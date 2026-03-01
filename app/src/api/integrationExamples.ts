/**
 * ========================================================================
 * HOSPITAL REVIEW PLATFORM - BACKEND INTEGRATION CODE EXAMPLES
 * ========================================================================
 * 
 * This file contains practical code examples showing how to replace
 * mock API calls with real backend API integration.
 * 
 * USAGE:
 * 1. Copy the implementation patterns below
 * 2. Replace API_BASE_URL with your actual backend URL
 * 3. Implement proper error handling
 * 4. Add authentication token management
 * 5. Consider using a library like axios or React Query
 * 
 * ========================================================================
 */

import type {
  Hospital,
  Doctor,
  Customer,
  Review,
  ApiResponse,
  ExtractedData,
  DocumentValidationResult
} from '../app/services/apiMocks';

// ========================================================================
// CONFIGURATION
// ========================================================================

/**
 * Backend API base URL
 * Set this in your .env file:
 * REACT_APP_API_BASE_URL=https://api.hospitalreviewplatform.com/v1
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Get authentication token from storage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Set authentication token in storage
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
// ERROR HANDLING
// ========================================================================

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API response and throw errors if needed
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An error occurred'
    }));
    
    throw new ApiError(
      errorData.message || 'An error occurred',
      response.status,
      errorData.error,
      errorData.details
    );
  }
  
  return response.json();
}

// ========================================================================
// AUTHENTICATION EXAMPLES
// ========================================================================

/**
 * Example: Register a new customer
 * POST /api/auth/register
 */
export async function registerCustomer(data: {
  customerName: string;
  email: string;
  password: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
}): Promise<ApiResponse<{ token: string; customer: Customer }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await handleResponse<ApiResponse<{ token: string; customer: Customer }>>(response);
    
    // Store the token
    if (result.data?.token) {
      setAuthToken(result.data.token);
    }
    
    return result;
  } catch (error) {
    console.error('[API] Register failed:', error);
    throw error;
  }
}

/**
 * Example: Login customer
 * POST /api/auth/login
 */
export async function loginCustomer(data: {
  email: string;
  password: string;
}): Promise<ApiResponse<{ token: string; customer: Customer }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await handleResponse<ApiResponse<{ token: string; customer: Customer }>>(response);
    
    // Store the token
    if (result.data?.token) {
      setAuthToken(result.data.token);
    }
    
    return result;
  } catch (error) {
    console.error('[API] Login failed:', error);
    throw error;
  }
}

// ========================================================================
// HOSPITAL SEARCH EXAMPLES
// ========================================================================

/**
 * Example: Search hospitals with filters and pagination
 * GET /api/hospitals/search?q={query}&page={page}&limit={limit}
 */
