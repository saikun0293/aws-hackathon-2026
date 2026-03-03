# PowerShell Deployment Script for searchFunction Lambda
# Usage: .\deploy.ps1 [-FunctionName searchFunction] [-Region us-east-1]

param(
    [string]$FunctionName = "searchFunction",
    [string]$Region = "us-east-1",
    [string]$RoleArn = "arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deploying Search Function Lambda" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Function Name: $FunctionName"
Write-Host "Region: $Region"
Write-Host ""

# Step 1: Install dependencies
Write-Host "[1/4] Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt -t . --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment package
Write-Host "[2/4] Creating deployment package..." -ForegroundColor Yellow
if (Test-Path searchFunction.zip) {
    Remove-Item searchFunction.zip
}

$exclude = @("*.git*", "*.sh", "*.ps1", "*.md", "test-event.json", "__pycache__", "*.pyc")
$files = Get-ChildItem -Recurse | Where-Object { 
    $item = $_
    -not ($exclude | Where-Object { $item.Name -like $_ })
}

Compress-Archive -Path $files -DestinationPath searchFunction.zip -Force
Write-Host "Deployment package created: searchFunction.zip" -ForegroundColor Green

# Step 3: Check if function exists
Write-Host "[3/4] Checking if function exists..." -ForegroundColor Yellow
$functionExists = $false
try {
    aws lambda get-function --function-name $FunctionName --region $Region 2>$null
    $functionExists = $LASTEXITCODE -eq 0
} catch {
    $functionExists = $false
}

if ($functionExists) {
    Write-Host "Function exists. Updating code..." -ForegroundColor Green
    
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file fileb://searchFunction.zip `
        --region $Region
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to update function code" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Updating configuration..." -ForegroundColor Green
    
    $envVars = @{
        BEDROCK_AGENT_ID = "ASPMAO88W7"
        BEDROCK_AGENT_ALIAS_ID = "FXGJQUGJRJQ"
        BEDROCK_REGION = "us-east-1"
        API_GATEWAY_BASE_URL = "https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com"
    }
    
    $envJson = $envVars | ConvertTo-Json -Compress
    
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --timeout 30 `
        --memory-size 512 `
        --environment "Variables=$envJson" `
        --region $Region
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to update function configuration" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Function does not exist. Creating new function..." -ForegroundColor Green
    Write-Host "NOTE: Update RoleArn parameter before running!" -ForegroundColor Yellow
    
    $envVars = @{
        BEDROCK_AGENT_ID = "ASPMAO88W7"
        BEDROCK_AGENT_ALIAS_ID = "FXGJQUGJRJQ"
        BEDROCK_REGION = "us-east-1"
        API_GATEWAY_BASE_URL = "https://ri8zkgmzlb.execute-api.us-east-1.amazonaws.com"
    }
    
    $envJson = $envVars | ConvertTo-Json -Compress
    
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.11 `
        --role $RoleArn `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://searchFunction.zip `
        --timeout 30 `
        --memory-size 512 `
        --environment "Variables=$envJson" `
        --region $Region
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create function" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Cleanup
Write-Host "[4/4] Cleaning up..." -ForegroundColor Yellow
Remove-Item searchFunction.zip

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

$functionArn = aws lambda get-function --function-name $FunctionName --region $Region --query 'Configuration.FunctionArn' --output text
Write-Host "Function ARN: $functionArn" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add POST /search route in API Gateway"
Write-Host "2. Test with: aws lambda invoke --function-name $FunctionName --payload file://test-event.json response.json"
Write-Host "=========================================" -ForegroundColor Cyan
