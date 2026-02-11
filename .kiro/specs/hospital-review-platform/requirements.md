# Requirements Document: Hospital Review Platform

## Introduction

The Hospital Review Platform is a web application designed to improve healthcare transparency for individuals constrained by income. The platform empowers patients to make informed healthcare decisions by providing comprehensive, verified information about hospitals, doctors, surgery costs, insurance coverage, and claim outcomes.

The app's primary goal is to help users find the best hospitals based on their specific needs, budget, and insurance coverage. By aggregating patient-submitted reviews backed by authentic documents (payment receipts, insurance claims, discharge summaries), the platform provides transparent facts about:

- **Doctor qualifications and patient experiences**: Verified reviews of doctors and their specialties
- **Surgery costs and pricing**: Actual costs paid by patients for specific procedures
- **Insurance coverage details**: How much insurance companies actually paid for claims
- **Treatment timelines**: Expected duration for procedures and recovery
- **Hospital quality and services**: Patient experiences with hospital facilities and care

This transparency enables income-constrained individuals to compare healthcare options, understand true out-of-pocket costs, select hospitals that accept their insurance, and make financially informed decisions about their healthcare.

## Glossary

- **System**: The Hospital Review Platform application
- **Patient**: A user who submits reviews and uploads documents
- **Document**: A payment receipt or insurance claim document uploaded by a patient
- **Review**: A patient's written experience with a hospital, doctor, or insurance claim process
- **Authentication_Service**: AWS Cognito service for user authentication and authorization
- **API_Gateway**: Amazon API Gateway that routes requests to appropriate services
- **Review_Process_Orchestrator**: AWS Step Function that orchestrates the review submission workflow
- **Document_Validation_Service**: Step Function service that validates document authenticity using Amazon Rekognition and HyperVerge
- **Medical_Data_Extraction_Service**: Step Function service that extracts data using Amazon Textract and Amazon Comprehend Medical
- **Review_Service**: Step Function service that processes and stores review data
- **Embedding_Indexing_Service**: Step Function service that generates embeddings using AWS Bedrock and indexes in Amazon OpenSearch
- **Hospital_Service**: Lambda function for hospital CRUD operations
- **Doctor_Service**: Lambda function for doctor CRUD operations
- **Review_API_Service**: Lambda function for review query operations
- **Insurance_Service**: Lambda function for insurance policy CRUD operations
- **Customer_Service**: Lambda function for customer CRUD operations
- **Search_Service**: Lambda function that orchestrates search using Bedrock and OpenSearch
- **Storage_Service**: Amazon S3 bucket for storing verified documents
- **Database**: Amazon DynamoDB for storing structured data
- **Search_Index**: Amazon OpenSearch for vector search and indexing
- **Verified_Document**: A document that has passed both authenticity verification and content validation

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a patient, I want to securely access the platform, so that my personal health and financial information is protected.

#### Acceptance Criteria

1. WHEN a user accesses the platform, THE Authentication_Service SHALL authenticate the user credentials
2. WHEN authentication succeeds, THE Authentication_Service SHALL issue a secure token for API access
3. THE API_Gateway SHALL validate authentication tokens before routing requests to backend services
4. THE System SHALL enforce that patients can only access and modify their own reviews and documents
5. WHERE administrative functions are required, THE System SHALL enforce role-based access controls

### Requirement 2: Document Upload and Validation

**User Story:** As a patient, I want to upload payment receipts and claim documents securely, so that my review is backed by verifiable evidence.

#### Acceptance Criteria

