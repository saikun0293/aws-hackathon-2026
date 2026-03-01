# Hospital Review Platform - Backend Integration Guide

This guide provides comprehensive documentation for all API endpoints, including request/response schemas, example payloads, and integration notes for backend developers.

---

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Hospital Endpoints](#hospital-endpoints)
4. [Department Endpoints](#department-endpoints)
5. [Doctor Endpoints](#doctor-endpoints)
6. [Insurance Company Endpoints](#insurance-company-endpoints)
7. [Insurance Policy Endpoints](#insurance-policy-endpoints)
8. [Customer Endpoints](#customer-endpoints)
9. [Review Endpoints](#review-endpoints)
10. [Document Endpoints](#document-endpoints)
11. [Analytics Endpoints](#analytics-endpoints)
12. [Error Handling](#error-handling)
13. [Rate Limiting](#rate-limiting)

---

## Base Configuration

### Environment Variables
```bash
# Backend API Base URL
REACT_APP_API_BASE_URL=https://api.hospitalreviewplatform.com/v1

# AWS Configuration (for document uploads)
AWS_S3_BUCKET=hospital-review-documents
AWS_REGION=us-east-1

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
```

### Common Headers
All authenticated requests should include:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
```

---

## Authentication

### 1. Register New Customer

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```typescript
{
  customerName: string;      // Required
  email: string;             // Required, must be valid email
  password: string;          // Required, min 8 chars
  gender?: "Male" | "Female" | "Other";
  age?: number;              // 18-80
}
```

**Example Request:**
```json
{
  "customerName": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "gender": "Male",
  "age": 35
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "customer": {
      "customerId": "cust_1234567890abc",
      "customerName": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-03-01T10:30:00Z",
      "gender": "Male",
      "age": 35,
      "visits": []
    }
  }
}
```

**Errors:**
- `400` - Invalid email format
- `409` - Email already registered
- `422` - Validation errors

---

### 2. Login Customer

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Example Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "customer": {
      "customerId": "cust_1234567890abc",
      "customerName": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "policyId": "pol_987654321xyz",
      "gender": "Male",
      "age": 35,
      "uhid": "UHID-12345",
      "visits": [...]
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `404` - User not found

---

### 3. Logout Customer

**Endpoint:** `POST /api/auth/logout`

**Headers:** Include Authorization token

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Hospital Endpoints

### 1. Search Hospitals

**Endpoint:** `GET /api/hospitals/search?q={query}`

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `insuranceId` (optional): Filter by insurance company ID
- `location` (optional): Lat,Long for proximity search
- `radius` (optional): Search radius in km (default: 10)

**Example Request:**
```
GET /api/hospitals/search?q=cardiac&insuranceId=ins_001&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hospitals": [
      {
        "hospitalId": "hosp_001",
        "hospitalName": "City General Hospital",
        "services": ["Emergency Care", "Surgery", "Cardiology", "Pediatrics"],
        "location": {
          "latitude": 28.6139,
          "longitude": 77.2090
        },
        "address": "123 Medical Center Blvd, Delhi, 110001",
        "departmentIds": ["dept_001", "dept_002", "dept_003"],
        "insuranceCompanyIds": ["ins_001", "ins_002"],
        "phoneNumber": "+91-11-2345-6789",
        "description": "# Leading Multi-Specialty Hospital\n\nProviding quality healthcare since 1985.",
        "patients": ["cust_001", "cust_002"]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalResults": 29,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Database Schema Reference:**
```sql
-- Hospital table (29 rows)
CREATE TABLE Hospital (
  hospitalId TEXT PRIMARY KEY,
  hospitalName TEXT NOT NULL,
  services TEXT NOT NULL,              -- JSON array
  location TEXT NOT NULL,              -- JSON object {latitude, longitude}
  address TEXT NOT NULL,
  departmentIds TEXT NOT NULL,         -- JSON array
  insuranceCompanyIds TEXT NOT NULL,   -- JSON array
  phoneNumber TEXT,
  description TEXT,                    -- Markdown format
  patients TEXT                        -- JSON array of customerIds
);
```

---

### 2. Get Hospital by ID

**Endpoint:** `GET /api/hospitals/{hospitalId}`

**Example Request:**
```
GET /api/hospitals/hosp_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hospitalId": "hosp_001",
    "hospitalName": "City General Hospital",
    "services": ["Emergency Care", "Surgery", "Cardiology", "Pediatrics"],
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090
    },
    "address": "123 Medical Center Blvd, Delhi, 110001",
    "departmentIds": ["dept_001", "dept_002", "dept_003"],
    "insuranceCompanyIds": ["ins_001", "ins_002"],
    "phoneNumber": "+91-11-2345-6789",
    "description": "# Leading Multi-Specialty Hospital\n\nProviding quality healthcare since 1985.",
    "patients": ["cust_001", "cust_002"]
  }
}
```

**Errors:**
- `404` - Hospital not found

---

### 3. Get All Hospitals (Paginated)

**Endpoint:** `GET /api/hospitals?page={page}&limit={limit}`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (name, rating, reviews)
- `order` (optional): asc or desc (default: asc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hospitals": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalResults": 29,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 4. Get Hospitals by Insurance Company

**Endpoint:** `GET /api/hospitals/by-insurance/{insuranceCompanyId}`

**Example Request:**
```
GET /api/hospitals/by-insurance/ins_001?page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hospitals": [...],
    "insuranceCompany": {
      "insuranceCompanyId": "ins_001",
      "insuranceCompanyName": "Star Health Insurance"
    }
  }
}
```

---

## Department Endpoints

### 1. Get Departments by Hospital

**Endpoint:** `GET /api/departments/hospital/{hospitalId}`

**Example Request:**
```
GET /api/departments/hospital/hosp_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "departmentId": "dept_001",
        "departmentName": "Cardiology",
        "departmentDescription": "# Cardiology Department\n\nSpecializing in heart-related conditions.",
        "hospitalId": "hosp_001",
        "listOfDoctorIds": ["doc_001", "doc_002", "doc_003"],
        "patients": ["cust_001", "cust_005"]
      },
      {
        "departmentId": "dept_002",
        "departmentName": "Orthopedics",
        "departmentDescription": "# Orthopedics Department\n\nBone and joint specialists.",
        "hospitalId": "hosp_001",
        "listOfDoctorIds": ["doc_004", "doc_005"],
        "patients": ["cust_002"]
      }
    ]
  }
}
```

**Database Schema Reference:**
```sql
-- Department table (218 rows)
CREATE TABLE Department (
  departmentId TEXT PRIMARY KEY,
  departmentName TEXT NOT NULL,
  departmentDescription TEXT,          -- Markdown format
  hospitalId TEXT NOT NULL,            -- Foreign key → Hospital
  listOfDoctorIds TEXT NOT NULL,       -- JSON array
  patients TEXT                        -- JSON array of customerIds
);
```

---

### 2. Get Department by ID

**Endpoint:** `GET /api/departments/{departmentId}`

**Example Request:**
```
GET /api/departments/dept_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "departmentId": "dept_001",
    "departmentName": "Cardiology",
    "departmentDescription": "# Cardiology Department\n\nSpecializing in heart-related conditions.",
    "hospitalId": "hosp_001",
    "listOfDoctorIds": ["doc_001", "doc_002", "doc_003"],
    "patients": ["cust_001", "cust_005"]
  }
}
```

---

## Doctor Endpoints

### 1. Get Doctors by Hospital

**Endpoint:** `GET /api/doctors/hospital/{hospitalId}`

**Example Request:**
```
GET /api/doctors/hospital/hosp_001?page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "doctorId": "doc_001",
        "doctorName": "Dr. Sarah Johnson",
        "about": "# Dr. Sarah Johnson\n\n**Specialty:** Cardiology\n\n**Experience:** 15+ years\n\n**Education:** MBBS, MD (Cardiology)",
        "records": [],
        "patients": ["cust_001", "cust_002", "cust_003"]
      }
    ]
  }
}
```

**Database Schema Reference:**
```sql
-- Doctor table (976 rows)
CREATE TABLE Doctor (
  doctorId TEXT PRIMARY KEY,
  doctorName TEXT NOT NULL,
  about TEXT NOT NULL,                 -- Markdown format
  records TEXT NOT NULL,               -- JSON array (currently empty [])
  patients TEXT                        -- JSON array of customerIds
);
```

---

### 2. Get Doctors by Department

**Endpoint:** `GET /api/doctors/department/{departmentId}`

**Example Request:**
```
GET /api/doctors/department/dept_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "doctors": [...],
    "department": {
      "departmentId": "dept_001",
      "departmentName": "Cardiology"
    }
  }
}
```

---

### 3. Get Doctor by ID

**Endpoint:** `GET /api/doctors/{doctorId}`

**Example Request:**
```
GET /api/doctors/doc_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "doctorId": "doc_001",
    "doctorName": "Dr. Sarah Johnson",
    "about": "# Dr. Sarah Johnson\n\n**Specialty:** Cardiology\n\n**Experience:** 15+ years",
    "records": [],
    "patients": ["cust_001", "cust_002", "cust_003"]
  }
}
```

---

### 4. Search Doctors

**Endpoint:** `GET /api/doctors/search?q={query}`

**Query Parameters:**
- `q` (required): Search query (name, specialty, etc.)
- `hospitalId` (optional): Filter by hospital
- `departmentId` (optional): Filter by department
- `page`, `limit`: Pagination

**Example Request:**
```
GET /api/doctors/search?q=cardiology&hospitalId=hosp_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "doctors": [...]
  }
}
```

---

## Insurance Company Endpoints

### 1. Get All Insurance Companies

**Endpoint:** `GET /api/insurance-companies`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "insuranceCompanyId": "ins_001",
        "insuranceCompanyName": "Star Health Insurance",
        "description": "# Star Health Insurance\n\nLeading health insurance provider in India.",
        "services": "## Services\n\n- Cashless hospitalization\n- Wide network coverage\n- Quick claim processing"
      }
    ]
  }
}
```

**Database Schema Reference:**
```sql
-- InsuranceCompany table (10 rows)
CREATE TABLE InsuranceCompany (
  insuranceCompanyId TEXT PRIMARY KEY,
  insuranceCompanyName TEXT NOT NULL,
  description TEXT NOT NULL,           -- Markdown format
  services TEXT NOT NULL               -- Markdown format
);
```

---

### 2. Get Insurance Company by ID

**Endpoint:** `GET /api/insurance-companies/{insuranceCompanyId}`

**Example Request:**
```
GET /api/insurance-companies/ins_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "insuranceCompanyId": "ins_001",
    "insuranceCompanyName": "Star Health Insurance",
    "description": "# Star Health Insurance\n\nLeading health insurance provider in India.",
    "services": "## Services\n\n- Cashless hospitalization\n- Wide network coverage"
  }
}
```

---

## Insurance Policy Endpoints

### 1. Get Policies by Insurance Company

**Endpoint:** `GET /api/insurance-policies/company/{companyId}`

**Example Request:**
```
GET /api/insurance-policies/company/ins_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "policyId": "pol_001",
        "companyId": "ins_001",
        "about": "# Family Health Protect Plan\n\n**Coverage:** ₹5,00,000\n**Premium:** ₹12,000/year"
      }
    ]
  }
}
```

**Database Schema Reference:**
```sql
-- InsurancePolicy table (185 rows)
CREATE TABLE InsurancePolicy (
  policyId TEXT PRIMARY KEY,
  companyId TEXT NOT NULL,             -- Foreign key → InsuranceCompany
  about TEXT NOT NULL                  -- Markdown format
);
```

---

### 2. Get Policy by ID

**Endpoint:** `GET /api/insurance-policies/{policyId}`

**Example Request:**
```
GET /api/insurance-policies/pol_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "policyId": "pol_001",
    "companyId": "ins_001",
    "about": "# Family Health Protect Plan\n\n**Coverage:** ₹5,00,000",
    "company": {
      "insuranceCompanyId": "ins_001",
      "insuranceCompanyName": "Star Health Insurance"
    }
  }
}
```

---

## Customer Endpoints

### 1. Get Customer Profile

**Endpoint:** `GET /api/customers/{customerId}`

**Headers:** Requires Authorization token

**Example Request:**
```
GET /api/customers/cust_001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customerId": "cust_001",
    "customerName": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "policyId": "pol_001",
    "gender": "Male",
    "age": 35,
    "uhid": "UHID-12345",
    "visits": [
      {
        "visitId": "visit_001",
        "hospitalId": "hosp_001",
        "departmentId": "dept_001",
        "doctorId": "doc_001"
      }
    ]
  }
}
```

**Database Schema Reference:**
```sql
-- Customer table (11,110 rows)
CREATE TABLE Customer (
  customerId TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  email TEXT NOT NULL,
  createdAt DATETIME NOT NULL,
  policyId TEXT,                       -- Foreign key → InsurancePolicy
  gender TEXT,                         -- Male/Female/Other
  age INTEGER,                         -- 18-80
  uhid TEXT,                           -- UHID-XXXXX format
  visits TEXT                          -- JSON array
);