export async function searchHospitals(params: {
  query: string;
  page?: number;
  limit?: number;
  insuranceId?: string;
  location?: string; // "lat,long"
  radius?: number; // in km
}): Promise<ApiResponse<{
  hospitals: Hospital[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}>> {
  try {
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.query);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.insuranceId) queryParams.append('insuranceId', params.insuranceId);
    if (params.location) queryParams.append('location', params.location);
    if (params.radius) queryParams.append('radius', params.radius.toString());

    const response = await fetch(
      `${API_BASE_URL}/hospitals/search?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Search hospitals failed:', error);
    throw error;
  }
}

/**
 * Example: Get hospital by ID
 * GET /api/hospitals/{hospitalId}
 */
export async function getHospitalById(hospitalId: string): Promise<ApiResponse<Hospital>> {
  try {
    const response = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Get hospital failed:', error);
    throw error;
  }
}

// ========================================================================
// DOCTOR SEARCH EXAMPLES
// ========================================================================

/**
 * Example: Get doctors by hospital
 * GET /api/doctors/hospital/{hospitalId}
 */
export async function getDoctorsByHospital(
  hospitalId: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<{ doctors: Doctor[] }>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/doctors/hospital/${hospitalId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Get doctors by hospital failed:', error);
    throw error;
  }
}

// ========================================================================
// CUSTOMER PROFILE EXAMPLES
// ========================================================================

/**
 * Example: Get customer profile (requires authentication)
 * GET /api/customers/{customerId}
 */
export async function getCustomerProfile(customerId: string): Promise<ApiResponse<Customer>> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError('No authentication token found', 401, 'UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Get customer profile failed:', error);
    throw error;
  }
}

/**
 * Example: Update customer profile (requires authentication)
 * PUT /api/customers/{customerId}
 */
export async function updateCustomerProfile(
  customerId: string,
  updates: Partial<Customer>
): Promise<ApiResponse<Customer>> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError('No authentication token found', 401, 'UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Update customer profile failed:', error);
    throw error;
  }
}

// ========================================================================
// REVIEW EXAMPLES
// ========================================================================

/**
 * Example: Create a new review (requires authentication)
 * POST /api/reviews
 */
export async function createReview(
  reviewData: Omit<Review, 'reviewId' | 'createdAt'>
): Promise<ApiResponse<Review>> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError('No authentication token found', 401, 'UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Create review failed:', error);
    throw error;
  }
}

/**
 * Example: Get reviews by customer (requires authentication)
 * GET /api/reviews/customer/{customerId}
 */
export async function getReviewsByCustomer(
  customerId: string,
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }
): Promise<ApiResponse<{
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}>> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError('No authentication token found', 401, 'UNAUTHORIZED');
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.order) queryParams.append('order', params.order);

    const url = `${API_BASE_URL}/reviews/customer/${customerId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Get reviews by customer failed:', error);
    throw error;
  }
}

// ========================================================================
// DOCUMENT UPLOAD EXAMPLES
// ========================================================================

/**
 * Example: Get pre-signed URL for document upload (requires authentication)
 * POST /api/documents/presigned-url
 */
export async function getPresignedUploadUrl(params: {
  fileName: string;
  documentType: 'medical_record' | 'insurance_claim' | 'bill' | 'prescription' | 'discharge_summary';
  fileSize: number;
  contentType: string;
}): Promise<ApiResponse<{
  uploadUrl: string;
  documentId: string;
  expiresIn: number;
}>> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError('No authentication token found', 401, 'UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/documents/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Get presigned URL failed:', error);
    throw error;
  }
}

/**
 * Example: Upload document to S3 using presigned URL
 */
export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to upload file to S3', response.status);
    }
  } catch (error) {
    console.error('[API] Upload to S3 failed:', error);
    throw error;
  }
}

/**
 * Example: Verify uploaded document (requires authentication)
 * POST /api/documents/{documentId}/verify
 */
export async function verifyDocument(documentId: string): Promise<ApiResponse<DocumentValidationResult>> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError('No authentication token found', 401, 'UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Verify document failed:', error);
    throw error;
  }
}

/**
 * Example: Complete document upload workflow
 */
export async function uploadAndVerifyDocument(
  file: File,
  documentType: 'medical_record' | 'insurance_claim' | 'bill' | 'prescription' | 'discharge_summary'
): Promise<DocumentValidationResult> {
  try {
    // Step 1: Get presigned URL
    const presignedResult = await getPresignedUploadUrl({
      fileName: file.name,
      documentType,
      fileSize: file.size,
      contentType: file.type,
    });

    if (!presignedResult.data) {
      throw new ApiError('Failed to get presigned URL', 500);
    }

    const { uploadUrl, documentId } = presignedResult.data;

    // Step 2: Upload to S3
    await uploadToS3(uploadUrl, file);

    // Step 3: Verify document
    const verifyResult = await verifyDocument(documentId);

    if (!verifyResult.data) {
      throw new ApiError('Failed to verify document', 500);
    }

    return verifyResult.data;
  } catch (error) {
    console.error('[API] Upload and verify document failed:', error);
    throw error;
  }
}

/**
 * Example: Extract medical data from documents (requires authentication)
 * POST /api/documents/extract
 */
export async function extractMedicalData(documentIds: string[]): Promise<ApiResponse<ExtractedData>> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError('No authentication token found', 401, 'UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/documents/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ documentIds }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('[API] Extract medical data failed:', error);
    throw error;
  }
}

// ========================================================================
// USING WITH REACT QUERY (RECOMMENDED)
// ========================================================================

/**
 * Example: Using React Query for data fetching and caching
 * 
 * First, install React Query:
 * npm install @tanstack/react-query
 * 
 * Then use it in your components:
 */

