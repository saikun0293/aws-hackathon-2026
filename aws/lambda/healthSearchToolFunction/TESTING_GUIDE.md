# Hospital Search Function - Testing Guide

## Overview

This guide shows you exactly what test data to pass for each of the 7 search functions in the hospitalSearchFunction Lambda.

---

## Function 0: get_all_insurance_companies

### Test Event
```json
{
  "operation": "get_all_insurance_companies",
  "parameters": {}
}
```

### What It Does
Returns a complete list of all insurance companies with their IDs and names. Use this FIRST when testing insurance-related queries.

### Expected Result
Returns all insurance companies including:
- `insuranceCompanyId`: Unique ID (format: `insurancecomp_[random_id]`)
- `insuranceCompanyName`: Display name

### Example Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "insuranceCompanyId": "insurancecomp_9kjwhl3k19",
        "insuranceCompanyName": "Star Health Insurance"
      },
      {
        "insuranceCompanyId": "insurancecomp_abc123",
        "insuranceCompanyName": "ICICI Lombard"
      }
    ],
    "count": 10
  }
}
```

### Usage Pattern
**Always call this function FIRST before testing `get_hospitals_by_insurance`**:
1. Call `get_all_insurance_companies` to get the list
2. Copy the `insuranceCompanyId` for your desired insurance
3. Use that ID in `get_hospitals_by_insurance`

---

## Function 1: get_hospitals_by_affordability

### Test Event
```json
{
  "operation": "get_hospitals_by_affordability",
  "parameters": {
    "min_affordability": 0.6,
    "max_affordability": 1.0
  }
}
```

### What It Does
Finds hospitals with affordability scores between 0.6 and 1.0 (60% to 100% affordable)

### Expected Result
Returns hospitals sorted by affordability, including:
- Hospital name and ID
- Affordability score (0.6-1.0)
- Average, min, max costs
- Rating
- Location

### Test Variations

**Very Affordable Hospitals (0.7-1.0)**
```json
{
  "operation": "get_hospitals_by_affordability",
  "parameters": {
    "min_affordability": 0.7,
    "max_affordability": 1.0
  }
}
```

**Moderate Affordability (0.5-0.7)**
```json
{
  "operation": "get_hospitals_by_affordability",
  "parameters": {
    "min_affordability": 0.5,
    "max_affordability": 0.7
  }
}
```

---

## Function 2: get_hospitals_by_insurance

### IMPORTANT: Two-Step Process
This function requires the exact `insuranceCompanyId` from the database. You MUST:
1. First call `get_all_insurance_companies` to get the list
2. Find the insurance company you want
3. Copy its `insuranceCompanyId`
4. Use that ID in this function

### Test Event (Step 1: Get Insurance IDs)
```json
{
  "operation": "get_all_insurance_companies",
  "parameters": {}
}
```

### Test Event (Step 2: Get Hospitals)
```json
{
  "operation": "get_hospitals_by_insurance",
  "parameters": {
    "insurance_company_id": "insurancecomp_9kjwhl3k19"
  }
}
```
**Note**: Replace `insurancecomp_9kjwhl3k19` with the actual ID from Step 1

### What It Does
Finds all hospitals that accept the specified insurance company

### Expected Result
Returns hospitals that accept the specified insurance, including:
- Hospital details
- Claim statistics

### Test Variations

**ICICI Lombard**
```json
{
  "operation": "get_hospitals_by_insurance",
  "parameters": {
    "insurance_company_id": "insurance_company_icici_lombard"
  }
}
```

**HDFC ERGO**
```json
{
  "operation": "get_hospitals_by_insurance",
  "parameters": {
    "insurance_company_id": "insurance_company_hdfc_ergo"
  }
}
```

**Max Bupa**
```json
{
  "operation": "get_hospitals_by_insurance",
  "parameters": {
    "insurance_company_id": "insurance_company_max_bupa"
  }
}
```

### Available Insurance Company IDs
- `insurance_company_star_health`
- `insurance_company_icici_lombard`
- `insurance_company_hdfc_ergo`
- `insurance_company_max_bupa`
- `insurance_company_care_health`
- `insurance_company_bajaj_allianz`
- `insurance_company_religare`
- `insurance_company_aditya_birla`
- `insurance_company_niva_bupa`
- `insurance_company_manipal_cigna`

---

## Function 3: get_hospitals_with_high_insurance_coverage

### Test Event
```json
{
  "operation": "get_hospitals_with_high_insurance_coverage",
  "parameters": {
    "min_approval_rate": 0.85
  }
}
```

### What It Does
Finds hospitals with insurance claim approval rate >= 85%

### Expected Result
Returns hospitals sorted by approval rate (highest first), including:
- Hospital details
- Total claims processed
- Total claims approved
- Calculated approval rate

### Test Variations

**Excellent Coverage (90%+)**
```json
{
  "operation": "get_hospitals_with_high_insurance_coverage",
  "parameters": {
    "min_approval_rate": 0.9
  }
}
```

**Good Coverage (80%+)** - Default
```json
{
  "operation": "get_hospitals_with_high_insurance_coverage",
  "parameters": {
    "min_approval_rate": 0.8
  }
}
```

**Any Coverage (No Filter)**
```json
{
  "operation": "get_hospitals_with_high_insurance_coverage",
  "parameters": {}
}
```

---

## Function 4: get_hospitals_with_top_doctors_in_department

### Test Event
```json
{
  "operation": "get_hospitals_with_top_doctors_in_department",
  "parameters": {
    "department_name": "Department of Cardiology",
    "min_rating": 4.5
  }
}
```

### What It Does
Finds hospitals with cardiologists rated 4.5+ stars

### Expected Result
Returns hospitals sorted by number of top doctors, including:
- Hospital details
- Count of top-rated doctors in that department
- Overall hospital rating

### Test Variations

**Top Orthopedic Surgeons**
```json
{
  "operation": "get_hospitals_with_top_doctors_in_department",
  "parameters": {
    "department_name": "Department of Orthopedics",
    "min_rating": 4.5
  }
}
```

**Good Neurologists (4.0+)**
```json
{
  "operation": "get_hospitals_with_top_doctors_in_department",
  "parameters": {
    "department_name": "Department of Neurology",
    "min_rating": 4.0
  }
}
```

**Oncology Specialists**
```json
{
  "operation": "get_hospitals_with_top_doctors_in_department",
  "parameters": {
    "department_name": "Department of Oncology",
    "min_rating": 4.0
  }
}
```

### Available Department Names
**Must include "Department of" prefix!**

- `Department of Cardiology`
- `Department of Neurology`
- `Department of Orthopedics`
- `Department of Gastroenterology`
- `Department of Nephrology`
- `Department of Oncology`
- `Department of Pulmonology`
- `Department of General Surgery`
- `Department of Emergency Care`
- `Department of ICU`
- `Department of Urology`
- `Department of Neurosurgery`
- `Department of Pediatrics`
- `Department of Obstetrics and Gynecology`
- `Department of Dermatology`
- `Department of Ophthalmology`
- `Department of ENT (Ear, Nose, Throat)`
- `Department of Psychiatry`
- `Department of Endocrinology`
- `Department of Rheumatology`

---

## Function 5: get_hospitals_by_surgery_cost

### Test Event - Between Range
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "min_cost": 20000,
    "max_cost": 100000
  }
}
```