-- Visit structure within Customer.visits
{
  "visitId": "string",
  "hospitalId": "string",
  "departmentId": "string",
  "doctorId": "string"
}
```

**Security:**
- Verify JWT token
- Ensure customerId matches authenticated user
- Do not expose sensitive data to unauthorized users

---

### 2. Update Customer Profile

**Endpoint:** `PUT /api/customers/{customerId}`

**Headers:** Requires Authorization token

**Request Body:**
```json
{
  "customerName": "John M. Doe",
  "gender": "Male",
  "age": 36,
  "uhid": "UHID-12345",
  "policyId": "pol_002"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "customerId": "cust_001",
    "customerName": "John M. Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "policyId": "pol_002",
    "gender": "Male",
    "age": 36,
    "uhid": "UHID-12345",
    "visits": [...]
  }
}
```

**Validation Rules:**
- `customerName`: 2-100 characters
- `email`: Valid email format (cannot be changed via this endpoint)
- `age`: 18-80
- `uhid`: Format UHID-XXXXX
- `policyId`: Must exist in InsurancePolicy table

**Protected Fields:**
- `customerId` - Cannot be modified
- `email` - Use separate endpoint for email change
- `createdAt` - System managed

---

### 3. Get Customer Visits

**Endpoint:** `GET /api/customers/{customerId}/visits`

**Headers:** Requires Authorization token

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "visitId": "visit_001",
        "hospitalId": "hosp_001",
        "departmentId": "dept_001",
        "doctorId": "doc_001",
        "hospital": {
          "hospitalName": "City General Hospital"
        },
        "department": {
          "departmentName": "Cardiology"
        },
        "doctor": {
          "doctorName": "Dr. Sarah Johnson"
        }
      }
    ]
  }
}
```