1. WHEN a patient uploads a document through the API_Gateway, THE System SHALL accept PDF, JPEG, and PNG formats
2. WHEN a document upload is initiated, THE Review_Process_Orchestrator SHALL invoke the Document_Validation_Service
3. WHEN the Document_Validation_Service processes a document, THE System SHALL use Amazon Rekognition to detect image manipulation
4. WHEN the Document_Validation_Service processes a document, THE System SHALL use HyperVerge to verify document authenticity
5. IF a document fails authenticity verification, THEN THE Document_Validation_Service SHALL reject the document and return a specific error message
6. WHEN a document passes authenticity verification, THE Document_Validation_Service SHALL store it in the Storage_Service with a unique key
7. WHEN a document is stored in the Storage_Service, THE System SHALL generate a unique S3 URL for the document
8. WHEN a document is stored, THE Document_Validation_Service SHALL save the S3 URL as a link in the review collection in the Database
9. THE review collection in the Database SHALL store document links that point to S3 bucket locations, not the documents themselves

### Requirement 3: Medical Data Extraction from Documents

**User Story:** As a patient, I want the system to extract medical information from my documents, so that I don't have to manually enter hospital names, doctor names, and procedure details.

#### Acceptance Criteria

1. WHEN a document becomes a Verified_Document, THE Review_Process_Orchestrator SHALL invoke the Medical_Data_Extraction_Service
2. WHEN the Medical_Data_Extraction_Service processes a document, THE System SHALL use Amazon Textract to extract text from the document
3. WHEN text is extracted, THE System SHALL use Amazon Comprehend Medical to identify medical entities including hospital name, doctor name, surgery type, operation details, and dates
4. WHEN medical entities are extracted, THE Medical_Data_Extraction_Service SHALL present the extracted information to the patient for review
5. THE System SHALL allow the patient to review and modify the extracted information before finalizing the review
6. WHEN the patient confirms the extracted information, THE Medical_Data_Extraction_Service SHALL store the verified medical data in the Database
7. THE extracted medical data SHALL be used to pre-fill review form fields including hospitalId, doctorId, and purposeOfVisit

### Requirement 4: Review Submission and Verification

**User Story:** As a patient, I want to write a detailed review of my healthcare experience with verified proof, so that I can help other patients make informed decisions with trustworthy information.

#### Acceptance Criteria

1. WHEN a patient writes a review, THE System SHALL accept markdown-formatted text
2. THE System SHALL require the patient to upload supporting documents (payment receipts, insurance emails, discharge summaries) to verify the review
3. THE System SHALL require the patient to specify hospitalId, doctorId, and purposeOfVisit based on extracted or manually entered data
4. WHERE a patient used insurance, THE System SHALL require the patient to specify policyId
5. WHEN a review is submitted with verified documents, THE Review_Service SHALL mark the review as a verified review
6. WHEN the review is stored, THE Review_Service SHALL store it in the Database with a unique reviewId
7. THE Review_Service SHALL link all document S3 URLs to the review via reviewId
8. WHEN the review is stored, THE Review_Process_Orchestrator SHALL invoke the Embedding_Indexing_Service

### Requirement 5: Review Submission and Medical Analysis

**User Story:** As a patient, I want to write a detailed review of my healthcare experience, so that I can help other patients make informed decisions.

#### Acceptance Criteria

1. WHEN a patient writes a review, THE System SHALL accept markdown-formatted text
2. THE System SHALL require the patient to specify hospitalId, doctorId, and purposeOfVisit
3. WHERE a patient used insurance, THE System SHALL require the patient to specify policyId
4. WHEN a review is submitted, THE Medical_Data_Extraction_Service SHALL use Amazon Comprehend Medical to extract medical entities and sentiment
5. WHEN medical analysis completes, THE Review_Service SHALL store the review in the Database with a unique reviewId
6. THE Review_Service SHALL link all payment records and claim records to the review via reviewId
7. WHEN the review is stored, THE Review_Process_Orchestrator SHALL invoke the Embedding_Indexing_Service

### Requirement 5: Review Indexing for Search

**User Story:** As a system, I want to index reviews for efficient search, so that users can quickly find relevant healthcare experiences.

#### Acceptance Criteria

