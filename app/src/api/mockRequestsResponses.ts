/**
 * ========================================================================
 * HOSPITAL REVIEW PLATFORM - MOCK REQUEST/RESPONSE OBJECTS
 * ========================================================================
 * 
 * This file contains comprehensive mock objects for all API endpoints.
 * Use these as reference when implementing actual backend API integration.
 * 
 * USAGE:
 * 1. Copy these objects as templates for your API requests
 * 2. Replace mock data with actual values from your forms/state
 * 3. Use TypeScript types from apiMocks.ts for type safety
 * 4. Refer to database schema in /src/imports/database-schema.md
 * 
 * ========================================================================
 */

import type {
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
} from '../app/services/apiMocks';

// ========================================================================
// AUTHENTICATION - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * REGISTER CUSTOMER
 * POST /api/auth/register
 */
export const mockRegisterRequest = {
  customerName: "John Doe",
  email: "john.doe@example.com",
  password: "SecurePassword123!",
  gender: "Male" as const,
  age: 35
};

export const mockRegisterResponse: ApiResponse<{
  token: string;
  customer: Customer;
}> = {
  success: true,
  message: "Registration successful",
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjdXN0XzAwMSIsImlhdCI6MTcwOTI5NDQwMCwiZXhwIjoxNzA5ODk5MjAwfQ.signature",
    customer: {
      customerId: "cust_001",
      customerName: "John Doe",
      email: "john.doe@example.com",
      createdAt: "2024-03-01T10:30:00Z",
      gender: "Male",
      age: 35,
      visits: []
    }
  }
};

/**
 * LOGIN CUSTOMER
 * POST /api/auth/login
 */
export const mockLoginRequest = {
  email: "john.doe@example.com",
  password: "SecurePassword123!"
};

export const mockLoginResponse: ApiResponse<{
  token: string;
  customer: Customer;
}> = {
  success: true,
  message: "Login successful",
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjdXN0XzAwMSIsImlhdCI6MTcwOTI5NDQwMCwiZXhwIjoxNzA5ODk5MjAwfQ.signature",
    customer: {
      customerId: "cust_001",
      customerName: "John Doe",
      email: "john.doe@example.com",
      createdAt: "2024-01-15T10:30:00Z",
      policyId: "pol_001",
      gender: "Male",
      age: 35,
      uhid: "UHID-12345",
      visits: [
        {
          visitId: "visit_001",
          hospitalId: "hosp_001",
          departmentId: "dept_001",
          doctorId: "doc_001"
        }
      ]
    }
  }
};

// ========================================================================
// HOSPITAL - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * SEARCH HOSPITALS
 * GET /api/hospitals/search?q={query}&page={page}&limit={limit}
 */
export const mockHospitalSearchParams = {
  q: "cardiac surgery",
  page: 1,
  limit: 20,
  insuranceId: "ins_001", // Optional filter
  location: "28.6139,77.2090", // Optional: Lat,Long
  radius: 10 // Optional: Search radius in km
};

