# Search Function - AI-Powered Hospital Search

## Overview

This Lambda function orchestrates intelligent hospital search by integrating AWS Bedrock Agent with multiple backend services to provide comprehensive, AI-enhanced search results.

## Architecture

```
User Query → API Gateway → searchLambda
                              ├─→ Bedrock Agent (AI recommendations)
                              ├─→ Hospital API (hospital details)
                              ├─→ Doctor API (doctor details)
                              ├─→ Review API (statistics & coverage)
                              └─→ Department API (all hospital doctors)
                              
                           ↓ Parallel Processing ↓
                           
                         Enriched Response → UI
```

## Features

1. **AI-Powered Recommendations**: Uses AWS Bedrock Agent for intelligent hospital matching
2. **Parallel Data Fetching**: Fetches data from multiple APIs concurrently for performance
3. **Statistics Calculation**: Computes ratings, success rates, and coverage from reviews
4. **Insurance Matching**: Calculates personalized insurance coverage estimates
5. **Comprehensive Logging**: Extensive logging for debugging and monitoring
6. **Error Handling**: Graceful degradation with user-friendly error messages

## Environment Variables

### Required

- `BEDROCK_AGENT_ID` - Bedrock Agent ID (default: `ASPMAO88W7`)
- `BEDROCK_AGENT_ALIAS_ID` - Agent Alias ID (default: `FXGJQUGJRJQ`)
- `API_GATEWAY_BASE_URL` - Base URL for backend APIs (default: `https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com`)

### Optional

- `BEDROCK_REGION` - AWS region for Bedrock (default: `us-east-1`)

## Request Format

```json
POST /search

{
  "query": "best hospital for cardiac surgery with Star Health Insurance",
  "customerId": "customer_123",
  "userContext": {
    "insuranceId": "ins_001",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  }
}
```

### Fields

- `query` (required): User's search query as natural language text
- `customerId` (optional): Customer ID - used as sessionId for agent conversation memory
- `userContext` (optional): Additional context
  - `insuranceId`: User's insurance policy ID for coverage calculations
  - `location`: User's location for distance calculations

## Response Format

See `app/src/api/SEARCH_RESPONSE_FORMAT.md` for complete response structure.

```json
{
  "success": true,
  "cached": false,
  "responseTime": "2847ms",
  "userIntent": {
    "category": "general_search",
    "keywords": ["cardiac", "surgery", "Star", "Health", "Insurance"]
  },
  "results": {
    "totalMatches": 4,
    "hospitals": [...]
  },
  "metadata": {...}
}
```

## Deployment

### 1. Install Dependencies

```bash
cd aws/lambda/searchFunction
pip install -r requirements.txt -t .
```

### 2. Create Deployment Package

```bash
zip -r searchFunction.zip .
```

### 3. Deploy to AWS Lambda

```bash
aws lambda create-function \
  --function-name searchFunction \
  --runtime python3.11 \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://searchFunction.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{
    BEDROCK_AGENT_ID=ASPMAO88W7,
    BEDROCK_AGENT_ALIAS_ID=FXGJQUGJRJQ,
    API_GATEWAY_BASE_URL=https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com
  }"
```

### 4. Configure API Gateway

Add a new route to your API Gateway:

```
POST /search → searchFunction
```

## IAM Permissions

The Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent"
      ],
      "Resource": "arn:aws:bedrock:us-east-1:*:agent/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## Logging

The function provides extensive logging at multiple levels:

- **INFO**: High-level flow (request start/end, major steps)
- **DEBUG**: Detailed data (API responses, calculations)
- **ERROR**: Failures and exceptions
- **WARNING**: Non-fatal issues

### Log Format

```
[INFO] SEARCH REQUEST START | RequestId=abc123
[INFO] Request parsed | Query='cardiac surgery' | CustomerId=cust_001
[INFO] STEP 1: Invoking Bedrock Agent
[INFO] Bedrock Agent response received | Chunks=5 | Duration=2.34s
[INFO] STEP 2: Extracting IDs from LLM response
[INFO] IDs extracted | Hospitals=4 | LLM-recommended Doctors=12
[INFO] STEP 3: Fetching data from API Gateway (parallel)
[DEBUG] API Request | Type=Hospital | URL=https://...
[INFO] Data fetching complete | Hospitals=4 | Doctors=12
[INFO] STEP 4: Building enriched response
[INFO] SEARCH REQUEST COMPLETE | Duration=3.45s | Hospitals=4
```

## Performance

- **Average Response Time**: 2-4 seconds
- **Parallel Processing**: Up to 20 concurrent API calls
- **Timeout**: 30 seconds (configurable)
- **Memory**: 512 MB (configurable)

## Error Handling

### User-Facing Errors

- `400 Bad Request`: Missing or invalid query
- `404 Not Found`: No hospitals match criteria
- `503 Service Unavailable`: Bedrock Agent failure
- `500 Internal Error`: Unexpected errors

### Error Response Format

```json
{
  "success": false,
  "error": "No hospitals found matching your criteria",
  "details": {
    "code": "NO_RESULTS",
    "suggestion": "Try different keywords"
  }
}
```

## Testing

### Local Testing

```python
import json
from lambda_function import lambda_handler

event = {
    "httpMethod": "POST",
    "path": "/search",
    "body": json.dumps({
        "query": "affordable hospital for lung disease",
        "customerId": "test_customer"
    })
}

response = lambda_handler(event, None)
print(json.dumps(response, indent=2))
```

### API Testing

```bash
curl -X POST https://YOUR_API_GATEWAY_URL/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "best hospital for cardiac surgery",
    "customerId": "customer_123",
    "userContext": {
      "insuranceId": "ins_001"
    }
  }'
```

## Monitoring

### CloudWatch Metrics

- Invocations
- Duration
- Errors
- Throttles

### Custom Metrics (via Logs)

- Bedrock Agent response time
- API Gateway call count
- Review processing time
- Total hospitals returned

## Troubleshooting

### Issue: "Bedrock Agent timeout"

**Solution**: Increase Lambda timeout or check Bedrock Agent configuration

### Issue: "No hospitals found"

**Possible Causes**:
- LLM returned empty results
- Query too specific
- Agent not properly configured

**Solution**: Check CloudWatch logs for LLM response

### Issue: "API Gateway errors"

**Solution**: Verify API_GATEWAY_BASE_URL and endpoint availability

## Future Enhancements

- [ ] Caching layer (Redis/ElastiCache)
- [ ] Distance calculation from user location
- [ ] Fetch all hospital doctors (not just LLM-recommended)
- [ ] Enhanced cost estimates with procedure-specific data
- [ ] Real-time availability checking
- [ ] A/B testing for different AI models

## Support

For issues or questions, check CloudWatch Logs for detailed error messages.
