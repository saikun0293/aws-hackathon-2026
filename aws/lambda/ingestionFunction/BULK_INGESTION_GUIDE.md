# Bulk Ingestion Guide - Processing All 10,000 Reviews

This guide explains how to process all your reviews from DynamoDB and index them to OpenSearch with embeddings.

## Overview

The bulk ingestion process will:
1. Fetch reviews from DynamoDB (in batches)
2. For each review, fetch related Hospital, Doctor, and Customer data
3. Combine all data into enriched documents
4. Generate 1024-dimensional embeddings using Bedrock Titan Embed Text v2
5. Index documents with embeddings to OpenSearch

## Prerequisites

✓ Lambda function `IngestionLambda` deployed with:
  - OpenSearch permissions (es:ESHttpPut, es:ESHttpGet, etc.)
  - DynamoDB read permissions (dynamodb:GetItem, dynamodb:Scan)
  - Bedrock permissions (bedrock:InvokeModel for amazon.titan-embed-text-v2:0)
  - Timeout: 300 seconds (5 minutes)
  - Memory: 512 MB

✓ OpenSearch index `health-review-index` created with:
  - 1024-dimensional vector field named `embedding`
  - knn enabled with HNSW/FAISS engine

✓ Python environment with boto3:
  ```bash
  pip install boto3
  ```

✓ AWS credentials configured (AWS CLI or environment variables)

## Step 1: Test with Single Review First

Before processing all 10,000 reviews, test with a single review:

```bash
python bulk_ingest.py --test --review-id review_373fvasqa4
```

Expected output:
```
Testing single review: review_373fvasqa4
--------------------------------------------------------------------------------
Status Code: 200
Response: {
  "success": true,
  "reviewId": "review_373fvasqa4",
  "message": "Review indexed successfully"
}
```

Verify in OpenSearch:
```
GET health-review-index/_search
{
  "query": {
    "match": {
      "reviewId": "review_373fvasqa4"
    }
  }
}
```

Check that the document has:
- All review, hospital, doctor data
- An `embedding` field with 1024 dimensions

## Step 2: Process All Reviews

Once the test succeeds, process all reviews:

```bash
python bulk_ingest.py
```

This will:
- Process 25 reviews per batch (safe for Lambda timeout)
- Automatically handle pagination
- Show progress for each batch
- Provide a final summary

### Expected Output

```
Starting bulk ingestion at 2026-03-02 10:00:00
Function: IngestionLambda, Batch size: 25, Region: us-east-1
--------------------------------------------------------------------------------

Batch 1: Invoking Lambda...
Batch 1 completed in 45.23s:
  - Processed: 25
  - Indexed: 25
  - Errors: 0
  - Total so far: 25 processed, 25 indexed, 0 errors

Batch 2: Invoking Lambda...
Batch 2 completed in 43.87s:
  - Processed: 25
  - Indexed: 25
  - Errors: 0
  - Total so far: 50 processed, 50 indexed, 0 errors

... (continues for all batches)

================================================================================
All reviews processed!
================================================================================
INGESTION SUMMARY
================================================================================
Start time: 2026-03-02 10:00:00
End time: 2026-03-02 12:30:00
Duration: 9000.00 seconds (150.00 minutes)
Total batches: 400
Total processed: 10000
Total indexed: 10000
Total errors: 0
Success rate: 100.00%
Average time per review: 0.900 seconds
================================================================================
```

## Step 3: Verify Ingestion

Check total document count in OpenSearch:

```
GET health-review-index/_count
```

Expected response:
```json
{
  "count": 10000
}
```

Check a few random documents to verify embeddings:

```
GET health-review-index/_search
{
  "size": 3,
  "query": {
    "match_all": {}
  }
}
```

Each document should have:
- `embedding` field with 1024 float values
- Complete review, hospital, doctor, and customer data

## Timing Estimates

With 10,000 reviews and batch size of 25:
- Total batches: 400
- Time per batch: ~40-60 seconds (including embedding generation)
- Total time: ~2.5-4 hours

The process is safe to interrupt (Ctrl+C) and resume - it will continue from where it left off.

## Customization Options

### Adjust Batch Size

If you want faster processing (and have increased Lambda timeout):

```bash
python bulk_ingest.py --batch-size 50
```

⚠️ Not recommended to go above 50 due to:
- Embedding generation takes time (~1-2 seconds per review)
- Lambda timeout limits (5 minutes max)
- Risk of partial batch failures

### Different Lambda Function Name

If your Lambda has a different name:

```bash
python bulk_ingest.py --function-name MyCustomLambdaName
```

### Different AWS Region

If your Lambda is in a different region:

```bash
python bulk_ingest.py --region eu-west-1
```

## Troubleshooting

### Lambda Timeout Errors

If you see timeout errors:
1. Reduce batch size: `--batch-size 10`
2. Increase Lambda timeout to 300 seconds (5 minutes)
3. Increase Lambda memory to 512 MB or 1024 MB

### Bedrock Throttling

If you see Bedrock throttling errors:
1. Reduce batch size to 10-15
2. Add delay between batches (modify script)
3. Request quota increase for Bedrock Titan Embed

### OpenSearch 403 Errors

If you see 403 errors:
1. Verify Lambda execution role has OpenSearch permissions
2. Check OpenSearch access policy allows Lambda role
3. Verify Fine-Grained Access Control settings

### Partial Failures

If some reviews fail:
- Check CloudWatch Logs: `/aws/lambda/IngestionLambda`
- Look for specific error messages
- Re-run the script - it will skip already indexed reviews

## Monitoring Progress

### CloudWatch Logs

Monitor Lambda execution in CloudWatch:
```
/aws/lambda/IngestionLambda
```

Look for:
- "Generated embedding with 1024 dimensions"
- "Indexed document review_xxx: created/updated"
- Any error messages

### OpenSearch Dashboard

Monitor index size in OpenSearch:
```
GET health-review-index/_stats
```

Check document count increasing:
```
GET health-review-index/_count
```

## After Ingestion

Once all reviews are indexed:

1. **Test Vector Search**: Try a semantic search query
2. **Create Knowledge Base**: Connect OpenSearch to Bedrock Knowledge Base
3. **Configure Agent**: Set up your OpenSearch Knowledge Agent
4. **Test Queries**: Verify agent can retrieve relevant reviews

## Next Steps

See:
- `EMBEDDING_INTEGRATION.md` - How embeddings are generated
- `INDEX_SCHEMA_GUIDE.md` - OpenSearch index schema details
- `../agents/opensearch-knowledge-agent-ui-fields.md` - Agent configuration
