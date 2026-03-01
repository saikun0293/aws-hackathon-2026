/**
 * ========================================================================
 * HOSPITAL REVIEW PLATFORM - API MOCK DEFINITIONS
 * ========================================================================
 * 
 * This file contains all API endpoint mocks with TypeScript interfaces
 * matching the database schema. When integrating with the actual backend,
 * replace the mock implementations with real HTTP calls.
 * 
 * BACKEND INTEGRATION INSTRUCTIONS:
 * 1. Replace the mock delay() calls with actual fetch/axios requests
 * 2. Update the base URL to point to your backend server
 * 3. Add proper error handling for network failures
 * 4. Implement authentication headers where needed
 * 5. Handle pagination for large datasets
 * 
 * RECOMMENDED STACK:
 * - Use axios or fetch for HTTP requests
 * - Consider using React Query or SWR for data fetching/caching
 * - Implement proper TypeScript types for request/response
 * ========================================================================
 */

// ========================================================================
// BASE CONFIGURATION
// ========================================================================

/**
 * Backend API base URL
 * REPLACE THIS with your actual backend URL in production
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Simulates network delay for mock APIs
 * REMOVE THIS in production
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Common API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ========================================================================
// TYPE DEFINITIONS MATCHING DATABASE SCHEMA
// ========================================================================

/**
 * Hospital Entity
 * Matches the Hospital table (29 rows)
 */
export interface Hospital {
  hospitalId: string;                    // Primary Key
  hospitalName: string;                  // Required
  services: string[];                    // JSON array of services offered
  location: {                            // Lat/Long object
    latitude: number;
    longitude: number;
  };
  address: string;                       // Full address
  departmentIds: string[];               // JSON array of department IDs
  insuranceCompanyIds: string[];         // JSON array of insurance company IDs
  phoneNumber?: string;                  // Optional landline/mobile
  description?: string;                  // Optional markdown description
  patients?: string[];                   // Optional JSON array of customer IDs
}

/**
 * Department Entity
 * Matches the Department table (218 rows)
 */
export interface Department {
  departmentId: string;                  // Primary Key
  departmentName: string;                // Required
  departmentDescription?: string;        // Optional markdown
  hospitalId: string;                    // Foreign key → Hospital
  listOfDoctorIds: string[];            // JSON array of doctor IDs
  patients?: string[];                   // Optional JSON array of customer IDs
}

/**
 * Doctor Entity
 * Matches the Doctor table (976 rows)
 */
export interface Doctor {
  doctorId: string;                      // Primary Key
  doctorName: string;                    // Required
  about: string;                         // Markdown bio
  records: any[];                        // JSON array (currently empty [])
  patients?: string[];                   // Optional JSON array of customer IDs
}

/**
 * Insurance Company Entity
 * Matches the InsuranceCompany table (10 rows)
 */
export interface InsuranceCompany {
  insuranceCompanyId: string;            // Primary Key
  insuranceCompanyName: string;          // Required
  description: string;                   // Markdown description
  services: string;                      // Markdown services list
}

/**
 * Insurance Policy Entity
 * Matches the InsurancePolicy table (185 rows)
 */
export interface InsurancePolicy {
  policyId: string;                      // Primary Key
  companyId: string;                     // Foreign key → InsuranceCompany
  about: string;                         // Markdown about policy
}

/**
 * Visit Information
 * Nested in Customer.visits
 */
export interface Visit {
  visitId: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
}

/**
 * Customer Entity
 * Matches the Customer table (11,110 rows)
 */
export interface Customer {
  customerId: string;                    // Primary Key
  customerName: string;                  // Required
  email: string;                         // Required
  createdAt: string;                     // DateTime (ISO 8601 format)
  policyId?: string;                     // Optional → InsurancePolicy
  gender?: 'Male' | 'Female' | 'Other'; // Optional
  age?: number;                          // Optional (18-80)
  uhid?: string;                         // Optional (UHID-XXXXX format)
  visits?: Visit[];                      // Optional JSON array
}

