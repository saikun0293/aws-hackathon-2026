# API Integration Guide for Hospital Review Platform

This directory contains comprehensive documentation and mock objects for backend API integration.

## 📁 Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `API_INTEGRATION_GUIDE.md` | Complete API documentation with all endpoints, schemas, and examples | Reference for backend developers implementing the API |
| `mockRequestsResponses.ts` | TypeScript mock objects for all request/response payloads | Copy these as templates for your API requests |
| `integrationExamples.ts` | Working code examples using fetch, axios, and React Query | Copy integration patterns into your codebase |
| `/src/app/services/apiMocks.ts` | Current mock API implementation | Replace these implementations with real API calls |

## 🚀 Quick Start

### Step 1: Review the Database Schema

The database schema is documented in `/src/imports/database-schema.md`. This contains all table structures and data types that match your backend.

### Step 2: Read the API Documentation

Open `API_INTEGRATION_GUIDE.md` for complete documentation of:
- All API endpoints
- Request/response formats
- Authentication flow
- Error handling
- Rate limiting
- Best practices

### Step 3: Use Mock Objects as Templates

Refer to `mockRequestsResponses.ts` for example request and response objects:

```typescript
import { mockCreateReviewRequest, mockCreateReviewResponse } from './api/mockRequestsResponses';

// Use these as templates for your actual API calls
const reviewData = mockCreateReviewRequest;
// Modify with actual data from your form
reviewData.hospitalId = selectedHospitalId;
reviewData.doctorId = selectedDoctorId;
// ... etc
```

### Step 4: Implement Real API Calls

Use the code patterns from `integrationExamples.ts`:

```typescript
import { createReview, searchHospitals } from './api/integrationExamples';

// Example: Search hospitals
const results = await searchHospitals({ 
  query: 'cardiac surgery',
  page: 1,
  limit: 20 
});

// Example: Create a review
const review = await createReview(reviewData);
```

### Step 5: Replace Mock Functions

The current mock API functions are in `/src/app/services/apiMocks.ts`. Replace them one by one:

**Before (Mock):**
```typescript
export async function searchHospitals(query: string): Promise<Hospital[]> {
  await delay(500);
  // Return mock data
  return mockHospitals;
}
```