export const mockHospitalSearchResponse: ApiResponse<{
  hospitals: Hospital[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> = {
  success: true,
  data: {
    hospitals: [
      {
        hospitalId: "hosp_001",
        hospitalName: "City General Hospital",
        services: [
          "Emergency Care",
          "Surgery",
          "Cardiology",
          "Pediatrics",
          "Orthopedics"
        ],
        location: {
          latitude: 28.6139,
          longitude: 77.2090
        },
        address: "123 Medical Center Blvd, Delhi, 110001",
        departmentIds: ["dept_001", "dept_002", "dept_003"],
        insuranceCompanyIds: ["ins_001", "ins_002"],
        phoneNumber: "+91-11-2345-6789",
        description: "# Leading Multi-Specialty Hospital\n\nProviding quality healthcare since 1985. We specialize in cardiac care with state-of-the-art facilities.",
        patients: ["cust_001", "cust_002"]
      },
      {
        hospitalId: "hosp_002",
        hospitalName: "Apollo Healthcare Center",
        services: [
          "Cardiology",
          "Neurology",
          "Oncology",
          "Emergency Care"
        ],
        location: {
          latitude: 28.5355,
          longitude: 77.3910
        },
        address: "456 Healthcare Road, Noida, 201301",
        departmentIds: ["dept_004", "dept_005"],
        insuranceCompanyIds: ["ins_001", "ins_003"],
        phoneNumber: "+91-120-4567-8900",
        description: "# Apollo Healthcare Center\n\nAdvanced cardiac care and diagnostics."
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 2,
      totalResults: 29,
      hasNextPage: true,
      hasPreviousPage: false
    }
  }
};

/**
 * GET HOSPITAL BY ID
 * GET /api/hospitals/{hospitalId}
 */
export const mockGetHospitalByIdResponse: ApiResponse<Hospital> = {
  success: true,
  data: {
    hospitalId: "hosp_001",
    hospitalName: "City General Hospital",
    services: ["Emergency Care", "Surgery", "Cardiology", "Pediatrics"],
    location: {
      latitude: 28.6139,
      longitude: 77.2090
    },
    address: "123 Medical Center Blvd, Delhi, 110001",
    departmentIds: ["dept_001", "dept_002", "dept_003"],
    insuranceCompanyIds: ["ins_001", "ins_002"],
    phoneNumber: "+91-11-2345-6789",
    description: "# Leading Multi-Specialty Hospital\n\nProviding quality healthcare since 1985.",
    patients: ["cust_001", "cust_002"]
  }
};

// ========================================================================
// DEPARTMENT - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * GET DEPARTMENTS BY HOSPITAL
 * GET /api/departments/hospital/{hospitalId}
 */
export const mockGetDepartmentsByHospitalResponse: ApiResponse<{
  departments: Department[];
}> = {
  success: true,
  data: {
    departments: [
      {
        departmentId: "dept_001",
        departmentName: "Cardiology",
        departmentDescription: "# Cardiology Department\n\nSpecializing in heart-related conditions and treatments. Our team of expert cardiologists uses the latest technology.",
        hospitalId: "hosp_001",
        listOfDoctorIds: ["doc_001", "doc_002", "doc_003"],
        patients: ["cust_001", "cust_005"]
      },
      {
        departmentId: "dept_002",
        departmentName: "Orthopedics",
        departmentDescription: "# Orthopedics Department\n\nBone and joint specialists with extensive experience in sports medicine and joint replacement.",
        hospitalId: "hosp_001",
        listOfDoctorIds: ["doc_004", "doc_005"],
        patients: ["cust_002"]
      }
    ]
  }
};

// ========================================================================
// DOCTOR - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * GET DOCTORS BY HOSPITAL
 * GET /api/doctors/hospital/{hospitalId}
 */
export const mockGetDoctorsByHospitalResponse: ApiResponse<{
  doctors: Doctor[];
}> = {
  success: true,
  data: {
    doctors: [
      {
        doctorId: "doc_001",
        doctorName: "Dr. Sarah Johnson",
        about: "# Dr. Sarah Johnson\n\n**Specialty:** Cardiology\n\n**Experience:** 15+ years\n\n**Education:** MBBS, MD (Cardiology), Fellowship in Interventional Cardiology\n\n**Expertise:** Cardiac bypass surgery, Angioplasty, Heart failure management",
        records: [],
        patients: ["cust_001", "cust_002", "cust_003"]
      },
      {
        doctorId: "doc_002",
        doctorName: "Dr. Rajesh Kumar",
        about: "# Dr. Rajesh Kumar\n\n**Specialty:** Cardiology\n\n**Experience:** 12+ years\n\n**Education:** MBBS, MD (Cardiology)\n\n**Expertise:** Preventive cardiology, Echocardiography",
        records: [],
        patients: ["cust_004", "cust_005"]
      }
    ]
  }
};

/**
 * SEARCH DOCTORS
 * GET /api/doctors/search?q={query}
 */
export const mockDoctorSearchParams = {
  q: "cardiology",
  hospitalId: "hosp_001", // Optional
  departmentId: "dept_001", // Optional
  page: 1,
  limit: 20
};

export const mockDoctorSearchResponse: ApiResponse<{
  doctors: Doctor[];
}> = {
  success: true,
  data: {
    doctors: [
      {
        doctorId: "doc_001",
        doctorName: "Dr. Sarah Johnson",
        about: "# Dr. Sarah Johnson\n\n**Specialty:** Cardiology\n\n**Experience:** 15+ years",
        records: [],
        patients: ["cust_001", "cust_002"]
      }
    ]
  }
};

// ========================================================================
// INSURANCE - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * GET ALL INSURANCE COMPANIES
 * GET /api/insurance-companies
 */
export const mockGetAllInsuranceCompaniesResponse: ApiResponse<{
  companies: InsuranceCompany[];
}> = {
  success: true,
  data: {
    companies: [
      {
        insuranceCompanyId: "ins_001",
        insuranceCompanyName: "Star Health Insurance",
        description: "# Star Health Insurance\n\nLeading health insurance provider in India with comprehensive coverage.",
        services: "## Services\n\n- Cashless hospitalization\n- Wide network of 10,000+ hospitals\n- Quick claim processing\n- 24/7 customer support"
      },
      {
        insuranceCompanyId: "ins_002",
        insuranceCompanyName: "HDFC ERGO Health Insurance",
        description: "# HDFC ERGO Health Insurance\n\nTrusted health insurance solutions.",
        services: "## Services\n\n- Family floater plans\n- Critical illness cover\n- No claim bonus"
      }
    ]
  }
};

/**
 * GET POLICIES BY COMPANY
 * GET /api/insurance-policies/company/{companyId}
 */
export const mockGetPoliciesByCompanyResponse: ApiResponse<{
  policies: InsurancePolicy[];
}> = {
  success: true,
  data: {
    policies: [
      {
        policyId: "pol_001",
        companyId: "ins_001",
        about: "# Family Health Protect Plan\n\n**Coverage:** ₹5,00,000\n\n**Premium:** ₹12,000/year\n\n**Features:**\n- Cashless hospitalization\n- Pre and post hospitalization\n- Day care procedures"
      },
      {
        policyId: "pol_002",
        companyId: "ins_001",
        about: "# Senior Citizen Health Plan\n\n**Coverage:** ₹3,00,000\n\n**Premium:** ₹18,000/year\n\n**Features:**\n- No age limit\n- Pre-existing disease cover after 2 years"
      }
    ]
  }
};

// ========================================================================
// CUSTOMER - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * GET CUSTOMER PROFILE
 * GET /api/customers/{customerId}
 */
export const mockGetCustomerProfileResponse: ApiResponse<Customer> = {
  success: true,
  data: {
    customerId: "cust_001",
    customerName: "John Doe",
    email: "john.doe@example.com",
    createdAt: "2024-01-15T10:30:00Z",
    policyId: "pol_001",
    gender: "Male",
    age: 35,
    uhid: "UHID-12345",
    visits: [
      {
        visitId: "visit_001",
        hospitalId: "hosp_001",
        departmentId: "dept_001",
        doctorId: "doc_001"
      },
      {
        visitId: "visit_002",
        hospitalId: "hosp_002",
        departmentId: "dept_005",
        doctorId: "doc_008"
      }
    ]
  }
};

/**
 * UPDATE CUSTOMER PROFILE
 * PUT /api/customers/{customerId}
 */
export const mockUpdateCustomerRequest: Partial<Customer> = {
  customerName: "John Michael Doe",
  gender: "Male",
  age: 36,
  uhid: "UHID-12345",
  policyId: "pol_002"
};

export const mockUpdateCustomerResponse: ApiResponse<Customer> = {
  success: true,
  message: "Profile updated successfully",
  data: {
    customerId: "cust_001",
    customerName: "John Michael Doe",
    email: "john.doe@example.com",
    createdAt: "2024-01-15T10:30:00Z",
    policyId: "pol_002",
    gender: "Male",
    age: 36,
    uhid: "UHID-12345",
    visits: [
      {
        visitId: "visit_001",
        hospitalId: "hosp_001",
        departmentId: "dept_001",
        doctorId: "doc_001"
      }
    ]
  }
};

/**
 * ADD CUSTOMER VISIT
 * POST /api/customers/{customerId}/visits
 */
export const mockAddVisitRequest: Omit<Visit, 'visitId'> = {
  hospitalId: "hosp_001",
  departmentId: "dept_001",
  doctorId: "doc_001"
};

export const mockAddVisitResponse: ApiResponse<Visit> = {
  success: true,
  message: "Visit added successfully",
  data: {
    visitId: "visit_new_123",
    hospitalId: "hosp_001",
    departmentId: "dept_001",
    doctorId: "doc_001"
  }
};

// ========================================================================
// REVIEW - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * CREATE REVIEW
 * POST /api/reviews
 * 
 * This is the most complex request in the system.
 * All fields marked as required must be included.
 */
export const mockCreateReviewRequest: Omit<Review, 'reviewId' | 'createdAt'> = {
  // Foreign Keys (Required)
  hospitalId: "hosp_001",
  doctorId: "doc_001",
  customerId: "cust_001",
  policyId: "pol_001", // Optional if no insurance
  
  // Purpose of Visit (Required - Markdown format)
  purposeOfVisit: `# Cardiac Bypass Surgery

## Chief Complaint
Chest pain and shortness of breath

## Diagnosis
Coronary Artery Disease requiring immediate surgical intervention

## Procedure Performed
Triple vessel coronary artery bypass grafting (CABG)

## Duration of Stay
7 days (2 days ICU, 5 days general ward)

## Outcome
Successful recovery with excellent post-operative results`,

  // Doctor Review (Required - JSON object)
  doctorReview: {
    doctorId: "doc_001",
    doctorReview: `Dr. Sarah Johnson was exceptional throughout my treatment. She explained the procedure thoroughly, addressed all my concerns, and maintained excellent communication with my family during the surgery. Her expertise and caring demeanor made a difficult situation much more manageable. The post-operative care instructions were clear and comprehensive.`,
    bedsideMannerRating: 5,
    medicalExpertiseRating: 5,
    communicationRating: 4,
    waitTimeRating: 4,
    thoroughnessRating: 5,
    followUpRating: 5
  },

  // Insurance Claim (Optional - JSON object)
  claim: {
    claimId: "claim_2024_001",
    claimAmountApproved: 450000,
    remainingAmountToBePaid: 50000
  },

  // Payment Information (Required - JSON object)
  payment: {
    billNo: "BILL-2024-001",
    amountToBePayed: 50000,
    totalBillAmount: 500000,
    description: "Cardiac bypass surgery with 7-day hospitalization, ICU charges, operation theater charges, surgeon fees, anesthesia, medications, and post-operative care"
  },

  // Hospital Review (Required - Markdown format)
  hospitalReview: `# City General Hospital Review

## Facilities
The hospital has excellent facilities with modern equipment. The operation theaters are state-of-the-art and well-maintained.

## Cleanliness
The entire hospital was spotless. Special attention was given to hygiene in the ICU and patient rooms.

## Staff Behavior
All staff members, from nurses to support staff, were courteous, helpful, and professional.

## Food Quality
Hospital food was decent but could be improved. Vegetarian options were limited.

## Overall Experience
Despite the medical emergency, the hospital made the experience as comfortable as possible. Would highly recommend for cardiac procedures.`,

  // Documents (Required - Array of document IDs)
  documentIds: [
    "doc_medical_record_001",
    "doc_insurance_claim_001",
    "doc_bill_001",
    "doc_discharge_summary_001"
  ],

  // Extracted Data from Documents (Required - JSON object)
  extractedData: {
    hospitalName: "City General Hospital",
    doctorName: "Dr. Sarah Johnson",
    surgeryType: "Triple Vessel Coronary Artery Bypass Grafting (CABG)",
    procedureDate: "2024-02-15",
    diagnosis: "Coronary Artery Disease with Triple Vessel Involvement",
    medications: [
      "Aspirin 75mg",
      "Metoprolol 50mg",
      "Atorvastatin 40mg",
      "Clopidogrel 75mg",
      "Ramipril 5mg"
    ],
    confidence: 0.95 // AI extraction confidence score
  },

  // Verification Status (Set by backend after document verification)
  verified: true,

  // Hospital Ratings (Optional but recommended)
  serviceQualityRating: 5,
  maintenanceRating: 4,
  foodQualityRating: 3,
  cleanlinessRating: 5,
  staffBehaviorRating: 4
};

export const mockCreateReviewResponse: ApiResponse<Review> = {
  success: true,
  message: "Review created successfully",
  data: {
    reviewId: "review_1709294400_abc123xyz",
    hospitalId: "hosp_001",
    doctorId: "doc_001",
    customerId: "cust_001",
    policyId: "pol_001",
    purposeOfVisit: "# Cardiac Bypass Surgery\n\n...",
    doctorReview: {
      doctorId: "doc_001",
      doctorReview: "Dr. Sarah Johnson was exceptional...",
      bedsideMannerRating: 5,
      medicalExpertiseRating: 5,
      communicationRating: 4,
      waitTimeRating: 4,
      thoroughnessRating: 5,
      followUpRating: 5
    },
    claim: {
      claimId: "claim_2024_001",
      claimAmountApproved: 450000,
      remainingAmountToBePaid: 50000
    },
    payment: {
      billNo: "BILL-2024-001",
      amountToBePayed: 50000,
      totalBillAmount: 500000,
      description: "Cardiac bypass surgery with 7-day hospitalization..."
    },
    hospitalReview: "# City General Hospital Review\n\n...",
    documentIds: [
      "doc_medical_record_001",
      "doc_insurance_claim_001",
      "doc_bill_001",
      "doc_discharge_summary_001"
    ],
    extractedData: {
      hospitalName: "City General Hospital",
      doctorName: "Dr. Sarah Johnson",
      surgeryType: "Triple Vessel Coronary Artery Bypass Grafting (CABG)",
      procedureDate: "2024-02-15",
      diagnosis: "Coronary Artery Disease with Triple Vessel Involvement",
      medications: ["Aspirin 75mg", "Metoprolol 50mg", "Atorvastatin 40mg"],
      confidence: 0.95
    },
    verified: true,
    createdAt: "2024-03-01T10:30:00Z",
    serviceQualityRating: 5,
    maintenanceRating: 4,
    foodQualityRating: 3,
    cleanlinessRating: 5,
    staffBehaviorRating: 4
  }
};

/**
 * GET REVIEWS BY CUSTOMER
 * GET /api/reviews/customer/{customerId}
 */
export const mockGetReviewsByCustomerParams = {
  customerId: "cust_001",
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  order: "desc"
};

export const mockGetReviewsByCustomerResponse: ApiResponse<{
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> = {
  success: true,
  data: {
    reviews: [
      {
        reviewId: "review_001",
        hospitalId: "hosp_001",
        doctorId: "doc_001",
        customerId: "cust_001",
        policyId: "pol_001",
        purposeOfVisit: "# Cardiac Surgery\n\nRoutine bypass procedure",
        doctorReview: {
          doctorId: "doc_001",
          doctorReview: "Excellent care and follow-up",
          bedsideMannerRating: 5,
          medicalExpertiseRating: 5,
          communicationRating: 4,
          waitTimeRating: 4,
          thoroughnessRating: 5,
          followUpRating: 5
        },
        claim: {
          claimId: "claim_001",
          claimAmountApproved: 450000,
          remainingAmountToBePaid: 50000
        },
        payment: {
          billNo: "BILL-2024-001",
          amountToBePayed: 50000,
          totalBillAmount: 500000,
          description: "Cardiac bypass surgery with post-op care"
        },
        hospitalReview: "# Excellent Facilities\n\nVery clean and well-maintained",
        documentIds: ["doc_001.pdf", "doc_002.pdf"],
        extractedData: {
          hospitalName: "City General Hospital",
          doctorName: "Dr. Sarah Johnson",
          surgeryType: "Cardiac Bypass Surgery",
          procedureDate: "2024-02-15",
          diagnosis: "Coronary Artery Disease",
          medications: ["Aspirin", "Metoprolol"],
          confidence: 0.95
        },
        verified: true,
        createdAt: "2024-02-20T14:30:00Z",
        serviceQualityRating: 5,
        maintenanceRating: 4,
        foodQualityRating: 3,
        cleanlinessRating: 5,
        staffBehaviorRating: 4
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalResults: 3,
      hasNextPage: false,
      hasPreviousPage: false
    }
  }
};

/**
 * UPDATE REVIEW
 * PUT /api/reviews/{reviewId}
 */
export const mockUpdateReviewRequest: Partial<Review> = {
  hospitalReview: "# Updated Hospital Review\n\nAfter follow-up visit, I'm even more impressed with the care quality.",
  serviceQualityRating: 5,
  staffBehaviorRating: 5
};

export const mockUpdateReviewResponse: ApiResponse<Review> = {
  success: true,
  message: "Review updated successfully",
  data: {
    reviewId: "review_001",
    // ... full review object with updates
    hospitalReview: "# Updated Hospital Review\n\nAfter follow-up visit, I'm even more impressed with the care quality.",
    serviceQualityRating: 5,
    staffBehaviorRating: 5,
    // ... rest of the fields
  } as Review
};

// ========================================================================
// DOCUMENT - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * UPLOAD DOCUMENT (Pre-signed URL approach)
 * Step 1: GET PRESIGNED URL
 * POST /api/documents/presigned-url
 */
export const mockGetPresignedUrlRequest = {
  fileName: "medical_report_2024.pdf",
  documentType: "medical_record" as const,
  fileSize: 245678,
  contentType: "application/pdf"
};

export const mockGetPresignedUrlResponse: ApiResponse<{
  uploadUrl: string;
  documentId: string;
  expiresIn: number;
}> = {
  success: true,
  data: {
    uploadUrl: "https://s3.amazonaws.com/hospital-reviews/uploads/doc_1709294400_abc123.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
    documentId: "doc_1709294400_abc123",
    expiresIn: 300 // seconds
  }
};

/**
 * Step 2: Upload to S3 (Frontend does this directly)
 * PUT {presignedUrl}
 * Content-Type: application/pdf
 * Body: <file binary data>
 */

/**
 * Step 3: TRIGGER VERIFICATION
 * POST /api/documents/{documentId}/verify
 */
export const mockVerifyDocumentResponse: ApiResponse<DocumentValidationResult> = {
  success: true,
  data: {
    success: true,
    verified: true,
    documentId: "doc_1709294400_abc123",
    s3Url: "https://s3.amazonaws.com/hospital-reviews/verified/doc_1709294400_abc123.pdf",
    message: "Document verified successfully",
    confidence: 0.96
  }
};

/**
 * EXTRACT MEDICAL DATA
 * POST /api/documents/extract
 */
export const mockExtractMedicalDataRequest = {
  documentIds: [
    "doc_medical_record_001",
    "doc_discharge_summary_001"
  ]
};

export const mockExtractMedicalDataResponse: ApiResponse<ExtractedData> = {
  success: true,
  data: {
    hospitalName: "City General Hospital",
    doctorName: "Dr. Sarah Johnson",
    surgeryType: "Triple Vessel Coronary Artery Bypass Grafting (CABG)",
    procedureDate: "2024-02-15",
    diagnosis: "Coronary Artery Disease with Triple Vessel Involvement",
    medications: [
      "Aspirin 75mg",
      "Metoprolol 50mg",
      "Atorvastatin 40mg",
      "Clopidogrel 75mg"
    ],
    confidence: 0.93
  }
};

/**
 * GET CUSTOMER DOCUMENTS
 * GET /api/customers/{customerId}/documents
 */
export const mockGetCustomerDocumentsParams = {
  customerId: "cust_001",
  documentType: "medical_record", // Optional filter
  verified: true, // Optional filter
  page: 1,
  limit: 20
};

export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  documentType: string;
  s3Url: string;
  verified: boolean;
  uploadedAt: string;
  fileSize: number;
  confidence?: number;
}

export const mockGetCustomerDocumentsResponse: ApiResponse<{
  documents: DocumentMetadata[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> = {
  success: true,
  data: {
    documents: [
      {
        documentId: "doc_medical_record_001",
        fileName: "medical_report_2024.pdf",
        documentType: "medical_record",
        s3Url: "https://s3.amazonaws.com/hospital-reviews/verified/doc_medical_record_001.pdf?X-Amz-Expires=900&...",
        verified: true,
        uploadedAt: "2024-02-20T10:30:00Z",
        fileSize: 245678,
        confidence: 0.96
      },
      {
        documentId: "doc_insurance_claim_001",
        fileName: "insurance_claim.pdf",
        documentType: "insurance_claim",
        s3Url: "https://s3.amazonaws.com/hospital-reviews/verified/doc_insurance_claim_001.pdf?X-Amz-Expires=900&...",
        verified: true,
        uploadedAt: "2024-02-20T11:15:00Z",
        fileSize: 189234,
        confidence: 0.94
      },
      {
        documentId: "doc_bill_001",
        fileName: "hospital_bill.pdf",
        documentType: "bill",
        s3Url: "https://s3.amazonaws.com/hospital-reviews/verified/doc_bill_001.pdf?X-Amz-Expires=900&...",
        verified: true,
        uploadedAt: "2024-02-20T12:00:00Z",
        fileSize: 156789,
        confidence: 0.98
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalResults: 3,
      hasNextPage: false,
      hasPreviousPage: false
    }
  }
};

// ========================================================================
// ANALYTICS - REQUEST/RESPONSE EXAMPLES
// ========================================================================

/**
 * GET HOSPITAL STATISTICS
 * GET /api/hospitals/{hospitalId}/stats
 */
export const mockGetHospitalStatsParams = {
  hospitalId: "hosp_001",
  startDate: "2024-01-01", // Optional
  endDate: "2024-12-31"    // Optional
};

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
  reviewsByMonth?: Array<{ month: string; count: number }>;
  topDoctors?: Array<{
    doctorId: string;
    doctorName: string;
    averageRating: number;
    totalReviews: number;
  }>;
}

export const mockGetHospitalStatsResponse: ApiResponse<HospitalStats> = {
  success: true,
  data: {
    totalReviews: 145,
    verifiedReviews: 132,
    averageRating: 4.3,
    averageClaimApprovalRate: 0.87, // 87% of claims approved
    averageCost: 285000, // Average treatment cost in INR
    ratingBreakdown: {
      serviceQuality: 4.5,
      maintenance: 4.2,
      foodQuality: 3.8,
      cleanliness: 4.6,
      staffBehavior: 4.4
    },
    reviewsByMonth: [
      { month: "2024-01", count: 12 },
      { month: "2024-02", count: 15 },
      { month: "2024-03", count: 18 }
    ],
    topDoctors: [
      {
        doctorId: "doc_001",
        doctorName: "Dr. Sarah Johnson",
        averageRating: 4.8,
        totalReviews: 45
      },
      {
        doctorId: "doc_002",
        doctorName: "Dr. Rajesh Kumar",
        averageRating: 4.6,
        totalReviews: 38
      }
    ]
  }
};

/**
 * GET DOCTOR STATISTICS
 * GET /api/doctors/{doctorId}/stats
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
  reviewsByProcedure?: Array<{
    surgeryType: string;
    count: number;
    averageRating: number;
  }>;
  hospitals?: Array<{
    hospitalId: string;
    hospitalName: string;
    reviewCount: number;
  }>;
}

export const mockGetDoctorStatsResponse: ApiResponse<DoctorStats> = {
  success: true,
  data: {
    totalReviews: 87,
    verifiedReviews: 82,
    averageRating: 4.7,
    ratingBreakdown: {
      bedsideManner: 4.8,
      medicalExpertise: 4.9,
      communication: 4.6,
      waitTime: 4.2,
      thoroughness: 4.8,
      followUpCare: 4.7
    },
    reviewsByProcedure: [
      {
        surgeryType: "Cardiac Bypass Surgery",
        count: 23,
        averageRating: 4.9
      },
      {
        surgeryType: "Angioplasty",
        count: 31,
        averageRating: 4.6
      },
      {
        surgeryType: "Valve Replacement",
        count: 15,
        averageRating: 4.8
      }
    ],
    hospitals: [
      {
        hospitalId: "hosp_001",
        hospitalName: "City General Hospital",
        reviewCount: 65
      },
      {
        hospitalId: "hosp_003",
        hospitalName: "Metro Medical Center",
        reviewCount: 22
      }
    ]
  }
};

// ========================================================================
// ERROR RESPONSE EXAMPLES
// ========================================================================

/**
 * VALIDATION ERROR (422)
 */
export const mockValidationError = {
  success: false,
  error: "VALIDATION_ERROR",
  message: "Validation failed",
  details: {
    email: "Invalid email format",
    age: "Age must be between 18 and 80",
    password: "Password must be at least 8 characters and include uppercase, lowercase, and numbers"
  }
};

/**
 * AUTHENTICATION ERROR (401)
 */
export const mockAuthenticationError = {
  success: false,
  error: "UNAUTHORIZED",
  message: "Invalid or expired token. Please login again."
};

/**
 * NOT FOUND ERROR (404)
 */
export const mockNotFoundError = {
  success: false,
  error: "NOT_FOUND",
  message: "Hospital with ID 'hosp_999' not found"
};

/**
 * FORBIDDEN ERROR (403)
 */
export const mockForbiddenError = {
  success: false,
  error: "FORBIDDEN",
  message: "You do not have permission to access this resource"
};

/**
 * RATE LIMIT ERROR (429)
 */
export const mockRateLimitError = {
  success: false,
  error: "RATE_LIMIT_EXCEEDED",
  message: "Too many requests. Please try again in 60 seconds.",
  retryAfter: 60
};

/**
 * SERVER ERROR (500)
 */
export const mockServerError = {
  success: false,
  error: "INTERNAL_SERVER_ERROR",
  message: "An unexpected error occurred. Our team has been notified."
};

// ========================================================================
// EXPORT ALL MOCKS
// ========================================================================

export const allMockData = {
  // Authentication
  auth: {
    registerRequest: mockRegisterRequest,
    registerResponse: mockRegisterResponse,
    loginRequest: mockLoginRequest,
    loginResponse: mockLoginResponse
  },
  
  // Hospitals
  hospitals: {
    searchParams: mockHospitalSearchParams,
    searchResponse: mockHospitalSearchResponse,
    getByIdResponse: mockGetHospitalByIdResponse
  },
  
  // Departments
  departments: {
    getByHospitalResponse: mockGetDepartmentsByHospitalResponse
  },
  
  // Doctors
  doctors: {
    getByHospitalResponse: mockGetDoctorsByHospitalResponse,
    searchParams: mockDoctorSearchParams,
    searchResponse: mockDoctorSearchResponse
  },
  
  // Insurance
  insurance: {
    getAllCompaniesResponse: mockGetAllInsuranceCompaniesResponse,
    getPoliciesResponse: mockGetPoliciesByCompanyResponse
  },
  
  // Customers
  customers: {
    getProfileResponse: mockGetCustomerProfileResponse,
    updateRequest: mockUpdateCustomerRequest,
    updateResponse: mockUpdateCustomerResponse,
    addVisitRequest: mockAddVisitRequest,
    addVisitResponse: mockAddVisitResponse
  },
  
  // Reviews
  reviews: {
    createRequest: mockCreateReviewRequest,
    createResponse: mockCreateReviewResponse,
    getByCustomerParams: mockGetReviewsByCustomerParams,
    getByCustomerResponse: mockGetReviewsByCustomerResponse,
    updateRequest: mockUpdateReviewRequest,
    updateResponse: mockUpdateReviewResponse
  },
  
  // Documents
  documents: {
    getPresignedUrlRequest: mockGetPresignedUrlRequest,
    getPresignedUrlResponse: mockGetPresignedUrlResponse,
    verifyResponse: mockVerifyDocumentResponse,
    extractRequest: mockExtractMedicalDataRequest,
    extractResponse: mockExtractMedicalDataResponse,
    getCustomerDocsParams: mockGetCustomerDocumentsParams,
    getCustomerDocsResponse: mockGetCustomerDocumentsResponse
  },
  
  // Analytics
  analytics: {
    hospitalStatsParams: mockGetHospitalStatsParams,
    hospitalStatsResponse: mockGetHospitalStatsResponse,
    doctorStatsResponse: mockGetDoctorStatsResponse
  },
  
  // Errors
  errors: {
    validation: mockValidationError,
    authentication: mockAuthenticationError,
    notFound: mockNotFoundError,
    forbidden: mockForbiddenError,
    rateLimit: mockRateLimitError,
    server: mockServerError
  }
};
