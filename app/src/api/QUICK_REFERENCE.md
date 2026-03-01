# API Quick Reference - Hospital Review Platform

Quick reference guide for all API endpoints. For detailed documentation, see `API_INTEGRATION_GUIDE.md`.

---

## 🔑 Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "customerName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "gender": "Male",
  "age": 35
}

Response: { token, customer }
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: { token, customer }
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}

Response: { success: true }
```

---

## 🏥 Hospitals

### Search Hospitals
```http
GET /api/hospitals/search?q={query}&page=1&limit=20
Optional params: insuranceId, location, radius

Response: { hospitals: [], pagination: {} }
```

### Get Hospital by ID
```http
GET /api/hospitals/{hospitalId}

Response: { hospital }
```

### Get All Hospitals
```http
GET /api/hospitals?page=1&limit=20

Response: { hospitals: [], pagination: {} }
```

### Get Hospitals by Insurance
```http
GET /api/hospitals/by-insurance/{insuranceCompanyId}

Response: { hospitals: [] }
```

---

## 🏢 Departments

### Get Departments by Hospital
```http
GET /api/departments/hospital/{hospitalId}

Response: { departments: [] }
```

### Get Department by ID
```http
GET /api/departments/{departmentId}

Response: { department }
```

---

## 👨‍⚕️ Doctors

### Get Doctors by Hospital
```http
GET /api/doctors/hospital/{hospitalId}?page=1&limit=20

Response: { doctors: [] }
```

### Get Doctors by Department
```http
GET /api/doctors/department/{departmentId}

Response: { doctors: [] }
```

### Get Doctor by ID
```http
GET /api/doctors/{doctorId}

Response: { doctor }
```

### Search Doctors
```http
GET /api/doctors/search?q={query}&hospitalId={id}

Response: { doctors: [] }
```

---

## 🏛️ Insurance

### Get All Insurance Companies
```http
GET /api/insurance-companies

Response: { companies: [] }
```

### Get Insurance Company by ID
```http
GET /api/insurance-companies/{insuranceCompanyId}

Response: { company }
```

### Get Policies by Company
```http
GET /api/insurance-policies/company/{companyId}

Response: { policies: [] }
```

### Get Policy by ID
```http
GET /api/insurance-policies/{policyId}

Response: { policy }
```

---

## 👤 Customers

### Get Customer Profile
```http
GET /api/customers/{customerId}
Authorization: Bearer {token}

Response: { customer }
```

### Update Customer Profile
```http
PUT /api/customers/{customerId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerName": "John M. Doe",
  "age": 36,
  "policyId": "pol_002"
}

Response: { customer }
```

### Get Customer Visits
```http
GET /api/customers/{customerId}/visits
Authorization: Bearer {token}

Response: { visits: [] }
```

### Add Customer Visit
```http
POST /api/customers/{customerId}/visits
Authorization: Bearer {token}
Content-Type: application/json

{
  "hospitalId": "hosp_001",
  "departmentId": "dept_001",
  "doctorId": "doc_001"
}

Response: { visit }
```

---

## ⭐ Reviews

### Create Review
```http
POST /api/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "hospitalId": "hosp_001",
  "doctorId": "doc_001",
  "customerId": "cust_001",
  "policyId": "pol_001",
  "purposeOfVisit": "# Surgery...",
  "doctorReview": {
    "doctorId": "doc_001",
    "doctorReview": "Excellent...",
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
    "billNo": "BILL-001",
    "amountToBePayed": 50000,
    "totalBillAmount": 500000,
    "description": "Surgery..."
  },
  "hospitalReview": "# Great hospital...",
  "documentIds": ["doc_001", "doc_002"],
  "extractedData": {
    "hospitalName": "City General",
    "doctorName": "Dr. Johnson",
    "surgeryType": "CABG",
    "procedureDate": "2024-02-15",
    "diagnosis": "CAD",
    "medications": ["Aspirin"],
    "confidence": 0.95
  },
  "verified": true,
  "serviceQualityRating": 5,
  "maintenanceRating": 4,
  "foodQualityRating": 3,
  "cleanlinessRating": 5,
  "staffBehaviorRating": 4
}