### What It Does
Finds hospitals where average surgery cost is between ₹20,000 and ₹1,00,000

### Expected Result
Returns hospitals sorted by average cost (lowest first), including:
- Hospital details
- Average cost
- Min and max costs
- Affordability score

### Test Variations

**Less Than ₹50,000**
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "max_cost": 50000
  }
}
```

**Greater Than ₹1,00,000**
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "min_cost": 100000
  }
}
```

**Budget Range ₹30k-₹80k**
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "min_cost": 30000,
    "max_cost": 80000
  }
}
```

**Premium Hospitals (₹2L+)**
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "min_cost": 200000
  }
}
```

---

## Function 6: get_doctors_by_specialization

### Test Event
```json
{
  "operation": "get_doctors_by_specialization",
  "parameters": {
    "specialization": "Department of Cardiology"
  }
}
```

### What It Does
Finds all cardiologists across all hospitals

### Expected Result
Returns doctors sorted by rating (highest first), including:
- Doctor name and ID
- Rating (0-5)
- Years of experience
- Qualifications (MBBS, MD, DM, etc.)
- Hospital name and ID
- Department name
- Detailed biography

### Test Variations

**Orthopedic Surgeons**
```json
{
  "operation": "get_doctors_by_specialization",
  "parameters": {
    "specialization": "Department of Orthopedics"
  }
}
```

