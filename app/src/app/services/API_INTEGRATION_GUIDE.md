# API Integration Guide

## Overview

This guide helps you integrate the Hospital Review Platform frontend with your backend API. All mock API endpoints are defined in `/src/app/services/apiMocks.ts` with comprehensive TypeScript types matching your database schema.

## Quick Start

### Step 1: Environment Setup

Create a `.env` file in your project root:

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
# or for production:
# REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
```

### Step 2: Install HTTP Client (Optional but Recommended)

```bash
npm install axios
# or
npm install @tanstack/react-query axios
```

### Step 3: Replace Mock Implementations

Open `/src/app/services/apiMocks.ts` and replace the mock implementations with real HTTP calls.

## Backend API Endpoints Reference

### Hospital Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/hospitals/search?q={query}` | Search hospitals | - | `Hospital[]` |
| `GET` | `/api/hospitals/{hospitalId}` | Get hospital by ID | - | `Hospital` |
| `GET` | `/api/hospitals?page={page}&limit={limit}` | Get all hospitals (paginated) | - | `{ hospitals: Hospital[], total: number }` |
| `GET` | `/api/hospitals/by-insurance/{insuranceCompanyId}` | Get hospitals by insurance | - | `Hospital[]` |
| `GET` | `/api/hospitals/{hospitalId}/stats` | Get hospital statistics | - | `HospitalStats` |

### Department Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/departments/hospital/{hospitalId}` | Get departments by hospital | - | `Department[]` |
| `GET` | `/api/departments/{departmentId}` | Get department by ID | - | `Department` |

### Doctor Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/doctors/hospital/{hospitalId}` | Get doctors by hospital | - | `Doctor[]` |
| `GET` | `/api/doctors/department/{departmentId}` | Get doctors by department | - | `Doctor[]` |
| `GET` | `/api/doctors/{doctorId}` | Get doctor by ID | - | `Doctor` |
| `GET` | `/api/doctors/search?q={query}` | Search doctors | - | `Doctor[]` |
| `GET` | `/api/doctors/{doctorId}/stats` | Get doctor statistics | - | `DoctorStats` |

### Insurance Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/insurance-companies` | Get all insurance companies | - | `InsuranceCompany[]` |
| `GET` | `/api/insurance-companies/{id}` | Get insurance company by ID | - | `InsuranceCompany` |
| `GET` | `/api/insurance-policies/company/{companyId}` | Get policies by company | - | `InsurancePolicy[]` |
| `GET` | `/api/insurance-policies/{policyId}` | Get policy by ID | - | `InsurancePolicy` |

### Customer Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/customers/{customerId}` | Get customer profile | - | `Customer` |
| `PUT` | `/api/customers/{customerId}` | Update customer profile | `Partial<Customer>` | `{ success: boolean, data: Customer }` |
| `GET` | `/api/customers/{customerId}/visits` | Get customer visits | - | `Visit[]` |
| `POST` | `/api/customers/{customerId}/visits` | Add customer visit | `Omit<Visit, 'visitId'>` | `{ success: boolean, data: Visit }` |
| `GET` | `/api/customers/{customerId}/documents` | Get customer documents | - | `DocumentMetadata[]` |

### Review Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/reviews` | Create review | `Omit<Review, 'reviewId' \| 'createdAt'>` | `{ success: boolean, data: Review }` |
| `GET` | `/api/reviews/customer/{customerId}` | Get reviews by customer | - | `Review[]` |
| `GET` | `/api/reviews/hospital/{hospitalId}` | Get reviews by hospital | - | `Review[]` |
| `GET` | `/api/reviews/doctor/{doctorId}` | Get reviews by doctor | - | `Review[]` |
| `GET` | `/api/reviews/{reviewId}` | Get review by ID | - | `Review` |
| `PUT` | `/api/reviews/{reviewId}` | Update review | `Partial<Review>` | `{ success: boolean, data: Review }` |
| `DELETE` | `/api/reviews/{reviewId}` | Delete review | - | `{ success: boolean }` |

### Document Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/documents/upload` | Upload document | `FormData` with file and documentType | `DocumentValidationResult` |
| `POST` | `/api/documents/extract` | Extract medical data | `{ documentIds: string[] }` | `ExtractedData` |
| `DELETE` | `/api/documents/{documentId}` | Delete document | - | `{ success: boolean }` |

### Authentication Endpoints (Optional)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/auth/register` | Register new customer | `RegisterData` | `{ success: boolean, token: string, customer: Customer }` |
| `POST` | `/api/auth/login` | Login customer | `LoginData` | `{ success: boolean, token: string, customer: Customer }` |
| `POST` | `/api/auth/logout` | Logout customer | - | `{ success: boolean }` |