1. WHEN the Embedding_Indexing_Service is invoked, THE System SHALL use AWS Bedrock to generate vector embeddings for the review text
2. WHEN embeddings are generated, THE Embedding_Indexing_Service SHALL store the vector embeddings in the Search_Index
3. THE Search_Index SHALL use Amazon OpenSearch as a vector database to store and query embeddings
4. THE Embedding_Indexing_Service SHALL index hospital information, doctor information, and medical data associated with the review
5. WHEN indexing completes, THE Review_Process_Orchestrator SHALL mark the review as fully processed
6. THE System SHALL update the Search_Index within 5 seconds of review submission

### Requirement 6: Hospital and Doctor Information Management

**User Story:** As a system administrator, I want to maintain accurate hospital and doctor information, so that patients can find and review the correct healthcare providers.

#### Acceptance Criteria

1. WHEN hospital information is requested, THE Hospital_Service SHALL retrieve or update hospital records from the Database
2. THE Hospital_Service SHALL manage hospital records with hospitalId, hospitalName, services, location, address, departments, and tiedInsuranceCompanies
3. WHEN doctor information is requested, THE Doctor_Service SHALL retrieve or update doctor records from the Database
4. THE Doctor_Service SHALL manage doctor records with doctorId, doctorName, about, and certification records
5. WHEN doctor certification documents are uploaded, THE Customer_Service SHALL store them in the Storage_Service and link them to the doctor record
6. THE Hospital_Service SHALL associate doctors with hospital departments through department arrays
7. THE Hospital_Service SHALL maintain relationships between hospitals and accepted insurance companies

### Requirement 7: Insurance Policy Information Management

**User Story:** As a patient, I want to see which insurance policies are accepted at hospitals, so that I can choose appropriate healthcare providers.

#### Acceptance Criteria

1. WHEN insurance policy information is requested, THE Insurance_Service SHALL retrieve or update policy records from the Database
2. THE Insurance_Service SHALL manage insurance policy records with policyId, companyId, companyName, and about
3. THE Insurance_Service SHALL maintain relationships between insurance policies and hospitals that accept them
4. WHEN a review includes insurance claim information, THE Review_Service SHALL link the review to the corresponding insurance policy

### Requirement 8: Search and Discovery

**User Story:** As a prospective patient, I want to search for hospitals and doctors based on my needs, so that I can find appropriate healthcare providers.

#### Acceptance Criteria

1. WHEN a user submits a search query, THE Search_Service SHALL use AWS Bedrock to enhance and optimize the query
2. WHEN the query is optimized, THE Search_Service SHALL perform vector search in the Search_Index using Amazon OpenSearch
3. THE Search_Index SHALL return matching review IDs and relevance scores based on vector similarity
4. WHEN search results are retrieved, THE Search_Service SHALL use AWS Bedrock to analyze results and generate a markdown summary
5. THE Search_Service SHALL extract unique hospital IDs from the matching reviews
6. THE Search_Service SHALL query the Hospital_Service to retrieve hospital details for the matching hospital IDs
7. THE System SHALL return search results with hospital summaries and the markdown analysis from Bedrock
8. WHEN a user selects a specific hospital from search results, THE System SHALL retrieve detailed information including reviews, doctors, and accepted insurance policies
9. THE System SHALL query the Review_API_Service to retrieve all reviews for the selected hospital
10. THE System SHALL query the Doctor_Service to retrieve all doctors associated with the selected hospital
11. THE System SHALL query the Insurance_Service to retrieve all insurance policies accepted by the selected hospital

### Requirement 9: Review Display and Aggregation

**User Story:** As a prospective patient, I want to read detailed reviews and see aggregated statistics, so that I can make informed healthcare decisions.

#### Acceptance Criteria

1. WHEN a user views a hospital or doctor profile, THE Review_API_Service SHALL retrieve all associated reviews from the Database
2. THE Review_API_Service SHALL calculate and return aggregated statistics including average ratings and review counts
3. WHEN displaying reviews, THE System SHALL render markdown-formatted text correctly
4. THE Review_API_Service SHALL include document links (S3 URLs) for supporting documents in review responses
5. THE System SHALL display whether a review is verified based on document validation status

