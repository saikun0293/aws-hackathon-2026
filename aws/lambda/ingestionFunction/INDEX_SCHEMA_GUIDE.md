# OpenSearch Index Schema Guide

## Your Existing Index Schema

You've already created the index `health-review-index` with this schema:

```json
PUT health-review-index
{
  "settings": {
    "index.knn": true,
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "hospitalId": { "type": "keyword" },
      "doctorId": { "type": "keyword" },
      "departmentId": { "type": "keyword" },
      "insuranceId": { "type": "keyword" },
      "reviewText": { "type": "text" },
      "reviewId": { "type": "text" },
      "embedding": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "engine": "faiss",
          "space_type": "cosinesimil",
          "parameters": {
            "ef_construction": 128,
            "m": 24
          }
        }
      }
    }
  }
}
```

---

## How Lambda Function Works with Your Schema

The Lambda function now:

1. ✅ **Uses your existing index** (`health-review-index`)
2. ✅ **Does NOT create or modify the index**
3. ✅ **Populates your required fields**:
   - `hospitalId` - From review.hospitalId
   - `doctorId` - From review.doctorId
   - `departmentId` - From doctor.departmentId
   - `insuranceId` - First insurance ID from hospital.insuranceCompanyIds
   - `reviewText` - Combined text from all sources (for semantic search)
   - `reviewIndex` - Searchable metadata (IDs, names, diagnosis, surgery type)
   - `embedding` - Will be added by Bedrock Knowledge Base

4. ✅ **Also includes complete data** from Hospital, Doctor, and Review tables as additional fields

---

## Document Structure

Each document indexed will have:

### Your Required Fields (for vector search)
```json
{
  "hospitalId": "hospital_apollo_hospitals_jubilee_hills_500033",
  "doctorId": "doctor_nvbxwl",
  "departmentId": "department_hospital_apollo_hospitals_jubilee_hills_500033_mtxbj",
  "insuranceId": "insurancecomp_9kjwhl3k19",
  "reviewText": "Combined text from review, hospital, doctor...",
  "reviewIndex": "review_customer_cust_0001_1 hospital_apollo_hospitals_jubilee_hills_500033 Apollo Hospitals doctor_nvbxwl Dr. Rajesh Kumar department_hospital_apollo_hospitals_jubilee_hills_500033_mtxbj cust_0001 policy_xxx Cardiac Arrhythmia Bypass Surgery",
  "embedding": [0.123, 0.456, ...]  // Added by Bedrock
}
```

### Additional Fields (for complete context)
```json
{
  // ... your required fields above ...
  
  "reviewId": "review_customer_cust_0001_1",
  "customerId": "cust_0001",
  "policyId": "policy_xxx",
  "purposeOfVisit": "Cardiac surgery...",
  "hospitalReview": "Excellent care...",
  "verified": true,
  "createdAt": "2024-01-15T10:30:00Z",
  
  "hospital": {
    "hospitalName": "Apollo Hospitals",
    "address": "Jubilee Hills, Hyderabad",
    "rating": 4.5,
    "affordability": 0.7,
    // ... all other hospital fields
  },
  
  "doctor": {
    "doctorName": "Dr. Rajesh Kumar",
    "qualification": "MBBS, MD, DM (Cardiology)",
    "rating": 4.8,
    // ... all other doctor fields
  }
}
```

---

## Field Construction

### reviewText Field
The `reviewText` field combines text from multiple sources for semantic search:

```python
reviewText = ' '.join([
    review.purposeOfVisit,
    review.hospitalReview,
    hospital.hospitalName,
    hospital.description,
    hospital.address,
    doctor.doctorName,
    doctor.about,
    doctor.qualification,
    extractedData.diagnosis,
    extractedData.surgeryType,
    hospital.services (joined)
])
```

This provides rich context for semantic search and embeddings.

### reviewIndex Field
The `reviewIndex` field contains searchable metadata for quick text-based lookups:

```python
reviewIndex = ' '.join([
    review.reviewId,
    hospital.hospitalId,
    hospital.hospitalName,
    doctor.doctorId,
    doctor.doctorName,
    doctor.departmentId,
    review.customerId,
    review.policyId,
    extractedData.diagnosis,
    extractedData.surgeryType
])
```

This enables fast text searches on IDs, names, and key medical terms without relying on vector similarity.

---

## Bedrock Knowledge Base Configuration

When configuring Bedrock Knowledge Base:

1. **Data Source**: OpenSearch
2. **Index Name**: `health-review-index`
3. **Text Field**: `reviewText`
4. **Vector Field**: `embedding`
5. **Metadata Fields**:
   - `hospitalId`
   - `doctorId`
   - `departmentId`
   - `insuranceId`
   - `hospital.hospitalName`
   - `doctor.doctorName`
   - `verified`

---

## Environment Variables

Set these in Lambda:

```bash
DYNAMODB_REGION=eu-north-1
OPENSEARCH_ENDPOINT=your-domain.us-east-1.es.amazonaws.com
OPENSEARCH_REGION=us-east-1
INDEX_NAME=health-review-index  # Your index name
```

---

## Deployment

```bash
# 1. Edit deploy.sh
vim deploy.sh
# Set INDEX_NAME="health-review-index"

# 2. Deploy
./deploy.sh

# 3. Test single review
aws lambda invoke \
  --function-name opensearch-data-ingestion \
  --payload '{"mode":"single","reviewId":"review_customer_cust_0001_1"}' \
  response.json

# 4. Verify in OpenSearch
GET /health-review-index/_search
{
  "query": {
    "match": {
      "reviewText": "cardiac"
    }
  }
}

# 5. Bulk ingest all reviews
python bulk_ingest.py --batch-size 100
```

---

## Verification

After ingestion, verify the data:

```bash
# Count documents
GET /health-review-index/_count

# Get sample document
GET /health-review-index/_search
{
  "size": 1
}

# Search by hospital
GET /health-review-index/_search
{
  "query": {
    "term": {
      "hospitalId": "hospital_apollo_hospitals_jubilee_hills_500033"
    }
  }
}

# Search by text
GET /health-review-index/_search
{
  "query": {
    "match": {
      "reviewText": "cardiac surgery"
    }
  }
}
```

---

## Key Points

✅ Lambda uses YOUR existing index schema
✅ Does NOT create or modify the index
✅ Populates your required fields:
   - hospitalId, doctorId, departmentId, insuranceId (keyword fields)
   - reviewText (semantic search content)
   - reviewIndex (searchable metadata: IDs, names, diagnosis, surgery)
✅ Includes complete data from all tables as additional fields
✅ Bedrock Knowledge Base will add embeddings to the `embedding` field
✅ Single AZ, 1 node optimized (1 shard, 0 replicas)

---

## Next Steps

1. Deploy Lambda function
2. Test with single review
3. Bulk ingest all 10,110 reviews
4. Configure Bedrock Knowledge Base to use `health-review-index`
5. Bedrock will generate embeddings and populate the `embedding` field
6. Test semantic search with OpenSearch Knowledge Agent

Done!
