# Frontend Usage Guide - AI Search Integration

## Quick Start

### 1. Call the API

```typescript
import type { SearchResponse } from '../api/searchResponseTypes';

async function searchHospitals(query: string) {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      userContext: {
        insuranceId: currentUser?.policyId, // Optional
        location: userLocation, // Optional
      }
    }),
  });
  
  const data: SearchResponse = await response.json();
  return data;
}
```

### 2. Render the Results

```typescript
import { SearchResults } from './components/SearchResultsExample';

function HomePage() {
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const data = await searchHospitals(query);
      setSearchData(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      
      {isLoading && <LoadingState />}
      
      {searchData && (
        <SearchResults 
          data={searchData}
          onHospitalClick={(id) => navigate(`/hospital/${id}`)}
          onDoctorClick={(id) => navigate(`/doctor/${id}`)}
        />
      )}
    </div>
  );
}
```

## Key Features to Highlight in Demo

### 1. AI Explanation
Every hospital has an AI-generated explanation:
```typescript
{hospital.aiInsights && (
  <div className="ai-explanation">
    <p>{hospital.aiInsights.explanation}</p>
  </div>
)}
```

**Demo Script:**
> "Notice how our AI explains exactly WHY this hospital is recommended? It understands you mentioned Star Health Insurance, so it's showing claim approval rates. It knows you said 'cardiac surgery,' so it's highlighting cardiac expertise."

### 2. Top Doctors Auto-Appear
Doctors are included in the same response:
```typescript
{hospital.topDoctors.map(doctor => (
  <DoctorCard 
    key={doctor.doctorId}
    doctor={doctor}
  />
))}
```

**Demo Script:**
> "And here - hover over any hospital - the top 3 doctors automatically appear with AI-generated summaries. No additional API calls needed!"

### 3. Cost Prediction
Show estimated costs:
```typescript
{hospital.insuranceInfo.userInsuranceMatch && (
  <CostPredictor 
    estimatedCoverage={hospital.insuranceInfo.userInsuranceMatch.estimatedCoverage}
    estimatedOutOfPocket={hospital.insuranceInfo.userInsuranceMatch.estimatedOutOfPocket}
  />
)}
```

**Demo Script:**
> "See this? Our platform tells you EXACTLY what you'll pay after insurance. Total bill: ₹5 lakhs. Insurance covers: ₹4.5 lakhs. You pay: ₹50K. No surprises!"

### 4. Trust Score
Display verification badges:
```typescript
<VerificationBadge level={hospital.trustIndicators.verificationBadge} />
<div>Trust Score: {hospital.trustIndicators.trustScore}/100</div>
```

**Demo Script:**
> "This hospital has a 'Gold' verification badge and 87/100 trust score. That's calculated from claim approval rates, document verification, and review authenticity."

## Loading States

Show progressive loading:

```typescript
const [loadingStage, setLoadingStage] = useState('');

const stages = [
  { text: '🔍 Analyzing your requirements...', delay: 0 },
  { text: '🏥 Searching 29 hospitals...', delay: 1000 },
  { text: '👨‍⚕️ Finding top doctors...', delay: 2000 },
  { text: '🤖 Generating AI recommendations...', delay: 3000 },
];

useEffect(() => {
  if (isLoading) {
    stages.forEach(({ text, delay }) => {
      setTimeout(() => setLoadingStage(text), delay);
    });
  }
}, [isLoading]);

{isLoading && (
  <div className="text-center py-12">
    <Spinner />
    <p className="mt-4 text-lg font-medium">{loadingStage}</p>
  </div>
)}
```

**Why:** Turns 3-second wait into a feature, not a bug!

## Caching Strategy

Implement simple caching:

```typescript
const searchCache = new Map<string, SearchResponse>();

async function searchWithCache(query: string) {
  const cacheKey = query.toLowerCase().trim();
  
  // Check cache first
  if (searchCache.has(cacheKey)) {
    console.log('⚡ Cache hit!');
    return searchCache.get(cacheKey)!;
  }
  
  // Call API
  const data = await searchHospitals(query);
  
  // Store in cache
  searchCache.set(cacheKey, data);
  
  return data;
}
```

**Demo Impact:** Second search for "cardiac" is instant!

## Error Handling

```typescript
try {
  const data = await searchHospitals(query);
  
  // Check if it's a fallback response
  if (data.fallback) {
    showWarning('AI unavailable, showing basic keyword search');
  }
  
  setSearchData(data);
} catch (error) {
  if (error instanceof ApiError) {
    showError(error.message);
  } else {
    showError('Search failed. Please try again.');
  }
}
```

## Accessing Nested Data

### Get hospital details:
```typescript
const hospital = searchData.results.hospitals[0];

console.log(hospital.hospitalName);           // "City General Hospital"
console.log(hospital.aiInsights.matchScore);  // 95
console.log(hospital.stats.averageRating);    // 4.5
console.log(hospital.location.distance);      // 3.2 km
```

### Get doctor details:
```typescript
const doctor = hospital.topDoctors[0];

console.log(doctor.doctorName);                    // "Dr. Sarah Johnson"
console.log(doctor.aiReview.summary);              // AI-generated summary
console.log(doctor.stats.averageRating);           // 4.8
console.log(doctor.stats.successRate);             // 0.98 (98%)
console.log(doctor.availability.nextAvailableSlot); // "2024-03-10T09:00:00Z"
```

