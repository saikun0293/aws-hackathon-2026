# Hospital and Doctor Search Lambda Functions - Detailed Documentation

## Overview
This Lambda function provides comprehensive search and filtering capabilities for hospitals and doctors based on various criteria including affordability, insurance coverage, doctor ratings, surgery costs, and specializations. The function is designed to be used as tool calls for LLMs to query DynamoDB tables.

---

## Function 0: get_all_insurance_companies

### Description
Returns a complete list of all insurance companies available in the system with their IDs and names. This function is essential for the two-step insurance workflow where the LLM first retrieves all insurance companies, identifies the one mentioned by the user, and then uses its ID for hospital searches.

### Use Case
- **Primary use**: Get insurance company IDs for use with `get_hospitals_by_insurance`
- Listing all available insurance providers to users
- Helping users identify their insurance company when they mention it by name
- Supporting natural language queries like "I have Star Health insurance"

### Two-Step Insurance Workflow
When a user mentions insurance by name (e.g., "Star Health", "ICICI Lombard"):
1. **Step 1**: Call `get_all_insurance_companies()` to get the complete list
2. **Step 2**: Match the user's insurance name to find the `insuranceCompanyId`
3. **Step 3**: Call `get_hospitals_by_insurance(insurance_company_id)` with the ID

### Parameters
None - this function takes no parameters.

### Return Value
Returns an array of insurance company objects containing:
- `insuranceCompanyId`: Unique identifier (format: `insurancecomp_[random_id]`)
- `insuranceCompanyName`: Display name of the insurance company

### Example Request
```json
{
  "operation": "get_all_insurance_companies",
  "parameters": {}
}
```

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
        "insuranceCompanyId": "insurancecomp_abc123xyz",
        "insuranceCompanyName": "ICICI Lombard"
      }
    ],
    "count": 10
  }
}
```

### LLM Usage Pattern
```
User: "Show me hospitals that accept Star Health insurance"

LLM Action 1: Call get_all_insurance_companies()
LLM receives: List of all insurance companies with IDs

LLM Action 2: Find "Star Health Insurance" in the list
LLM extracts: insuranceCompanyId = "insurancecomp_9kjwhl3k19"

LLM Action 3: Call get_hospitals_by_insurance("insurancecomp_9kjwhl3k19")
LLM receives: List of hospitals accepting Star Health
```

---

## Function 1: get_hospitals_by_affordability

### Description
Returns a list of hospitals filtered by their affordability score. The affordability score is a normalized metric ranging from 0.0 (least affordable) to 1.0 (most affordable), calculated based on historical billing data and cost patterns.

### Use Case
- Finding budget-friendly hospitals for patients with financial constraints
- Comparing hospital costs across different facilities
- Identifying affordable options for uninsured or underinsured patients

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| min_affordability | float | No | 0.0 | Minimum affordability score (0.0 to 1.0). Lower values indicate higher costs. |
| max_affordability | float | No | 1.0 | Maximum affordability score (0.0 to 1.0). Higher values indicate lower costs. |

### Return Value
Returns an array of hospital objects containing:
- `hospitalId`: Unique identifier for the hospital
- `hospitalName`: Name of the hospital
- `affordability`: Affordability score (0.0 to 1.0)
- `avgCost`: Average bill amount from patient reviews
- `minCost`: Minimum bill amount recorded
- `maxCost`: Maximum bill amount recorded
- `location`: Geographic coordinates (Lat/Long)
- `address`: Full physical address
- `rating`: Hospital rating (0-5 scale)
- `services`: Array of services offered
- `departmentIds`: Array of department IDs
- `insuranceCompanyIds`: Array of accepted insurance companies

### Example Request
```json
{
  "operation": "get_hospitals_by_affordability",
  "parameters": {
    "min_affordability": 0.6,
    "max_affordability": 1.0
  }
}
```

### Example Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "hospitalId": "hospital_apollo_hospitals_jubilee_hills_500033",
        "hospitalName": "Apollo Hospitals, Jubilee Hills",
        "affordability": 0.75,
        "avgCost": 45000.50,
        "minCost": 5000.00,
        "maxCost": 250000.00,
        "rating": 4.5,
        "location": "17.4326,78.4071",
        "address": "Road No. 72, Film Nagar, Jubilee Hills, Hyderabad - 500033"
      }
    ],
    "count": 1
  }
}
```

---

## Function 2: get_hospitals_by_insurance

### Description
Returns hospitals that accept and support a specific insurance company ID. This function helps patients find hospitals where their insurance coverage is valid, ensuring smoother claim processing and reduced out-of-pocket expenses.