/**
 * Doctor Review Data
 * Nested in Review.doctorReview
 */
export interface DoctorReviewData {
  doctorId: string;
  doctorReview: string;
  // Optional detailed ratings
  bedsideMannerRating?: number;
  medicalExpertiseRating?: number;
  communicationRating?: number;
  waitTimeRating?: number;
  thoroughnessRating?: number;
  followUpRating?: number;
}

/**
 * Claim Information
 * Nested in Review.claim
 */
export interface ClaimData {
  claimId: string;
  claimAmountApproved: number;
  remainingAmountToBePaid: number;
}

/**
 * Payment Information
 * Nested in Review.payment
 */
export interface PaymentData {
  billNo: string;
  amountToBePayed: number;
  totalBillAmount: number;
  description: string;
}

/**
 * Extracted Medical Data
 * Nested in Review.extractedData
 */
export interface ExtractedData {
  hospitalName: string;
  doctorName: string;
  surgeryType: string;
  procedureDate: string;
  diagnosis: string;
  medications: string[];
  confidence: number;
}

/**
 * Review Entity
 * Matches the Review table (10,110 rows)
 */
export interface Review {
  reviewId: string;                      // Primary Key
  hospitalId: string;                    // Foreign key → Hospital
  doctorId: string;                      // Foreign key → Doctor
  customerId: string;                    // Foreign key → Customer
  policyId?: string;                     // Optional → InsurancePolicy
  purposeOfVisit: string;                // Detailed markdown
  doctorReview: DoctorReviewData;        // JSON object
  claim?: ClaimData;                     // Optional JSON object
  payment: PaymentData;                  // JSON object
  hospitalReview: string;                // Detailed markdown
  documentIds: string[];                 // JSON array of filenames
  extractedData: ExtractedData;          // JSON object
  verified: boolean;                     // 1=verified, 0=fake
  createdAt: string;                     // DateTime (ISO 8601 format)
  // Optional hospital ratings
  serviceQualityRating?: number;
  maintenanceRating?: number;
  foodQualityRating?: number;
  cleanlinessRating?: number;
  staffBehaviorRating?: number;
}

/**
 * Document Validation Result
 */
export interface DocumentValidationResult {
  success: boolean;
  verified: boolean;
  s3Url?: string;
  documentId?: string;
  message: string;
  confidence?: number;
}

// ========================================================================
// HOSPITAL API ENDPOINTS
// ========================================================================

/**
 * Search hospitals by query
 * 
 * BACKEND ENDPOINT: GET /api/hospitals/search?q={query}
 * 
 * @param query - Search string (hospital name, services, location, etc.)
 * @returns Array of matching hospitals
 * 
 * INTEGRATION NOTES:
 * - Implement full-text search on hospitalName, services, address, description
 * - Consider implementing pagination for large result sets
 * - Add filters for location radius, insurance accepted, departments
 */
export async function searchHospitals(query: string): Promise<Hospital[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/hospitals/search?q=${query}`);
  
  // MOCK IMPLEMENTATION - Replace with actual fetch
  await delay(500 + Math.random() * 500);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/hospitals/search?q=${encodeURIComponent(query)}`);
  // const data = await response.json();
  // return data.hospitals;
  
  // Mock data
  return [
    {
      hospitalId: 'hosp_001',
      hospitalName: 'City General Hospital',
      services: ['Emergency Care', 'Surgery', 'Cardiology', 'Pediatrics'],
      location: { latitude: 28.6139, longitude: 77.2090 },
      address: '123 Medical Center Blvd, Delhi, 110001',
      departmentIds: ['dept_001', 'dept_002', 'dept_003'],
      insuranceCompanyIds: ['ins_001', 'ins_002'],
      phoneNumber: '+91-11-2345-6789',
      description: '# Leading Multi-Specialty Hospital\n\nProviding quality healthcare since 1985.',
      patients: ['cust_001', 'cust_002']
    }
  ];
}