**After (Real API):**
```typescript
export async function searchHospitals(query: string): Promise<Hospital[]> {
  const response = await fetch(`${API_BASE_URL}/hospitals/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return data.hospitals;
}
```

## 📋 Integration Checklist

### Environment Setup
- [ ] Set `REACT_APP_API_BASE_URL` in `.env` file
- [ ] Configure CORS on backend to allow frontend domain
- [ ] Set up AWS S3 bucket for document uploads (if using S3)
- [ ] Configure JWT secret on backend

### Authentication
- [ ] Implement registration endpoint (`POST /api/auth/register`)
- [ ] Implement login endpoint (`POST /api/auth/login`)
- [ ] Implement logout endpoint (`POST /api/auth/logout`)
- [ ] Add JWT token generation and validation
- [ ] Implement token refresh mechanism

### Hospital Endpoints
- [ ] Search hospitals (`GET /api/hospitals/search`)
- [ ] Get hospital by ID (`GET /api/hospitals/{hospitalId}`)
- [ ] Get all hospitals with pagination (`GET /api/hospitals`)
- [ ] Get hospitals by insurance (`GET /api/hospitals/by-insurance/{insuranceId}`)

### Department Endpoints
- [ ] Get departments by hospital (`GET /api/departments/hospital/{hospitalId}`)
- [ ] Get department by ID (`GET /api/departments/{departmentId}`)

### Doctor Endpoints
- [ ] Get doctors by hospital (`GET /api/doctors/hospital/{hospitalId}`)
- [ ] Get doctors by department (`GET /api/doctors/department/{departmentId}`)
- [ ] Get doctor by ID (`GET /api/doctors/{doctorId}`)
- [ ] Search doctors (`GET /api/doctors/search`)

### Insurance Endpoints
- [ ] Get all insurance companies (`GET /api/insurance-companies`)
- [ ] Get insurance company by ID (`GET /api/insurance-companies/{insuranceCompanyId}`)
- [ ] Get policies by company (`GET /api/insurance-policies/company/{companyId}`)
- [ ] Get policy by ID (`GET /api/insurance-policies/{policyId}`)

### Customer Endpoints
- [ ] Get customer profile (`GET /api/customers/{customerId}`)
- [ ] Update customer profile (`PUT /api/customers/{customerId}`)
- [ ] Get customer visits (`GET /api/customers/{customerId}/visits`)
- [ ] Add customer visit (`POST /api/customers/{customerId}/visits`)

### Review Endpoints
- [ ] Create review (`POST /api/reviews`)
- [ ] Get reviews by customer (`GET /api/reviews/customer/{customerId}`)
- [ ] Get reviews by hospital (`GET /api/reviews/hospital/{hospitalId}`)
- [ ] Get reviews by doctor (`GET /api/reviews/doctor/{doctorId}`)
- [ ] Get review by ID (`GET /api/reviews/{reviewId}`)
- [ ] Update review (`PUT /api/reviews/{reviewId}`)
- [ ] Delete review (`DELETE /api/reviews/{reviewId}`)

### Document Endpoints
- [ ] Get presigned upload URL (`POST /api/documents/presigned-url`)
- [ ] Upload to S3 (client-side, using presigned URL)
- [ ] Verify document (`POST /api/documents/{documentId}/verify`)
- [ ] Extract medical data (`POST /api/documents/extract`)
- [ ] Get customer documents (`GET /api/customers/{customerId}/documents`)
- [ ] Delete document (`DELETE /api/documents/{documentId}`)

### Analytics Endpoints
- [ ] Get hospital statistics (`GET /api/hospitals/{hospitalId}/stats`)
- [ ] Get doctor statistics (`GET /api/doctors/{doctorId}/stats`)

### Document Verification (Backend)
- [ ] Integrate AWS Rekognition for tampering detection
- [ ] Integrate AWS Textract for OCR
- [ ] Integrate AWS Comprehend Medical for entity extraction
- [ ] Implement confidence scoring algorithm

### Security & Performance
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Set up database indexes on frequently queried fields
- [ ] Implement caching strategy (Redis recommended)
- [ ] Add API request logging
- [ ] Set up error monitoring (Sentry, DataDog, etc.)
- [ ] Implement HTTPS only
- [ ] Add CSRF protection

## 🔐 Authentication Flow

```
1. User Registration/Login
   ↓
2. Backend generates JWT token
   ↓
3. Frontend stores token in localStorage
   ↓
4. Frontend includes token in Authorization header for protected endpoints
   ↓
5. Backend validates token on each request
   ↓
6. Token expires after 7 days (configurable)
   ↓
7. Frontend refreshes token or prompts re-login
```

## 📊 Database Schema Summary

Based on `/src/imports/database-schema.md`:

| Table | Rows | Key Fields |
|-------|------|------------|
| Hospital | 29 | hospitalId, hospitalName, services, location, address |
| Department | 218 | departmentId, departmentName, hospitalId, listOfDoctorIds |
| Doctor | 976 | doctorId, doctorName, about, patients |
| InsuranceCompany | 10 | insuranceCompanyId, insuranceCompanyName |
| InsurancePolicy | 185 | policyId, companyId, about |
| Customer | 11,110 | customerId, customerName, email, policyId, visits |
| Review | 10,110 | reviewId, hospitalId, doctorId, customerId, verified |

All JSON fields (arrays and objects) are stored as TEXT and should be parsed/stringified on the backend.

## 🛠️ Recommended Tech Stack

### Backend
- **Framework:** Node.js with Express or NestJS
- **Database:** PostgreSQL or MySQL
- **ORM:** Prisma or TypeORM
- **Authentication:** JWT with bcrypt for password hashing
- **File Storage:** AWS S3
- **Document Processing:** AWS Textract, AWS Comprehend Medical
- **Caching:** Redis
- **Queue:** AWS SQS or Bull

### Frontend (Current)
- **Framework:** React 18+ with TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v4
- **Animations:** Motion (Framer Motion)
- **Data Fetching:** Currently using fetch (recommend upgrading to React Query)

## 📝 Example: Complete Review Submission Flow

```typescript
// 1. User fills out review form
const reviewFormData = {
  hospitalId: "hosp_001",
  doctorId: "doc_001",
  purposeOfVisit: "...",
  // ... other fields
};

