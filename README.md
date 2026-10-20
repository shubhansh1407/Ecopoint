# Ecopoint — Gamified Waste Segregation & Traceability Platform

> **College Project**: A Full-Stack Java & Spring Boot Web Platform for verifiable municipal waste segregation, immutable chain-of-custody tracking, and tokenized circular economy incentives.

---

## 1. Overview & Problem Statement

Traditional municipal waste collection often fails because citizens lack transparency, direct feedback, and incentives to properly segregate waste at source. **Ecopoint** addresses this by pairing reusable bags (with unique identifier codes) to individual waste deposits and enforcing a strict **four-stage verification lifecycle**:

```
[Citizen] Register Bag Deposit (Estimated Weight)
   │
   ▼
[Collector] Physical Verification & Custody Pickup
   │
   ▼
[Material Recovery Facility] Weighing & Category Verification
   │
   ▼
[EcoWallet] Automated EcoPoint Credit & Voucher Redemption
```

---

## 2. Technology Stack

- **Backend**: Java (JDK 21/26), Spring Boot 4.x
- **Build & Dependency Tool**: Official Maven Wrapper (`mvnw.cmd` / `mvnw` — zero global Maven installation required)
- **Database & Persistence**: MySQL 8.4 with Spring Data JPA & Hibernate
- **Security & Authorization**: Spring Security with BCrypt password hashing and role-based endpoint protection
- **File Handling**: Pure-Java RFC 4180 CSV export for deposit records and audit ledgers
- **Frontend**: Semantic HTML5, Vanilla CSS3 (Earth & Cream Design System), Vanilla JavaScript (ES6+ Fetch API)
- **Design Language**: Warm Cream (`#F8F1E6`), Sage Green (`#66835B`), Earth Brown (`#5A4231`), subtle frosted glassmorphism, responsive collapsible sidebar, accessible typography, and Light/Dark mode.

---

## 3. Core Features & Business Constraints

1. **Server-Side Role-Based Access Control**:
   - `ROLE_USER`: Deposit registration, personal timeline, EcoWallet, reward redemption.
   - `ROLE_COLLECTOR`: Pickup queue, verification of physical bag code, custody transfer.
   - `ROLE_OPERATOR`: Facility verification, actual scale weight measurement, processing outcome assignment, point authorization.
   - `ROLE_ADMIN`: Municipal analytics, user directory, bag registry, waste category rate management, global ledger, and CSV export.

2. **Anti-Fraud & Integrity Constraints**:
   - **Reusable Bag Uniqueness**: One reusable bag code cannot have multiple unresolved active deposits. If a bag is currently `SUBMITTED`, `PICKED_UP`, or `AT_FACILITY`, creating a new deposit with the same bag code is strictly rejected until facility verification is completed.
   - **Anti-Double-Credit**: EcoPoints are awarded inside an ACID database transaction. Deposits maintain an `isPointsCredited` flag to mathematically prevent double credits.
   - **Scale-Verified Points Model**:
     $$\text{Awarded EcoPoints} = \text{round}(\text{Actual Scale Weight (kg)} \times \text{Category Rate})$$
     Points are calculated directly from verified scale weight and category rates once inspected by facility operators.
   - **Double-Entry Wallet Ledger**: Every EcoPoint awarded or redeemed is permanently logged in `wallet_transactions` with running balances and timestamps.
   - **Stock & Code Integrity**: Reward redemption atomically validates user points and reward stock, generates a unique 16-character alphanumeric voucher code (`ECO-RED-XXXX-XXXX`), and logs a debit ledger transaction.

---

## 4. Pre-Seeded Demo Accounts

The platform automatically seeds demo accounts with pre-calculated balances and realistic historical timeline events:

| Role | Name | Email | Password | Pre-seeded Features |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen User** | Aarav Sharma | `user@ecopoint.com` | `password123` | 190 EcoPoints, 1 verified deposit, 1 pending pickup |
| **Waste Collector** | Suresh Patil | `collector@ecopoint.com` | `password123` | Access to pending pickup queue |
| **Facility Operator** | Rajesh Verma | `operator@ecopoint.com` | `password123` | Access to recovery facility grading queue |
| **Platform Admin** | Platform Admin | `admin@ecopoint.com` | `password123` | Complete governance, analytics & CSV export |

> **Quick Switcher**: The top navigation bar includes a **Demo Role Switcher** (`Citizen` | `Collector` | `Facility` | `Admin`) allowing seamless demonstration during presentations without manual re-login.

---

## 5. Local Setup & Execution Guide

### Prerequisites
1. **Java JDK 21 or higher** installed (`JAVA_HOME` set).
2. **MySQL Server 8.4** installed and running on port `3306`.

### Database Configuration
The application targets database `ecopoint_db` on `localhost:3306`. Create the database once in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS ecopoint_db;
```

Credentials can be customized using standard environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | MySQL hostname |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `ecopoint_db` | Database schema name |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | *(empty string)* | Database password |

### Build & Run Instructions

From the project root:

```powershell
# 1. Run all automated tests (uses fast in-memory H2 test profile)
.\mvnw.cmd test

# 2. Run the Spring Boot application (connects to MySQL 8.4)
.\mvnw.cmd spring-boot:run
```

Once started, open your browser and navigate to:
```
http://localhost:8080/
```

Health check verification:
```
http://localhost:8080/api/health
```

---

## 6. Project Architecture & Directory Layout

```
Ecopoints/
├── mvnw & mvnw.cmd              # Official Maven Wrapper scripts
├── pom.xml                      # Dependencies: Web, Data JPA, Security, Validation, MySQL
├── src/
│   ├── main/
│   │   ├── java/com/ecopoint/
│   │   │   ├── EcopointPlatformApplication.java
│   │   │   ├── config/          # SecurityConfig, DataInitializer
│   │   │   ├── controller/      # Auth, User, Collector, Facility, Admin, Common, Health
│   │   │   ├── dto/             # Request & Response Data Transfer Objects
│   │   │   ├── entity/          # User, Bag, Category, Deposit, DepositEvent, Wallet, Ledger, Reward
│   │   │   ├── repository/      # Spring Data JPA Repositories
│   │   │   ├── service/         # AuthService, DepositService, WalletService, RewardService, CsvExportService
│   │   │   └── exception/       # GlobalExceptionHandler
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/          # Vanilla Frontend
│   │           ├── index.html   # Main Portal Container
│   │           ├── css/
│   │           │   └── theme.css # Earth & Cream design system tokens
│   │           └── js/
│   │               ├── api.js   # Fetch API client
│   │               └── app.js   # Router & interactive UI controllers
│   └── test/
│       ├── java/com/ecopoint/   # Automated workflow and reward redemption tests
│       └── resources/           # H2 in-memory test configuration
```

---

## 7. Academic & Demo Disclaimers

1. **Simulated Integrations**: Municipal partners, voucher sponsors (e.g. GreenHarvest Organics, City Metro Transit), and recycling outcome certificates are simulated for college demonstration purposes.
2. **Traceability Mechanism**: Physical bag identification uses discrete alphanumeric bag codes compatible with 2D barcode / QR scanning. Live GPS truck telemetry is excluded by design in accordance with municipal privacy and resource constraints.