### Get cost estimates:
```typescript
const costs = hospital.costEstimates.cardiacBypassSurgery;

console.log(costs.averageCost);              // 500000 (₹5L)
console.log(costs.estimatedInsuranceCoverage); // 450000 (₹4.5L)
console.log(costs.estimatedOutOfPocket);     // 50000 (₹50K)
```

### Get insurance match:
```typescript
const match = hospital.insuranceInfo.userInsuranceMatch;

if (match?.isAccepted) {
  console.log('✅ Hospital accepts your insurance');
  console.log(`Claim approval rate: ${match.claimApprovalRate * 100}%`);
  console.log(`You'll pay: ₹${match.estimatedOutOfPocket}`);
}
```

## TypeScript Usage

Import types for autocomplete:

```typescript
import type { 
  SearchResponse, 
  EnrichedHospital, 
  EnrichedDoctor,
  AIInsights,
  DoctorAIReview 
} from '../api/searchResponseTypes';

// Type-safe access
function displayHospital(hospital: EnrichedHospital) {
  // TypeScript knows all available fields
  const name = hospital.hospitalName; // ✅ Autocomplete works!
  const ai = hospital.aiInsights?.explanation; // ✅ Null-safe
}

// Type guards
import { isSearchSuccess } from '../api/searchResponseTypes';

const response = await fetch('/api/search', ...);
const data = await response.json();

if (isSearchSuccess(data)) {
  // TypeScript knows data is SearchResponse
  data.results.hospitals.forEach(...);
} else {
  // TypeScript knows data is SearchErrorResponse
  console.error(data.error);
}
```

## Performance Tips

### 1. Lazy Load Doctor Details
Only fetch full doctor data when clicked:

```typescript
const [selectedDoctor, setSelectedDoctor] = useState<EnrichedDoctor | null>(null);

async function handleDoctorClick(doctorId: string) {
  // Full doctor data is already in the response!
  const doctor = searchData.results.hospitals
    .flatMap(h => h.topDoctors)
    .find(d => d.doctorId === doctorId);
  
  setSelectedDoctor(doctor);
}
```

### 2. Virtualize Long Lists
If showing many hospitals:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Only render visible hospital cards
const virtualizer = useVirtualizer({
  count: hospitals.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 400, // Estimated card height
});
```

### 3. Memoize Expensive Renders

```typescript
const HospitalCard = memo(({ hospital }: { hospital: EnrichedHospital }) => {
  // Only re-renders if hospital changes
  return <div>...</div>;
});
```

## Demo Checklist

Before your demo:

- [ ] Pre-warm cache with demo queries:
  ```typescript
  await searchWithCache("cardiac surgery");
  await searchWithCache("orthopedic treatment");
  ```

- [ ] Test all features work:
  - Search returns results
  - AI explanations show
  - Doctor cards appear on hover
  - Cost predictor displays
  - Trust scores visible

- [ ] Prepare backup:
  - Have fallback data if API fails
  - Test with internet disconnected

- [ ] Practice script:
  1. "Let me search for cardiac surgery"
  2. *Show AI explanation*
  3. "Notice the cost prediction"
  4. *Hover to show doctors*
  5. "All in one API call!"

## Common Issues

### Issue: AI explanation is null
```typescript
// Always check before rendering
{hospital.aiInsights && (
  <div>{hospital.aiInsights.explanation}</div>
)}

// Or provide fallback
<div>
  {hospital.aiInsights?.explanation || 
   'Hospital matches your search criteria'}
</div>
```

### Issue: Doctors array is empty
```typescript
// Check length first
{hospital.topDoctors.length > 0 ? (
  hospital.topDoctors.map(doctor => <DoctorCard ... />)
) : (
  <p>No doctor recommendations available</p>
)}
```

### Issue: Cost estimates missing
```typescript
// Access with optional chaining
const cardiacCost = hospital.costEstimates?.cardiacBypassSurgery;

if (cardiacCost) {
  // Display cost
}
```

## Complete Example

```typescript
import { useState } from 'react';
import { SearchResults } from './components/SearchResultsExample';
import type { SearchResponse } from '../api/searchResponseTypes';

export function HospitalSearchPage() {
  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          userContext: {
            insuranceId: 'ins_001', // From logged-in user
          }
        }),
      });

      const data: SearchResponse = await response.json();
      setSearchData(data);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for hospitals, treatments, or doctors..."
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">
            🤖 AI is analyzing your request...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Results */}
      {searchData && !isLoading && (
        <SearchResults 
          data={searchData}
          onHospitalClick={(id) => window.location.href = `/hospital/${id}`}
          onDoctorClick={(id) => window.location.href = `/doctor/${id}`}
        />
      )}

      {/* No Results */}
      {searchData && searchData.results.totalMatches === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No hospitals found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
```

---

## Summary

✅ **Single API call** returns everything:
- Hospitals with AI explanations
- Top doctors with AI reviews
- Cost predictions
- Trust scores
- Statistics

✅ **Frontend just renders** - no complex logic needed

✅ **Perfect for hackathons** - impressive, works well, easy to demo

✅ **Type-safe** - TypeScript autocomplete for all fields

Now implement it and win! 🏆