Response: { review }
```

### Get Reviews by Customer
```http
GET /api/reviews/customer/{customerId}?page=1&limit=10
Authorization: Bearer {token}
Optional params: sortBy, order

Response: { reviews: [], pagination: {} }
```

### Get Reviews by Hospital
```http
GET /api/reviews/hospital/{hospitalId}?verified=true

Response: { reviews: [], stats: {} }
```

### Get Reviews by Doctor
```http
GET /api/reviews/doctor/{doctorId}?verified=true

Response: { reviews: [], stats: {} }
```

### Get Review by ID
```http
GET /api/reviews/{reviewId}

Response: { review }
```

### Update Review
```http
PUT /api/reviews/{reviewId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "hospitalReview": "Updated review...",
  "serviceQualityRating": 5
}

Response: { review }
```

### Delete Review
```http
DELETE /api/reviews/{reviewId}
Authorization: Bearer {token}

Response: { success: true }
```

---

## 📄 Documents

### Step 1: Get Presigned URL
```http
POST /api/documents/presigned-url
Authorization: Bearer {token}
Content-Type: application/json

{
  "fileName": "medical_report.pdf",
  "documentType": "medical_record",
  "fileSize": 245678,
  "contentType": "application/pdf"
}

Response: { uploadUrl, documentId, expiresIn }
```

### Step 2: Upload to S3
```http
PUT {presignedUrl}
Content-Type: application/pdf
Body: <file binary>

Response: 200 OK
```

### Step 3: Verify Document
```http
POST /api/documents/{documentId}/verify
Authorization: Bearer {token}

Response: { 
  verified: true, 
  s3Url, 
  confidence: 0.96 
}
```

### Extract Medical Data
```http
POST /api/documents/extract
Authorization: Bearer {token}
Content-Type: application/json

{
  "documentIds": ["doc_001", "doc_002"]
}

Response: { 
  hospitalName, 
  doctorName, 
  surgeryType, 
  procedureDate,
  diagnosis,
  medications,
  confidence 
}
```

### Get Customer Documents
```http
GET /api/customers/{customerId}/documents?verified=true&page=1&limit=20
Authorization: Bearer {token}

Response: { documents: [], pagination: {} }
```

### Delete Document
```http
DELETE /api/documents/{documentId}
Authorization: Bearer {token}

Response: { success: true }
```

---

## 📊 Analytics

### Get Hospital Statistics
```http
GET /api/hospitals/{hospitalId}/stats?startDate=2024-01-01&endDate=2024-12-31

Response: {
  totalReviews,
  verifiedReviews,
  averageRating,
  averageClaimApprovalRate,
  averageCost,
  ratingBreakdown: {
    serviceQuality,
    maintenance,
    foodQuality,
    cleanliness,
    staffBehavior
  }
}
```

### Get Doctor Statistics
```http
GET /api/doctors/{doctorId}/stats

