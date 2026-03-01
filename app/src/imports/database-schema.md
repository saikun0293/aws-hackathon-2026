1. Hospital (29 rows)
Column	Type	Nullable	Notes
hospitalId	TEXT	❌	🔑 Primary Key
hospitalName	TEXT	❌	
services	TEXT	❌	JSON array
location	TEXT	❌	Lat/Long
address	TEXT	❌	Full address
departmentIds	TEXT	❌	JSON array
insuranceCompanyIds	TEXT	❌	JSON array
phoneNumber	TEXT	✅	Landline/Mobile
description	TEXT	✅	Markdown
patients	TEXT	✅	JSON array of customerIds
2. Department (218 rows)
Column	Type	Nullable	Notes
departmentId	TEXT	❌	🔑 Primary Key
departmentName	TEXT	❌	
departmentDescription	TEXT	✅	Markdown
hospitalId	TEXT	❌	→ Hospital
listOfDoctorIds	TEXT	❌	JSON array
patients	TEXT	✅	JSON array of customerIds
3. Doctor (976 rows)
Column	Type	Nullable	Notes
doctorId	TEXT	❌	🔑 Primary Key
doctorName	TEXT	❌	
about	TEXT	❌	Markdown
records	TEXT	❌	JSON array (currently [])
patients	TEXT	✅	JSON array of customerIds
4. InsuranceCompany (10 rows)
Column	Type	Nullable	Notes
insuranceCompanyId	TEXT	❌	🔑 Primary Key
insuranceCompanyName	TEXT	❌	
description	TEXT	❌	Markdown
services	TEXT	❌	Markdown
5. InsurancePolicy (185 rows)
Column	Type	Nullable	Notes
policyId	TEXT	❌	🔑 Primary Key
companyId	TEXT	❌	🔗 → InsuranceCompany
about	TEXT	❌	Markdown
6. Customer (11,110 rows)
Column	Type	Nullable	Notes
customerId	TEXT	❌	🔑 Primary Key
customerName	TEXT	❌	
email	TEXT	❌	
createdAt	DATETIME	❌	
policyId	TEXT	✅	🔗 → InsurancePolicy
gender	TEXT	✅	Male/Female/Other
age	INTEGER	✅	18–80
uhid	TEXT	✅	UHID-XXXXX
visits	TEXT	✅	JSON array of {visitId, hospitalId, departmentId, doctorId}
7. Review (10,110 rows)
Column	Type	Nullable	Notes
reviewId	TEXT	❌	🔑 Primary Key
hospitalId	TEXT	❌	→ Hospital
doctorId	TEXT	❌	→ Doctor
customerId	TEXT	❌	→ Customer
policyId	TEXT	✅	→ InsurancePolicy
purposeOfVisit	TEXT	❌	Detailed Markdown
doctorReview	TEXT	❌	JSON: {doctorId, doctorReview}
claim	TEXT	✅	JSON: {claimId, claimAmountApproved, remainingAmountToBePaid}
payment	TEXT	❌	JSON: {billNo, amountToBePayed, totalBillAmount, description}
hospitalReview	TEXT	❌	Detailed Markdown
documentIds	TEXT	❌	JSON array of filenames
extractedData	TEXT	❌	JSON: {hospitalName, doctorName, surgeryType, procedureDate, diagnosis, medications, confidence}
verified	BOOLEAN	❌	1=verified, 0=fake
createdAt	DATETIME	❌	