/**
 * Get hospital by ID
 * 
 * BACKEND ENDPOINT: GET /api/hospitals/{hospitalId}
 * 
 * @param hospitalId - Unique hospital identifier
 * @returns Hospital details or null if not found
 * 
 * INTEGRATION NOTES:
 * - Include related entities (departments, insurance companies)
 * - Consider using GraphQL for flexible nested queries
 */
export async function getHospitalById(hospitalId: string): Promise<Hospital | null> {
  console.log(`[API Mock] GET ${API_BASE_URL}/hospitals/${hospitalId}`);
  
  await delay(300 + Math.random() * 300);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}`);
  // if (!response.ok) return null;
  // const data = await response.json();
  // return data.hospital;
  
  return null; // Mock implementation
}

/**
 * Get all hospitals (paginated)
 * 
 * BACKEND ENDPOINT: GET /api/hospitals?page={page}&limit={limit}
 * 
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 20)
 * @returns Paginated hospital list
 * 
 * INTEGRATION NOTES:
 * - Implement cursor-based pagination for better performance
 * - Return total count for pagination UI
 */
export async function getAllHospitals(page: number = 1, limit: number = 20): Promise<ApiResponse<Hospital[]>> {
  console.log(`[API Mock] GET ${API_BASE_URL}/hospitals?page=${page}&limit=${limit}`);
  
  await delay(400 + Math.random() * 400);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/hospitals?page=${page}&limit=${limit}`);
  // return await response.json();
  
  return {
    success: true,
    data: [],
    message: 'Hospitals retrieved successfully'
  };
}

/**
 * Get hospitals by insurance company
 * 
 * BACKEND ENDPOINT: GET /api/hospitals/by-insurance/{insuranceCompanyId}
 * 
 * @param insuranceCompanyId - Insurance company ID
 * @returns Hospitals that accept this insurance
 */
export async function getHospitalsByInsurance(insuranceCompanyId: string): Promise<Hospital[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/hospitals/by-insurance/${insuranceCompanyId}`);
  
  await delay(400);
  
  // TODO: Replace with actual API call
  return [];
}

// ========================================================================
// DEPARTMENT API ENDPOINTS
// ========================================================================

/**
 * Get departments by hospital ID
 * 
 * BACKEND ENDPOINT: GET /api/departments/hospital/{hospitalId}
 * 
 * @param hospitalId - Hospital ID
 * @returns Array of departments in the hospital
 */
export async function getDepartmentsByHospital(hospitalId: string): Promise<Department[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/departments/hospital/${hospitalId}`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/departments/hospital/${hospitalId}`);
  // const data = await response.json();
  // return data.departments;
  
  return [];
}

/**
 * Get department by ID
 * 
 * BACKEND ENDPOINT: GET /api/departments/{departmentId}
 */
export async function getDepartmentById(departmentId: string): Promise<Department | null> {
  console.log(`[API Mock] GET ${API_BASE_URL}/departments/${departmentId}`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  return null;
}

// ========================================================================
// DOCTOR API ENDPOINTS
// ========================================================================

/**
 * Get doctors by hospital ID
 * 
 * BACKEND ENDPOINT: GET /api/doctors/hospital/{hospitalId}
 * 
 * @param hospitalId - Hospital ID
 * @returns Array of doctors in the hospital
 */
export async function getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/doctors/hospital/${hospitalId}`);
  
  await delay(400);
  
  // TODO: Replace with actual API call
  return [];
}

/**
 * Get doctors by department ID
 * 
 * BACKEND ENDPOINT: GET /api/doctors/department/{departmentId}
 */
export async function getDoctorsByDepartment(departmentId: string): Promise<Doctor[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/doctors/department/${departmentId}`);
  
  await delay(400);
  
  // TODO: Replace with actual API call
  return [];
}

/**
 * Get doctor by ID
 * 
 * BACKEND ENDPOINT: GET /api/doctors/{doctorId}
 */
export async function getDoctorById(doctorId: string): Promise<Doctor | null> {
  console.log(`[API Mock] GET ${API_BASE_URL}/doctors/${doctorId}`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  return null;
}

/**
 * Search doctors by name or specialty
 * 
 * BACKEND ENDPOINT: GET /api/doctors/search?q={query}
 */
export async function searchDoctors(query: string): Promise<Doctor[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/doctors/search?q=${query}`);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  return [];
}