**IMPORTANT**: This function requires the exact `insuranceCompanyId` from the database. When users mention insurance by name, you MUST first call `get_all_insurance_companies()` to get the correct ID.

### Two-Step Workflow (REQUIRED)
1. **Step 1**: Call `get_all_insurance_companies()` to retrieve all insurance companies
2. **Step 2**: Match the user's insurance name to find the `insuranceCompanyId`
3. **Step 3**: Call this function with the correct `insuranceCompanyId`

### Use Case
- Finding hospitals that accept a patient's insurance plan
- Verifying network hospitals for insurance companies
- Planning medical procedures within insurance network

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| insurance_company_id | string | Yes | N/A | The unique identifier from `get_all_insurance_companies()` (format: `insurancecomp_[random_id]`) |

### Return Value
Returns an array of hospital objects that accept the specified insurance company, including all hospital details such as name, location, departments, ratings, and cost information.

### Example Request
```json
{
  "operation": "get_hospitals_by_insurance",
  "parameters": {
    "insurance_company_id": "insurancecomp_9kjwhl3k19"
  }
}
```

### Complete Workflow Example
```
User Query: "Show me hospitals that accept Star Health insurance"

Step 1 - Get all insurance companies:
{
  "operation": "get_all_insurance_companies",
  "parameters": {}
}

Response:
{
  "data": [
    {"insuranceCompanyId": "insurancecomp_9kjwhl3k19", "insuranceCompanyName": "Star Health Insurance"},
    {"insuranceCompanyId": "insurancecomp_abc123", "insuranceCompanyName": "ICICI Lombard"}
  ]
}

Step 2 - Match "Star Health" → insuranceCompanyId = "insurancecomp_9kjwhl3k19"

Step 3 - Get hospitals:
{
  "operation": "get_hospitals_by_insurance",
  "parameters": {
    "insurance_company_id": "insurancecomp_9kjwhl3k19"
  }
}
```

### Example Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "hospitalId": "hospital_yashoda_hospitals_somajiguda_500082",
        "hospitalName": "Yashoda Hospitals, Somajiguda",
        "insuranceCompanyIds": ["insurance_company_star_health", "insurance_company_icici_lombard"],
        "totalNumberOfClaims": 1250,
        "totalNumberOfClaimsApproved": 1100,
        "rating": 4.3,
        "location": "17.4239,78.4738"
      }
    ],
    "count": 1
  }
}
```

---

## Function 3: get_hospitals_with_high_insurance_coverage

### Description
Returns hospitals with high insurance claim approval rates, indicating reliable insurance processing and patient-friendly billing practices. This function calculates the approval rate as (totalNumberOfClaimsApproved / totalNumberOfClaims) and filters hospitals meeting the minimum threshold.

### Use Case
- Finding hospitals with reliable insurance claim processing
- Identifying patient-friendly hospitals with high approval rates
- Reducing risk of claim rejection
- Planning procedures with confidence in insurance coverage

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| min_approval_rate | float | No | 0.8 | Minimum claim approval rate (0.0 to 1.0). Default is 0.8 (80%). |

### Return Value
Returns an array of hospital objects sorted by approval rate (descending), including:
- All standard hospital fields
- `approvalRate`: Calculated approval rate (0.0 to 1.0)
- `totalNumberOfClaims`: Total insurance claims filed
- `totalNumberOfClaimsApproved`: Total claims approved

### Example Request
```json
{
  "operation": "get_hospitals_with_high_insurance_coverage",
  "parameters": {
    "min_approval_rate": 0.85
  }
}
```

### Example Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "hospitalId": "hospital_apollo_hospitals_jubilee_hills_500033",
        "hospitalName": "Apollo Hospitals, Jubilee Hills",
        "totalNumberOfClaims": 2500,
        "totalNumberOfClaimsApproved": 2250,
        "approvalRate": 0.90,
        "rating": 4.5
      }
    ],
    "count": 1
  }
}
```

---

## Function 4: get_hospitals_with_top_doctors_in_department

### Description
Returns hospitals that have highly-rated doctors (rating >= min_rating) in a specific medical department, including detailed information about each top-rated doctor. This function aggregates doctor ratings by department and hospital, helping patients find facilities with the best specialists and see exactly which doctors are available.

