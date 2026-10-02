# FinPolicy Compiler Platform (`v1.0.0` Enterprise GA)

Enterprise-grade **Financial Policy Language (`FPL`)** Compiler, 12-Pass IR Optimizer, Deterministic **Financial Policy Virtual Machine (`FPVM`)**, **Enterprise Policy Management System**, **FinPolicy Studio Desktop IDE**, and **12-Module Automated QA & Benchmark Suite**.

---

## 1. Architecture & Completed Phases

```
Source Code (.fpl)
      │
      ▼
1. Lexical Analyzer (compiler/src/lexer/)
      │
      ▼
2. Recursive Descent Parser & AST Repository (compiler/src/parser/, compiler/src/ast/)
      │
      ▼
3. Semantic Analyzer & Scoped Symbol Table (compiler/src/semantic/, compiler/src/symbol-table/)
      │
      ▼
4. Intermediate Representation — TAC, Quadruples, Triples, CFG (compiler/src/ir/)
      │
      ▼
5. 12-Pass Optimization Engine (compiler/src/optimizer/)
      │
      ▼
6. Financial Policy Virtual Machine — FPVM (compiler/src/runtime/)
      │
      ├──────────► Enterprise Policy Management System (backend/src/services/policy-management.service.ts)
      ├──────────► FinPolicy Studio Desktop IDE (/studio)
      ├──────────► Quality & Benchmark Dashboards (/qa)
      └──────────► Enterprise Release, Health & Backup Center (/release)
```

---

## 2. Shipped Sample Projects (7 Enterprise Domains)

1. **Loan Approval** (`LoanApproval.fpl`) — Retail personal loan underwriting evaluating applicant age, salary, and credit score.
2. **Insurance Claim** (`HealthInsuranceClaimAutoApprove.fpl`) — Outpatient healthcare insurance claim adjudication.
3. **Payroll** (`ExecutivePayrollBonus.fpl`) — Annual executive performance bonus and statutory withholding.
4. **Tax Calculation** (`CorporateTaxWithholding.fpl`) — Corporate tax rate and R&D credit deduction calculation.
5. **Scholarship** (`MeritScholarshipGrant.fpl`) — University academic merit and household income grant eligibility.
6. **Fraud Detection** (`HighValueWireFraudGuard.fpl`) — Real-time AML wire transfer velocity and risk tiering.
7. **Investment** (`InstitutionalPortfolioMargin.fpl`) — Institutional portfolio leverage, liquidity score, and margin compliance.

---

## 3. Project Structure

```
compiler-project/
├── compiler/                  # Core FPL Compiler & FPVM Runtime (Frozen Engine)
│   └── src/
│       ├── lexer/             # Scanner, Token Stream & Lexical Diagnostics
│       ├── parser/            # Recursive Descent Parser & Panic-Mode Recovery
│       ├── ast/               # AST Nodes, Factory, Visitor & Central AST Repository
│       ├── symbol-table/      # Hierarchical Scoped Symbol Table
│       ├── semantic/          # Type Checker, Identifier/Policy Resolver & Cycle Detector
│       ├── ir/                # TAC, Quadruples, Triples, Indirect Triples & CFG Builder
│       ├── optimizer/         # 12-Pass IR Optimization Pipeline & Metrics Reporter
│       └── runtime/           # Financial Policy Virtual Machine (FPVM), Debugger & Profiler
├── backend/                   # Express + TypeScript + Prisma Enterprise API Server
│   └── src/
│       ├── api/workspace/     # Policy Management, Versioning, Compile & Execute APIs
│       ├── api/health/        # Application, Database, Compiler & Runtime Health Checks
│       ├── services/          # PolicyManagementService & RBAC Permission Matrix
│       └── utils/             # JWT, Password Hashing & Security Sanitizer
├── frontend/                  # React + TypeScript + Vite + Tailwind + Monaco IDE
│   └── src/
│       ├── pages/studio/      # FinPolicy Studio Desktop IDE (/studio)
│       ├── pages/policies/    # Policy Explorer, Monaco Editor, Version Diff & History
│       ├── pages/qa/          # Quality & Benchmark Dashboards (/qa)
│       ├── pages/release/     # Enterprise Release, Sample Projects, Health & Backup (/release)
│       ├── features/studio/   # Modular Studio IDE Components & Developer Mode Panel
│       └── stores/            # Zustand Workspace & Studio State Stores
├── database/prisma/           # Supabase PostgreSQL Prisma Schema (schema.prisma)
├── shared/                    # Shared Types & Build Version Metadata (v1.0.0)
├── tests/                     # Unit, Integration & 12-Module QA / Benchmark / Stress Suite
└── docs/                      # Architecture, Language Spec, Compiler, VM, IDE & QA Docs
```

---

## 4. Quick Start & Developer Setup

### Prerequisites
- **Node.js** `>= 20.0.0`
- **PostgreSQL** `>= 15` (or Supabase PostgreSQL connection string)

### Installation & Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Run Frontend & Backend in development mode
npm run dev
```

---

## 5. Documentation Index

- **[Release Notes (`v1.0.0`)](file:///c:/Users/User/Desktop/compiler-project/RELEASE_NOTES.md)**
- **[Deployment & Production Readiness Guide](file:///c:/Users/User/Desktop/compiler-project/docs/DEPLOYMENT_AND_PRODUCTION_GUIDE.md)**
- **[FinPolicy Studio IDE Guide](file:///c:/Users/User/Desktop/compiler-project/docs/FINPOLICY_STUDIO_IDE.md)**
- **[Quality Assurance, Testing & Benchmark Suite](file:///c:/Users/User/Desktop/compiler-project/docs/QA_TESTING_BENCHMARK_SUITE.md)**
- **[Enterprise Policy Management API](file:///c:/Users/User/Desktop/compiler-project/docs/POLICY_MANAGEMENT_API.md)**
- **[Financial Policy Virtual Machine (`FPVM`) API](file:///c:/Users/User/Desktop/compiler-project/docs/RUNTIME_VM_API.md)**
- **[Optimization Engine API](file:///c:/Users/User/Desktop/compiler-project/docs/OPTIMIZER_API.md)**