---

### 4. Add Customer Visit

**Endpoint:** `POST /api/customers/{customerId}/visits`

**Headers:** Requires Authorization token

**Request Body:**
```json
{
  "hospitalId": "hosp_001",
  "departmentId": "dept_001",
  "doctorId": "doc_001"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Visit added successfully",
  "data": {
    "visitId": "visit_new_123",
    "hospitalId": "hosp_001",
    "departmentId": "dept_001",
    "doctorId": "doc_001"
  }
}
```

---

## Review Endpoints

### 1. Create Review

**Endpoint:** `POST /api/reviews`

**Headers:** Requires Authorization token

**Request Body:**
```json
{
  "hospitalId": "hosp_001",
  "doctorId": "doc_001",
  "customerId": "cust_001",
  "policyId": "pol_001",
  "purposeOfVisit": "# Cardiac Bypass Surgery\n\nRoutine bypass procedure after diagnosis of coronary artery disease.",
  "doctorReview": {
    "doctorId": "doc_001",
    "doctorReview": "Dr. Johnson was extremely professional and caring throughout my treatment. The surgery went smoothly and recovery was faster than expected.",
    "bedsideMannerRating": 5,
    "medicalExpertiseRating": 5,
    "communicationRating": 4,
    "waitTimeRating": 4,
    "thoroughnessRating": 5,
    "followUpRating": 5
  },
  "claim": {
    "claimId": "claim_001",
    "claimAmountApproved": 450000,
    "remainingAmountToBePaid": 50000
  },
  "payment": {
    "billNo": "BILL-2024-001",
    "amountToBePayed": 50000,
    "totalBillAmount": 500000,
    "description": "Cardiac bypass surgery with 5-day hospitalization and post-operative care"
  },
  "hospitalReview": "# Excellent Hospital Facilities\n\nThe hospital was very clean and well-maintained. Staff was courteous and helpful.",
  "documentIds": ["doc_123abc", "doc_456def"],
  "extractedData": {
    "hospitalName": "City General Hospital",
    "doctorName": "Dr. Sarah Johnson",
    "surgeryType": "Cardiac Bypass Surgery",
    "procedureDate": "2024-02-15",
    "diagnosis": "Coronary Artery Disease",
    "medications": ["Aspirin", "Metoprolol", "Atorvastatin"],
    "confidence": 0.95
  },
  "verified": true,
  "serviceQualityRating": 5,
  "maintenanceRating": 4,
  "foodQualityRating": 3,
  "cleanlinessRating": 5,
  "staffBehaviorRating": 4
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "reviewId": "review_1234567890abc",
    "hospitalId": "hosp_001",
    "doctorId": "doc_001",
    "customerId": "cust_001",
    "policyId": "pol_001",
    "purposeOfVisit": "# Cardiac Bypass Surgery\n\n...",
    "doctorReview": {...},
    "claim": {...},
    "payment": {...},
    "hospitalReview": "# Excellent Hospital Facilities\n\n...",
    "documentIds": ["doc_123abc", "doc_456def"],
    "extractedData": {...},
    "verified": true,
    "createdAt": "2024-03-01T10:30:00Z",
    "serviceQualityRating": 5,
    "maintenanceRating": 4,
    "foodQualityRating": 3,
    "cleanlinessRating": 5,
    "staffBehaviorRating": 4
  }
}
```

