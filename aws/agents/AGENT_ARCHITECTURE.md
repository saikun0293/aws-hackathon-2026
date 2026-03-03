# Agent Architecture V2 - Clear Separation of Responsibilities

## Overview

This document describes the updated agent architecture with clear separation between deterministic (DB Tool) and semantic (OpenSearch) operations.

## Core Principle: The Golden Rule

```
If it is:
- Numeric
- Exact
- Deterministic
- Filter-based
👉 DB Tool Agent

If it is:
- Meaning-based
- Fuzzy
- Interpretive
- Ranking-based
👉 OpenSearch Agent
```

---

## 🟦 DB Tool Agent

### What It SHOULD DO

**1. Deterministic Filtering**
- Affordability range (0.0–1.0)
- Rating thresholds (3.5+, 4.0+)
- Cost ranges (INR)
- Insurance filtering (by name)
- Department exact match
- Specialization exact match
- Claim approval rate filtering

**2. ID Resolution**
- Insurance name → insuranceId (Lambda handles this)
- Department normalization ("cardiology" → "Department of Cardiology")

**3. Return Tool Response Directly**

- Return exactly what the Lambda function returns
- No modifications, no additions, no commentary
- Lambda functions are already optimized to return minimal data
- Just pass through the response

Lambda functions return minimal structured data (no descriptions, no bios).

**4. Limit Results**
- Max 3–5 hospitals
- Sorting logic done in Lambda
- Never return 10–20 results

**5. Be Stateless**
- No memory
- No reasoning history
- No conversation accumulation
- Each call is independent

### What It SHOULD NOT DO

**❌ No Semantic Judgement**
- No "best"
- No "most advanced"
- No fuzzy matching logic

**❌ No Long Text Processing**
- No hospital descriptions
- No doctor bios
- No reading large blobs

**❌ No Ranking Based on Meaning**
- Only numeric sorting
- No interpretation

**❌ No Multi-step LLM Reasoning**
- If logic is deterministic → it's in Lambda
- Agent just calls the function

---

## 🟩 OpenSearch Agent

### What It SHOULD DO

**1. Semantic Search**
- "best cardiology hospital"
- "advanced heart surgery"
- "good patient reviews"
- "modern ICU facilities"
- "high success rate"

**2. Fuzzy Matching**
- "heart doctor" → cardiology
- "kidney problem hospital" → nephrology
- "bone specialist" → orthopedics

**3. Re-ranking**
Given hospitalIds from DB Tool, rank by semantic relevance.

**4. Return Minimal Output**
```json
{
  "hospitalId": "",
  "semanticScore": 0.89,
  "summarySnippet": "Known for advanced cardiac interventions"
}
```
Short snippet only (2–3 sentences max).

**5. Operate on Reduced Dataset**
Ideally:
- DB Tool filters first
- OpenSearch reranks only filtered IDs
- Not entire 50k dataset every time

### What It SHOULD NOT DO

**❌ No Structured Filtering**
- No insurance filtering
- No affordability filtering
- No cost filtering
- That's DB Tool's job

**❌ No Large Raw Document Returns**
Never return:
- Full hospital descriptions
- Entire doctor biographies
- Only snippets

**❌ No Numeric Threshold Logic**
No:
- rating > 4.0
- cost < 2 lakh
- That's DB Tool's job

---

## 🧠 Orchestrator Agent

### What It SHOULD DO

**1. Break Query into Parts**
- Structured filters? → DB Tool
- Semantic search? → OpenSearch

**2. Decide Which Agents to Call**
- DB Tool filters first (reduces dataset)
- OpenSearch reranks filtered results
- Can alternate as needed (max 6-7 total calls)

**3. Merge Results by hospitalId**
- Combine DB Tool data (IDs, ratings, costs)
- With OpenSearch data (reviews, experiences)

**4. Produce Final JSON**
```json
[{
  "hospitalId": "hospital_xyz",
  "hospitalAIReview": "From OpenSearch",
  "doctors": [{
    "doctorId": "doctor_abc",
    "doctorAIReview": "From OpenSearch"
  }],
  "aiSummary": "Synthesis of both sources"
}]
```

### What It SHOULD NOT DO

**❌ Don't Read Large Hospital Descriptions**
- That's OpenSearch's job

**❌ Don't Execute Filtering Logic**
- That's DB Tool's job

**❌ Don't Make Semantic Judgements**
- That's OpenSearch's job

**✅ You coordinate, merge, and format**

---

## Workflow Examples

### Example 1: Affordable Hospitals with Good Cardiac Care

**Query:** "Affordable hospitals with good cardiac care"

**Breakdown:**
- "Affordable" → Numeric filter → DB Tool
- "Good cardiac care" → Semantic search → OpenSearch

**Execution:**
1. DB Tool: get_hospitals_by_affordability(0.6, 1.0) → 10 hospitals
2. DB Tool: get_hospitals_top_doctors_in_dept("Department of Cardiology", 3.5) → 8 hospitals
3. Orchestrator merges: 5 hospitals match both criteria
4. OpenSearch: "cardiac care patient reviews for [5 hospitals]" → experiences
5. Orchestrator: Create JSON with 5 hospitals (IDs from DB + reviews from OpenSearch)

**Result:**
- DB Tool provided: hospitalId, rating, affordability, avgCost
- OpenSearch provided: hospitalAIReview, doctorAIReview
- Orchestrator combined: Complete JSON with all required fields

