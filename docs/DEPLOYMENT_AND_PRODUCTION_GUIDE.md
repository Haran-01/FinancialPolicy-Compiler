# FinPolicy Compiler v1.0.0 — Security Review, Production Readiness & Deployment Guide

**Version:** `1.0.0` (`2026.10.02-GA.100`)

---

## 1. Enterprise Security Review

| Security Domain | Implementation & Verification | Status |
| :--- | :--- | :---: |
| **Authentication** | JWT Bearer access tokens (`15m`) + rotating refresh tokens (`7d`) + bcrypt (`12` rounds) | ✔ Verified |
| **Authorization (RBAC)** | Strict role enforcement (`ADMIN`, `POLICY_MANAGER`, `AUDITOR`, `VIEWER`) in [`policy-management.service.ts`](file:///c:/Users/User/Desktop/compiler-project/backend/src/services/policy-management.service.ts) | ✔ Verified |
| **Input Sanitization & Output Encoding** | [`security-sanitizer.ts`](file:///c:/Users/User/Desktop/compiler-project/backend/src/utils/security-sanitizer.ts) strips script tags, encodes HTML entities, and enforces 512 KB source payload bounds | ✔ Verified |
| **Database Queries** | Parameterized Prisma ORM queries against Supabase PostgreSQL (`database/prisma/schema.prisma`) | ✔ Verified |
| **Runtime Sandbox Safety** | Financial Policy Virtual Machine (`FPVM`) enforces instruction budget limits, stack depth bounds, and division-by-zero traps | ✔ Verified |
| **HTTP Hardening** | `helmet`, `cors`, `compression`, `express-rate-limit`, and `X-Request-ID` tracing | ✔ Verified |

---

## 2. Application Health Monitoring (`/api/v1/health`)

Implemented in [`backend/src/api/health/health.routes.ts`](file:///c:/Users/User/Desktop/compiler-project/backend/src/api/health/health.routes.ts) and visualized at `/release` ([`EnterpriseReleaseCenterPage.tsx`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/pages/release/EnterpriseReleaseCenterPage.tsx)):
- **Database Connectivity Check:** Verifies PostgreSQL / Prisma connection readiness.
- **Compiler Availability Check:** Runs a live probe through Lexer $\rightarrow$ Parser $\rightarrow$ Semantic Analyzer $\rightarrow$ IR Generator $\rightarrow$ 12-Pass Optimizer.
- **Runtime Availability Check:** Executes the compiled probe on the Financial Policy Virtual Machine (`FPVM`) and verifies deterministic `APPROVE` output.

---

## 3. Workspace Backup & Restore Procedure

1. Navigate to **Help & Release v1.0** (`/release`) $\rightarrow$ **Backup & Restore** tab.
2. Click **Download Workspace Backup (`.json`)** to export all policies, version histories, folders, categories, tags, and audit logs.
3. Click **Upload & Restore Backup (`.json`)** to restore a workspace snapshot at any time.

---

## 4. Production Deployment Steps

```bash
# 1. Install dependencies across all monorepo workspaces
npm install

# 2. Generate Prisma Client & apply database migrations
npm run db:generate
npm run db:migrate

# 3. Build shared, compiler, backend, and frontend bundles
npm run build

# 4. Start production server
cd backend && npm start
```
