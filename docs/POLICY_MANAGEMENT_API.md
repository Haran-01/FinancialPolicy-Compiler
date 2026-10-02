# Enterprise Policy Management System — Architecture & API Reference

**Project:** FinPolicy Compiler (`FPC`) — Phase 5 (Enterprise Policy Management System)  
**Database:** Supabase PostgreSQL + Prisma ORM ([`database/prisma/schema.prisma`](file:///c:/Users/User/Desktop/compiler-project/database/prisma/schema.prisma))  
**Backend Engine:** [`backend/src/services/policy-management.service.ts`](file:///c:/Users/User/Desktop/compiler-project/backend/src/services/policy-management.service.ts) & [`backend/src/api/workspace/workspace.routes.ts`](file:///c:/Users/User/Desktop/compiler-project/backend/src/api/workspace/workspace.routes.ts)  
**Frontend Workspace:** [`frontend/src/stores/policy-workspace.store.ts`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/stores/policy-workspace.store.ts)

---

## 1. System Architecture & Compiler Integration

The **Policy Management System** wraps the frozen **FinPolicy Compiler** (`compiler/src/`) without modifying any compiler phase:

```
┌──────────────────────────────────────────────────────────────────────┐
│                 Enterprise Policy Management System                  │
│  • Policy CRUD, Rename, Duplicate, Favorite, Pin, Archive, Restore   │
│  • Version Control (v1, v2, v3...) + Side-by-Side Diff Viewer        │
│  • Workspace Project Explorer (Nested Folders & Drag-and-Drop)       │
│  • Import & Export (.fpl) + Audit Logging + RBAC                     │
└──────────────────┬─────────────────────────────────┬─────────────────┘
                   │ Compile Policy                  │ Execute Policy
                   ▼                                 ▼
┌─────────────────────────────────────┐ ┌──────────────────────────────┐
│     FinPolicy Compiler Pipeline     │ │ Financial Policy VM (FPVM)   │
│  1. Lexical Analysis (Scanner)      │ │ • Stack Frame & Heap Manager │
│  2. Recursive Descent Parser (AST)  │ │ • Instruction Dispatcher     │
│  3. Semantic Analysis & Symbols     │ │ • Runtime Trace & Profiler   │
│  4. IR Generation (TAC/Quad/CFG)    │ │ • Deterministic Decision     │
│  5. 12-Pass Optimization Engine     │ │   (APPROVE / REJECT)         │
└─────────────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Database Schema (Supabase PostgreSQL + Prisma)

Defined in [`database/prisma/schema.prisma`](file:///c:/Users/User/Desktop/compiler-project/database/prisma/schema.prisma):

| Table | Prisma Model | Responsibility |
| :--- | :--- | :--- |
| `users` | `User` | User accounts & RBAC roles (`ADMIN`, `POLICY_MANAGER`, `AUDITOR`, `VIEWER`) |
| `folders` | `Folder` | Self-referential nested workspace folder hierarchy (`parentId`) |
| `policy_categories` | `PolicyCategory` | Categories (`Loan`, `Insurance`, `Payroll`, `Tax`, `Investment`, `Fraud Detection`, `Scholarship`, `Custom`) |
| `tags` / `policy_tags` | `Tag`, `PolicyTag` | Domain tags (`Banking`, `HR`, `Government`, `Education`, `Healthcare`) |
| `policies` | `Policy` | Core policy entity with `isFavorite`, `isPinned`, `isArchived`, `latestVersion`, status & metrics |
| `policy_versions` | `PolicyVersion` | Immutable version history (`v1`, `v2`, `v3`...) with `changelog` & `isLatest` |
| `compilation_history` | `CompilationHistory` | Stores `compilationTimeMs`, `tokenCount`, `astNodeCount`, errors, warnings, and optimization summary |
| `execution_history` | `ExecutionHistory` | Stores `decision`, `executionTimeMs`, `memoryUsageBytes`, inputs, variables, and execution trace |
| `audit_logs` | `AuditLog` | Immutable enterprise audit trail for all 14 action types |
| `saved_sessions` | `SavedSession` | Persisted Monaco editor tabs, active folder, and runtime test payloads |

---

## 3. REST API Endpoints (`/api/v1/workspace`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/workspace/dashboard` | Dashboard KPIs, compilation/execution success rates, recent activity |
| `GET` | `/api/v1/workspace/policies` | Search & multi-facet filter policies |
| `POST` | `/api/v1/workspace/policies` | Create new policy (initializes `v1`) |
| `GET` | `/api/v1/workspace/policies/:id` | Open policy & update `lastOpenedAt` |
| `PATCH` | `/api/v1/workspace/policies/:id` | Edit policy source/metadata (auto-creates next version if source changed) |
| `POST` | `/api/v1/workspace/policies/:id/rename` | Rename policy |
| `POST` | `/api/v1/workspace/policies/:id/duplicate` | Duplicate policy |
| `DELETE` | `/api/v1/workspace/policies/:id` | Soft or hard delete policy (`ADMIN`) |
| `POST` | `/api/v1/workspace/policies/:id/publish` | Publish policy |
| `POST` | `/api/v1/workspace/policies/:id/archive` | Archive policy |
| `POST` | `/api/v1/workspace/policies/:id/restore` | Restore archived policy |
| `POST` | `/api/v1/workspace/policies/:id/favorite` | Toggle favorite star |
| `POST` | `/api/v1/workspace/policies/:id/pin` | Toggle workspace pin |
| `POST` | `/api/v1/workspace/policies/format` | Format FPL source code |
| `GET` | `/api/v1/workspace/policies/:id/versions` | List version history |
| `POST` | `/api/v1/workspace/policies/:id/versions` | Create explicit version snapshot |
| `POST` | `/api/v1/workspace/policies/:id/versions/:versionNumber/restore` | Restore a previous version |
| `GET` | `/api/v1/workspace/policies/:id/versions/compare?left=1&right=2` | Side-by-side line diff between two versions |
| `POST` | `/api/v1/workspace/policies/:id/compile` | Run full compiler pipeline & record `CompilationHistory` |
| `POST` | `/api/v1/workspace/policies/:id/execute` | Execute on FPVM & record `ExecutionHistory` |
| `POST` | `/api/v1/workspace/policies/import` | Import `.fpl` file |
| `GET` | `/api/v1/workspace/policies/:id/export` | Export policy as `.fpl` file |
| `GET` / `POST` | `/api/v1/workspace/folders` | List or create nested folders |
| `GET` | `/api/v1/workspace/audit` | Query immutable enterprise audit logs |

---

## 4. Role-Based Access Control (RBAC) Matrix

| Capability | `ADMIN` | `POLICY_MANAGER` | `AUDITOR` | `VIEWER` |
| :--- | :---: | :---: | :---: | :---: |
| Create / Edit / Rename / Duplicate Policy | ✔ | ✔ | ✖ | ✖ |
| Compile & Execute Policy (FPVM) | ✔ | ✔ | ✖ | ✖ |
| Publish / Archive / Restore / Version Restore | ✔ | ✔ | ✖ | ✖ |
| Delete Policy / Manage Users | ✔ | ✖ | ✖ | ✖ |
| View Audit Logs | ✔ | ✖ | ✔ | ✖ |
| View Policies, Versions & History | ✔ | ✔ | ✔ | ✔ |
