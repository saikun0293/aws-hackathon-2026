import { Hospital, mockHospitals, Doctor } from "../data/mockData";
import type { SearchResponse, EnrichedHospital, EnrichedDoctor } from "../../api/searchResponseTypes";

// API Configuration
const API_BASE_URL = "https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com";
const SEARCH_ENDPOINT = `${API_BASE_URL}/search`;

// Feature flag to toggle between real API and mock data
const USE_REAL_API = true; // Set to false to use mock data

// Simulates API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Adapter: Convert EnrichedHospital from Lambda to Hospital for UI
 */
function adaptEnrichedHospitalToHospital(enriched: EnrichedHospital): Hospital {
  // Extract insurance companies, handle empty array
  const acceptedInsurance = enriched.insuranceInfo?.acceptedCompanies?.length > 0
    ? enriched.insuranceInfo.acceptedCompanies.map(ic => ic.insuranceCompanyName)
    : ["Blue Cross", "United Health", "Aetna", "Medicare"]; // Default fallback

  // Calculate cost range from average cost
  const avgCost = enriched.stats?.averageCost || 300000;
  
  return {
    id: enriched.hospitalId,
    name: enriched.hospitalName,
    location: enriched.address,
    rating: enriched.stats?.averageRating || 4.0,
    reviewCount: enriched.stats?.totalReviews || 0,
    imageUrl: enriched.images?.[0]?.url || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400",
    description: enriched.description || "",
    specialties: enriched.services?.slice(0, 6) || [], // Take first 6 services as specialties
    acceptedInsurance,
    avgCostRange: {
      min: Math.round(avgCost * 0.5), // Estimate min as 50% of average
      max: Math.round(avgCost * 1.5), // Estimate max as 150% of average
    },
    aiRecommendation: enriched.aiInsights?.explanation || enriched.description || "Quality healthcare facility.",
    doctors: enriched.topDoctors?.map(adaptEnrichedDoctorToDoctor) || [],
    reviews: [], // Reviews would need separate API call or be included in response
    
    // Additional fields from Lambda response (extend Hospital type if needed)
    trustScore: enriched.trustIndicators?.trustScore,
    verificationBadge: enriched.trustIndicators?.verificationBadge,
    claimApprovalRate: enriched.stats?.claimApprovalRate,
    insuranceCoveragePercent: enriched.insuranceInfo?.userInsuranceMatch?.isAccepted 
      ? Math.round((enriched.insuranceInfo.userInsuranceMatch.estimatedCoverage / 
         (enriched.insuranceInfo.userInsuranceMatch.estimatedCoverage + 
          enriched.insuranceInfo.userInsuranceMatch.estimatedOutOfPocket)) * 100)
      : Math.round((enriched.stats?.claimApprovalRate || 0.85) * 100),
  };
}

/**
 * Adapter: Convert EnrichedDoctor from Lambda to Doctor for UI
 */
function adaptEnrichedDoctorToDoctor(enriched: EnrichedDoctor): Doctor {
  return {
    id: enriched.doctorId,
    name: enriched.doctorName,
    specialty: enriched.specialty,
    experience: parseInt(enriched.experience) || 10,
    qualifications: [], // Not in current response
    rating: enriched.stats.averageRating,
    reviewCount: enriched.stats.totalReviews,
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200", // Default image
    aiSummary: enriched.aiReview?.summary || "",
    reviews: enriched.recentReviews.map(r => ({
      id: r.reviewId,
      patientName: r.customerName,
      rating: r.rating,
      date: new Date(r.createdAt).toISOString().split('T')[0],
      treatment: r.procedureType,
      cost: 0, // Not in review response
      insuranceCovered: 0, // Not in review response
      comment: r.reviewText,
      verified: r.verified,
    })),
  };
}

/**
 * Call the real Lambda search endpoint
 */
async function callSearchAPI(query: string, customerId?: string): Promise<SearchResponse> {
  const requestBody = {
    query,
    customerId: customerId || undefined,
    userContext: {},
  };

  console.log(`[API] Calling Lambda search endpoint: ${SEARCH_ENDPOINT}`);
  console.log(`[API] Request:`, requestBody);

  const response = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[API] Response:`, data);

  // Handle Lambda's response format (body might be stringified)
  if (typeof data.body === "string") {
    return JSON.parse(data.body);
  }

  return data;
}

/**
 * Search hospitals using real API or mock data
 */
export async function searchHospitalsAPI(query: string, customerId?: string): Promise<Hospital[]> {
  if (!query.trim()) {
    return [];
  }

  // Use real API if enabled
  if (USE_REAL_API) {
    try {
      const response = await callSearchAPI(query, customerId);

      if (!response.success) {
        console.error("[API] Search failed:", response);
        throw new Error("Search failed");
      }

      console.log(`[API] Found ${response.results.totalMatches} hospitals`);

      // Convert EnrichedHospital[] to Hospital[]
      return response.results.hospitals.map(adaptEnrichedHospitalToHospital);
    } catch (error) {
      console.error("[API] Error calling search API:", error);
      console.log("[API] Falling back to mock data");
      // Fall back to mock data on error
      return searchMockHospitals(query);
    }
  }

  // Use mock data
  return searchMockHospitals(query);
}

/**
 * Mock search implementation (fallback)
 */
function searchMockHospitals(query: string): Hospital[] {
  const lowerQuery = query.toLowerCase();

  const results = mockHospitals.filter((hospital) => {
    return (
      hospital.name.toLowerCase().includes(lowerQuery) ||
      hospital.description.toLowerCase().includes(lowerQuery) ||
      hospital.specialties.some((s) => s.toLowerCase().includes(lowerQuery)) ||
      hospital.location.toLowerCase().includes(lowerQuery) ||
      hospital.aiRecommendation.toLowerCase().includes(lowerQuery) ||
      hospital.doctors.some(
        (doctor) =>
          doctor.name.toLowerCase().includes(lowerQuery) ||
          doctor.specialty.toLowerCase().includes(lowerQuery)
      )
    );
  });

  console.log(`[API] Mock search for: "${query}"`);
  console.log(`[API] Found ${results.length} hospitals`);

  return results;
}

/**
 * Get hospital by ID - currently uses mock data
 * TODO: Implement real API call when endpoint is available
 */
export async function getHospitalByIdAPI(id: string): Promise<Hospital | null> {
  await delay(Math.random() * 500 + 300);

  const hospital = mockHospitals.find((h) => h.id === id);

  console.log(`[API] Fetching hospital with ID: ${id}`);
  console.log(`[API] Hospital found:`, hospital?.name || "Not found");

  return hospital || null;
}

/**
 * Get all hospitals - currently uses mock data
 * TODO: Implement real API call when endpoint is available
 */
export async function getAllHospitalsAPI(): Promise<Hospital[]> {
  await delay(Math.random() * 800 + 400);

  console.log(`[API] Fetching all hospitals`);
  console.log(`[API] Total hospitals: ${mockHospitals.length}`);

  return mockHospitals;
}
