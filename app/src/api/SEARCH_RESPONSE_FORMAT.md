# AI-Powered Search Response Format

This document defines the complete JSON response format for the intelligent hospital search endpoint.

## Endpoint

```
POST /api/search
```

## Request Body

```json
{
  "query": "best hospital for cardiac surgery with Star Health Insurance",
  "userContext": {
    "insuranceId": "ins_001",  // Optional: if user is logged in
    "location": {               // Optional: for proximity sorting
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  }
}
```

## Response Format

```json
{
  "success": true,
  "cached": false,
  "responseTime": "2847ms",
  "userIntent": {
    "category": "cardiac_surgery",
    "keywords": ["cardiac surgery", "Star Health Insurance"],
    "insuranceRequired": true,
    "procedureType": "surgery"
  },
  "results": {
    "totalMatches": 5,
    "hospitals": [
      {
        // ==========================================
        // HOSPITAL BASIC INFO (from database)
        // ==========================================
        "hospitalId": "hosp_001",
        "hospitalName": "City General Hospital",
        "services": [
          "Emergency Care",
          "Cardiac Surgery",
          "Cardiology",
          "Pediatrics",
          "Orthopedics"
        ],
        "location": {
          "latitude": 28.6139,
          "longitude": 77.2090,
          "distance": 3.2  // km from user, if location provided
        },
        "address": "123 Medical Center Blvd, Connaught Place, Delhi, 110001",
        "phoneNumber": "+91-11-2345-6789",
        "description": "Leading multi-specialty hospital providing quality healthcare since 1985.",
        
        // ==========================================
        // AI INSIGHTS (from LLM)
        // ==========================================
        "aiInsights": {
          "matchScore": 95,  // 0-100, how well it matches user query
          "explanation": "City General Hospital is highly recommended for cardiac surgery because it has 145 verified patient reviews with an average rating of 4.5★. The hospital accepts Star Health Insurance with an 87% claim approval rate. They have state-of-the-art cardiac care facilities and top cardiologists including Dr. Sarah Johnson with 15+ years of experience. Average cardiac surgery cost here is ₹5,00,000, with an expected out-of-pocket expense of around ₹50,000 after insurance coverage.",
          "keyStrengths": [
            "High claim approval rate (87%)",
            "Experienced cardiac surgeons",
            "Modern cardiac care facilities",
            "Accepts your insurance"
          ],
          "considerations": [
            "Located 3.2km from your location",
            "Higher than average wait times for appointments"
          ]
        },
        
        // ==========================================
        // STATISTICS & RATINGS
        // ==========================================
        "stats": {
          "totalReviews": 145,
          "verifiedReviews": 132,
          "averageRating": 4.5,
          "ratingBreakdown": {
            "serviceQuality": 4.5,
            "maintenance": 4.2,
            "foodQuality": 3.8,
            "cleanliness": 4.6,
            "staffBehavior": 4.4
          },
          "claimApprovalRate": 0.87,  // 87%
          "averageCost": 285000,      // ₹2,85,000 average
          "averageWaitTime": 3        // days for appointment
        },
        
        // ==========================================
        // INSURANCE COMPATIBILITY
        // ==========================================
        "insuranceInfo": {
          "acceptedCompanies": [
            {
              "insuranceCompanyId": "ins_001",
              "insuranceCompanyName": "Star Health Insurance",
              "claimApprovalRate": 0.87,
              "averageClaimAmount": 450000,
              "cashlessAvailable": true
            },
            {
              "insuranceCompanyId": "ins_002",
              "insuranceCompanyName": "HDFC ERGO",
              "claimApprovalRate": 0.82,
              "averageClaimAmount": 425000,
              "cashlessAvailable": true
            }
          ],
          "userInsuranceMatch": {
            "isAccepted": true,
            "insuranceCompanyId": "ins_001",
            "claimApprovalRate": 0.87,
            "estimatedCoverage": 450000,
            "estimatedOutOfPocket": 50000
          }
        },
        
        // ==========================================
        // DEPARTMENTS (relevant to search)
        // ==========================================
        "relevantDepartments": [
          {
            "departmentId": "dept_001",
            "departmentName": "Cardiology",
            "departmentDescription": "Specializing in heart-related conditions and treatments. State-of-the-art cath labs and cardiac ICU.",
            "doctorCount": 8,
            "patientCount": 1247
          },
          {
            "departmentId": "dept_002",
            "departmentName": "Cardiac Surgery",
            "departmentDescription": "Advanced surgical interventions for heart conditions including bypass surgery and valve replacement.",
            "doctorCount": 5,
            "patientCount": 456
          }
        ],
        
        // ==========================================
        // TOP DOCTORS (AI-selected with reviews)
        // ==========================================
        "topDoctors": [
          {
            // Doctor basic info (from database)
            "doctorId": "doc_001",
            "doctorName": "Dr. Sarah Johnson",
            "specialty": "Cardiology",
            "experience": "15+ years",
            "about": "**Education:** MBBS, MD (Cardiology), Fellowship in Interventional Cardiology from AIIMS\n\n**Expertise:** Cardiac bypass surgery, Angioplasty, Heart failure management, Valve replacement\n\n**Awards:** Best Cardiologist Award 2022, Gold Medal in MD Cardiology",
            
            // AI-generated review summary
            "aiReview": {
              "summary": "Dr. Sarah Johnson is a highly experienced cardiologist with 15+ years of practice. She has performed over 500 successful cardiac surgeries with a 98% success rate. Patients consistently praise her excellent bedside manner, thorough explanations, and compassionate care. She specializes in complex cardiac procedures and is known for her expertise in minimally invasive techniques.",
              "keyHighlights": [
                "500+ successful cardiac surgeries",
                "98% success rate",
                "Excellent bedside manner",
                "Specializes in minimally invasive techniques"
              ]
            },
            
            // Doctor statistics
            "stats": {
              "totalReviews": 45,
              "verifiedReviews": 42,
              "averageRating": 4.8,
              "ratingBreakdown": {
                "bedsideManner": 4.9,
                "medicalExpertise": 4.9,
                "communication": 4.7,
                "waitTime": 4.2,
                "thoroughness": 4.8,
                "followUpCare": 4.8
              },
              "successRate": 0.98,
              "totalSurgeries": 567
            },
            
            // Sample verified reviews
            "recentReviews": [
              {
                "reviewId": "review_123",
                "customerName": "Anonymous Patient",
                "rating": 5,
                "procedureType": "Cardiac Bypass Surgery",
                "reviewText": "Dr. Johnson saved my life. Her expertise and caring nature made a difficult situation manageable.",
                "verified": true,
                "createdAt": "2024-02-15T10:30:00Z"
              }
            ],
            
            // Availability info
            "availability": {
              "nextAvailableSlot": "2024-03-10T09:00:00Z",
              "averageWaitTime": 5,  // days
              "acceptingNewPatients": true
            }
          },
          {
            "doctorId": "doc_002",
            "doctorName": "Dr. Rajesh Kumar",
            "specialty": "Cardiology",
            "experience": "12+ years",
            "about": "**Education:** MBBS, MD (Cardiology)\n\n**Expertise:** Preventive cardiology, Echocardiography, Coronary angiography",
            
            "aiReview": {
              "summary": "Dr. Rajesh Kumar is known for his expertise in preventive cardiology and diagnostic procedures. With 12+ years of experience, he has helped thousands of patients manage heart conditions through early detection and lifestyle modifications. Patients appreciate his patient approach and detailed explanations.",
              "keyHighlights": [
                "Expert in preventive cardiology",
                "3000+ diagnostic procedures",
                "Patient-centered approach",
                "Focus on early detection"
              ]
            },
            
            "stats": {
              "totalReviews": 38,
              "verifiedReviews": 36,
              "averageRating": 4.6,
              "ratingBreakdown": {
                "bedsideManner": 4.7,
                "medicalExpertise": 4.8,
                "communication": 4.6,
                "waitTime": 4.3,
                "thoroughness": 4.7,
                "followUpCare": 4.5
              },
              "successRate": 0.96,
              "totalProcedures": 3247
            },
            
            "recentReviews": [
              {
                "reviewId": "review_456",
                "customerName": "Anonymous Patient",
                "rating": 5,
                "procedureType": "Angiography",
                "reviewText": "Very thorough and explained everything clearly. Helped me avoid surgery through medication.",
                "verified": true,
                "createdAt": "2024-02-20T14:15:00Z"
              }
            ],
            
            "availability": {
              "nextAvailableSlot": "2024-03-05T14:00:00Z",
              "averageWaitTime": 3,
              "acceptingNewPatients": true
            }
          },
          {
            "doctorId": "doc_003",
            "doctorName": "Dr. Priya Sharma",
            "specialty": "Cardiac Surgery",
            "experience": "10+ years",
            "about": "**Education:** MBBS, MS (General Surgery), MCh (Cardiothoracic Surgery)\n\n**Expertise:** Valve replacement, Coronary artery bypass grafting, Pediatric cardiac surgery",
            
            "aiReview": {
              "summary": "Dr. Priya Sharma is one of the few female cardiac surgeons in Delhi with expertise in complex heart surgeries. She has a special interest in pediatric cardiac surgery and has successfully operated on over 300 children with congenital heart defects. Known for her precision and compassionate care.",
              "keyHighlights": [
                "Expert in valve replacement surgery",
                "300+ pediatric cardiac surgeries",
                "High success rate in complex cases",
                "Compassionate patient care"
              ]
            },
            
            "stats": {
              "totalReviews": 32,
              "verifiedReviews": 30,
              "averageRating": 4.7,
              "ratingBreakdown": {
                "bedsideManner": 4.8,
                "medicalExpertise": 4.9,
                "communication": 4.6,
                "waitTime": 4.4,
                "thoroughness": 4.7,
                "followUpCare": 4.8
              },
              "successRate": 0.97,
              "totalSurgeries": 423
            },
            
            "recentReviews": [
              {
                "reviewId": "review_789",
                "customerName": "Anonymous Patient",
                "rating": 5,
                "procedureType": "Valve Replacement",
                "reviewText": "Dr. Sharma operated on my 5-year-old daughter. She's a miracle worker. Forever grateful.",
                "verified": true,
                "createdAt": "2024-01-28T11:45:00Z"
              }
            ],
            
            "availability": {
              "nextAvailableSlot": "2024-03-12T10:00:00Z",
              "averageWaitTime": 7,
              "acceptingNewPatients": true
            }
          }
        ],
        
        // ==========================================
        // COST INFORMATION
        // ==========================================
        "costEstimates": {
          "cardiacBypassSurgery": {
            "minCost": 450000,
            "maxCost": 550000,
            "averageCost": 500000,
            "currency": "INR",
            "estimatedInsuranceCoverage": 450000,
            "estimatedOutOfPocket": 50000,
            "breakdown": {
              "surgeryFees": 200000,
              "hospitalization": 150000,
              "icuCharges": 100000,
              "medications": 30000,
              "diagnostics": 20000
            }
          },
          "angioplasty": {
            "minCost": 150000,
            "maxCost": 250000,
            "averageCost": 200000,
            "currency": "INR",
            "estimatedInsuranceCoverage": 180000,
            "estimatedOutOfPocket": 20000
          }
        },
        
        // ==========================================
        // VERIFICATION & TRUST INDICATORS
        // ==========================================
        "trustIndicators": {
          "verified": true,
          "trustScore": 87,  // 0-100
          "verificationBadge": "gold",  // bronze, silver, gold, platinum
          "accreditations": [
            "NABH Accredited",
            "ISO 9001:2015 Certified",
            "Green OT Certified"
          ],
          "documentVerificationRate": 0.91,  // 91% of reviews have verified documents
          "fakeReviewsBlocked": 23
        },
        
        // ==========================================
        // FACILITIES & AMENITIES
        // ==========================================
        "facilities": [
          "24/7 Emergency",
          "ICU",
          "NICU",
          "Blood Bank",
          "Pharmacy",
          "Cafeteria",
          "Parking"
        ],
        
        // ==========================================
        // IMAGES (if available)
        // ==========================================
        "images": [
          {
            "url": "https://s3.amazonaws.com/hospital-reviews/hosp_001_main.jpg",
            "type": "exterior",
            "caption": "Hospital Exterior"
          },
          {
            "url": "https://s3.amazonaws.com/hospital-reviews/hosp_001_ward.jpg",
            "type": "interior",
            "caption": "Patient Ward"
          }
        ]
      },
      
      // ==========================================
      // SECOND HOSPITAL (abbreviated structure)
      // ==========================================
      {
        "hospitalId": "hosp_002",
        "hospitalName": "Apollo Healthcare Center",
        "services": ["Cardiology", "Neurology", "Oncology", "Emergency Care"],
        "location": {
          "latitude": 28.5355,
          "longitude": 77.3910,
          "distance": 12.5
        },
        "address": "456 Healthcare Road, Sector 18, Noida, 201301",
        "phoneNumber": "+91-120-4567-8900",
        "description": "Advanced multi-specialty hospital with cutting-edge technology.",
        
        "aiInsights": {
          "matchScore": 88,
          "explanation": "Apollo Healthcare Center is another excellent choice for cardiac surgery. While slightly farther at 12.5km, they offer advanced robotic-assisted cardiac procedures and have a slightly higher success rate. They accept Star Health Insurance with an 85% claim approval rate. The hospital is known for shorter wait times and more personalized care.",
          "keyStrengths": [
            "Robotic-assisted surgery available",
            "Shorter wait times (2 days average)",
            "Personalized care approach",
            "High success rate (99%)"
          ],
          "considerations": [
            "Farther from your location (12.5km)",
            "Slightly lower claim approval rate (85%)"
          ]
        },
        
        "stats": {
          "totalReviews": 98,
          "verifiedReviews": 92,
          "averageRating": 4.6,
          "ratingBreakdown": {
            "serviceQuality": 4.7,
            "maintenance": 4.6,
            "foodQuality": 4.2,
            "cleanliness": 4.8,
            "staffBehavior": 4.5
          },
          "claimApprovalRate": 0.85,
          "averageCost": 320000,
          "averageWaitTime": 2
        },
        
        "insuranceInfo": {
          "acceptedCompanies": [
            {
              "insuranceCompanyId": "ins_001",
              "insuranceCompanyName": "Star Health Insurance",
              "claimApprovalRate": 0.85,
              "averageClaimAmount": 480000,
              "cashlessAvailable": true
            }
          ],
          "userInsuranceMatch": {
            "isAccepted": true,
            "insuranceCompanyId": "ins_001",
            "claimApprovalRate": 0.85,
            "estimatedCoverage": 480000,
            "estimatedOutOfPocket": 40000
          }
        },
        
        "relevantDepartments": [
          {
            "departmentId": "dept_005",
            "departmentName": "Advanced Cardiology",
            "departmentDescription": "Robotic-assisted cardiac procedures and minimally invasive surgery.",
            "doctorCount": 6,
            "patientCount": 892
          }
        ],
        
        "topDoctors": [
          {
            "doctorId": "doc_008",
            "doctorName": "Dr. Amit Patel",
            "specialty": "Cardiac Surgery",
            "experience": "18+ years",
            "about": "**Education:** MBBS, MS, MCh (CTVS), Fellowship in Robotic Surgery\n\n**Expertise:** Robotic cardiac surgery, Minimally invasive procedures",
            
            "aiReview": {
              "summary": "Dr. Amit Patel is a pioneer in robotic cardiac surgery in India. With 18+ years of experience and specialized training from USA, he has performed over 800 robotic-assisted cardiac procedures. Patients benefit from smaller incisions, faster recovery, and less pain.",
              "keyHighlights": [
                "800+ robotic cardiac surgeries",
                "Fellowship from USA",
                "Faster recovery times",
                "Minimally invasive expert"
              ]
            },
            
            "stats": {
              "totalReviews": 52,
              "verifiedReviews": 50,
              "averageRating": 4.9,
              "ratingBreakdown": {
                "bedsideManner": 4.8,
                "medicalExpertise": 5.0,
                "communication": 4.8,
                "waitTime": 4.7,
                "thoroughness": 4.9,
                "followUpCare": 4.9
              },
              "successRate": 0.99,
              "totalSurgeries": 823
            },
            
            "recentReviews": [
              {
                "reviewId": "review_999",
                "customerName": "Anonymous Patient",
                "rating": 5,
                "procedureType": "Robotic Cardiac Surgery",
                "reviewText": "Minimal scarring, recovered in 10 days. Dr. Patel is truly world-class.",
                "verified": true,
                "createdAt": "2024-02-25T09:20:00Z"
              }
            ],
            
            "availability": {
              "nextAvailableSlot": "2024-03-08T11:00:00Z",
              "averageWaitTime": 4,
              "acceptingNewPatients": true
            }
          },
          {
            "doctorId": "doc_009",
            "doctorName": "Dr. Meera Singh",
            "specialty": "Interventional Cardiology",
            "experience": "14+ years",
            "about": "**Education:** MBBS, MD, DM (Cardiology)\n\n**Expertise:** Complex angioplasty, Stent placement, Structural heart interventions",
            
            "aiReview": {
              "summary": "Dr. Meera Singh specializes in non-surgical cardiac interventions. She has successfully performed over 2000 angioplasties and is an expert in handling complex cases. Known for her gentle approach and excellent patient outcomes.",
              "keyHighlights": [
                "2000+ successful angioplasties",
                "Expert in complex cases",
                "Non-surgical interventions",
                "Excellent patient outcomes"
              ]
            },
            
            "stats": {
              "totalReviews": 41,
              "verifiedReviews": 39,
              "averageRating": 4.7,
              "ratingBreakdown": {
                "bedsideManner": 4.8,
                "medicalExpertise": 4.9,
                "communication": 4.6,
                "waitTime": 4.5,
                "thoroughness": 4.7,
                "followUpCare": 4.7
              },
              "successRate": 0.97,
              "totalProcedures": 2134
            },
            
            "recentReviews": [
              {
                "reviewId": "review_888",
                "customerName": "Anonymous Patient",
                "rating": 5,
                "procedureType": "Angioplasty",
                "reviewText": "Dr. Singh avoided my surgery through expert angioplasty. Back to normal in 3 days!",
                "verified": true,
                "createdAt": "2024-02-18T16:30:00Z"
              }
            ],
            
            "availability": {
              "nextAvailableSlot": "2024-03-06T15:00:00Z",
              "averageWaitTime": 2,
              "acceptingNewPatients": true
            }
          }
        ],
        
        "costEstimates": {
          "cardiacBypassSurgery": {
            "minCost": 500000,
            "maxCost": 600000,
            "averageCost": 550000,
            "currency": "INR",
            "estimatedInsuranceCoverage": 480000,
            "estimatedOutOfPocket": 70000
          },
          "roboticCardiacSurgery": {
            "minCost": 650000,
            "maxCost": 800000,
            "averageCost": 725000,
            "currency": "INR",
            "estimatedInsuranceCoverage": 500000,
            "estimatedOutOfPocket": 225000
          }
        },
        
        "trustIndicators": {
          "verified": true,
          "trustScore": 92,
          "verificationBadge": "platinum",
          "accreditations": [
            "NABH Accredited",
            "JCI Accredited",
            "ISO 15189:2012 Certified"
          ],
          "documentVerificationRate": 0.94,
          "fakeReviewsBlocked": 12
        },
        
        "facilities": [
          "24/7 Emergency",
          "Cardiac ICU",
          "Robotic Surgery Suite",
          "Cath Lab",
          "Blood Bank",
          "Pharmacy",
          "Ambulance Service"
        ],
        
        "images": [
          {
            "url": "https://s3.amazonaws.com/hospital-reviews/hosp_002_main.jpg",
            "type": "exterior",
            "caption": "Apollo Healthcare Entrance"
          }
        ]
      }
      
      // ... hospitals 3, 4, 5 would follow same structure
    ]
  },
  
  // ==========================================
  // METADATA
  // ==========================================
  "metadata": {
    "searchId": "search_1709294400_abc123",
    "timestamp": "2024-03-01T10:30:00Z",
    "aiModel": "gpt-3.5-turbo",
    "databaseVersion": "v1.2.0",
    "totalHospitalsInDatabase": 29,
    "totalDoctorsInDatabase": 976
  }
}
```

## Fallback Response (If LLM Fails)

```json
{
  "success": true,
  "fallback": true,
  "message": "Showing keyword-based results",
  "cached": false,
  "responseTime": "423ms",
  "userIntent": {
    "category": "general_search",
    "keywords": ["cardiac", "surgery"]
  },
  "results": {
    "totalMatches": 3,
    "hospitals": [
      // Same structure but without AI insights
      {
        "hospitalId": "hosp_001",
        "hospitalName": "City General Hospital",
        // ... rest of the data
        "aiInsights": null,  // No AI insights in fallback
        "topDoctors": [
          // Doctors without AI reviews
          {
            "doctorId": "doc_001",
            "doctorName": "Dr. Sarah Johnson",
            "aiReview": null,  // No AI review in fallback
            // ... rest of data
          }
        ]
      }
    ]
  },
  "metadata": {
    "searchId": "search_1709294400_xyz789",
    "timestamp": "2024-03-01T10:30:00Z",
    "aiModel": null,
    "fallbackReason": "LLM timeout"
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": "SEARCH_FAILED",
  "message": "Unable to process search query. Please try again.",
  "details": {
    "code": "LLM_ERROR",
    "suggestion": "Try simplifying your search query"
  }
}
```