// ========================================================================
// INSURANCE COMPANY API ENDPOINTS
// ========================================================================

/**
 * Get all insurance companies
 * 
 * BACKEND ENDPOINT: GET /api/insurance-companies
 */
export async function getAllInsuranceCompanies(): Promise<InsuranceCompany[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/insurance-companies`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/insurance-companies`);
  // const data = await response.json();
  // return data.companies;
  
  return [];
}

/**
 * Get insurance company by ID
 * 
 * BACKEND ENDPOINT: GET /api/insurance-companies/{insuranceCompanyId}
 */
export async function getInsuranceCompanyById(insuranceCompanyId: string): Promise<InsuranceCompany | null> {
  console.log(`[API Mock] GET ${API_BASE_URL}/insurance-companies/${insuranceCompanyId}`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  return null;
}

// ========================================================================
// INSURANCE POLICY API ENDPOINTS
// ========================================================================

/**
 * Get policies by insurance company
 * 
 * BACKEND ENDPOINT: GET /api/insurance-policies/company/{companyId}
 */
export async function getPoliciesByCompany(companyId: string): Promise<InsurancePolicy[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/insurance-policies/company/${companyId}`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  return [];
}

/**
 * Get policy by ID
 * 
 * BACKEND ENDPOINT: GET /api/insurance-policies/{policyId}
 */
export async function getPolicyById(policyId: string): Promise<InsurancePolicy | null> {
  console.log(`[API Mock] GET ${API_BASE_URL}/insurance-policies/${policyId}`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  return null;
}

// ========================================================================
// CUSTOMER API ENDPOINTS
// ========================================================================

/**
 * Get customer profile
 * 
 * BACKEND ENDPOINT: GET /api/customers/{customerId}
 * 
 * @param customerId - Customer ID (usually from auth context)
 * @returns Customer profile data
 * 
 * INTEGRATION NOTES:
 * - Add authentication middleware to verify customer identity
 * - Use JWT token or session to get current user
 */
export async function getCustomerProfile(customerId: string): Promise<Customer | null> {
  console.log(`[API Mock] GET ${API_BASE_URL}/customers/${customerId}`);
  
  await delay(400);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
  //   headers: {
  //     'Authorization': `Bearer ${getAuthToken()}`
  //   }
  // });
  // const data = await response.json();
  // return data.customer;
  
  // Mock data
  return {
    customerId: 'cust_001',
    customerName: 'John Doe',
    email: 'john.doe@example.com',
    createdAt: '2024-01-15T10:30:00Z',
    policyId: 'pol_001',
    gender: 'Male',
    age: 35,
    uhid: 'UHID-12345',
    visits: [
      {
        visitId: 'visit_001',
        hospitalId: 'hosp_001',
        departmentId: 'dept_001',
        doctorId: 'doc_001'
      }
    ]
  };
}

/**
 * Update customer profile
 * 
 * BACKEND ENDPOINT: PUT /api/customers/{customerId}
 * 
 * @param customerId - Customer ID
 * @param updates - Partial customer data to update
 * 
 * INTEGRATION NOTES:
 * - Validate email format on backend
 * - Prevent updating sensitive fields like customerId, createdAt
 */
export async function updateCustomerProfile(
  customerId: string,
  updates: Partial<Customer>
): Promise<ApiResponse<Customer>> {
  console.log(`[API Mock] PUT ${API_BASE_URL}/customers/${customerId}`, updates);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
  //   method: 'PUT',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${getAuthToken()}`
  //   },
  //   body: JSON.stringify(updates)
  // });
  // return await response.json();
  
  return {
    success: true,
    message: 'Profile updated successfully'
  };
}

/**
 * Get customer visit history
 * 
 * BACKEND ENDPOINT: GET /api/customers/{customerId}/visits
 */
export async function getCustomerVisits(customerId: string): Promise<Visit[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/customers/${customerId}/visits`);
  
  await delay(400);
  
  // TODO: Replace with actual API call
  return [];
}

/**
 * Add customer visit
 * 
 * BACKEND ENDPOINT: POST /api/customers/{customerId}/visits
 */
export async function addCustomerVisit(
  customerId: string,
  visit: Omit<Visit, 'visitId'>
): Promise<ApiResponse<Visit>> {
  console.log(`[API Mock] POST ${API_BASE_URL}/customers/${customerId}/visits`, visit);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  return {
    success: true,
    message: 'Visit added successfully'
  };
}

// ========================================================================
// REVIEW API ENDPOINTS
// ========================================================================

/**
 * Create a new review
 * 
 * BACKEND ENDPOINT: POST /api/reviews
 * 
 * @param reviewData - Complete review data
 * @returns Created review with ID
 * 
 * INTEGRATION NOTES:
 * - Validate that customer hasn't already reviewed this hospital/doctor combination
 * - Run document verification in background job
 * - Send confirmation email to customer
 * - Update hospital/doctor ratings asynchronously
 */
export async function createReview(
  reviewData: Omit<Review, 'reviewId' | 'createdAt'>
): Promise<ApiResponse<Review>> {
  console.log(`[API Mock] POST ${API_BASE_URL}/reviews`, reviewData);
  
  await delay(1500);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/reviews`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${getAuthToken()}`
  //   },
  //   body: JSON.stringify(reviewData)
  // });
  // return await response.json();
  
  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    success: true,
    data: {
      ...reviewData,
      reviewId,
      createdAt: new Date().toISOString()
    } as Review,
    message: 'Review created successfully'
  };
}

/**
 * Get reviews by customer ID
 * 
 * BACKEND ENDPOINT: GET /api/reviews/customer/{customerId}
 * 
 * @param customerId - Customer ID
 * @returns Array of customer's reviews
 */
export async function getReviewsByCustomer(customerId: string): Promise<Review[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/reviews/customer/${customerId}`);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/reviews/customer/${customerId}`, {
  //   headers: {
  //     'Authorization': `Bearer ${getAuthToken()}`
  //   }
  // });
  // const data = await response.json();
  // return data.reviews;
  
  // Mock data
  return [
    {
      reviewId: 'review_001',
      hospitalId: 'hosp_001',
      doctorId: 'doc_001',
      customerId: customerId,
      policyId: 'pol_001',
      purposeOfVisit: '# Cardiac Surgery\n\nRoutine bypass procedure',
      doctorReview: {
        doctorId: 'doc_001',
        doctorReview: 'Excellent care and follow-up',
        bedsideMannerRating: 5,
        medicalExpertiseRating: 5,
        communicationRating: 4,
        waitTimeRating: 4,
        thoroughnessRating: 5,
        followUpRating: 5
      },
      claim: {
        claimId: 'claim_001',
        claimAmountApproved: 450000,
        remainingAmountToBePaid: 50000
      },
      payment: {
        billNo: 'BILL-2024-001',
        amountToBePayed: 50000,
        totalBillAmount: 500000,
        description: 'Cardiac bypass surgery with post-op care'
      },
      hospitalReview: '# Excellent Facilities\n\nVery clean and well-maintained',
      documentIds: ['doc_001.pdf', 'doc_002.pdf'],
      extractedData: {
        hospitalName: 'City General Hospital',
        doctorName: 'Dr. Sarah Johnson',
        surgeryType: 'Cardiac Bypass Surgery',
        procedureDate: '2024-02-15',
        diagnosis: 'Coronary Artery Disease',
        medications: ['Aspirin', 'Metoprolol'],
        confidence: 0.95
      },
      verified: true,
      createdAt: '2024-02-20T14:30:00Z',
      serviceQualityRating: 5,
      maintenanceRating: 4,
      foodQualityRating: 3,
      cleanlinessRating: 5,
      staffBehaviorRating: 4
    }
  ];
}

/**
 * Get reviews by hospital ID
 * 
 * BACKEND ENDPOINT: GET /api/reviews/hospital/{hospitalId}?verified={true|false}
 * 
 * @param hospitalId - Hospital ID
 * @param verifiedOnly - Return only verified reviews (default: true)
 * @returns Array of hospital reviews
 */
export async function getReviewsByHospital(
  hospitalId: string,
  verifiedOnly: boolean = true
): Promise<Review[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/reviews/hospital/${hospitalId}?verified=${verifiedOnly}`);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  return [];
}