**Database Schema Reference:**
```sql
-- Review table (10,110 rows)
CREATE TABLE Review (
  reviewId TEXT PRIMARY KEY,
  hospitalId TEXT NOT NULL,            -- Foreign key → Hospital
  doctorId TEXT NOT NULL,              -- Foreign key → Doctor
  customerId TEXT NOT NULL,            -- Foreign key → Customer
  policyId TEXT,                       -- Foreign key → InsurancePolicy
  purposeOfVisit TEXT NOT NULL,        -- Markdown format
  doctorReview TEXT NOT NULL,          -- JSON object
  claim TEXT,                          -- JSON object
  payment TEXT NOT NULL,               -- JSON object
  hospitalReview TEXT NOT NULL,        -- Markdown format
  documentIds TEXT NOT NULL,           -- JSON array of filenames
  extractedData TEXT NOT NULL,         -- JSON object
  verified BOOLEAN NOT NULL,           -- 1=verified, 0=fake
  createdAt DATETIME NOT NULL
);

-- JSON Structures:

-- doctorReview field:
{
  "doctorId": "string",
  "doctorReview": "string",
  "bedsideMannerRating": number,      // 1-5
  "medicalExpertiseRating": number,   // 1-5
  "communicationRating": number,      // 1-5
  "waitTimeRating": number,           // 1-5
  "thoroughnessRating": number,       // 1-5
  "followUpRating": number            // 1-5
}

-- claim field (optional):
{
  "claimId": "string",
  "claimAmountApproved": number,
  "remainingAmountToBePaid": number
}

-- payment field:
{
  "billNo": "string",
  "amountToBePayed": number,
  "totalBillAmount": number,
  "description": "string"
}

-- extractedData field:
{
  "hospitalName": "string",
  "doctorName": "string",
  "surgeryType": "string",
  "procedureDate": "string",         // ISO date format
  "diagnosis": "string",
  "medications": ["string"],         // Array of medication names
  "confidence": number               // 0.0-1.0
}
```