### Example 2: Best Hospital for Heart Surgery

**Query:** "Best hospital for heart surgery"

**Breakdown:**
- "Best" → Semantic judgement → OpenSearch
- "Heart surgery" → Department filter → DB Tool

**Execution:**
1. OpenSearch: "best heart surgery hospital" → general insights
2. DB Tool: get_hospitals_top_doctors_in_dept("Department of Cardiology", 4.0) → 5 hospitals with IDs
3. OpenSearch: "patient reviews for [5 specific hospitals]" → targeted reviews
4. Orchestrator: Create JSON with 5 hospitals

**Result:**
- OpenSearch provided semantic ranking and reviews
- DB Tool provided IDs and structured data
- Orchestrator merged into final JSON

### Example 3: Star Health Insurance Under 2 Lakh

**Query:** "Star Health insurance hospitals under 2 lakh"

**Breakdown:**
- "Star Health insurance" → Exact filter → DB Tool
- "Under 2 lakh" → Numeric filter → DB Tool

**Execution:**
1. DB Tool: get_hospitals_by_insurance("Star Health") → 15 hospitals
2. DB Tool: get_hospitals_by_surgery_cost(max_cost=200000) → 12 hospitals
3. Orchestrator merges: 8 hospitals match both criteria
4. OpenSearch: "patient reviews for [8 hospitals]" → experiences
5. Orchestrator: Create JSON with 5 hospitals (limit to top 5)

**Result:**
- DB Tool provided all filtering (insurance + cost)
- OpenSearch provided patient experiences
- Orchestrator merged and limited to 5 results

---

## Performance Benefits

### Token Usage
- **Before:** LLM processes large hospital descriptions, doctor bios
- **After:** Only minimal structured data + short snippets
- **Savings:** 70-80% reduction in tokens

### Response Time
- **DB Tool:** <5s (deterministic queries)
- **OpenSearch:** <5-8s (semantic search on reduced dataset)
- **Total:** <10s for most queries

### Scalability
- Can scale to 100k+ hospitals
- DB Tool filters reduce dataset before semantic search
- OpenSearch only processes relevant subset

### Cost
- Predictable cost per query
- No expensive LLM reasoning for deterministic operations
- Semantic search only on filtered results

---

## Decision Tree

```
User Query
    |
    v
Orchestrator analyzes query
    |
    +-- Contains numeric filters? (affordability, cost, rating)
    |       |
    |       v
    |   DB Tool Agent
    |       |
    |       v
    |   Returns: hospitalId, ratings, costs (3-5 results)
    |
    +-- Contains semantic terms? (best, good, advanced)
    |       |
    |       v
    |   OpenSearch Agent
    |       |
    |       v
    |   Returns: reviews, experiences (snippets)
    |
    v
Orchestrator merges by hospitalId
    |
    v
Orchestrator creates JSON
    |
    v
Return to user
```

---

## Key Takeaways

1. **Clear Separation:** Numeric/exact → DB Tool, Meaning/fuzzy → OpenSearch
2. **Minimal Data:** No large text blobs, only structured data + short snippets
3. **Stateless Agents:** Each call is independent, no memory
4. **Filter First:** DB Tool reduces dataset, OpenSearch reranks
5. **Orchestrator Coordinates:** Breaks query, calls agents, merges results
6. **Performance:** <10s response time, 70-80% token reduction
7. **Scalability:** Can handle 100k+ hospitals efficiently

---

## Migration Notes

### Changes from V1

**DB Tool Agent:**
- ✅ Added: Clear "SHOULD DO" and "SHOULD NOT DO" sections
- ✅ Added: Golden Rule (numeric/exact/deterministic)
- ✅ Removed: Semantic judgement language
- ✅ Clarified: Return minimal structured data only

**OpenSearch Agent:**
- ✅ Added: Clear "SHOULD DO" and "SHOULD NOT DO" sections
- ✅ Added: Golden Rule (meaning/fuzzy/interpretive)
- ✅ Removed: Numeric filtering language
- ✅ Clarified: Return short snippets only (2-3 sentences)

**Orchestrator Agent:**
- ✅ Added: Clear role definition (coordinate, merge, format)
- ✅ Added: Golden Rule for agent selection
- ✅ Updated: Workflow examples showing filter-first approach
- ✅ Clarified: What orchestrator should NOT do

### Testing Checklist

After deploying updated prompts, verify:

- [ ] DB Tool returns only structured data (no descriptions)
- [ ] DB Tool returns max 3-5 results
- [ ] OpenSearch returns only short snippets (2-3 sentences)
- [ ] OpenSearch doesn't do numeric filtering
- [ ] Orchestrator calls DB Tool for filters
- [ ] Orchestrator calls OpenSearch for semantic search
- [ ] Orchestrator merges results correctly
- [ ] Final JSON has correct structure (4 fields per hospital, 2 per doctor)
- [ ] Response time <10s for most queries
- [ ] Token usage reduced by 70-80%

---

## Summary

The V2 architecture creates clear boundaries between deterministic and semantic operations, resulting in:
- Faster response times (<10s)
- Lower token usage (70-80% reduction)
- Better scalability (100k+ hospitals)
- Predictable costs
- Clearer agent responsibilities

The Golden Rule makes it easy to decide which agent to use: **Numeric/exact → DB Tool, Meaning/fuzzy → OpenSearch**.
