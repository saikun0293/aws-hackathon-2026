Step Function Workflows
Review Process Step Function
Purpose: Orchestrate the complete review submission workflow
Responsibilities:
Coordinate document validation, data extraction, review storage, and indexing
Handle errors and retries at each step
Maintain workflow state
State Machine:
Start → Document Validation → Medical Data Extraction → Review Service → Embedding & Indexing → End
Interface:
Input: Review submission data (documents, text, metadata)
Output: Review ID, processing status
Document Validation Service (Step Function State)
Purpose: Verify document authenticity
Responsibilities:
Validate document format (PDF, JPEG, PNG)
Detect image manipulation using Rekognition
Verify authenticity using HyperVerge
Store verified documents in S3
Save document metadata and S3 URLs to DynamoDB
Interface:
Input: Document file, document type
Output: S3 URL, validation status, metadata
Error Handling: Reject documents that fail validation, return specific error codes
Medical Data Extraction Service (Step Function State)
Purpose: Extract medical information from verified documents
Responsibilities:
Extract text using Textract
Identify medical entities using Comprehend Medical (hospital name, doctor name, surgery type, dates)
Present extracted data to user for review/correction
Store validated extracted data in DynamoDB
Interface:
Input: S3 document URLs
Output: Extracted medical entities (hospitalName, doctorName, surgeryType, dates, etc.)
Extracted Data Structure:
{
  "hospitalName": "string",
  "doctorName": "string",
  "surgeryType": "string",
  "procedureDate": "ISO date",
  "diagnosis": "string",
  "medications": ["string"],
  "confidence": "float"
}
Review Service (Step Function State)
Purpose: Store the review with all associated data
Responsibilities:
Validate foreign key relationships (hospitalId, doctorId, policyId exist)
Generate unique reviewId
Store review with markdown text, document links, extracted data
Mark review as verified
Link review to hospital and doctor via GSIs
Interface:
Input: Review text, hospitalId, doctorId, customerId, policyId (optional), purposeOfVisit, documentLinks[], extractedData
Output: reviewId, storage confirmation
Embedding & Indexing Service (Step Function State)
Purpose: Generate embeddings and index review for search
Responsibilities:
Generate vector embeddings using Bedrock
Index embeddings in OpenSearch
Index associated metadata (hospital, doctor, surgery type)
Mark review as fully processed
Interface:
Input: reviewId, review text, metadata
Output: Indexing confirmation