### Requirement 10: Data Validation and Integrity

**User Story:** As a system administrator, I want to ensure data integrity, so that the platform maintains trustworthy information.

#### Acceptance Criteria

1. THE System SHALL enforce that all foreign key relationships (hospitalId, doctorId, policyId, customerId) reference existing records in the Database
2. THE Review_Process_Orchestrator SHALL prevent review completion until all referenced documents pass validation
3. THE System SHALL generate unique identifiers for all entities (reviewId, hospitalId, doctorId, policyId, customerId)
4. WHEN a review references a document, THE System SHALL validate that the S3 URL is accessible and points to a valid document
5. THE System SHALL maintain referential integrity between reviews and their associated entities

### Requirement 11: Security and Privacy

**User Story:** As a patient, I want my sensitive medical and financial information protected, so that my privacy is maintained.

#### Acceptance Criteria

1. WHEN documents are stored in the Storage_Service, THE System SHALL encrypt them at rest using AWS S3 encryption
2. WHEN documents are transmitted, THE System SHALL use HTTPS encryption through CloudFront
3. THE Authentication_Service SHALL implement access controls ensuring patients can only view and edit their own reviews
4. THE API_Gateway SHALL validate authentication tokens and enforce authorization policies before routing requests
5. THE System SHALL implement presigned URLs for document access with expiration times
6. WHEN personal information is stored in the Database, THE System SHALL comply with healthcare data protection regulations

### Requirement 12: Frontend Delivery

**User Story:** As a user, I want fast and reliable access to the platform, so that I can submit and view reviews efficiently.

#### Acceptance Criteria

1. THE System SHALL serve the frontend application through Amazon CloudFront for global content delivery
2. THE System SHALL host static assets in Amazon S3
3. THE System SHALL use AWS Amplify for application framework and authentication integration
4. WHEN a user accesses the platform, THE System SHALL deliver the frontend within 3 seconds under normal network conditions
5. THE System SHALL cache static assets at CloudFront edge locations

### Requirement 13: API Gateway and Service Routing

**User Story:** As a developer, I want well-defined APIs, so that the frontend can interact with backend services reliably.

#### Acceptance Criteria

1. THE API_Gateway SHALL expose RESTful endpoints for /hospitals, /doctors, /reviews, /insurance, /customers, /search, and /process paths
2. WHEN a request is received at /hospitals, THE API_Gateway SHALL route it to the Hospital_Service
3. WHEN a request is received at /doctors, THE API_Gateway SHALL route it to the Doctor_Service
4. WHEN a request is received at /reviews, THE API_Gateway SHALL route it to the Review_API_Service
5. WHEN a request is received at /insurance, THE API_Gateway SHALL route it to the Insurance_Service
6. WHEN a request is received at /customers, THE API_Gateway SHALL route it to the Customer_Service
7. WHEN a request is received at /search, THE API_Gateway SHALL route it to the Search_Service
8. WHEN a request is received at /process, THE API_Gateway SHALL invoke the Review_Process_Orchestrator
9. WHEN an API operation fails, THE System SHALL return appropriate HTTP status codes and error messages
10. THE API_Gateway SHALL implement rate limiting to prevent abuse

### Requirement 14: Monitoring and Observability

**User Story:** As a system administrator, I want to monitor system health and user activity, so that I can identify and resolve issues quickly.

#### Acceptance Criteria

1. THE System SHALL log all API requests and responses to Amazon CloudWatch
2. THE System SHALL log all AWS service interactions to AWS CloudTrail
3. WHEN system errors occur in Lambda functions or Step Functions, THE System SHALL create CloudWatch alarms
4. THE System SHALL track metrics for document validation success rates, data extraction accuracy, API latency, and user activity
5. THE System SHALL provide CloudWatch dashboards for monitoring system health and usage patterns
6. THE Review_Process_Orchestrator SHALL log each step execution status for debugging and monitoring