**Backend Processing Steps:**
1. Validate all foreign keys (hospitalId, doctorId, customerId, policyId)
2. Verify document IDs exist and belong to customer
3. Check for duplicate reviews (same customer + hospital + doctor)
4. Run background job for document verification
5. Update hospital and doctor aggregate ratings
6. Send confirmation email to customer
7. Add visit to customer's visit history if not exists

**Validation Rules:**
- All ratings: 1-5 (integer)
- `verified` will be set by backend based on document verification
- `createdAt` is system-generated
- `documentIds` array must not be empty
- `extractedData.confidence` should be 0.0-1.0

---

### 2. Get Reviews by Customer

**Endpoint:** `GET /api/reviews/customer/{customerId}`

**Headers:** Requires Authorization token

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Results per page
- `sortBy` (optional): createdAt, verified
- `order` (optional): asc or desc

**Example Request:**
```
GET /api/reviews/customer/cust_001?page=1&limit=10&sortBy=createdAt&order=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "reviewId": "review_001",
        "hospitalId": "hosp_001",
        "doctorId": "doc_001",
        "customerId": "cust_001",
        "policyId": "pol_001",
        "purposeOfVisit": "# Cardiac Surgery\n\nRoutine bypass procedure",
        "doctorReview": {
          "doctorId": "doc_001",
          "doctorReview": "Excellent care and follow-up",
          "bedsideMannerRating": 5,
          "medicalExpertiseRating": 5,
          "communicationRating": 4,
          "waitTimeRating": 4,
          "thoroughnessRating": 5,
          "followUpRating": 5
        },
        "claim": {
          "claimId": "claim_001",
          "claimAmountApproved": 450000,
          "remainingAmountToBePaid": 50000
        },
        "payment": {
          "billNo": "BILL-2024-001",
          "amountToBePayed": 50000,
          "totalBillAmount": 500000,
          "description": "Cardiac bypass surgery with post-op care"
        },
        "hospitalReview": "# Excellent Facilities\n\nVery clean and well-maintained",
        "documentIds": ["doc_001.pdf", "doc_002.pdf"],
        "extractedData": {
          "hospitalName": "City General Hospital",
          "doctorName": "Dr. Sarah Johnson",
          "surgeryType": "Cardiac Bypass Surgery",
          "procedureDate": "2024-02-15",
          "diagnosis": "Coronary Artery Disease",
          "medications": ["Aspirin", "Metoprolol"],
          "confidence": 0.95
        },
        "verified": true,
        "createdAt": "2024-02-20T14:30:00Z",
        "serviceQualityRating": 5,
        "maintenanceRating": 4,
        "foodQualityRating": 3,
        "cleanlinessRating": 5,
        "staffBehaviorRating": 4,
        "hospital": {
          "hospitalName": "City General Hospital"
        },
        "doctor": {
          "doctorName": "Dr. Sarah Johnson"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalResults": 3,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

**Optimization:**
- Include hospital and doctor names to avoid additional queries
- Consider using GraphQL for flexible field selection
- Cache frequently accessed reviews

---

### 3. Get Reviews by Hospital

**Endpoint:** `GET /api/reviews/hospital/{hospitalId}?verified={true|false}`

**Query Parameters:**
- `verified` (optional): Filter by verification status (default: true)
- `page`, `limit`: Pagination
- `minRating` (optional): Filter by minimum rating

**Example Request:**
```
GET /api/reviews/hospital/hosp_001?verified=true&minRating=4&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "hospital": {
      "hospitalId": "hosp_001",
      "hospitalName": "City General Hospital"
    },
    "stats": {
      "totalReviews": 145,
      "verifiedReviews": 132,
      "averageRating": 4.3
    },
    "pagination": {...}
  }
}
```

---

### 4. Get Reviews by Doctor

**Endpoint:** `GET /api/reviews/doctor/{doctorId}?verified={true|false}`

**Example Request:**
```
GET /api/reviews/doctor/doc_001?verified=true&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "doctor": {
      "doctorId": "doc_001",
      "doctorName": "Dr. Sarah Johnson"
    },
    "stats": {
      "totalReviews": 87,
      "verifiedReviews": 82,
      "averageRating": 4.7
    },
    "pagination": {...}
  }
}
```

---

### 5. Get Review by ID

**Endpoint:** `GET /api/reviews/{reviewId}`

**Example Request:**
```
GET /api/reviews/review_001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviewId": "review_001",
    // ... full review object
    "hospital": {
      "hospitalName": "City General Hospital"
    },
    "doctor": {
      "doctorName": "Dr. Sarah Johnson"
    },
    "customer": {
      "customerName": "John Doe"
    }
  }
}
```

---

### 6. Update Review

**Endpoint:** `PUT /api/reviews/{reviewId}`

**Headers:** Requires Authorization token

**Request Body:**
```json
{
  "hospitalReview": "# Updated Review\n\nAfter follow-up visit, I'm even more impressed.",
  "serviceQualityRating": 5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    // ... updated review object
  }
}
```

**Security:**
- Only allow updates by review owner
- Do not allow changing verified status via this endpoint
- Re-run verification if documentIds are changed
- Track update history for audit

---

### 7. Delete Review

**Endpoint:** `DELETE /api/reviews/{reviewId}`

**Headers:** Requires Authorization token

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Implementation:**
- Use soft delete (add `deletedAt` timestamp)
- Only allow deletion by review owner or admin
- Update hospital/doctor aggregate ratings
- Keep document references for audit

---

## Document Endpoints

### 1. Upload Document

**Endpoint:** `POST /api/documents/upload`

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Multipart):**
```
file: <File>
documentType: "medical_record" | "insurance_claim" | "bill" | "prescription" | "discharge_summary"
customerId: string
```

**Alternative Approach (Pre-signed URL):**

**Step 1:** Get pre-signed URL
```
POST /api/documents/presigned-url
Content-Type: application/json