// 2. User uploads documents
const uploadedDocs = [];
for (const file of selectedFiles) {
  const result = await uploadAndVerifyDocument(file, 'medical_record');
  uploadedDocs.push(result.documentId);
}

// 3. Extract medical data from documents
const extractedData = await extractMedicalData(uploadedDocs);

// 4. Combine and submit review
const reviewData = {
  ...reviewFormData,
  documentIds: uploadedDocs,
  extractedData,
  verified: extractedData.confidence > 0.8,
  customerId: currentUser.customerId,
};

const review = await createReview(reviewData);

// 5. Show success message
console.log('Review created:', review);
```

## 🧪 Testing

### Unit Tests
Test individual API functions with mocked fetch/axios:

```typescript
import { searchHospitals } from './integrationExamples';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: { hospitals: [] } }),
  })
) as jest.Mock;

test('searchHospitals calls correct endpoint', async () => {
  await searchHospitals({ query: 'test' });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/hospitals/search?q=test'),
    expect.any(Object)
  );
});
```

### Integration Tests
Test complete workflows with a test database:

```typescript
test('complete review submission flow', async () => {
  // 1. Register user
  const user = await registerCustomer({...});
  
  // 2. Upload document
  const doc = await uploadAndVerifyDocument(...);
  
  // 3. Create review
  const review = await createReview({...});
  
  expect(review.verified).toBe(true);
});
```

## 🐛 Debugging Tips

### Enable API Logging
All mock functions log to console with `[API Mock]` prefix. Real API calls should follow the same pattern:

```typescript
console.log(`[API] POST ${API_BASE_URL}/reviews`, reviewData);
```

### Check Network Tab
- Verify request URL is correct
- Check request headers include Authorization token
- Inspect request body format
- Review response status and body

### Common Issues

**401 Unauthorized:**
- Check if token is stored: `localStorage.getItem('auth_token')`
- Verify token is included in Authorization header
- Check if token has expired

**400 Bad Request:**
- Validate request body matches expected schema
- Check all required fields are included
- Verify data types are correct (string vs number)

**404 Not Found:**
- Verify API_BASE_URL is correct
- Check endpoint path spelling
- Ensure entity exists (e.g., hospitalId is valid)

**429 Too Many Requests:**
- Implement request throttling on frontend
- Add exponential backoff retry logic
- Check rate limit headers in response

## 📚 Additional Resources

- [Database Schema](/src/imports/database-schema.md)
- [Current Mock API](/src/app/services/apiMocks.ts)
- [React Router Documentation](https://reactrouter.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [AWS Textract](https://aws.amazon.com/textract/)
- [AWS Comprehend Medical](https://aws.amazon.com/comprehend/medical/)

## 💬 Support

For questions about API integration:
1. Review the `API_INTEGRATION_GUIDE.md` for detailed documentation
2. Check `integrationExamples.ts` for working code patterns
3. Refer to `mockRequestsResponses.ts` for example payloads
4. Contact the backend team if issues persist

## 🔄 Migration Strategy

### Phase 1: Setup (Week 1)
- Set up backend server and database
- Implement authentication endpoints
- Test login/register flow

### Phase 2: Read Operations (Week 2)
- Implement GET endpoints for hospitals, doctors, departments
- Replace mock search functions with real API calls
- Test search and detail pages

### Phase 3: Customer Data (Week 3)
- Implement customer profile endpoints
- Add customer visit tracking
- Test profile management

### Phase 4: Document Upload (Week 4)
- Set up S3 bucket
- Implement document upload with presigned URLs
- Integrate AWS Textract and Comprehend Medical
- Test document verification flow

### Phase 5: Reviews (Week 5)
- Implement review CRUD endpoints
- Add review submission and retrieval
- Test complete review workflow

### Phase 6: Analytics & Optimization (Week 6)
- Implement statistics endpoints
- Add caching layer
- Optimize database queries
- Load testing

### Phase 7: Production (Week 7)
- Security audit
- Performance testing
- Deploy to production
- Monitor and fix issues

---

**Last Updated:** March 1, 2024

**Version:** 1.0.0
