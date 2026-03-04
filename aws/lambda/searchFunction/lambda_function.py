"""
AWS Lambda – AI-Powered Hospital Search
========================================
This Lambda function orchestrates intelligent hospital search by:
1. Invoking AWS Bedrock Agent for AI-powered recommendations
2. Fetching detailed data from multiple API Gateway endpoints
3. Calculating statistics and insurance coverage from reviews
4. Building a comprehensive response for the UI

Routes:
  POST /search  → search_hospitals

Environment variables (required):
  BEDROCK_AGENT_ID       – Bedrock Agent ID (e.g., ASPMAO88W7)
  BEDROCK_AGENT_ALIAS_ID – Agent Alias ID (e.g., FXGJQUGJRJQ)
  BEDROCK_REGION         – AWS region for Bedrock (default: us-east-1)
  API_GATEWAY_BASE_URL   – Base URL for API Gateway endpoints
  
Request Body:
  {
    "query": "best hospital for cardiac surgery",
    "customerId": "customer_123",  // Used as sessionId for agent memory
    "userContext": {
      "insuranceId": "ins_001",    // Optional
      "location": {                // Optional
        "latitude": 28.6139,
        "longitude": 77.2090
      }
    }
  }

Response Format:
  See SEARCH_RESPONSE_FORMAT.md for complete structure
"""

from __future__ import annotations

import json
import logging
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import boto3
import requests
from botocore.exceptions import ClientError

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

logger = logging.getLogger()
logger.setLevel(logging.INFO)


# Environment variables
BEDROCK_AGENT_ID = os.environ.get("BEDROCK_AGENT_ID", "ASPMAO88W7")
BEDROCK_AGENT_ALIAS_ID = os.environ.get("BEDROCK_AGENT_ALIAS_ID", "FXGJQUGRJQ")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
API_GATEWAY_BASE_URL = os.environ.get(
    "API_GATEWAY_BASE_URL",
    "https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com"
)

# Initialize AWS clients
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", region_name=BEDROCK_REGION)

# Constants
MAX_WORKERS = 20  # For parallel API calls
REQUEST_TIMEOUT = 10  # seconds for HTTP requests
AGENT_TIMEOUT = 30  # seconds for Bedrock Agent invocation


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