{
  "fileName": "medical_report_2024.pdf",
  "documentType": "medical_record",
  "fileSize": 245678,
  "contentType": "application/pdf"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/hospital-reviews/...",
    "documentId": "doc_1234567890abc",
    "expiresIn": 300
  }
}
```

**Step 2:** Upload to S3 directly from frontend
```javascript
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});
```

**Step 3:** Trigger verification
```
POST /api/documents/{documentId}/verify

{
  "documentId": "doc_1234567890abc"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "verified": true,
  "documentId": "doc_1234567890abc",
  "s3Url": "https://s3.amazonaws.com/hospital-reviews/...",
  "message": "Document verified successfully",
  "confidence": 0.96
}
```

**Verification Process:**
1. Run AWS Rekognition for tampering detection
2. Use OCR (AWS Textract) to extract text
3. Validate document authenticity using ML models
4. Check for watermarks and official stamps
5. Cross-reference with known hospital templates
6. Return confidence score (0.0-1.0)

**Allowed File Types:**
- PDF: application/pdf
- Images: image/jpeg, image/png
- Max file size: 10MB

---

### 2. Extract Medical Data from Documents

**Endpoint:** `POST /api/documents/extract`

**Headers:** Requires Authorization token

**Request Body:**
```json
{
  "documentIds": ["doc_123abc", "doc_456def"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hospitalName": "City General Hospital",
    "doctorName": "Dr. Sarah Johnson",
    "surgeryType": "Cardiac Bypass Surgery",
    "procedureDate": "2024-02-15",
    "diagnosis": "Coronary Artery Disease",
    "medications": ["Aspirin", "Metoprolol", "Atorvastatin"],
    "confidence": 0.95
  }
}
```

**Backend Implementation:**
1. Retrieve documents from S3
2. Run AWS Textract for OCR
3. Use AWS Comprehend Medical for entity extraction
4. Parse structured data:
   - Hospital name
   - Doctor name
   - Procedure/surgery type
   - Dates
   - Diagnosis
   - Medications
5. Calculate confidence score
6. Return extracted data

**Processing Time:**
- Small documents (< 2 pages): 3-5 seconds
- Large documents (> 10 pages): 10-20 seconds
- Consider using asynchronous processing with webhooks

---

### 3. Get Customer Documents

**Endpoint:** `GET /api/customers/{customerId}/documents`

**Headers:** Requires Authorization token

**Query Parameters:**
- `documentType` (optional): Filter by type
- `verified` (optional): Filter by verification status
- `page`, `limit`: Pagination

**Example Request:**
```
GET /api/customers/cust_001/documents?verified=true&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "doc_123abc",
        "fileName": "medical_report_2024.pdf",
        "documentType": "medical_record",
        "s3Url": "https://s3.amazonaws.com/hospital-reviews/doc_123abc.pdf",
        "verified": true,
        "uploadedAt": "2024-02-20T10:30:00Z",
        "fileSize": 245678,
        "confidence": 0.96
      }
    ],
    "pagination": {...}
  }
}
```

**Security:**
- Generate pre-signed URLs for S3 access (expires in 15 minutes)
- Only allow access to own documents
- Log all document access for audit

---

### 4. Delete Document

**Endpoint:** `DELETE /api/documents/{documentId}`

**Headers:** Requires Authorization token

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Implementation:**
- Check if document is used in any reviews
- If used, prevent deletion or warn user
- Remove from S3
- Mark as deleted in database
- Update review verification status if applicable

---

## Analytics Endpoints

### 1. Get Hospital Statistics

**Endpoint:** `GET /api/hospitals/{hospitalId}/stats`

**Query Parameters:**
- `startDate` (optional): Filter reviews from this date
- `endDate` (optional): Filter reviews until this date

**Example Request:**
```
GET /api/hospitals/hosp_001/stats?startDate=2024-01-01&endDate=2024-12-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalReviews": 145,
    "verifiedReviews": 132,
    "averageRating": 4.3,
    "averageClaimApprovalRate": 0.87,
    "averageCost": 285000,
    "ratingBreakdown": {
      "serviceQuality": 4.5,
      "maintenance": 4.2,
      "foodQuality": 3.8,
      "cleanliness": 4.6,
      "staffBehavior": 4.4
    },
    "reviewsByMonth": [
      { "month": "2024-01", "count": 12 },
      { "month": "2024-02", "count": 15 }
    ],
    "topDoctors": [
      {
        "doctorId": "doc_001",
        "doctorName": "Dr. Sarah Johnson",
        "averageRating": 4.8,
        "totalReviews": 45
      }
    ]
  }
}
```

**Calculation Notes:**
- `averageClaimApprovalRate` = sum(claimAmountApproved) / sum(totalBillAmount)
- `averageCost` = average of payment.totalBillAmount
- All ratings are 1-5 scale
- Only include verified reviews in calculations

---

### 2. Get Doctor Statistics

**Endpoint:** `GET /api/doctors/{doctorId}/stats`

**Example Request:**
```
GET /api/doctors/doc_001/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalReviews": 87,
    "verifiedReviews": 82,
    "averageRating": 4.7,
    "ratingBreakdown": {
      "bedsideManner": 4.8,
      "medicalExpertise": 4.9,
      "communication": 4.6,
      "waitTime": 4.2,
      "thoroughness": 4.8,
      "followUpCare": 4.7
    },
    "reviewsByProcedure": [
      {
        "surgeryType": "Cardiac Bypass Surgery",
        "count": 23,
        "averageRating": 4.9
      },
      {
        "surgeryType": "Angioplasty",
        "count": 31,
        "averageRating": 4.6
      }
    ],
    "hospitals": [
      {
        "hospitalId": "hosp_001",
        "hospitalName": "City General Hospital",
        "reviewCount": 65
      }
    ]
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error type or code",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific field error details"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE (no body) |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid token but no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (e.g., email exists) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Server maintenance |