**Neurologists**
```json
{
  "operation": "get_doctors_by_specialization",
  "parameters": {
    "specialization": "Department of Neurology"
  }
}
```

**Cancer Specialists**
```json
{
  "operation": "get_doctors_by_specialization",
  "parameters": {
    "specialization": "Department of Oncology"
  }
}
```

**Pediatricians**
```json
{
  "operation": "get_doctors_by_specialization",
  "parameters": {
    "specialization": "Department of Pediatrics"
  }
}
```

---

## How to Test in AWS Lambda Console

### Step 1: Open Lambda Function
1. Go to AWS Lambda Console
2. Find and click on `hospitalSearchFunction`

### Step 2: Create Test Event
1. Click the "Test" tab
2. Click "Create new event"
3. Give it a name (e.g., "TestAffordability")
4. Paste one of the JSON test events above
5. Click "Save"

### Step 3: Run Test
1. Click the "Test" button
2. Wait for execution to complete
3. View results in the "Execution results" section

### Step 4: Check Response
Look for:
- `statusCode: 200` (success)
- `success: true`
- `data: [...]` (array of results)
- `count: X` (number of results)

---

## Expected Response Format

### Success Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "hospitalId": "hospital_apollo_jubilee_hills",
        "hospitalName": "Apollo Hospitals, Jubilee Hills",
        "rating": 4.5,
        "affordability": 0.75,
        "avgCost": 45000.50,
        "location": "17.4326,78.4071",
        "address": "Road No. 72, Film Nagar, Jubilee Hills, Hyderabad - 500033"
      }
    ],
    "count": 1
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "body": {
    "success": false,
    "error": "insurance_company_id is required"
  }
}
```

---

## Quick Test Checklist

Use these to quickly test all functions:

### ✅ Test 1: Affordability
```json
{"operation": "get_hospitals_by_affordability", "parameters": {"min_affordability": 0.6, "max_affordability": 1.0}}
```

### ✅ Test 2: Insurance
```json
{"operation": "get_hospitals_by_insurance", "parameters": {"insurance_company_id": "insurance_company_star_health"}}
```

### ✅ Test 3: High Coverage
```json
{"operation": "get_hospitals_with_high_insurance_coverage", "parameters": {"min_approval_rate": 0.85}}
```

### ✅ Test 4: Top Doctors
```json
{"operation": "get_hospitals_with_top_doctors_in_department", "parameters": {"department_name": "Department of Cardiology", "min_rating": 4.5}}
```

### ✅ Test 5: Cost Range
```json
{"operation": "get_hospitals_by_surgery_cost", "parameters": {"min_cost": 20000, "max_cost": 100000}}
```

### ✅ Test 6: Doctors by Specialty
```json
{"operation": "get_doctors_by_specialization", "parameters": {"specialization": "Department of Cardiology"}}
```

---

## Troubleshooting

### Issue: "Unknown operation"
**Cause**: Typo in operation name  
**Solution**: Copy exact operation name from examples above

### Issue: "Missing required parameter"
**Cause**: Required parameter not provided  
**Solution**: Check which parameters are required for that operation

### Issue: "Department not found"
**Cause**: Department name doesn't match exactly  
**Solution**: Use exact department name with "Department of" prefix

### Issue: "No results returned"
**Cause**: Filters too restrictive  
**Solution**: Relax filters (lower min_rating, wider cost range, etc.)

### Issue: "DynamoDB error"
**Cause**: Tables not accessible  
**Solution**: Check Lambda has DynamoDB read permissions

---

## Performance Notes

- **Function 1-3**: Fast (< 1 second) - simple scans
- **Function 4**: Moderate (1-3 seconds) - joins multiple tables
- **Function 5**: Fast (< 1 second) - simple scan with filter
- **Function 6**: Moderate (1-3 seconds) - joins departments and doctors

---

## Database Statistics

- **Hospitals**: 29 total
- **Departments**: 218 total (across all hospitals)
- **Doctors**: 976 total
- **Insurance Companies**: 10 total

This means:
- Affordability queries typically return 10-20 hospitals
- Insurance queries return 15-25 hospitals
- Top doctor queries return 5-15 hospitals
- Doctor specialty queries return 20-50 doctors

---

## Next Steps

1. ✅ Test each function individually
2. ✅ Verify results make sense
3. ✅ Check CloudWatch logs for any errors
4. ✅ Test with different parameter values
5. ✅ Integrate with Intent Agent for production use
