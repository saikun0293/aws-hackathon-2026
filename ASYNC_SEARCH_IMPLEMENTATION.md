# Async Search Implementation - Backend Complete

## Backend Implementation Status: ✅ COMPLETE

### What Was Implemented

#### 1. DynamoDB Integration
- Added DynamoDB client for `eu-north-1` region
- Created `SearchResults` table structure:
  ```json
  {
    "searchId": "search_123",
    "status": "processing|complete|error",
    "updatedAt": "ISO timestamp",
    "ttl": 1772737832,
    "llmResponse": {
      "aiSummary": "...",
      "hospitals": [{
        "hospitalId": "...",
        "hospitalAIReview": "...",
        "doctors": [{"doctorId": "...", "doctorAIReview": "..."}]
      }]
    },
    "error": "..." // only if status is error
  }
  ```

#### 2. Three API Endpoints
1. **POST /search** - Initiate async search
   - Returns `{searchId, status: "processing"}` immediately (202 Accepted)
   - Starts background thread to process search
   
2. **GET /search/{searchId}** - Poll for status/results
   - Returns `{searchId, status: "processing"}` while processing
   - Returns enriched hospitals when complete
   - Returns error details if failed
   
3. **GET /hospitals/{hospitalId}/doctors?searchId={searchId}** - Lazy load doctors
   - Fetches doctor data from API
   - Enriches with AI reviews from stored LLM response
   - Returns enriched doctor list

#### 3. Async Processing Flow
- `search_hospitals()` - Generates searchId, saves "processing" status, starts thread
- `process_search_async()` - Invokes LLM with retries, stores raw response
- `get_search_status()` - Enriches hospitals on-the-fly from LLM response
- `get_hospital_doctors()` - Enriches doctors on-the-fly with AI reviews

#### 4. LLM Retry Logic
- 3 retry attempts with 1-second delays
- Handles JSON parsing errors
- Handles Bedrock client errors
- Stores error in DynamoDB if all retries fail

#### 5. Data Enrichment
- **Hospitals**: Fetches hospital data + reviews, enriches with:
  - `imageUrl`: "/default-hospital.jpg"
  - `avgCostRange`: from `minCost`, `maxCost`
  - `insuranceCoveragePercent`: calculated from claims
  - `location`: extracted from address
  - `specialties`: from services array
  - `aiRecommendation`: from LLM response
  
- **Doctors**: Fetches doctor data + reviews, enriches with:
  - `qualifications`: from Doctor API
  - `imageUrl`: "/default-doctor.jpg"
  - `aiSummary`: from LLM response stored in DynamoDB

#### 6. TTL and Expiration
- Search results expire after 5 hours
- TTL field automatically managed by DynamoDB

### Environment Variables Required

Add these to Lambda configuration:
```
DYNAMODB_TABLE_NAME=SearchResults
DYNAMODB_REGION=eu-north-1
LLM_MAX_RETRIES=3
SEARCH_RESULT_TTL_HOURS=5
```

### IAM Permissions Required

Lambda execution role needs:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:eu-north-1:*:table/SearchResults"
    }
  ]
}
```

### Deployment Steps

1. **Create DynamoDB Table**:
   ```bash
   aws dynamodb create-table \
     --table-name SearchResults \
     --attribute-definitions AttributeName=searchId,AttributeType=S \
     --key-schema AttributeName=searchId,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region eu-north-1
   ```

2. **Enable TTL on DynamoDB Table**:
   ```bash
   aws dynamodb update-time-to-live \
     --table-name SearchResults \
     --time-to-live-specification "Enabled=true, AttributeName=ttl" \
     --region eu-north-1
   ```

3. **Update Lambda Environment Variables**:
   - Add the environment variables listed above

4. **Update Lambda IAM Role**:
   - Add DynamoDB permissions

5. **Deploy Lambda Function**:
   ```powershell
   cd aws/lambda/searchFunction
   .\deploy.ps1
   ```

### API Gateway Routes to Configure

Ensure these routes are configured:
- `POST /search` → Lambda
- `GET /search/{searchId}` → Lambda
- `GET /hospitals/{hospitalId}/doctors` → Lambda

---

## Frontend Implementation: 🔴 NOT STARTED

### What Needs to Be Done

#### 1. Update `app/src/app/services/api.ts`

Add three new functions:

```typescript
// Initiate async search
export async function initiateSearch(query: string, customerId: string, userContext?: any) {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, customerId, userContext })
  });
  return response.json(); // Returns {searchId, status: "processing"}
}

// Poll for search status
export async function pollSearchStatus(searchId: string) {
  const response = await fetch(`${API_BASE_URL}/search/${searchId}`);
  return response.json(); // Returns {searchId, status, results?}
}

// Get hospital doctors (lazy load)
export async function getHospitalDoctors(hospitalId: string, searchId: string) {
  const response = await fetch(
    `${API_BASE_URL}/hospitals/${hospitalId}/doctors?searchId=${searchId}`
  );
  return response.json(); // Returns {doctors: [...]}
}
```

#### 2. Update `app/src/app/pages/Home.tsx`

Implement polling logic:

```typescript
const [searchId, setSearchId] = useState<string | null>(null);
const [isPolling, setIsPolling] = useState(false);
const [searchStatus, setSearchStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');

// On search submit
const handleSearch = async (query: string) => {
  setIsPolling(true);
  setSearchStatus('processing');
  
  // Initiate search
  const { searchId } = await initiateSearch(query, customerId);
  setSearchId(searchId);
  
  // Start polling
  const pollInterval = setInterval(async () => {
    const result = await pollSearchStatus(searchId);
    
    if (result.status === 'complete') {
      clearInterval(pollInterval);
      setSearchStatus('complete');
      setIsPolling(false);
      setHospitals(result.results.hospitals);
      setAiSummary(result.results.aiSummary);
    } else if (result.status === 'error') {
      clearInterval(pollInterval);
      setSearchStatus('error');
      setIsPolling(false);
      // Show error message
    }
  }, 5000); // Poll every 5 seconds
};
```

#### 3. Update `app/src/app/pages/HospitalDetail.tsx`

Implement lazy loading for doctors:

```typescript
const [doctors, setDoctors] = useState([]);
const [loadingDoctors, setLoadingDoctors] = useState(true);

useEffect(() => {
  const loadDoctors = async () => {
    if (hospitalId && searchId) {
      setLoadingDoctors(true);
      const { doctors } = await getHospitalDoctors(hospitalId, searchId);
      setDoctors(doctors);
      setLoadingDoctors(false);
    }
  };
  
  loadDoctors();
}, [hospitalId, searchId]);
```

#### 4. UI Changes

- Show loading spinner while `status === 'processing'`
- Show error message if `status === 'error'`
- Display results when `status === 'complete'`
- Pass `searchId` to HospitalDetail page (via URL params or state)
- Show loading skeleton for doctors section until loaded

### Testing Checklist

- [ ] Search initiates and returns searchId
- [ ] Polling starts and continues every 5 seconds
- [ ] Results display when status becomes "complete"
- [ ] Error message shows if status becomes "error"
- [ ] Clicking hospital navigates to detail page
- [ ] Doctors lazy load on hospital detail page
- [ ] AI summaries display correctly for hospitals and doctors
- [ ] Search expires after 5 hours (show appropriate message)

---

## Next Steps

1. ✅ Backend implementation complete
2. 🔄 Deploy Lambda function with new code
3. 🔄 Configure DynamoDB table and permissions
4. 🔄 Test backend endpoints with Postman
5. ⏳ Implement frontend changes
6. ⏳ Test end-to-end flow
