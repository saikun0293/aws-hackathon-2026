import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
import os
import logging
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
DYNAMODB_REGION = os.environ.get('DYNAMODB_REGION', 'eu-north-1')
OPENSEARCH_ENDPOINT = os.environ.get('OPENSEARCH_ENDPOINT','search-health-review-vector-domain-kuas3fubuql36nogy4tuq5usna.us-east-1.es.amazonaws.com')
OPENSEARCH_REGION = os.environ.get('OPENSEARCH_REGION', 'us-east-1')
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', 'us-east-1')
INDEX_NAME = os.environ.get('INDEX_NAME', 'health-review-index')

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=DYNAMODB_REGION)
review_table = dynamodb.Table('Review')
hospital_table = dynamodb.Table('Hospital')
doctor_table = dynamodb.Table('Doctor')
customer_table = dynamodb.Table('Customer')

# Initialize Bedrock client for embedding generation
bedrock_runtime = boto3.client('bedrock-runtime', region_name=BEDROCK_REGION)

# Initialize OpenSearch client with AWS Signature Version 4 authentication
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    OPENSEARCH_REGION,
    'es',
    session_token=credentials.token
)

opensearch_client = OpenSearch(
    hosts=[{'host': OPENSEARCH_ENDPOINT, 'port': 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection,
    timeout=60
)

logger.info(f"Initialized clients - DynamoDB: {DYNAMODB_REGION}, OpenSearch: {OPENSEARCH_REGION}, Bedrock: {BEDROCK_REGION}")


def generate_embedding(text):
    """
    Generate embedding using Bedrock Titan Embed Text v2 model.
    Returns a 1024-dimensional vector.
    """
    try:
        # Truncate text if too long (Titan has 8K token limit)
        max_chars = 25000  # Approximate character limit
        if len(text) > max_chars:
            text = text[:max_chars]
            logger.warning(f"Text truncated to {max_chars} characters for embedding")
        
        # Call Bedrock Titan Embed Text v2
        response = bedrock_runtime.invoke_model(
            modelId='amazon.titan-embed-text-v2:0',
            body=json.dumps({
                "inputText": text,
                "dimensions": 1024,
                "normalize": True
            })
        )
        
        result = json.loads(response['body'].read())
        embedding = result['embedding']
        
        logger.info(f"Generated embedding with {len(embedding)} dimensions")
        return embedding
    
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        # Return None if embedding generation fails - document will be indexed without embedding
        return None


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def get_hospital_data(hospital_id):
    """Fetch hospital data from DynamoDB - returns ALL fields"""
    try:
        response = hospital_table.get_item(Key={'hospitalId': hospital_id})
        hospital = response.get('Item', {})
        return hospital
    except Exception as e:
        logger.error(f"Error fetching hospital {hospital_id}: {str(e)}")
        return {}


def get_doctor_data(doctor_id):
    """Fetch doctor data from DynamoDB - returns ALL fields"""
    try:
        response = doctor_table.get_item(Key={'doctorId': doctor_id})
        doctor = response.get('Item', {})
        return doctor
    except Exception as e:
        logger.error(f"Error fetching doctor {doctor_id}: {str(e)}")
        return {}


def get_customer_data(customer_id):
    """Fetch customer data from DynamoDB (optional, for additional context)"""
    try:
        response = customer_table.get_item(Key={'customerId': customer_id})
        customer = response.get('Item', {})
        
        # Only include non-PII fields
        return {
            'customerId': customer.get('customerId'),
            'gender': customer.get('gender'),
            'age': customer.get('age')
        }
    except Exception as e:
        logger.error(f"Error fetching customer {customer_id}: {str(e)}")
        return {}


def parse_json_field(field_value):
    """Parse JSON string fields from DynamoDB"""
    if isinstance(field_value, str):
        try:
            return json.loads(field_value)
        except:
            return field_value
    return field_value


def sanitize_for_knowledge_base(obj):
    """
    Sanitize data to ensure compatibility with Bedrock Knowledge Base.
    Converts Decimals, removes None values, and ensures proper JSON serialization.
    """
    if obj is None:
        return None
    elif isinstance(obj, Decimal):
        # Convert Decimal to float or int
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    elif isinstance(obj, dict):
        # Recursively sanitize dictionary, remove None values
        return {k: sanitize_for_knowledge_base(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        # Recursively sanitize list, remove None values
        return [sanitize_for_knowledge_base(item) for item in obj if item is not None]
    elif isinstance(obj, str):
        # Ensure string is valid UTF-8 and remove control characters
        try:
            # Remove null bytes and other control characters that might cause issues
            return obj.replace('\x00', '').replace('\r', ' ').replace('\n', ' ')
        except:
            return str(obj)
    else:
        return obj


def combine_review_data(review):
    """
    Combine review with hospital and doctor data into a single enriched document.
    Includes ALL fields from Review, Hospital, and Doctor tables.
    
    Returns a comprehensive document suitable for vector search with full context.
    """
    hospital_id = review.get('hospitalId')
    doctor_id = review.get('doctorId')
    customer_id = review.get('customerId')
    
    # Fetch related data - ALL fields included
    hospital_data = get_hospital_data(hospital_id) if hospital_id else {}
    doctor_data = get_doctor_data(doctor_id) if doctor_id else {}
    customer_data = get_customer_data(customer_id) if customer_id else {}
    
    # Parse JSON fields from review
    doctor_review = parse_json_field(review.get('doctorReview', '{}'))
    claim = parse_json_field(review.get('claim', '{}'))
    payment = parse_json_field(review.get('payment', '{}'))
    extracted_data = parse_json_field(review.get('extractedData', '{}'))
    document_ids = parse_json_field(review.get('documentIds', '[]'))
    
    # Parse JSON fields from hospital
    hospital_services = parse_json_field(hospital_data.get('services', '[]'))
    hospital_department_ids = parse_json_field(hospital_data.get('departmentIds', '[]'))
    hospital_insurance_ids = parse_json_field(hospital_data.get('insuranceCompanyIds', '[]'))
    hospital_patients = parse_json_field(hospital_data.get('patients', '[]'))
    
    # Parse JSON fields from doctor
    doctor_records = parse_json_field(doctor_data.get('records', '[]'))
    doctor_patients = parse_json_field(doctor_data.get('patients', '[]'))
    
    # Build reviewText for your index schema
    review_text = ' '.join(filter(None, [
        review.get('purposeOfVisit', ''),
        review.get('hospitalReview', ''),
        hospital_data.get('hospitalName', ''),
        hospital_data.get('description', ''),
        hospital_data.get('address', ''),
        doctor_data.get('doctorName', ''),
        doctor_data.get('about', ''),
        doctor_data.get('qualification', ''),
        extracted_data.get('diagnosis', '') if isinstance(extracted_data, dict) else '',
        extracted_data.get('surgeryType', '') if isinstance(extracted_data, dict) else '',
        ' '.join(hospital_services) if isinstance(hospital_services, list) else ''
    ]))
    
    # Append metadata section to reviewText so Agent can extract IDs
    metadata_section = f"""

---METADATA---
hospitalId: {review.get('hospitalId', '')}
doctorId: {review.get('doctorId', '')}
reviewId: {review.get('reviewId', '')}
verified: {review.get('verified', False)}
"""
    review_text = review_text + metadata_section
    
    # Build reviewIndex - searchable metadata for quick lookups
    review_index = ' '.join(filter(None, [
        review.get('reviewId', ''),
        hospital_data.get('hospitalId', ''),
        hospital_data.get('hospitalName', ''),
        doctor_data.get('doctorId', ''),
        doctor_data.get('doctorName', ''),
        doctor_data.get('departmentId', ''),
        review.get('customerId', ''),
        review.get('policyId', ''),
        extracted_data.get('diagnosis', '') if isinstance(extracted_data, dict) else '',
        extracted_data.get('surgeryType', '') if isinstance(extracted_data, dict) else ''
    ]))
    
    # Get first insurance ID if available
    insurance_id = hospital_insurance_ids[0] if isinstance(hospital_insurance_ids, list) and len(hospital_insurance_ids) > 0 else None
    
    # Create enriched document matching YOUR index schema
    enriched_doc = {
        # ===== YOUR INDEX FIELDS =====
        'hospitalId': review.get('hospitalId'),
        'doctorId': review.get('doctorId'),
        'departmentId': doctor_data.get('departmentId'),
        'insuranceId': insurance_id,
        'reviewText': review_text,
        'reviewIndex': review_index,
        # embedding will be added after generation
        
        # ===== ADDITIONAL FIELDS (for completeness) =====
        'reviewId': review.get('reviewId'),
        'customerId': review.get('customerId'),
        'policyId': review.get('policyId'),
        'purposeOfVisit': review.get('purposeOfVisit', ''),
        'doctorReview': doctor_review,
        'claim': claim,
        'payment': payment,
        'hospitalReview': review.get('hospitalReview', ''),
        'documentIds': document_ids,
        'extractedData': extracted_data,
        'verified': review.get('verified', False),
        'createdAt': review.get('createdAt'),
        
        # ===== HOSPITAL DATA (excluding patients list) =====
        'hospital': {
            'hospitalId': hospital_data.get('hospitalId'),
            'hospitalName': hospital_data.get('hospitalName'),
            'services': hospital_services,
            'location': hospital_data.get('location'),
            'address': hospital_data.get('address'),
            'departmentIds': hospital_department_ids,
            'insuranceCompanyIds': hospital_insurance_ids,
            'phoneNumber': hospital_data.get('phoneNumber'),
            'description': hospital_data.get('description', ''),
            'rating': hospital_data.get('rating'),
            'affordability': hospital_data.get('affordability'),
            'maxCost': hospital_data.get('maxCost'),
            'minCost': hospital_data.get('minCost'),
            'avgCost': hospital_data.get('avgCost'),
            'totalNumberOfClaims': hospital_data.get('totalNumberOfClaims'),
            'totalNumberOfClaimsApproved': hospital_data.get('totalNumberOfClaimsApproved')
        },
        
        # ===== DOCTOR DATA (excluding patients and records lists) =====
        'doctor': {
            'doctorId': doctor_data.get('doctorId'),
            'doctorName': doctor_data.get('doctorName'),
            'about': doctor_data.get('about', ''),
            'rating': doctor_data.get('rating'),
            'yearsOfExperience': doctor_data.get('yearsOfExperience'),
            'qualification': doctor_data.get('qualification'),
            'departmentId': doctor_data.get('departmentId')
        },
        
        # ===== CUSTOMER DATA (NON-PII) =====
        'customer': customer_data
    }
    
    # Generate embedding for the reviewText
    logger.info(f"Generating embedding for review {review.get('reviewId')}")
    embedding = generate_embedding(review_text)
    
    if embedding:
        enriched_doc['embedding'] = embedding
        logger.info(f"Added embedding to document {review.get('reviewId')}")
    else:
        logger.warning(f"No embedding generated for document {review.get('reviewId')}, indexing without embedding")
    
    # Add metadata field required by Bedrock Knowledge Base
    # This must be a JSON string, not an object
    # Field name should match what you configured in Knowledge Base settings
    metadata = {
        'reviewId': review.get('reviewId'),
        'hospitalId': review.get('hospitalId'),
        'doctorId': review.get('doctorId'),
        'departmentId': doctor_data.get('departmentId'),
        'insuranceId': insurance_id,
        'hospitalName': hospital_data.get('hospitalName', ''),
        'doctorName': doctor_data.get('doctorName', ''),
        'verified': review.get('verified', False)
    }
    
    # Sanitize metadata and convert to JSON string (required by Bedrock Knowledge Base)
    metadata_sanitized = sanitize_for_knowledge_base(metadata)
    enriched_doc['metadata'] = json.dumps(metadata_sanitized, cls=DecimalEncoder)
    
    return enriched_doc


def index_document_to_opensearch(document, document_id):
    """Index a single document to OpenSearch"""
    try:
        # Sanitize document for Knowledge Base compatibility
        document_sanitized = sanitize_for_knowledge_base(document)
        
        # Convert to JSON string and back to ensure valid JSON
        document_json = json.loads(json.dumps(document_sanitized, cls=DecimalEncoder))
        
        response = opensearch_client.index(
            index=INDEX_NAME,
            id=document_id,
            body=document_json,
            refresh=True
        )
        
        logger.info(f"Indexed document {document_id}: {response['result']}")
        return True
    except Exception as e:
        logger.error(f"Error indexing document {document_id}: {str(e)}")
        return False


def check_index_exists():
    """
    Check if OpenSearch index exists.
    Does NOT create index - assumes you've already created it with your schema.
    """
    try:
        if opensearch_client.indices.exists(index=INDEX_NAME):
            logger.info(f"Index {INDEX_NAME} exists and ready for use")
            return True
        else:
            logger.error(f"Index {INDEX_NAME} does not exist. Please create it first.")
            raise Exception(f"Index {INDEX_NAME} not found. Create it in OpenSearch first.")
    except Exception as e:
        logger.error(f"Error checking index: {str(e)}")
        raise


def process_reviews_batch(last_evaluated_key=None, batch_size=25):
    """
    Process a batch of reviews from DynamoDB and index to OpenSearch.
    
    Args:
        last_evaluated_key: For pagination
        batch_size: Number of reviews to process per batch
    
    Returns:
        dict with processing results and pagination key
    """
    try:
        # Scan reviews table
        scan_params = {'Limit': batch_size}
        if last_evaluated_key:
            scan_params['ExclusiveStartKey'] = last_evaluated_key
        
        response = review_table.scan(**scan_params)
        reviews = response.get('Items', [])
        
        success_count = 0
        error_count = 0
        
        for review in reviews:
            try:
                # Combine review with hospital and doctor data
                enriched_doc = combine_review_data(review)
                
                # Index to OpenSearch
                if index_document_to_opensearch(enriched_doc, review['reviewId']):
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                logger.error(f"Error processing review {review.get('reviewId')}: {str(e)}")
                error_count += 1
        
        return {
            'success': True,
            'processed': len(reviews),
            'indexed': success_count,
            'errors': error_count,
            'lastEvaluatedKey': response.get('LastEvaluatedKey')
        }
    
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def lambda_handler(event, context):
    """
    Lambda handler for ingesting DynamoDB reviews into OpenSearch.
    
    Supports two modes:
    1. Batch processing: Process all reviews (triggered manually or by schedule)
    2. Single review: Process specific review (triggered by DynamoDB stream)
    
    Event format for batch:
    {
        "mode": "batch",
        "batchSize": 25,
        "lastEvaluatedKey": {...}  // optional, for pagination
    }
    
    Event format for single review:
    {
        "mode": "single",
        "reviewId": "review_xxx"
    }
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Check if index exists (does NOT create it)
        check_index_exists()
        
        mode = event.get('mode', 'batch')
        
        if mode == 'single':
            # Process single review
            review_id = event.get('reviewId')
            if not review_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'reviewId is required for single mode'})
                }
            
            response = review_table.get_item(Key={'reviewId': review_id})
            review = response.get('Item')
            
            if not review:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': f'Review {review_id} not found'})
                }
            
            enriched_doc = combine_review_data(review)
            success = index_document_to_opensearch(enriched_doc, review_id)
            
            return {
                'statusCode': 200 if success else 500,
                'body': json.dumps({
                    'success': success,
                    'reviewId': review_id,
                    'message': 'Review indexed successfully' if success else 'Failed to index review'
                })
            }
        
        else:
            # Batch processing mode
            batch_size = event.get('batchSize', 25)
            last_evaluated_key = event.get('lastEvaluatedKey')
            
            result = process_reviews_batch(last_evaluated_key, batch_size)
            
            return {
                'statusCode': 200 if result['success'] else 500,
                'body': json.dumps(result, cls=DecimalEncoder)
            }
    
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