Response: {
  totalReviews,
  verifiedReviews,
  averageRating,
  ratingBreakdown: {
    bedsideManner,
    medicalExpertise,
    communication,
    waitTime,
    thoroughness,
    followUpCare
  }
}
```

---

## 🚨 Common Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Login or refresh token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 422 | Validation Error | Fix validation errors |
| 429 | Too Many Requests | Slow down, retry later |
| 500 | Server Error | Report to backend team |

---

## 🔐 Authentication Headers

All protected endpoints require:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Data Types

### Customer
```typescript
{
  customerId: string;          // "cust_001"
  customerName: string;        // "John Doe"
  email: string;              // "john@example.com"
  createdAt: string;          // ISO 8601: "2024-03-01T10:30:00Z"
  policyId?: string;          // "pol_001"
  gender?: "Male" | "Female" | "Other";
  age?: number;               // 18-80
  uhid?: string;              // "UHID-12345"
  visits?: Visit[];
}
```

### Hospital
```typescript
{
  hospitalId: string;
  hospitalName: string;
  services: string[];          // ["Surgery", "Cardiology"]
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  departmentIds: string[];
  insuranceCompanyIds: string[];
  phoneNumber?: string;
  description?: string;        // Markdown
  patients?: string[];
}
```

### Review
```typescript
{
  reviewId: string;
  hospitalId: string;
  doctorId: string;
  customerId: string;
  policyId?: string;
  purposeOfVisit: string;      // Markdown
  doctorReview: {
    doctorId: string;
    doctorReview: string;
    bedsideMannerRating: number;     // 1-5
    medicalExpertiseRating: number;  // 1-5
    communicationRating: number;     // 1-5
    waitTimeRating: number;          // 1-5
    thoroughnessRating: number;      // 1-5
    followUpRating: number;          // 1-5
  };
  claim?: {
    claimId: string;
    claimAmountApproved: number;
    remainingAmountToBePaid: number;
  };
  payment: {
    billNo: string;
    amountToBePayed: number;
    totalBillAmount: number;
    description: string;
  };
  hospitalReview: string;      // Markdown
  documentIds: string[];
  extractedData: {
    hospitalName: string;
    doctorName: string;
    surgeryType: string;
    procedureDate: string;     // "2024-02-15"
    diagnosis: string;
    medications: string[];
    confidence: number;        // 0.0-1.0
  };
  verified: boolean;
  createdAt: string;           // ISO 8601
  serviceQualityRating?: number;    // 1-5
  maintenanceRating?: number;       // 1-5
  foodQualityRating?: number;       // 1-5
  cleanlinessRating?: number;       // 1-5
  staffBehaviorRating?: number;     // 1-5
}
```

---

## 🛠️ Quick Code Examples

### TypeScript/Fetch
```typescript
// Search hospitals
const response = await fetch(
  `${API_BASE_URL}/hospitals/search?q=cardiac`,
  {
    headers: { 'Content-Type': 'application/json' }
  }
);
const data = await response.json();
```

### With Auth Token
```typescript
const token = localStorage.getItem('auth_token');
const response = await fetch(
  `${API_BASE_URL}/customers/${customerId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### POST Request
```typescript
const response = await fetch(`${API_BASE_URL}/reviews`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reviewData)
});
```

---

## 📦 Environment Variables

Create `.env` file:
```bash
REACT_APP_API_BASE_URL=https://api.hospitalreviewplatform.com/v1
REACT_APP_AWS_S3_BUCKET=hospital-review-documents
REACT_APP_AWS_REGION=us-east-1
```

Backend `.env`:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/hospital_reviews
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=hospital-review-documents
CORS_ORIGIN=http://localhost:3000
```

---

## 🔍 Testing Endpoints

### Using cURL
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"customerName":"John","email":"john@test.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Test123!"}'

# Search (with token)
curl -X GET "http://localhost:3001/api/hospitals/search?q=cardiac" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
1. Import `API_INTEGRATION_GUIDE.md` examples
2. Set environment variable `{{baseUrl}}` = `http://localhost:3001/api`
3. Set environment variable `{{token}}` = your JWT token
4. Use `{{baseUrl}}/hospitals/search` in requests

---

## 📚 File References

- **Complete Documentation**: `/src/api/API_INTEGRATION_GUIDE.md`
- **Mock Objects**: `/src/api/mockRequestsResponses.ts`
- **Code Examples**: `/src/api/integrationExamples.ts`
- **Database Schema**: `/src/imports/database-schema.md`
- **Current Mocks**: `/src/app/services/apiMocks.ts`

---

**Last Updated:** March 1, 2024  
**API Version:** 1.0.0