/*
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Example: Search hospitals with React Query
export function useHospitalSearch(query: string) {
  return useQuery({
    queryKey: ['hospitals', 'search', query],
    queryFn: () => searchHospitals({ query, page: 1, limit: 20 }),
    enabled: query.length > 0, // Only run if there's a search query
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Example: Get customer profile with React Query
export function useCustomerProfile(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomerProfile(customerId),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// Example: Update customer profile with mutation
export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, updates }: { 
      customerId: string; 
      updates: Partial<Customer> 
    }) => updateCustomerProfile(customerId, updates),
    onSuccess: (data, variables) => {
      // Invalidate and refetch customer profile
      queryClient.invalidateQueries({ queryKey: ['customer', variables.customerId] });
    },
  });
}

// Example: Create review with mutation
export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reviewData: Omit<Review, 'reviewId' | 'createdAt'>) => 
      createReview(reviewData),
    onSuccess: (data, variables) => {
      // Invalidate reviews cache
      queryClient.invalidateQueries({ 
        queryKey: ['reviews', 'customer', variables.customerId] 
      });
    },
  });
}

// Usage in component:
function HospitalSearchComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, error } = useHospitalSearch(searchQuery);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <input 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search hospitals..."
      />
      {data?.data?.hospitals.map(hospital => (
        <div key={hospital.hospitalId}>{hospital.hospitalName}</div>
      ))}
    </div>
  );
}
*/

// ========================================================================
// AXIOS ALTERNATIVE (if you prefer axios over fetch)
// ========================================================================

/**
 * Example: Using axios instead of fetch
 * 
 * First, install axios:
 * npm install axios
 * 
 * Then create an axios instance:
 */

/*
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      throw new ApiError(
        data.message || 'An error occurred',
        status,
        data.error,
        data.details
      );
    } else if (error.request) {
      // Request made but no response
      throw new ApiError('Network error. Please check your connection.', 0);
    } else {
      // Something else happened
      throw new ApiError(error.message, 0);
    }
  }
);

// Example: Search hospitals with axios
export async function searchHospitalsAxios(params: {
  query: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ hospitals: Hospital[] }>> {
  return apiClient.get('/hospitals/search', { params });
}

// Example: Create review with axios
export async function createReviewAxios(
  reviewData: Omit<Review, 'reviewId' | 'createdAt'>
): Promise<ApiResponse<Review>> {
  return apiClient.post('/reviews', reviewData);
}
*/

// ========================================================================
// TESTING UTILITIES
// ========================================================================

/**
 * Example: Mock API calls for testing
 */
export const mockApiForTesting = {
  /**
   * Enable mock mode (use mock data instead of real API)
   */
  enableMockMode: () => {
    (window as any).__USE_MOCK_API__ = true;
  },
  
  /**
   * Disable mock mode (use real API)
   */
  disableMockMode: () => {
    (window as any).__USE_MOCK_API__ = false;
  },
  
  /**
   * Check if mock mode is enabled
   */
  isMockMode: () => {
    return (window as any).__USE_MOCK_API__ === true;
  },
};

// ========================================================================
// RETRY LOGIC FOR FAILED REQUESTS
// ========================================================================

/**
 * Example: Retry failed requests with exponential backoff
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry for client errors (4xx)
      if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      console.log(`[API] Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Usage example:
 * 
 * const hospitals = await fetchWithRetry(
 *   () => searchHospitals({ query: 'cardiac' }),
 *   3,  // max 3 retries
 *   1000 // start with 1 second delay
 * );
 */

// ========================================================================
// EXPORT ALL FUNCTIONS
// ========================================================================

export default {
  // Auth
  registerCustomer,
  loginCustomer,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  
  // Hospitals
  searchHospitals,
  getHospitalById,
  
  // Doctors
  getDoctorsByHospital,
  
  // Customers
  getCustomerProfile,
  updateCustomerProfile,
  
  // Reviews
  createReview,
  getReviewsByCustomer,
  
  // Documents
  getPresignedUploadUrl,
  uploadToS3,
  verifyDocument,
  uploadAndVerifyDocument,
  extractMedicalData,
  
  // Utilities
  mockApiForTesting,
  fetchWithRetry,
};
