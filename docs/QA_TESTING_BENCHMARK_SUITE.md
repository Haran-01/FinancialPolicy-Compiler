# FinPolicy Compiler — Quality Assurance, Testing & Benchmark Suite

**Project:** FinPolicy Compiler (`FPC`) — Phase 7 (Quality Assurance, Testing & Benchmark Suite)  
**Test Framework:** Vitest + React Testing Library + Supertest + Playwright-ready Architecture + TypeScript  
**QA Harness:** [`tests/qa/harness/qa-harness.ts`](file:///c:/Users/User/Desktop/compiler-project/tests/qa/harness/qa-harness.ts)  
**Shared Fixtures:** [`tests/qa/fixtures/policy-fixtures.ts`](file:///c:/Users/User/Desktop/compiler-project/tests/qa/fixtures/policy-fixtures.ts)  
**Interactive Dashboards:** [`frontend/src/pages/qa/QualityBenchmarkDashboardPage.tsx`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/pages/qa/QualityBenchmarkDashboardPage.tsx) (`/qa`)

---

## 1. QA & Benchmark Folder Structure

```
tests/
├── vitest.config.ts                                    # Root Vitest configuration
├── compiler/
│   ├── lexer.test.ts                                   # Phase 3A Lexer Unit Tests
│   ├── parser.test.ts                                  # Phase 3B Parser Unit Tests
│   ├── semantic.test.ts                                # Phase 3C Semantic Unit Tests
│   ├── ir.test.ts                                      # Phase 3D IR Generator Unit Tests
│   ├── optimizer.test.ts                               # Phase 3E Optimizer Unit Tests
│   ├── runtime.test.ts                                 # Phase 4 FPVM Runtime Unit Tests
│   ├── policy-management.test.ts                       # Phase 5 Policy Management Unit Tests
│   └── finpolicy-studio.test.ts                        # Phase 6 FinPolicy Studio IDE Tests
└── qa/
    ├── fixtures/
    │   └── policy-fixtures.ts                          # Sample, Invalid, Edge Case, Regression & Stress Generators
    ├── harness/
    │   └── qa-harness.ts                               # Benchmark Runner, Memory Profiler, Error Reporter & Exporter
    └── modules/
        ├── compiler-phases.qa.test.ts                  # Modules 1–7: Lexer, Parser, AST, Semantic, IR, Optimizer, VM
        ├── platform-api-ui.qa.test.ts                  # Modules 8–9: Backend APIs, RBAC & FinPolicy Studio UI
        └── regression-benchmark-stress.qa.test.ts      # Modules 10–12: Regression, Benchmarks, Stress & Export
```

---

## 2. The 12 Automated Validation Modules

| # | Test Module | Verified Capabilities |
| :--- | :--- | :--- |
| **1** | **Lexer Tests** | Keywords, Identifiers, Numbers, Strings, Comments, Whitespace, Operators, Delimiters, Invalid Characters, Unicode Support, Large Source Files |
| **2** | **Parser Tests** | Program Parsing, Policy Parsing, Nested Conditions, Functions, Expressions, Assignments, Imports, Syntax Recovery |
| **3** | **AST Tests** | Tree Structure, Parent-Child Relationships, Node Types, Node Positions, JSON Serialization |
| **4** | **Semantic Tests** | Type Checking, Undefined Variables, Duplicate Variables, Duplicate Policies, Circular Dependencies, Function/Policy/Scope Resolution |
| **5** | **IR Tests** | Three Address Code, Quadruples, Triples, Indirect Triples, Basic Blocks, Control Flow Graph, Temporary Variables |
| **6** | **Optimization Tests** | Constant Folding, Constant Propagation, Copy Propagation, Dead Code Elimination, CSE, Strength Reduction, Jump Optimization |
| **7** | **Runtime Tests** | Execution, Function Calls, Policy Calls, Memory, Stack, Branching, Runtime Exceptions |
| **8** | **API Tests** | Policy CRUD, Compilation APIs, Execution APIs, Version APIs, Authentication, Authorization (RBAC) |
| **9** | **UI Tests** | FinPolicy Studio Editor, Navigation, Policy Creation, Compilation, Execution, Developer Mode (`OFF` by default), Settings |
| **10** | **Regression Tests** | Golden compiler baselines, previous bug fixes (`FPC-BUG-101`, `FPC-BUG-104`, `FPC-BUG-209`), deterministic VM outputs |
| **11** | **Performance & Memory Benchmarks** | Lexing, Parsing, Semantic, IR, Optimization, Execution & E2E Compile Times; Peak Heap, Peak Stack, Temp Variables, Object Allocations |
| **12** | **Stress Tests** | Very Large Policies (100+ policies), Deeply Nested Conditions (Depth 30+), 1,000+ Variables, 1,000+ Functions |

---

## 3. Quality Dashboard, Benchmark Dashboard & Report Export

Accessible at `/qa` ([`QualityBenchmarkDashboardPage.tsx`](file:///c:/Users/User/Desktop/compiler-project/frontend/src/pages/qa/QualityBenchmarkDashboardPage.tsx)):
- **Quality Dashboard:** Displays Overall Test Status, Coverage Percentage, 12-Module Validation Matrix, Regression Summary, Compiler Health, and Error Reporting Store (`Stack Trace`, `Compiler Stage`, `Error Message`, `Input Policy`, `Timestamp`).
- **Benchmark Dashboard:** Displays Compile Time, Execution Time, Optimization Time, Memory Usage (`Peak Heap`, `Peak Stack`, `Temporary Variables`, `Object Allocations`), Compiler Throughput (`LOC/sec`), and a live interactive Benchmark Runner.
- **Report Exports:** One-click export in **PDF** (`%PDF-1.4`), **CSV**, and **JSON** formats via [`QAReportExporter`](file:///c:/Users/User/Desktop/compiler-project/tests/qa/harness/qa-harness.ts#L291-L366).