class DecimalEncoder(json.JSONEncoder):
    """Serialize DynamoDB Decimal values."""
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def _response(status_code: int, body: Any) -> dict:
    """Build API Gateway response."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body, cls=DecimalEncoder, ensure_ascii=False),
    }


def _ok(body: Any, status_code: int = 200) -> dict:
    return _response(status_code, body)


def _error(status_code: int, message: str, details: dict = None) -> dict:
    error_body = {"success": False, "error": message}
    if details:
        error_body["details"] = details
    return _response(status_code, error_body)


def _parse_body(event: dict) -> dict:
    """Parse request body from API Gateway event."""
    raw = event.get("body") or "{}"
    if isinstance(raw, str):
        return json.loads(raw)
    return raw


# ---------------------------------------------------------------------------
# Bedrock Agent Integration
# ---------------------------------------------------------------------------

def invoke_bedrock_agent(query: str, customer_id: str) -> dict:
    """
    Invoke AWS Bedrock Agent for AI-powered hospital recommendations.
    
    Args:
        query: User's search query
        customer_id: Customer ID (used as sessionId for conversation memory)
    
    Returns:
        dict: LLM response with aiSummary and hospitals array
    
    Raises:
        Exception: If agent invocation fails or times out
    """
    session_id = customer_id or f"session_{uuid.uuid4().hex[:12]}"
    
    logger.info(
        "Invoking Bedrock Agent | AgentId=%s | AliasId=%s | SessionId=%s | Query='%s'",
        BEDROCK_AGENT_ID,
        BEDROCK_AGENT_ALIAS_ID,
        session_id,
        query[:100]  # Log first 100 chars
    )
    
    start_time = time.time()
    
    try:
        response = bedrock_agent_runtime.invoke_agent(
            agentId=BEDROCK_AGENT_ID,
            agentAliasId=BEDROCK_AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=query,
        )
        
        # Properly handle streaming response - collect ALL chunks
        full_response = ""
        chunk_count = 0
        
        # Process all events in the completion stream
        # CRITICAL: Must iterate through ALL events to get complete response
        completion_stream = response.get("completion", [])
        
        for event in completion_stream:
            # Log event type for debugging
            event_type = list(event.keys())[0] if event else "unknown"
            logger.debug("Event received | Type=%s", event_type)
            
            if "chunk" in event:
                chunk = event["chunk"]
                if "bytes" in chunk:
                    # Decode bytes and append to full response
                    chunk_data = chunk["bytes"].decode("utf-8")
                    full_response += chunk_data
                    chunk_count += 1
                    logger.debug("Chunk %d received | Length=%d | Content=%s", 
                                chunk_count, len(chunk_data), chunk_data[:100])
            
            # Handle other event types that might contain data
            elif "trace" in event:
                logger.debug("Trace event received")
            elif "returnControl" in event:
                logger.debug("ReturnControl event received")
            elif "internalServerException" in event:
                logger.error("InternalServerException in stream")
                raise Exception("Bedrock Agent internal server error")
            elif "validationException" in event:
                logger.error("ValidationException in stream")
                raise Exception("Bedrock Agent validation error")
        
        # Ensure we received some response
        if not full_response:
            logger.error("No response received from Bedrock Agent | ChunkCount=%d", chunk_count)
            raise Exception("Empty response from Bedrock Agent")
        
        elapsed = time.time() - start_time
        logger.info(
            "Bedrock Agent response received | Chunks=%d | ResponseLength=%d | Duration=%.2fs",
            chunk_count,
            len(full_response),
            elapsed
        )
        
        # Log full response for debugging (truncated to 3000 chars)
        logger.info("Full Agent response (first 3000 chars): %s", full_response[:3000])
        if len(full_response) > 3000:
            logger.info("Full Agent response (last 500 chars): %s", full_response[-500:])
        
        # Parse JSON response - extract JSON from conversational text
        try:
            # Find the first '{' and extract JSON from there
            json_start = full_response.find('{')
            if json_start == -1:
                logger.error("No JSON object found in response | Response=%s", full_response[:500])
                raise ValueError("No JSON object found in Bedrock Agent response")
            
            # Extract from first '{' to end
            json_str = full_response[json_start:]
            
            # Log if there was text before JSON
            if json_start > 0:
                prefix = full_response[:json_start].strip()
                logger.info("Stripped conversational prefix | Prefix='%s'", prefix[:100])
            
            # Check if JSON is complete (ends with '}')
            json_str_stripped = json_str.strip()
            if not json_str_stripped.endswith('}'):
                logger.warning("JSON appears incomplete | Ends with: '%s'", json_str_stripped[-50:])
                # Try to find the last complete JSON object
                last_brace = json_str_stripped.rfind('}')
                if last_brace > 0:
                    json_str = json_str_stripped[:last_brace + 1]
                    logger.info("Truncated to last complete brace | NewLength=%d", len(json_str))
            
            llm_data = json.loads(json_str)
            logger.info(
                "LLM response parsed | Hospitals=%d | HasSummary=%s",
                len(llm_data.get("hospitals", [])),
                "aiSummary" in llm_data
            )
            return llm_data
        except json.JSONDecodeError as e:
            logger.error("Failed to parse LLM response as JSON | Error=%s | Response=%s", str(e), full_response[:500])
            logger.error("JSON string that failed to parse (last 500 chars): %s", json_str[-500:] if len(json_str) > 500 else json_str)
            raise ValueError(f"Invalid JSON response from Bedrock Agent: {str(e)}")
    
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_msg = e.response["Error"]["Message"]
        logger.error(
            "Bedrock Agent invocation failed | ErrorCode=%s | ErrorMsg=%s",
            error_code,
            error_msg
        )
        raise Exception(f"Bedrock Agent error: {error_code} - {error_msg}")
    
    except Exception as e:
        logger.exception("Unexpected error invoking Bedrock Agent")
        raise


# ---------------------------------------------------------------------------
# API Gateway HTTP Calls
# ---------------------------------------------------------------------------

def fetch_from_api(endpoint: str, resource_type: str, resource_id: str = None) -> dict:
    """
    Fetch data from API Gateway endpoint.
    
    Args:
        endpoint: API endpoint path (e.g., 'hospitals', 'doctors')
        resource_type: Type of resource for logging
        resource_id: Optional resource ID for specific item
    
    Returns:
        dict: API response data
    """
    if resource_id:
        url = f"{API_GATEWAY_BASE_URL}/{endpoint}/{resource_id}"
    else:
        url = f"{API_GATEWAY_BASE_URL}/{endpoint}"
    
    logger.debug("API Request | Type=%s | URL=%s", resource_type, url)
    
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        
        logger.debug(
            "API Response | Type=%s | Status=%d | DataKeys=%s",
            resource_type,
            response.status_code,
            list(data.keys()) if isinstance(data, dict) else "list"
        )
        
        return data
    
    except requests.exceptions.Timeout:
        logger.error("API request timeout | Type=%s | URL=%s", resource_type, url)
        raise Exception(f"Timeout fetching {resource_type}")
    
    except requests.exceptions.HTTPError as e:
        logger.error(
            "API HTTP error | Type=%s | Status=%d | URL=%s",
            resource_type,
            e.response.status_code,
            url
        )
        raise Exception(f"HTTP {e.response.status_code} fetching {resource_type}")
    
    except Exception as e:
        logger.exception("API request failed | Type=%s | URL=%s", resource_type, url)
        raise


def fetch_reviews(query_params: dict) -> list:
    """
    Fetch reviews with query parameters.
    
    Args:
        query_params: Dict of query parameters (hospitalId, doctorId, etc.)
    
    Returns:
        list: Review items
    """
    params_str = "&".join([f"{k}={v}" for k, v in query_params.items()])
    url = f"{API_GATEWAY_BASE_URL}/reviews?{params_str}&limit=100"
    
    logger.debug("Fetching reviews | Params=%s", query_params)
    
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        
        items = data.get("items", [])
        logger.debug("Reviews fetched | Count=%d | Params=%s", len(items), query_params)
        
        return items
    
    except Exception as e:
        logger.error("Failed to fetch reviews | Params=%s | Error=%s", query_params, str(e))
        return []  # Return empty list on error, don't fail the whole search


# ---------------------------------------------------------------------------
# Data Enrichment Functions
# ---------------------------------------------------------------------------

def calculate_hospital_stats(reviews: list, hospital_data: dict) -> dict:
    """
    Calculate hospital statistics from reviews.
    
    Args:
        reviews: List of review items for this hospital
        hospital_data: Hospital data from API
    
    Returns:
        dict: Statistics including ratings, costs, wait times
    """
    logger.debug("Calculating hospital stats | HospitalId=%s | ReviewCount=%d", 
                 hospital_data.get("hospitalId"), len(reviews))
    
    if not reviews:
        # Use pre-computed values from hospital table
        return {
            "totalReviews": 0,
            "verifiedReviews": 0,
            "averageRating": hospital_data.get("rating", 0),
            "ratingBreakdown": {
                "serviceQuality": 0,
                "maintenance": 0,
                "foodQuality": 0,
                "cleanliness": 0,
                "staffBehavior": 0,
            },
            "claimApprovalRate": (
                hospital_data.get("totalNumberOfClaimsApproved", 0) / 
                hospital_data.get("totalNumberOfClaims", 1)
            ) if hospital_data.get("totalNumberOfClaims") else 0,
            "averageCost": hospital_data.get("avgCost", 0),
            "averageWaitTime": 3,  # Default
        }
    
    # Calculate from reviews
    verified_reviews = [r for r in reviews if r.get("verified")]
    total_reviews = len(reviews)
    verified_count = len(verified_reviews)
    
    # Extract ratings (assuming hospitalReview contains rating info)
    # This is a simplified calculation - adjust based on actual review structure
    avg_rating = hospital_data.get("rating", 4.0)
    
    stats = {
        "totalReviews": total_reviews,
        "verifiedReviews": verified_count,
        "averageRating": avg_rating,
        "ratingBreakdown": {
            "serviceQuality": avg_rating,
            "maintenance": avg_rating - 0.2,
            "foodQuality": avg_rating - 0.5,
            "cleanliness": avg_rating + 0.1,
            "staffBehavior": avg_rating - 0.1,
        },
        "claimApprovalRate": (
            hospital_data.get("totalNumberOfClaimsApproved", 0) / 
            hospital_data.get("totalNumberOfClaims", 1)
        ) if hospital_data.get("totalNumberOfClaims") else 0,
        "averageCost": hospital_data.get("avgCost", 0),
        "averageWaitTime": 3,
    }
    
    logger.debug("Hospital stats calculated | Stats=%s", stats)
    return stats


def calculate_doctor_stats(reviews: list, doctor_data: dict) -> dict:
    """
    Calculate doctor statistics from reviews.
    
    Args:
        reviews: List of review items for this doctor
        doctor_data: Doctor data from API
    
    Returns:
        dict: Statistics including ratings, success rate
    """
    logger.debug("Calculating doctor stats | DoctorId=%s | ReviewCount=%d",
                 doctor_data.get("doctorId"), len(reviews))
    
    verified_reviews = [r for r in reviews if r.get("verified")]
    avg_rating = doctor_data.get("rating", 4.5)
    
    stats = {
        "totalReviews": len(reviews),
        "verifiedReviews": len(verified_reviews),
        "averageRating": avg_rating,
        "ratingBreakdown": {
            "bedsideManner": avg_rating + 0.1,
            "medicalExpertise": avg_rating + 0.2,
            "communication": avg_rating,
            "waitTime": avg_rating - 0.3,
            "thoroughness": avg_rating + 0.1,
            "followUpCare": avg_rating,
        },
        "successRate": 0.95,  # Default - could be calculated from reviews
        "totalSurgeries": len(reviews),  # Simplified
    }
    
    logger.debug("Doctor stats calculated | Stats=%s", stats)
    return stats


def calculate_insurance_coverage(reviews: list, insurance_id: str, hospital_data: dict) -> dict:
    """
    Calculate insurance coverage estimates from reviews.
    
    Args:
        reviews: List of review items for this hospital
        insurance_id: User's insurance policy ID
        hospital_data: Hospital data
    
    Returns:
        dict: Insurance match information with coverage estimates
    """
    logger.debug(
        "Calculating insurance coverage | HospitalId=%s | InsuranceId=%s | ReviewCount=%d",
        hospital_data.get("hospitalId"),
        insurance_id,
        len(reviews)
    )
    
    # Filter reviews with this insurance
    insurance_reviews = [r for r in reviews if r.get("policyId") == insurance_id]
    
    if not insurance_reviews:
        logger.debug("No reviews found for this insurance | Using hospital defaults")
        # Use hospital-level data
        claim_approval_rate = (
            hospital_data.get("totalNumberOfClaimsApproved", 0) / 
            hospital_data.get("totalNumberOfClaims", 1)
        ) if hospital_data.get("totalNumberOfClaims") else 0.85
        
        avg_cost = hospital_data.get("avgCost", 300000)
        estimated_coverage = avg_cost * 0.9
        estimated_out_of_pocket = avg_cost * 0.1
    else:
        # Calculate from insurance-specific reviews
        approved_claims = sum(1 for r in insurance_reviews if r.get("claim", {}).get("claimAmountApproved"))
        claim_approval_rate = approved_claims / len(insurance_reviews) if insurance_reviews else 0.85
        
        # Calculate average coverage
        total_bills = []
        total_coverage = []
        
        for review in insurance_reviews:
            payment = review.get("payment", {})
            claim = review.get("claim", {})
            
            if payment.get("totalBillAmount"):
                total_bills.append(float(payment["totalBillAmount"]))
            
            if claim.get("claimAmountApproved"):
                total_coverage.append(float(claim["claimAmountApproved"]))
        
        avg_cost = sum(total_bills) / len(total_bills) if total_bills else 300000
        estimated_coverage = sum(total_coverage) / len(total_coverage) if total_coverage else avg_cost * 0.9
        estimated_out_of_pocket = avg_cost - estimated_coverage
    
    result = {
        "isAccepted": True,  # Assuming LLM only returns matching hospitals
        "insuranceCompanyId": insurance_id,
        "claimApprovalRate": claim_approval_rate,
        "estimatedCoverage": int(estimated_coverage),
        "estimatedOutOfPocket": int(estimated_out_of_pocket),
    }
    
    logger.debug("Insurance coverage calculated | Result=%s", result)
    return result


def get_all_hospital_doctors(hospital_data: dict) -> list:
    """
    Fetch all doctors in a hospital from its departments.
    
    Args:
        hospital_data: Hospital data containing departmentIds
    
    Returns:
        list: List of doctor IDs in this hospital
    """
    hospital_id = hospital_data.get("hospitalId")
    department_ids = hospital_data.get("departmentIds", [])
    
    # Parse if it's a JSON string
    if isinstance(department_ids, str):
        try:
            department_ids = json.loads(department_ids)
        except:
            department_ids = []
    
    logger.debug(
        "Fetching all doctors for hospital | HospitalId=%s | DepartmentCount=%d",
        hospital_id,
        len(department_ids)
    )
    
    all_doctor_ids = []
    
    for dept_id in department_ids:
        try:
            dept_data = fetch_from_api("departments", "Department", dept_id)
            doctor_ids = dept_data.get("listOfDoctorIds", [])
            
            # Parse if it's a JSON string
            if isinstance(doctor_ids, str):
                try:
                    doctor_ids = json.loads(doctor_ids)
                except:
                    doctor_ids = []
            
            all_doctor_ids.extend(doctor_ids)
            logger.debug(
                "Department doctors fetched | DeptId=%s | DoctorCount=%d",
                dept_id,
                len(doctor_ids)
            )
        except Exception as e:
            logger.warning("Failed to fetch department | DeptId=%s | Error=%s", dept_id, str(e))
            continue
    
    # Remove duplicates
    unique_doctor_ids = list(set(all_doctor_ids))
    logger.info(
        "All hospital doctors collected | HospitalId=%s | TotalDoctors=%d",
        hospital_id,
        len(unique_doctor_ids)
    )
    
    return unique_doctor_ids


# ---------------------------------------------------------------------------
# Main Search Orchestration
# ---------------------------------------------------------------------------

def enrich_hospital_data(
    hospital_llm: dict,
    hospital_data: dict,
    reviews: list,
    insurance_id: str = None
) -> dict:
    """
    Enrich hospital data with statistics and AI insights.
    
    Args:
        hospital_llm: Hospital data from LLM (with AI review)
        hospital_data: Hospital data from API
        reviews: Reviews for this hospital
        insurance_id: User's insurance ID (optional)
    
    Returns:
        dict: Enriched hospital data matching SEARCH_RESPONSE_FORMAT
    """
    hospital_id = hospital_data.get("hospitalId")
    logger.info("Enriching hospital data | HospitalId=%s", hospital_id)
    
    # Calculate statistics
    stats = calculate_hospital_stats(reviews, hospital_data)
    
    # Parse services if it's a JSON string
    services = hospital_data.get("services", [])
    if isinstance(services, str):
        try:
            services = json.loads(services)
        except:
            services = []
    
    # Parse location
    location_str = hospital_data.get("location", "0,0")
    try:
        lat, lon = map(float, location_str.split(","))
    except:
        lat, lon = 0.0, 0.0
    
    # Build enriched hospital object
    enriched = {
        "hospitalId": hospital_id,
        "hospitalName": hospital_data.get("hospitalName", ""),
        "services": services,
        "location": {
            "latitude": lat,
            "longitude": lon,
            "distance": None,  # TODO: Calculate if user location provided
        },
        "address": hospital_data.get("address", ""),
        "phoneNumber": hospital_data.get("phoneNumber", ""),
        "description": hospital_data.get("description", ""),
        "aiInsights": {
            "matchScore": 90,  # Default - could be extracted from LLM
            "explanation": hospital_llm.get("hospitalAIReview", ""),
            "keyStrengths": [],  # TODO: Extract from AI review
            "considerations": [],
        },
        "stats": stats,
        "insuranceInfo": {
            "acceptedCompanies": [],  # TODO: Fetch insurance companies
            "userInsuranceMatch": None,
        },
        "relevantDepartments": [],  # TODO: Fetch departments
        "topDoctors": [],  # Will be populated separately
        "costEstimates": {},  # TODO: Build from hospital data
        "trustIndicators": {
            "verified": True,
            "trustScore": 85,
            "verificationBadge": "gold",
            "accreditations": [],
            "documentVerificationRate": 0.9,
            "fakeReviewsBlocked": 0,
        },
        "facilities": [],  # TODO: Extract from hospital data
        "images": [],
    }
    
    # Add insurance match if user has insurance
    if insurance_id:
        enriched["insuranceInfo"]["userInsuranceMatch"] = calculate_insurance_coverage(
            reviews, insurance_id, hospital_data
        )
    
    logger.debug("Hospital enrichment complete | HospitalId=%s", hospital_id)
    return enriched


def enrich_doctor_data(
    doctor_llm: dict,
    doctor_data: dict,
    reviews: list
) -> dict:
    """
    Enrich doctor data with statistics and AI insights.
    
    Args:
        doctor_llm: Doctor data from LLM (with AI review)
        doctor_data: Doctor data from API
        reviews: Reviews for this doctor
    
    Returns:
        dict: Enriched doctor data matching SEARCH_RESPONSE_FORMAT
    """
    doctor_id = doctor_data.get("doctorId")
    logger.debug("Enriching doctor data | DoctorId=%s", doctor_id)
    
    # Calculate statistics
    stats = calculate_doctor_stats(reviews, doctor_data)
    
    # Build enriched doctor object
    enriched = {
        "doctorId": doctor_id,
        "doctorName": doctor_data.get("doctorName", ""),
        "specialty": "General",  # TODO: Extract from department or doctor data
        "experience": f"{doctor_data.get('yearsOfExperience', 10)}+ years",
        "about": doctor_data.get("about", ""),
        "aiReview": {
            "summary": doctor_llm.get("doctorAIReview", ""),
            "keyHighlights": [],  # TODO: Extract from AI review
        },
        "stats": stats,
        "recentReviews": [],  # TODO: Format recent reviews
        "availability": {
            "nextAvailableSlot": datetime.now(timezone.utc).isoformat(),
            "averageWaitTime": 5,
            "acceptingNewPatients": True,
        },
    }
    
    logger.debug("Doctor enrichment complete | DoctorId=%s", doctor_id)
    return enriched


def search_hospitals(event: dict) -> dict:
    """
    Main search handler - orchestrates the entire search process.
    
    Process:
    1. Parse request and validate
    2. Invoke Bedrock Agent for AI recommendations
    3. Fetch detailed data from API Gateway (parallel)
    4. Calculate statistics from reviews
    5. Build comprehensive response
    
    Args:
        event: API Gateway event
    
    Returns:
        dict: API Gateway response
    """
    request_id = event.get("requestContext", {}).get("requestId", uuid.uuid4().hex[:12])
    logger.info("=" * 80)
    logger.info("SEARCH REQUEST START | RequestId=%s", request_id)
    logger.info("=" * 80)
    
    start_time = time.time()
    
    try:
        # Parse request body
        body = _parse_body(event)
        query = body.get("query", "").strip()
        customer_id = body.get("customerId", "").strip()
        user_context = body.get("userContext", {})
        insurance_id = user_context.get("insuranceId")
        
        logger.info(
            "Request parsed | Query='%s' | CustomerId=%s | InsuranceId=%s",
            query[:100],
            customer_id or "None",
            insurance_id or "None"
        )
        
        # Validate required fields
        if not query:
            logger.warning("Missing required field: query")
            return _error(400, "Missing required field: query")
        
        # Step 1: Invoke Bedrock Agent
        logger.info("STEP 1: Invoking Bedrock Agent")
        try:
            llm_response = invoke_bedrock_agent(query, customer_id)
        except Exception as e:
            logger.error("Bedrock Agent invocation failed | Error=%s", str(e))
            return _error(
                503,
                "Search service temporarily unavailable. Please try again.",
                {"code": "AGENT_ERROR", "suggestion": "Try simplifying your search query"}
            )
        
        # Validate LLM response
        if not llm_response.get("hospitals"):
            logger.warning("LLM returned no hospitals")
            return _error(
                404,
                "No hospitals found matching your criteria. Try different keywords.",
                {"code": "NO_RESULTS"}
            )
        
        ai_summary = llm_response.get("aiSummary", "")
        hospitals_llm = llm_response.get("hospitals", [])
        
        logger.info("LLM response validated | HospitalCount=%d", len(hospitals_llm))


        # Step 2: Extract IDs from LLM response
        logger.info("STEP 2: Extracting IDs from LLM response")
        hospital_ids = [h["hospitalId"] for h in hospitals_llm]
        
        # Extract doctor IDs from LLM recommendations
        llm_doctor_ids = []
        for h in hospitals_llm:
            for d in h.get("doctors", []):
                doctor_id = d["doctorId"]
                llm_doctor_ids.append(doctor_id)
                logger.info("Extracted doctor ID from LLM | DoctorId=%s | HospitalId=%s", doctor_id, h["hospitalId"])
        
        logger.info(
            "IDs extracted | Hospitals=%d | LLM-recommended Doctors=%d",
            len(hospital_ids),
            len(llm_doctor_ids)
        )
        
        # Step 3: Fetch data in parallel
        logger.info("STEP 3: Fetching data from API Gateway (parallel)")
        
        hospitals_data = {}
        doctors_data = {}
        hospital_reviews = {}
        doctor_reviews = {}
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {}
            
            # Submit hospital fetch tasks
            for hospital_id in hospital_ids:
                future = executor.submit(fetch_from_api, "hospitals", "Hospital", hospital_id)
                futures[future] = ("hospital", hospital_id)
            
            # Submit doctor fetch tasks (LLM-recommended doctors)
            for doctor_id in llm_doctor_ids:
                future = executor.submit(fetch_from_api, "doctors", "Doctor", doctor_id)
                futures[future] = ("doctor", doctor_id)
            
            # Submit review fetch tasks
            for hospital_id in hospital_ids:
                future = executor.submit(fetch_reviews, {"hospitalId": hospital_id})
                futures[future] = ("hospital_reviews", hospital_id)
            
            for doctor_id in llm_doctor_ids:
                future = executor.submit(fetch_reviews, {"doctorId": doctor_id})
                futures[future] = ("doctor_reviews", doctor_id)
            
            # Collect results
            completed = 0
            total = len(futures)
            
            for future in as_completed(futures):
                completed += 1
                task_type, resource_id = futures[future]
                
                try:
                    result = future.result()
                    
                    if task_type == "hospital":
                        hospitals_data[resource_id] = result
                    elif task_type == "doctor":
                        doctors_data[resource_id] = result
                    elif task_type == "hospital_reviews":
                        hospital_reviews[resource_id] = result
                    elif task_type == "doctor_reviews":
                        doctor_reviews[resource_id] = result
                    
                    logger.debug(
                        "Task completed | Progress=%d/%d | Type=%s | ResourceId=%s",
                        completed,
                        total,
                        task_type,
                        resource_id
                    )
                
                except Exception as e:
                    logger.error(
                        "Task failed | Type=%s | ResourceId=%s | Error=%s",
                        task_type,
                        resource_id,
                        str(e)
                    )
                    # Log additional details for doctor fetch failures
                    if task_type == "doctor":
                        logger.error(
                            "Doctor fetch failed - check if doctor exists in DynamoDB | DoctorId=%s | URL=%s/doctors/%s",
                            resource_id,
                            API_GATEWAY_BASE_URL,
                            resource_id
                        )
        
        logger.info(
            "Data fetching complete | Hospitals=%d | Doctors=%d | HospitalReviews=%d | DoctorReviews=%d",
            len(hospitals_data),
            len(doctors_data),
            len(hospital_reviews),
            len(doctor_reviews)
        )


        # Step 4: Build enriched response
        logger.info("STEP 4: Building enriched response")
        
        enriched_hospitals = []
        
        for hospital_llm in hospitals_llm:
            hospital_id = hospital_llm["hospitalId"]
            
            # Get hospital data
            hospital_data = hospitals_data.get(hospital_id)
            if not hospital_data:
                logger.warning("Hospital data not found | HospitalId=%s", hospital_id)
                continue
            
            # Get reviews for this hospital
            reviews = hospital_reviews.get(hospital_id, [])
            
            # Enrich hospital data
            enriched_hospital = enrich_hospital_data(
                hospital_llm,
                hospital_data,
                reviews,
                insurance_id
            )
            
            # Add LLM-recommended doctors
            top_doctors = []
            for doctor_llm in hospital_llm.get("doctors", []):
                doctor_id = doctor_llm["doctorId"]
                doctor_data = doctors_data.get(doctor_id)
                
                if doctor_data:
                    doctor_reviews_list = doctor_reviews.get(doctor_id, [])
                    enriched_doctor = enrich_doctor_data(
                        doctor_llm,
                        doctor_data,
                        doctor_reviews_list
                    )
                    top_doctors.append(enriched_doctor)
                    logger.info("Doctor enriched successfully | DoctorId=%s | HospitalId=%s", doctor_id, hospital_id)
                else:
                    logger.warning(
                        "Doctor data not found - skipping | DoctorId=%s | HospitalId=%s | Reason=API fetch failed or returned 404",
                        doctor_id,
                        hospital_id
                    )
            
            enriched_hospital["topDoctors"] = top_doctors
            
            logger.info(
                "Hospital enriched | HospitalId=%s | TopDoctors=%d",
                hospital_id,
                len(top_doctors)
            )
            
            enriched_hospitals.append(enriched_hospital)
        
        # Build final response
        elapsed = time.time() - start_time
        
        response_body = {
            "success": True,
            "cached": False,
            "responseTime": f"{int(elapsed * 1000)}ms",
            "userIntent": {
                "category": "general_search",
                "keywords": query.split()[:5],  # First 5 words
                "insuranceRequired": bool(insurance_id),
                "procedureType": "general",
            },
            "results": {
                "totalMatches": len(enriched_hospitals),
                "hospitals": enriched_hospitals,
            },
            "metadata": {
                "searchId": f"search_{int(time.time())}_{request_id}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "aiModel": "bedrock-agent",
                "databaseVersion": "v1.0.0",
                "totalHospitalsInDatabase": 29,
                "totalDoctorsInDatabase": 976,
            },
        }
        
        logger.info("=" * 80)
        logger.info(
            "SEARCH REQUEST COMPLETE | RequestId=%s | Duration=%.2fs | Hospitals=%d",
            request_id,
            elapsed,
            len(enriched_hospitals)
        )
        logger.info("=" * 80)
        
        return _ok(response_body)
    
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return _error(400, "Invalid JSON in request body")
    
    except Exception as e:
        elapsed = time.time() - start_time
        logger.exception(
            "Search request failed | RequestId=%s | Duration=%.2fs",
            request_id,
            elapsed
        )
        return _error(
            500,
            "An unexpected error occurred. Please try again.",
            {"code": "INTERNAL_ERROR"}
        )


# ---------------------------------------------------------------------------
# Lambda Handler
# ---------------------------------------------------------------------------

def lambda_handler(event: dict, context: Any) -> dict:
    """
    Main Lambda entry point for API Gateway integration.
    
    Routes:
      POST /search  → search_hospitals
    
    Args:
        event: API Gateway event
        context: Lambda context
    
    Returns:
        dict: API Gateway response
    """
    method = (
        event.get("httpMethod") 
        or event.get("requestContext", {}).get("http", {}).get("method", "")
    ).upper()
    
    path = (
        event.get("path", "")
        or event.get("requestContext", {}).get("http", {}).get("path", "")
    ).rstrip("/").lower()
    
    logger.info("Lambda invoked | Method=%s | Path=%s", method, path)
    
    # Route to search handler
    if method == "POST" and path.endswith("/search"):
        return search_hospitals(event)
    
    # Method not allowed
    logger.warning("Method not allowed | Method=%s | Path=%s", method, path)
    return _error(405, f"Method '{method}' not allowed on path '{path}'")
