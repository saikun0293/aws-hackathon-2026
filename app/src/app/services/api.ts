import { Hospital, mockHospitals } from "../data/mockData";

// Simulates API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulated API call to search hospitals
export async function searchHospitalsAPI(query: string): Promise<Hospital[]> {
  // Simulate network delay (500-1500ms)
  await delay(Math.random() * 1000 + 500);

  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  // Simulate API filtering
  const results = mockHospitals.filter((hospital) => {
    return (
      hospital.name.toLowerCase().includes(lowerQuery) ||
      hospital.description.toLowerCase().includes(lowerQuery) ||
      hospital.specialties.some((s) => s.toLowerCase().includes(lowerQuery)) ||
      hospital.location.toLowerCase().includes(lowerQuery) ||
      hospital.aiRecommendation.toLowerCase().includes(lowerQuery) ||
      hospital.doctors.some(
        (doctor) =>
          doctor.name.toLowerCase().includes(lowerQuery) ||
          doctor.specialty.toLowerCase().includes(lowerQuery)
      )
    );
  });

  // Log to console to simulate API call
  console.log(`[API] Searching for: "${query}"`);
  console.log(`[API] Found ${results.length} hospitals`);

  return results;
}

// Simulated API call to get hospital by ID
export async function getHospitalByIdAPI(id: string): Promise<Hospital | null> {
  await delay(Math.random() * 500 + 300);

  const hospital = mockHospitals.find((h) => h.id === id);

  console.log(`[API] Fetching hospital with ID: ${id}`);
  console.log(`[API] Hospital found:`, hospital?.name || "Not found");

  return hospital || null;
}

// Simulated API call to get all hospitals
export async function getAllHospitalsAPI(): Promise<Hospital[]> {
  await delay(Math.random() * 800 + 400);

  console.log(`[API] Fetching all hospitals`);
  console.log(`[API] Total hospitals: ${mockHospitals.length}`);

  return mockHospitals;
}