/**
 * Get reviews by doctor ID
 * 
 * BACKEND ENDPOINT: GET /api/reviews/doctor/{doctorId}?verified={true|false}
 */
export async function getReviewsByDoctor(
  doctorId: string,
  verifiedOnly: boolean = true
): Promise<Review[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/reviews/doctor/${doctorId}?verified=${verifiedOnly}`);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  return [];
}

/**
 * Get review by ID
 * 
 * BACKEND ENDPOINT: GET /api/reviews/{reviewId}
 */
export async function getReviewById(reviewId: string): Promise<Review | null> {
  console.log(`[API Mock] GET ${API_BASE_URL}/reviews/${reviewId}`);
  
  await delay(400);
  
  // TODO: Replace with actual API call
  return null;
}

/**
 * Update review
 * 
 * BACKEND ENDPOINT: PUT /api/reviews/{reviewId}
 * 
 * INTEGRATION NOTES:
 * - Only allow updates by the review owner
 * - Re-run verification if documents are changed
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<Review>
): Promise<ApiResponse<Review>> {
  console.log(`[API Mock] PUT ${API_BASE_URL}/reviews/${reviewId}`, updates);
  
  await delay(800);
  
  // TODO: Replace with actual API call
  return {
    success: true,
    message: 'Review updated successfully'
  };
}

/**
 * Delete review
 * 
 * BACKEND ENDPOINT: DELETE /api/reviews/{reviewId}
 * 
 * INTEGRATION NOTES:
 * - Soft delete (mark as deleted) instead of hard delete
 * - Only allow deletion by review owner or admin
 */
export async function deleteReview(reviewId: string): Promise<ApiResponse<void>> {
  console.log(`[API Mock] DELETE ${API_BASE_URL}/reviews/${reviewId}`);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  return {
    success: true,
    message: 'Review deleted successfully'
  };
}

// ========================================================================
// DOCUMENT API ENDPOINTS
// ========================================================================

/**
 * Upload and validate document
 * 
 * BACKEND ENDPOINT: POST /api/documents/upload
 * 
 * @param file - Document file to upload
 * @param documentType - Type of document (medical_record, insurance_claim, bill, etc.)
 * @returns Validation result with S3 URL
 * 
 * INTEGRATION NOTES:
 * - Use AWS S3 pre-signed URLs for direct upload from browser
 * - Run AWS Rekognition for document tampering detection
 * - Use HyperVerge or similar service for enhanced verification
 * - Store original and processed versions
 */
export async function uploadDocument(
  file: File,
  documentType: 'medical_record' | 'insurance_claim' | 'bill' | 'prescription' | 'discharge_summary'
): Promise<DocumentValidationResult> {
  console.log(`[API Mock] POST ${API_BASE_URL}/documents/upload`, {
    fileName: file.name,
    fileSize: file.size,
    documentType
  });
  
  await delay(2000 + Math.random() * 1000);
  
  // TODO: Replace with actual API call
  // Step 1: Get pre-signed URL
  // const presignResponse = await fetch(`${API_BASE_URL}/documents/presigned-url`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ fileName: file.name, documentType })
  // });
  // const { uploadUrl, documentId } = await presignResponse.json();
  //
  // Step 2: Upload to S3
  // await fetch(uploadUrl, {
  //   method: 'PUT',
  //   body: file,
  //   headers: { 'Content-Type': file.type }
  // });
  //
  // Step 3: Trigger verification
  // const verifyResponse = await fetch(`${API_BASE_URL}/documents/${documentId}/verify`, {
  //   method: 'POST'
  // });
  // return await verifyResponse.json();
  
  // Mock implementation
  const verified = Math.random() > 0.05; // 95% success rate
  
  return {
    success: true,
    verified,
    documentId: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    s3Url: `https://s3.amazonaws.com/hospital-reviews/${Date.now()}-${file.name}`,
    message: verified ? 'Document verified successfully' : 'Document verification failed',
    confidence: verified ? 0.92 + Math.random() * 0.08 : 0.3 + Math.random() * 0.3
  };
}

