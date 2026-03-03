#!/bin/bash

# Deployment script for searchFunction Lambda
# Usage: ./deploy.sh [function-name] [aws-region]

set -e

FUNCTION_NAME=${1:-searchFunction}
AWS_REGION=${2:-us-east-1}
ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role"

echo "========================================="
echo "Deploying Search Function Lambda"
echo "========================================="
echo "Function Name: $FUNCTION_NAME"
echo "Region: $AWS_REGION"
echo ""

# Step 1: Install dependencies
echo "[1/4] Installing dependencies..."
pip install -r requirements.txt -t . --quiet

# Step 2: Create deployment package
echo "[2/4] Creating deployment package..."
zip -r searchFunction.zip . -x "*.git*" "*.sh" "*.md" "test-event.json" "__pycache__/*" "*.pyc" > /dev/null

# Step 3: Check if function exists
echo "[3/4] Checking if function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo "Function exists. Updating code..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://searchFunction.zip \
        --region $AWS_REGION
    
    echo "Updating configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables="{
            BEDROCK_AGENT_ID=ASPMAO88W7,
            BEDROCK_AGENT_ALIAS_ID=FXGJQUGJRJQ,
            BEDROCK_REGION=us-east-1,
            API_GATEWAY_BASE_URL=https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com
        }" \
        --region $AWS_REGION
else
    echo "Function does not exist. Creating new function..."
    echo "NOTE: Update ROLE_ARN in this script before running!"
    
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.11 \
        --role $ROLE_ARN \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://searchFunction.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables="{
            BEDROCK_AGENT_ID=ASPMAO88W7,
            BEDROCK_AGENT_ALIAS_ID=FXGJQUGJRJQ,
            BEDROCK_REGION=us-east-1,
            API_GATEWAY_BASE_URL=https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com
        }" \
        --region $AWS_REGION
fi

# Step 4: Cleanup
echo "[4/4] Cleaning up..."
rm searchFunction.zip

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Function ARN:"
aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION --query 'Configuration.FunctionArn' --output text
echo ""
echo "Next steps:"
echo "1. Add POST /search route in API Gateway"
echo "2. Test with: aws lambda invoke --function-name $FUNCTION_NAME --payload file://test-event.json response.json"
echo "========================================="