## Example Integration with Axios

### Basic Setup

Create `/src/app/services/apiClient.ts`:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Example: Replace Mock Function

**Before (Mock):**

```typescript
export async function searchHospitals(query: string): Promise<Hospital[]> {
  console.log(`[API Mock] GET ${API_BASE_URL}/hospitals/search?q=${query}`);
  await delay(500);
  return []; // Mock data
}
```

**After (Real API):**

```typescript
import apiClient from './apiClient';

export async function searchHospitals(query: string): Promise<Hospital[]> {
  try {
    const response = await apiClient.get<{ hospitals: Hospital[] }>(
      `/hospitals/search`,
      { params: { q: query } }
    );
    return response.data.hospitals;
  } catch (error) {
    console.error('Failed to search hospitals:', error);
    throw error;
  }
}
```

### Example: File Upload with FormData

**Before (Mock):**

```typescript
export async function uploadDocument(
  file: File,
  documentType: string
): Promise<DocumentValidationResult> {
  await delay(2000);
  return { success: true, verified: true, ... };
}
```

**After (Real API):**

```typescript
export async function uploadDocument(
  file: File,
  documentType: string
): Promise<DocumentValidationResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  try {
    const response = await apiClient.post<DocumentValidationResult>(
      '/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Longer timeout for file uploads
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to upload document:', error);
    throw error;
  }
}
```

## Integration with React Query (Recommended)

React Query provides caching, automatic refetching, and better state management.

### Setup

```bash
npm install @tanstack/react-query
```

**In your App.tsx:**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

### Example: Using React Query

**Create custom hooks in `/src/app/hooks/useHospitals.ts`:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchHospitals, getHospitalById } from '../services/apiMocks';

export function useHospitalSearch(query: string) {
  return useQuery({
    queryKey: ['hospitals', 'search', query],
    queryFn: () => searchHospitals(query),
    enabled: query.length > 0,
  });
}

export function useHospitalDetail(hospitalId: string) {
  return useQuery({
    queryKey: ['hospitals', hospitalId],
    queryFn: () => getHospitalById(hospitalId),
    enabled: !!hospitalId,
  });
}
```

**Use in components:**

```typescript
function HospitalSearchComponent() {
  const [query, setQuery] = useState('');
  const { data: hospitals, isLoading, error } = useHospitalSearch(query);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {hospitals?.map(hospital => (
        <HospitalCard key={hospital.hospitalId} hospital={hospital} />
      ))}
    </div>
  );
}
```

## AWS Services Integration

### Document Verification Flow

1. **Client uploads to S3 via pre-signed URL:**
   - Backend generates pre-signed URL
   - Frontend uploads directly to S3
   - Backend receives callback on upload completion

2. **Backend runs verification:**
   - AWS Rekognition: Detect document tampering
   - HyperVerge API: Enhanced document verification
   - Store verification results in database

3. **Medical Data Extraction:**
   - AWS Textract: OCR for text extraction
   - AWS Comprehend Medical: Extract medical entities
   - Parse structured data (dates, amounts, medications)

### Example Backend Flow (Node.js)

```javascript
// Backend: Generate pre-signed URL
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

app.post('/api/documents/presigned-url', async (req, res) => {
  const { fileName, documentType } = req.body;
  const documentId = generateId();
  
  const uploadUrl = await s3.getSignedUrlPromise('putObject', {
    Bucket: 'hospital-reviews',
    Key: `${documentId}/${fileName}`,
    Expires: 300, // 5 minutes
    ContentType: req.body.contentType,
  });
  
  res.json({ uploadUrl, documentId });
});

