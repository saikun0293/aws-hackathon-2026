# Database Schema Structure

## 1. Customer (11,110 rows)

| Column | Type | Constraints |
|--------|------|-------------|
| customerId | TEXT | **PRIMARY KEY** |
| customerName | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| createdAt | DATETIME | NOT NULL |
| policyId | TEXT | FK → InsurancePolicy(policyId) |
| gender | TEXT | |
| age | INTEGER | |
| uhid | TEXT | |
| visits | TEXT | Default: '[]' |

---

## 2. Department (218 rows)

| Column | Type | Constraints |
|--------|------|-------------|
| departmentId | TEXT | **PRIMARY KEY** |
| departmentName | TEXT | NOT NULL |
| departmentDescription | TEXT | |
| hospitalId | TEXT | NOT NULL |
| listOfDoctorIds | TEXT | NOT NULL, Default: '[]' |
| patients | TEXT | Default: '[]' |

---

## 3. Doctor (976 rows)

| Column | Type | Constraints |
|--------|------|-------------|
| doctorId | TEXT | **PRIMARY KEY** |
| doctorName | TEXT | NOT NULL |
| about | TEXT | NOT NULL |
| records | TEXT | NOT NULL, Default: '[]' |
| patients | TEXT | Default: '[]' |
| rating | REAL | |
| yearsOfExperience | INTEGER | |
| qualification | TEXT | |
| departmentId | TEXT | |

---

## 4. Hospital (29 rows)

| Column | Type | Constraints |
|--------|------|-------------|
| hospitalId | TEXT | **PRIMARY KEY** |
| hospitalName | TEXT | NOT NULL |
| services | TEXT | NOT NULL |
| location | TEXT | NOT NULL |
| address | TEXT | NOT NULL |
| departmentIds | TEXT | NOT NULL |
| insuranceCompanyIds | TEXT | NOT NULL |
| phoneNumber | TEXT | |
| description | TEXT | Default: '' |
| patients | TEXT | Default: '[]' |
| rating | REAL | |
| affordability | REAL | |
| maxCost | REAL | |
| minCost | REAL | |
| avgCost | REAL | |
| totalNumberOfClaims | INTEGER | |
| totalNumberOfClaimsApproved | INTEGER | |

---

## 5. InsuranceCompany (10 rows)

| Column | Type | Constraints |
|--------|------|-------------|
| insuranceCompanyId | TEXT | **PRIMARY KEY** |
| insuranceCompanyName | TEXT | NOT NULL |
| description | TEXT | NOT NULL |
| services | TEXT | NOT NULL |

---

## 6. InsurancePolicy (185 rows)

| Column | Type | Constraints |
|--------|------|-------------|
| policyId | TEXT | **PRIMARY KEY** |
| companyId | TEXT | NOT NULL, FK → InsuranceCompany(insuranceCompanyId) |
| about | TEXT | NOT NULL |

---

## 7. Review (10,110 rows)

| Column | Type | Constraints |
|--------|------|-------------|
| reviewId | TEXT | **PRIMARY KEY** |
| hospitalId | TEXT | NOT NULL |
| doctorId | TEXT | NOT NULL |
| customerId | TEXT | NOT NULL |
| policyId | TEXT | |
| purposeOfVisit | TEXT | NOT NULL |
| doctorReview | TEXT | NOT NULL |
| claim | TEXT | |
| payment | TEXT | NOT NULL |
| hospitalReview | TEXT | NOT NULL |
| documentIds | TEXT | NOT NULL, Default: '[]' |
| extractedData | TEXT | NOT NULL, Default: '{}' |
| verified | BOOLEAN | NOT NULL, Default: 1 |
| createdAt | DATETIME | NOT NULL |

---

## Key Relationships

- **Customer** → **InsurancePolicy** (via `policyId`)
- **InsurancePolicy** → **InsuranceCompany** (via `companyId`)
- **Review** references Hospital, Doctor, Customer, and Policy (via their respective IDs)
- **Department** references Hospital (via `hospitalId`)
- **Doctor** references Department (via `departmentId`)