### Use Case
- Finding hospitals with top specialists for specific medical conditions
- Comparing hospital expertise in particular departments
- Selecting hospitals based on doctor quality and reputation
- Planning specialized treatments or surgeries
- Getting detailed information about specific doctors at each hospital

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| department_name | string | Yes | N/A | Full name of the department (must match exactly, including "Department of" prefix) |
| min_rating | float | No | 4.0 | Minimum doctor rating threshold (0.0 to 5.0) |

### Available Departments
Based on the database (218 department records across 29 hospitals), the following unique departments are available:

- Department of Cardiology
- Department of Neurology
- Department of Orthopedics
- Department of Gastroenterology
- Department of Nephrology
- Department of Oncology
- Department of Pulmonology
- Department of General Surgery
- Department of Emergency Care
- Department of ICU
- Department of Urology
- Department of Neurosurgery
- Department of Pediatrics
- Department of Obstetrics and Gynecology
- Department of Dermatology
- Department of Ophthalmology
- Department of ENT (Ear, Nose, Throat)
- Department of Psychiatry
- Department of Endocrinology
- Department of Rheumatology
- Department of Radiology
- Department of Anesthesiology
- Department of Plastic Surgery
- Department of Vascular Surgery
- Department of Thoracic Surgery

**Note**: Department names must be provided exactly as listed above, including the "Department of" prefix.

### Return Value
Returns an array of hospital objects sorted by the count of top-rated doctors (descending), including:
- All standard hospital fields
- `topDoctorsCount`: Number of doctors in the department meeting the rating threshold
- `topDoctors`: Array of doctor objects with details:
  - `doctorId`: Unique doctor identifier
  - `doctorName`: Doctor's full name
  - `rating`: Doctor's rating (0.0 to 5.0)
  - `experience`: Years of experience
  - `qualification`: Medical qualifications (e.g., "MBBS, MD, DM")
  - `specialization`: Department name
  - `bio`: Doctor's biography/description

### Example Request
```json
{
  "operation": "get_hospitals_with_top_doctors_in_department",
  "parameters": {
    "department_name": "Department of Cardiology",
    "min_rating": 4.5
  }
}
```

### Example Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "hospitalId": "hospital_apollo_hospitals_jubilee_hills_500033",
        "hospitalName": "Apollo Hospitals, Jubilee Hills",
        "topDoctorsCount": 3,
        "rating": 4.5,
        "location": "17.4326,78.4071",
        "topDoctors": [
          {
            "doctorId": "doctor_12345",
            "doctorName": "Dr. Rajesh Kumar",
            "rating": 4.8,
            "experience": 15,
            "qualification": "MBBS, MD, DM (Cardiology)",
            "specialization": "Department of Cardiology",
            "bio": "Renowned cardiologist with expertise in interventional cardiology..."
          },
          {
            "doctorId": "doctor_67890",
            "doctorName": "Dr. Priya Sharma",
            "rating": 4.6,
            "experience": 12,
            "qualification": "MBBS, MD, DM (Cardiology)",
            "specialization": "Department of Cardiology",
            "bio": "Specialist in cardiac imaging and non-invasive cardiology..."
          }
        ]
      }
    ],
    "count": 1
  }
}
```

### Benefits of Including Doctor Details
- **LLM Context**: The LLM can now reference specific doctors by name when responding to users
- **Better Recommendations**: Users get complete information about which doctors they can see at each hospital
- **Transparency**: Clear visibility into who the top-rated doctors are
- **Decision Making**: Helps users choose between hospitals based on specific doctor expertise

---

## Function 5: get_hospitals_by_surgery_cost

### Description
Returns hospitals where surgery/treatment costs fall within a specified range. This function intelligently handles cost queries by:
1. **Primary**: Using actual cost data (`avgCost`, `minCost`, `maxCost`) from patient reviews when available
2. **Fallback**: Using `affordability` score as a proxy when cost data is missing

This ensures users always get relevant results even when specific cost data isn't available for all hospitals.

### Use Case
- Finding affordable hospitals for specific budget constraints
- Comparing surgery costs across different facilities
- Planning medical procedures within financial limits
- Identifying premium vs. budget healthcare options

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| min_cost | float | No | None | Minimum cost threshold in Indian Rupees. If only min_cost is provided, returns hospitals with costs >= min_cost |
| max_cost | float | No | None | Maximum cost threshold in Indian Rupees. If only max_cost is provided, returns hospitals with costs <= max_cost |

**Query Modes**:
1. **Less than**: Provide only `max_cost` to get hospitals with costs <= max_cost
2. **Greater than**: Provide only `min_cost` to get hospitals with costs >= min_cost
3. **Between**: Provide both `min_cost` and `max_cost` to get hospitals with costs in that range

### Affordability Fallback Logic
When hospitals don't have cost data, the function uses affordability scores:
- Budget ≤ ₹50,000 → Returns hospitals with affordability ≥ 0.7 (very affordable)
- Budget ≤ ₹100,000 → Returns hospitals with affordability ≥ 0.6 (affordable)
- Budget ≤ ₹200,000 → Returns hospitals with affordability ≥ 0.5 (moderate)
- Budget > ₹200,000 → Returns hospitals with affordability ≥ 0.4

### Return Value
Returns an array of hospital objects sorted by cost (ascending), including:
- All standard hospital fields
- `avgCost`: Average bill amount from reviews (if available)
- `minCost`: Minimum recorded bill (if available)
- `maxCost`: Maximum recorded bill (if available)
- `affordability`: Affordability score (0.0-1.0)
- `costDataAvailable`: Boolean flag indicating if actual cost data exists
- `estimatedAffordability`: Present when using affordability fallback

**Result Ordering**:
1. Hospitals with actual cost data (sorted by cost, lowest first)
2. Hospitals using affordability fallback (sorted by affordability, highest first)

### Example Request (Between Range)
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "min_cost": 20000,
    "max_cost": 100000
  }
}
```