// Backend: Verify document (triggered by S3 event)
app.post('/api/documents/:documentId/verify', async (req, res) => {
  const { documentId } = req.params;
  
  // Run AWS Rekognition
  const rekognition = new AWS.Rekognition();
  const result = await rekognition.detectText({
    Image: { S3Object: { Bucket: 'hospital-reviews', Name: documentId } }
  }).promise();
  
  // Run HyperVerge
  const hyperverge = await verifyWithHyperVerge(documentId);
  
  // Save results
  await db.documents.update(documentId, {
    verified: hyperverge.verified && result.confidence > 0.9,
    confidence: Math.min(hyperverge.confidence, result.confidence)
  });
  
  res.json({ verified: true, confidence: 0.95 });
});
```

## Database Schema Notes

### JSON Fields

Many fields in your schema store JSON data. Make sure to:

1. **Parse on retrieval:**
   ```typescript
   const hospital = await db.hospitals.findById(id);
   hospital.services = JSON.parse(hospital.services);
   hospital.departmentIds = JSON.parse(hospital.departmentIds);
   ```

2. **Stringify on insert:**
   ```typescript
   await db.hospitals.create({
     ...data,
     services: JSON.stringify(data.services),
     departmentIds: JSON.stringify(data.departmentIds),
   });
   ```

3. **Consider using PostgreSQL JSONB** for better query performance:
   ```sql
   SELECT * FROM hospitals 
   WHERE services @> '["Emergency Care"]';
   ```

### Handling Nullable Fields

The schema has many optional fields. Ensure your API:

1. Returns `null` for nullable fields when not present
2. Accepts `undefined` or `null` in update operations
3. Validates required fields on creation

### DateTime Format

Use ISO 8601 format for all dates:
```typescript
createdAt: new Date().toISOString() // "2024-03-01T10:30:00.000Z"
```

## Security Considerations

### 1. Authentication

```typescript
// Add JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/customers/:customerId', verifyToken, async (req, res) => {
  // Ensure user can only access their own data
  if (req.user.customerId !== req.params.customerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // ... fetch customer data
});
```

### 2. Input Validation

```typescript
const { body, validationResult } = require('express-validator');

app.post('/api/reviews', [
  body('hospitalId').isString().notEmpty(),
  body('doctorId').isString().notEmpty(),
  body('payment.totalBillAmount').isNumeric().isFloat({ min: 0 }),
  // ... more validations
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... create review
});
```

### 3. Rate Limiting

```typescript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. CORS Configuration

```typescript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

## Testing Your Integration

### 1. Test with Postman/Thunder Client

Import this collection to test all endpoints:

```json
{
  "info": { "name": "Hospital Review Platform API" },
  "item": [
    {
      "name": "Search Hospitals",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/hospitals/search?q=cardiac"
      }
    },
    // ... more endpoints
  ]
}
```

### 2. Frontend Testing

```typescript
// In your component
import { searchHospitals } from './services/apiMocks';

// Test the integration
useEffect(() => {
  searchHospitals('test').then(results => {
    console.log('API returned:', results);
  }).catch(error => {
    console.error('API error:', error);
  });
}, []);
```

### 3. Error Handling

```typescript
try {
  const hospitals = await searchHospitals(query);
  setResults(hospitals);
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      setError(error.response.data.message);
    } else if (error.request) {
      // Request made but no response
      setError('No response from server');
    } else {
      // Error setting up request
      setError('Failed to make request');
    }
  } else {
    setError('An unexpected error occurred');
  }
}
```

## Performance Optimization

### 1. Implement Caching

```typescript
// Redis caching example
const redis = require('redis');
const client = redis.createClient();

app.get('/api/hospitals/:id', async (req, res) => {
  const cached = await client.get(`hospital:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  const hospital = await db.hospitals.findById(req.params.id);
  await client.setEx(`hospital:${req.params.id}`, 3600, JSON.stringify(hospital));
  
  res.json(hospital);
});
```

### 2. Pagination

```typescript
app.get('/api/hospitals', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const [hospitals, total] = await Promise.all([
    db.hospitals.findMany({ limit, offset }),
    db.hospitals.count()
  ]);
  
  res.json({
    hospitals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
```

### 3. Database Indexes

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_hospitals_name ON hospitals(hospitalName);
CREATE INDEX idx_reviews_customer ON reviews(customerId);
CREATE INDEX idx_reviews_hospital ON reviews(hospitalId);
CREATE INDEX idx_reviews_created ON reviews(createdAt);
CREATE INDEX idx_reviews_verified ON reviews(verified);
```

## Migration Checklist

- [ ] Set up backend server (Node.js/Express, Python/FastAPI, etc.)
- [ ] Configure database (PostgreSQL, MySQL, SQLite)
- [ ] Implement authentication (JWT, OAuth, etc.)
- [ ] Create all API endpoints listed in this guide
- [ ] Set up AWS services (S3, Rekognition, Textract, Comprehend)
- [ ] Configure environment variables
- [ ] Replace mock functions in `/src/app/services/apiMocks.ts`
- [ ] Set up error handling and logging
- [ ] Implement rate limiting and security measures
- [ ] Test all endpoints with real data
- [ ] Deploy backend to production
- [ ] Update frontend environment variables
- [ ] Test full integration

## Support

For questions about the frontend implementation, refer to the component files in `/src/app/`.

For backend-specific questions, consult your backend framework's documentation.

---

**Last Updated:** March 1, 2026
