# Quick Start Guide - Search Function

## 🚀 Deploy in 5 Minutes

### Prerequisites
- AWS CLI configured
- Python 3.11+
- IAM role for Lambda execution

### Step 1: Deploy Lambda

**Windows (PowerShell)**:
```powershell
cd aws\lambda\searchFunction
.\deploy.ps1 -RoleArn "arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-role"
```

**Linux/Mac (Bash)**:
```bash
cd aws/lambda/searchFunction
chmod +x deploy.sh
./deploy.sh
```

### Step 2: Add API Gateway Route

1. Go to API Gateway console
2. Select your API: `https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com`
3. Create route: `POST /search`
4. Integration: Lambda function `searchFunction`
5. Deploy

### Step 3: Test

```bash
curl -X POST https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "affordable hospital for lung disease",
    "customerId": "customer_001"
  }'
```

## 📝 Request Examples

### Basic Search
```json
{
  "query": "best hospital for cardiac surgery",
  "customerId": "customer_123"
}
```

### With Insurance
```json
{
  "query": "affordable hospital with Star Health Insurance",
  "customerId": "customer_123",
  "userContext": {
    "insuranceId": "ins_001"
  }
}
```

### With Location
```json
{
  "query": "nearby hospital for orthopedic treatment",
  "customerId": "customer_123",
  "userContext": {
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  }
}
```

## 🔍 Check Logs

```bash
aws logs tail /aws/lambda/searchFunction --follow
```

## 🐛 Troubleshooting

### Error: "Bedrock Agent timeout"
- Increase Lambda timeout: `aws lambda update-function-configuration --function-name searchFunction --timeout 45`

### Error: "No hospitals found"
- Check Bedrock Agent is configured correctly
- Verify Agent ID and Alias ID in environment variables

### Error: "API Gateway 502"
- Check Lambda execution role has Bedrock permissions
- Verify API Gateway integration is correct

## 📊 Monitor Performance

```bash
# View recent invocations
aws lambda get-function --function-name searchFunction

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=searchFunction \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## ✅ Verify Deployment

1. **Lambda exists**:
   ```bash
   aws lambda get-function --function-name searchFunction
   ```

2. **Environment variables set**:
   ```bash
   aws lambda get-function-configuration --function-name searchFunction --query 'Environment'
   ```

3. **Test invocation**:
   ```bash
   aws lambda invoke \
     --function-name searchFunction \
     --payload file://test-event.json \
     response.json
   
   cat response.json
   ```

## 🎯 Success Checklist

- [ ] Lambda deployed successfully
- [ ] Environment variables configured
- [ ] API Gateway route added
- [ ] Test request returns results
- [ ] CloudWatch logs show detailed execution
- [ ] Response matches expected format

## 📚 Next Steps

1. Review `README.md` for detailed documentation
2. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
3. Monitor CloudWatch logs for performance
4. Iterate based on real-world usage

## 🆘 Need Help?

- Check CloudWatch Logs: `/aws/lambda/searchFunction`
- Review error messages in response
- Verify all environment variables are set
- Ensure IAM role has required permissions