/**
 * Extract medical data from documents using AI
 * 
 * BACKEND ENDPOINT: POST /api/documents/extract
 * 
 * @param documentIds - Array of document IDs to extract from
 * @returns Extracted medical information
 * 
 * INTEGRATION NOTES:
 * - Use AWS Textract for OCR
 * - Use AWS Comprehend Medical for entity extraction
 * - Parse structured data (dates, amounts, medications)
 * - Run asynchronously for large documents
 */
export async function extractMedicalData(documentIds: string[]): Promise<ExtractedData> {
  console.log(`[API Mock] POST ${API_BASE_URL}/documents/extract`, { documentIds });
  
  await delay(3000 + Math.random() * 2000);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/documents/extract`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ documentIds })
  // });
  // return await response.json();
  
  // Mock data
  return {
    hospitalName: 'City General Hospital',
    doctorName: 'Dr. Sarah Johnson',
    surgeryType: 'Cardiac Bypass Surgery',
    procedureDate: '2024-02-15',
    diagnosis: 'Coronary Artery Disease',
    medications: ['Aspirin', 'Metoprolol', 'Atorvastatin'],
    confidence: 0.89 + Math.random() * 0.1
  };
}

/**
 * Get customer's uploaded documents
 * 
 * BACKEND ENDPOINT: GET /api/customers/{customerId}/documents
 * 
 * @param customerId - Customer ID
 * @returns Array of document metadata
 */
export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  documentType: string;
  s3Url: string;
  verified: boolean;
  uploadedAt: string;
  fileSize: number;
}

export async function getCustomerDocuments(customerId: string): Promise<DocumentMetadata[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/customers/${customerId}/documents`);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/customers/${customerId}/documents`, {
  //   headers: {
  //     'Authorization': `Bearer ${getAuthToken()}`
  //   }
  // });
  // const data = await response.json();
  // return data.documents;
  
  // Mock data
  return [
    {
      documentId: 'doc_001',
      fileName: 'medical_report_2024.pdf',
      documentType: 'medical_record',
      s3Url: 'https://s3.amazonaws.com/hospital-reviews/doc_001.pdf',
      verified: true,
      uploadedAt: '2024-02-20T10:30:00Z',
      fileSize: 245678
    }
  ];
}

/**
 * Delete document
 * 
 * BACKEND ENDPOINT: DELETE /api/documents/{documentId}
 * 
 * INTEGRATION NOTES:
 * - Remove from S3
 * - Mark as deleted in database
 * - Check if document is referenced in any reviews
 */
export async function deleteDocument(documentId: string): Promise<ApiResponse<void>> {
  console.log(`[API Mock] DELETE ${API_BASE_URL}/documents/${documentId}`);
  
  await delay(500);
  
  // TODO: Replace with actual API call
  return {
    success: true,
    message: 'Document deleted successfully'
  };
}

// ========================================================================
// ANALYTICS & AGGREGATION ENDPOINTS
// ========================================================================

/**
 * Get hospital statistics
 * 
 * BACKEND ENDPOINT: GET /api/hospitals/{hospitalId}/stats
 */
export interface HospitalStats {
  totalReviews: number;
  verifiedReviews: number;
  averageRating: number;
  averageClaimApprovalRate: number;
  averageCost: number;
  ratingBreakdown: {
    serviceQuality: number;
    maintenance: number;
    foodQuality: number;
    cleanliness: number;
    staffBehavior: number;
  };
}

export async function getHospitalStats(hospitalId: string): Promise<HospitalStats> {
  console.log(`[API Mock] GET ${API_BASE_URL}/hospitals/${hospitalId}/stats`);
  
  await delay(600);
  
  // TODO: Replace with actual API call
  return {
    totalReviews: 0,
    verifiedReviews: 0,
    averageRating: 0,
    averageClaimApprovalRate: 0,
    averageCost: 0,
    ratingBreakdown: {
      serviceQuality: 0,
      maintenance: 0,
      foodQuality: 0,
      cleanliness: 0,
      staffBehavior: 0
    }
  };
}

/**
 * Get doctor statistics
 * 
 * BACKEND ENDPOINT: GET /api/doctors/{doctorId}/stats
 */
export interface DoctorStats {
  totalReviews: number;
  verifiedReviews: number;
  averageRating: number;
  ratingBreakdown: {
    bedsideManner: number;
    medicalExpertise: number;
    communication: number;
    waitTime: number;
    thoroughness: number;
    followUpCare: number;
  };
}

export async function getDoctorStats(doctorId: string): Promise<DoctorStats> {
  console.log(`[API Mock] GET ${API_BASE_URL}/doctors/${doctorId}/stats`);
  
  await delay(600);
  
  // TODO: Replace with actual API call
  return {
    totalReviews: 0,
    verifiedReviews: 0,
    averageRating: 0,
    ratingBreakdown: {
      bedsideManner: 0,
      medicalExpertise: 0,
      communication: 0,
      waitTime: 0,
      thoroughness: 0,
      followUpCare: 0
    }
  };
}

// ========================================================================
// AUTHENTICATION ENDPOINTS (If implementing your own auth)
// ========================================================================

/**
 * Register new customer
 * 
 * BACKEND ENDPOINT: POST /api/auth/register
 * 
 * INTEGRATION NOTES:
 * - Hash passwords using bcrypt
 * - Send email verification
 * - Return JWT token
 */
export interface RegisterData {
  customerName: string;
  email: string;
  password: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
}

export async function registerCustomer(data: RegisterData): Promise<ApiResponse<{ token: string; customer: Customer }>> {
  console.log(`[API Mock] POST ${API_BASE_URL}/auth/register`, { ...data, password: '[REDACTED]' });
  
  await delay(1000);
  
  // TODO: Replace with actual API call
  return {
    success: true,
    message: 'Registration successful'
  };
}

/**
 * Login customer
 * 
 * BACKEND ENDPOINT: POST /api/auth/login
 */
export interface LoginData {
  email: string;
  password: string;
}

export async function loginCustomer(data: LoginData): Promise<ApiResponse<{ token: string; customer: Customer }>> {
  console.log(`[API Mock] POST ${API_BASE_URL}/auth/login`, { ...data, password: '[REDACTED]' });
  
  await delay(800);
  
  // TODO: Replace with actual API call
  return {
    success: true,
    message: 'Login successful'
  };
}

/**
 * Logout customer
 * 
 * BACKEND ENDPOINT: POST /api/auth/logout
 */
export async function logoutCustomer(): Promise<ApiResponse<void>> {
  console.log(`[API Mock] POST ${API_BASE_URL}/auth/logout`);
  
  await delay(300);
  
  // TODO: Replace with actual API call
  return {
    success: true,
    message: 'Logout successful'
  };
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

/**
 * Get authentication token from storage
 * REPLACE with your actual token management
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Set authentication token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Clear authentication token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}

// ========================================================================
// EXPORT ALL TYPES
// ========================================================================

export type {
  Hospital,
  Department,
  Doctor,
  InsuranceCompany,
  InsurancePolicy,
  Customer,
  Review,
  Visit,
  DoctorReviewData,
  ClaimData,
  PaymentData,
  ExtractedData,
  DocumentValidationResult,
  ApiResponse
};