### Common Error Examples

**Validation Error (422):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "age": "Age must be between 18 and 80"
  }
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Hospital with ID 'hosp_999' not found"
}
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 60
}
```

---

## Rate Limiting

### Recommended Limits

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Authentication | 5 requests | 15 minutes |
| Search | 100 requests | 1 hour |
| Read (GET) | 1000 requests | 1 hour |
| Write (POST/PUT) | 100 requests | 1 hour |
| Document Upload | 20 requests | 1 hour |

### Rate Limit Headers

Include in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1709294400
```

---

## Data Validation Rules

### Customer
- `customerName`: 2-100 characters
- `email`: Valid email, max 255 characters
- `password`: Min 8 characters, must include uppercase, lowercase, number
- `age`: 18-80
- `gender`: Male, Female, Other
- `uhid`: Format UHID-XXXXX (5 digits)

### Review
- All ratings: 1-5 (integer)
- `purposeOfVisit`: Markdown, max 5000 characters
- `hospitalReview`: Markdown, max 5000 characters
- `doctorReview.doctorReview`: Max 2000 characters
- `documentIds`: Array, min 1 item
- `payment.totalBillAmount`: > 0
- `claim.claimAmountApproved`: >= 0, <= totalBillAmount

### Document
- File size: Max 10MB
- Allowed types: PDF, JPEG, PNG
- File name: Max 255 characters

