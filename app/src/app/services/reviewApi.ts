// Mock API for review submission workflow

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface DocumentValidationResult {
  success: boolean;
  verified: boolean;
  s3Url?: string;
  message: string;
  confidence?: number;
}

export interface ExtractedMedicalData {
  hospitalName: string;
  doctorName: string;
  surgeryType: string;
  procedureDate: string;
  diagnosis: string;
  medications: string[];
  confidence: number;
}

// Mock document validation (simulates AWS Rekognition + HyperVerge)
export async function validateDocument(file: File): Promise<DocumentValidationResult> {
  console.log(`[Document Validation API] Validating: ${file.name}`);
  
  // Simulate processing time
  await delay(2000 + Math.random() * 1000);

  // Simulate 95% success rate
  const verified = Math.random() > 0.05;
  
  if (verified) {
    console.log(`[Document Validation API] ✓ Document verified: ${file.name}`);
    return {
      success: true,
      verified: true,
      s3Url: `https://s3.amazonaws.com/mock-bucket/${Date.now()}-${file.name}`,
      message: "Document verified successfully",
      confidence: 0.92 + Math.random() * 0.08,
    };
  } else {
    console.log(`[Document Validation API] ✗ Document failed verification: ${file.name}`);
    return {
      success: false,
      verified: false,
      message: "Possible tampering detected or document quality too low",
      confidence: 0.3 + Math.random() * 0.3,
    };
  }
}

// Mock medical data extraction (simulates AWS Textract + Comprehend Medical)
export async function extractMedicalData(files: File[]): Promise<ExtractedMedicalData> {
  console.log(`[Medical Extraction API] Extracting data from ${files.length} documents`);
  
  // Simulate processing time
  await delay(3000 + Math.random() * 2000);

  // Mock extracted data - in real app this would come from AWS Textract/Comprehend
  const mockData: ExtractedMedicalData = {
    hospitalName: "City General Hospital",
    doctorName: "Dr. Sarah Johnson",
    surgeryType: "Cardiac Bypass Surgery",
    procedureDate: "2024-02-15",
    diagnosis: "Coronary Artery Disease",
    medications: ["Aspirin", "Metoprolol", "Atorvastatin"],
    confidence: 0.89 + Math.random() * 0.1,
  };

  console.log(`[Medical Extraction API] ✓ Data extracted:`, mockData);
  return mockData;
}

// Mock insurance claim validation
export async function validateInsuranceClaim(claimFile: File): Promise<DocumentValidationResult> {
  console.log(`[Insurance Validation API] Validating claim: ${claimFile.name}`);
  
  // Simulate processing time
  await delay(2500 + Math.random() * 1000);

  // Simulate 90% success rate
  const verified = Math.random() > 0.1;
  
  if (verified) {
    console.log(`[Insurance Validation API] ✓ Claim verified: ${claimFile.name}`);
    return {
      success: true,
      verified: true,
      s3Url: `https://s3.amazonaws.com/mock-bucket/claims/${Date.now()}-${claimFile.name}`,
      message: "Insurance claim document verified",
      confidence: 0.88 + Math.random() * 0.12,
    };
  } else {
    console.log(`[Insurance Validation API] ✗ Claim failed verification: ${claimFile.name}`);
    return {
      success: false,
      verified: false,
      message: "Unable to verify insurance claim document",
      confidence: 0.2 + Math.random() * 0.4,
    };
  }
}

// Mock final review submission
export async function submitReview(reviewData: any): Promise<{ success: boolean; reviewId: string }> {
  console.log(`[Review Submission API] Submitting review`, reviewData);
  
  // Simulate processing time
  await delay(2000);

  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[Review Submission API] ✓ Review submitted with ID: ${reviewId}`);
  
  return {
    success: true,
    reviewId,
  };
}