### Example Request (Less Than - Budget Constraint)
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "max_cost": 50000
  }
}
```

### Example Request (Greater Than - Premium Hospitals)
```json
{
  "operation": "get_hospitals_by_surgery_cost",
  "parameters": {
    "min_cost": 100000
  }
}
```

### Example Response (With Cost Data)
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "hospitalId": "hospital_yashoda_hospitals_somajiguda_500082",
        "hospitalName": "Yashoda Hospitals, Somajiguda",
        "avgCost": 35000.75,
        "minCost": 8000.00,
        "maxCost": 180000.00,
        "affordability": 0.82,
        "rating": 4.3,
        "costDataAvailable": true
      }
    ],
    "count": 1
  }
}
```

### Example Response (Using Affordability Fallback)
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "hospitalId": "hospital_apollo_hospitals_jubilee_hills_500033",
        "hospitalName": "Apollo Hospitals, Jubilee Hills",
        "affordability": 0.75,
        "rating": 4.5,
        "costDataAvailable": false,
        "estimatedAffordability": 0.75
      }
    ],
    "count": 1
  }
}
```

### LLM Response Guidelines
When `costDataAvailable` is `false`, the LLM should inform users:
- "Based on affordability scores, these hospitals are likely within your budget"
- "Exact cost data not available, showing hospitals with high affordability ratings"
- "These hospitals are estimated to be affordable based on their affordability score of X"

---

## Function 6: get_doctors_by_specialization

### Description
Returns a comprehensive list of doctors specialized in a particular medical field or department. This function searches across all hospitals and departments to find doctors matching the specified specialization, enriching the results with hospital and department information.

### Use Case
- Finding specialists for specific medical conditions
- Comparing doctors across different hospitals
- Identifying top-rated specialists in a field
- Building referral networks for specific specializations

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| specialization | string | Yes | N/A | Department name or specialization field (must match department names exactly) |

### Available Specializations
The specialization parameter should match one of the department names listed in Function 4. Common specializations include:

**Surgical Specializations**:
- Department of General Surgery
- Department of Neurosurgery
- Department of Orthopedics
- Department of Plastic Surgery
- Department of Vascular Surgery
- Department of Thoracic Surgery

**Medical Specializations**:
- Department of Cardiology
- Department of Neurology
- Department of Gastroenterology
- Department of Nephrology
- Department of Pulmonology
- Department of Oncology
- Department of Endocrinology
- Department of Rheumatology

**Diagnostic & Support**:
- Department of Radiology
- Department of Anesthesiology
- Department of Emergency Care
- Department of ICU

**Other Specializations**:
- Department of Pediatrics
- Department of Obstetrics and Gynecology
- Department of Dermatology
- Department of Ophthalmology
- Department of ENT (Ear, Nose, Throat)
- Department of Psychiatry
- Department of Urology

### Doctor Qualifications Reference
Doctors in the database typically have the following qualifications:
- **MBBS**: Bachelor of Medicine, Bachelor of Surgery (basic medical degree)
- **MD**: Doctor of Medicine (postgraduate specialization)
- **MS**: Master of Surgery (postgraduate surgical specialization)
- **DM**: Doctorate of Medicine (super-specialization)
- **MCh**: Master of Chirurgiae (super-specialization in surgery)
- **DNB**: Diplomate of National Board
- **Fellowship**: Additional specialized training from premier institutions

### Return Value
Returns an array of doctor objects sorted by rating (descending), including:
- `doctorId`: Unique identifier
- `doctorName`: Full name with title (e.g., "Dr. Rajesh Kumar")
- `about`: Detailed biography including education, experience, and expertise
- `rating`: Doctor rating (0-5 scale)
- `yearsOfExperience`: Years of practice (5-30 years)
- `qualification`: Degrees and certifications
- `departmentId`: Associated department ID
- `departmentName`: Name of the department
- `hospitalId`: Associated hospital ID
- `hospitalName`: Name of the hospital
- `patients`: Array of patient IDs (if available)

### Example Request
```json
{
  "operation": "get_doctors_by_specialization",
  "parameters": {
    "specialization": "Department of Cardiology"
  }
}
```

### Example Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": [
      {
        "doctorId": "department_hospital_apollo_hospitals_jubilee_hills_500033_mtxbj_doctor_nvbxwl",
        "doctorName": "Dr. Rajesh Kumar Sharma",
        "about": "Dr. Rajesh Kumar Sharma is a distinguished cardiologist with 24 years of experience...",
        "rating": 4.8,
        "yearsOfExperience": 24,
        "qualification": "MBBS, MD (Internal Medicine), DM (Cardiology)",
        "departmentName": "Department of Cardiology",
        "hospitalName": "Apollo Hospitals, Jubilee Hills",
        "hospitalId": "hospital_apollo_hospitals_jubilee_hills_500033"
      }
    ],
    "count": 1
  }
}
```