---

## Best Practices for Backend Integration

### 1. Security
- Always validate JWT tokens on protected endpoints
- Use HTTPS only
- Implement CORS properly
- Sanitize all inputs to prevent SQL injection
- Hash passwords using bcrypt (cost factor: 12)
- Store API keys in environment variables

### 2. Database
- Use indexes on frequently queried fields:
  - `Customer.email`
  - `Review.hospitalId`, `Review.doctorId`, `Review.customerId`
  - `Review.createdAt`
  - `Hospital.hospitalName`
- Use foreign key constraints
- Implement soft deletes with `deletedAt` timestamp
- Use transactions for multi-table operations

### 3. Performance
- Implement caching:
  - Hospital/doctor lists (1 hour)
  - Insurance companies (24 hours)
  - Statistics (15 minutes)
- Use pagination for all list endpoints
- Consider read replicas for heavy queries
- Implement database connection pooling

### 4. Document Storage
- Use AWS S3 or similar for document storage
- Generate pre-signed URLs for uploads (expires in 5 minutes)
- Store only metadata in database
- Implement lifecycle policies (archive after 7 years)
- Enable versioning for compliance

### 5. Background Jobs
- Document verification: Use queue (AWS SQS, RabbitMQ)
- Email notifications: Async processing
- Statistics calculation: Update every 15 minutes
- Data extraction: Process asynchronously for large documents

### 6. Monitoring
- Log all API requests with correlation IDs
- Track error rates per endpoint
- Monitor response times
- Set up alerts for:
  - Error rate > 5%
  - Response time > 2 seconds
  - Document verification failures

---

## Testing Endpoints

### Sample Test Data

Use these IDs for testing:

```javascript
// Hospitals (29 total)
const testHospitalIds = [
  'hosp_001', 'hosp_002', 'hosp_003', // ... up to hosp_029
];

// Departments (218 total)
const testDepartmentIds = [
  'dept_001', 'dept_002', // ... up to dept_218
];

// Doctors (976 total)
const testDoctorIds = [
  'doc_001', 'doc_002', // ... up to doc_976
];

// Insurance Companies (10 total)
const testInsuranceIds = [
  'ins_001', 'ins_002', // ... up to ins_010
];

// Insurance Policies (185 total)
const testPolicyIds = [
  'pol_001', 'pol_002', // ... up to pol_185
];

// Customers (11,110 total)
const testCustomerIds = [
  'cust_001', 'cust_002', // ... up to cust_11110
];

// Reviews (10,110 total)
const testReviewIds = [
  'review_001', 'review_002', // ... up to review_10110
];
```

### Example Integration Test

```javascript
// Test: Create Review
async function testCreateReview() {
  const token = await loginAndGetToken();
  
  const reviewData = {
    hospitalId: 'hosp_001',
    doctorId: 'doc_001',
    customerId: 'cust_001',
    policyId: 'pol_001',
    purposeOfVisit: '# Test Surgery\n\nTest procedure',
    doctorReview: {
      doctorId: 'doc_001',
      doctorReview: 'Test review',
      bedsideMannerRating: 5,
      medicalExpertiseRating: 5,
      communicationRating: 5,
      waitTimeRating: 4,
      thoroughnessRating: 5,
      followUpRating: 5
    },
    payment: {
      billNo: 'TEST-001',
      amountToBePayed: 10000,
      totalBillAmount: 50000,
      description: 'Test payment'
    },
    hospitalReview: '# Test Hospital Review',
    documentIds: ['doc_test_001'],
    extractedData: {
      hospitalName: 'Test Hospital',
      doctorName: 'Dr. Test',
      surgeryType: 'Test Surgery',
      procedureDate: '2024-03-01',
      diagnosis: 'Test Diagnosis',
      medications: ['Test Med'],
      confidence: 0.95
    },
    verified: true,
    serviceQualityRating: 5,
    maintenanceRating: 4,
    foodQualityRating: 3,
    cleanlinessRating: 5,
    staffBehaviorRating: 4
  };
  
  const response = await fetch('http://localhost:3001/api/reviews', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reviewData)
  });
  
  const result = await response.json();
  console.log('Review created:', result);
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-03-01 | Initial API specification |

---

## Support

For backend integration support, contact:
- Email: backend-support@hospitalreviewplatform.com
- Slack: #backend-integration
- Documentation: https://docs.hospitalreviewplatform.com

---

**End of API Integration Guide**