---

## General Usage Information

### Lambda Invocation Format

All functions use a consistent invocation format:

```json
{
  "operation": "<function_name>",
  "parameters": {
    "<param1>": "<value1>",
    "<param2>": "<value2>"
  }
}
```

### Error Handling

The Lambda function returns standardized error responses:

**400 Bad Request** - Invalid parameters or missing required fields:
```json
{
  "statusCode": 400,
  "body": {
    "success": false,
    "error": "insurance_company_id is required"
  }
}
```

**500 Internal Server Error** - Database or processing errors:
```json
{
  "statusCode": 500,
  "body": {
    "success": false,
    "error": "Error fetching hospitals by affordability: <error details>"
  }
}
```

### DynamoDB Table Configuration

The Lambda function requires access to the following DynamoDB tables:
- **Hospital**: Contains 29 hospital records
- **Department**: Contains 218 department records
- **Doctor**: Contains 976 doctor records
- **InsuranceCompany**: Contains 10 insurance company records

Ensure the Lambda execution role has appropriate IAM permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:region:account-id:table/Hospital",
        "arn:aws:dynamodb:region:account-id:table/Department",
        "arn:aws:dynamodb:region:account-id:table/Doctor",
        "arn:aws:dynamodb:region:account-id:table/InsuranceCompany"
      ]
    }
  ]
}
```

### Performance Considerations

1. **Scan Operations**: Most functions use DynamoDB Scan operations which can be expensive for large datasets. Consider implementing pagination for production use.

2. **Caching**: Implement caching mechanisms (e.g., ElastiCache) for frequently accessed data like department lists and insurance companies.

3. **Indexes**: Create Global Secondary Indexes (GSI) on frequently queried fields:
   - Hospital: affordability, rating
   - Doctor: rating, departmentId
   - Department: departmentName

4. **Batch Operations**: For functions that query multiple items (e.g., getting multiple doctors), consider using BatchGetItem for better performance.

### Best Practices for LLM Tool Calls

1. **Validate Input**: Always validate user input before passing to the Lambda function
2. **Handle Pagination**: Implement pagination for large result sets
3. **Cache Results**: Cache frequently requested data to reduce Lambda invocations
4. **Error Recovery**: Implement retry logic with exponential backoff for transient errors
5. **User Feedback**: Provide clear feedback to users about search criteria and results

---

## Database Statistics

- **Total Hospitals**: 29
- **Total Departments**: 218
- **Total Doctors**: 976
- **Total Insurance Companies**: 10
- **Total Insurance Policies**: 185
- **Total Customers**: 11,110
- **Total Reviews**: 10,110

---

## Support and Maintenance

For issues or questions regarding these Lambda functions:
1. Check CloudWatch Logs for detailed error messages
2. Verify DynamoDB table names match the configuration
3. Ensure IAM permissions are correctly configured
4. Validate input parameters match the expected format
5. Test with sample data before production deployment
