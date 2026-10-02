# Folder Structure — FinPolicy Compiler

Complete annotated directory tree for the monorepo.

```
finpolicy-compiler/                    ← Monorepo root
│
├── package.json                       ← Root package.json (npm workspaces)
├── tsconfig.base.json                 ← Shared TypeScript base config
├── .eslintrc.cjs                      ← Root ESLint config (TypeScript)
├── .prettierrc                        ← Prettier formatting rules
├── .gitignore                         ← Comprehensive ignore rules
├── .env.example                       ← Root env example (points to workspaces)
├── README.md                          ← Project overview & quick start
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                     ← CI pipeline (backend + frontend + compiler)
│   └── PULL_REQUEST_TEMPLATE.md       ← PR checklist template
│
├── docs/
│   ├── CONTRIBUTING.md                ← Branch naming, commit format, PR process
│   ├── DEVELOPER_GUIDE.md             ← Step-by-step dev recipes & env reference
│   ├── API_REFERENCE.md               ← Full REST API endpoint table
│   └── FOLDER_STRUCTURE.md            ← This file
│
├── scripts/
│   ├── setup.sh                       ← Bash setup (Linux/macOS)
│   ├── setup.ps1                      ← PowerShell setup (Windows)
│   └── generate-secret.js             ← JWT secret generator (Node ESM)
│
├── shared/                            ← @finpolicy/shared (types-only)
│   ├── package.json
│   └── src/
│       ├── index.ts                   ← Barrel — re-exports all types
│       └── types/
│           ├── user.types.ts          ← User, UserRole, CreateUserDto …
│           ├── policy.types.ts        ← Policy, PolicyVersion, PolicyCategory …
│           ├── compiler.types.ts      ← CompilationJob, CompiledArtifact …
│           ├── execution.types.ts     ← ExecutionJob, ExecutionResult …
│           ├── audit.types.ts         ← AuditLog, CreateAuditLogDto
│           └── api.types.ts           ← ApiResponse<T>, PaginatedResult<T> …
│
├── compiler/                          ← @finpolicy/compiler (FPL Compiler)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                   ← Public API barrel + compile() stub
│       ├── lexer/
│       │   └── lexer.interface.ts     ← ILexer, Token, TokenType (Phase 3)
│       ├── parser/
│       │   └── parser.interface.ts    ← IParser, ParseResult (Phase 3)
│       ├── ast/
│       │   └── ast.interface.ts       ← ASTNode, ASTProgram, 60+ node types
│       ├── semantic/
│       │   └── semantic.interface.ts  ← ISemanticAnalyzer, SemanticResult
│       ├── symbol-table/
│       │   └── symbol-table.interface.ts ← ISymbolTable, Symbol, Scope
│       ├── ir/
│       │   └── ir.interface.ts        ← IIRGenerator, IRInstruction, IROpcode
│       ├── optimizer/
│       │   └── optimizer.interface.ts ← IOptimizer, OptimizationPass
│       ├── codegen/
│       │   └── codegen.interface.ts   ← ICodeGenerator, TAC, Quadruples, Triples
│       ├── runtime/
│       │   └── runtime.interface.ts   ← IExecutionEngine, ExecutionContext (Phase 4)
│       ├── diagnostics/
│       │   └── diagnostics.interface.ts ← IDiagnostics, CompilerDiagnostic
│       └── pipeline/
│           └── pipeline.interface.ts  ← CompilerPipeline, PipelineResult
│
├── backend/                           ← Hono API Server (Phase 2)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts                   ← App entry point
│       ├── app.ts                     ← Hono app factory
│       ├── config/                    ← Environment config
│       ├── middleware/                ← Auth, logging, error handling
│       ├── routes/                    ← Route handlers by resource
│       │   ├── auth/
│       │   ├── users/
│       │   ├── policies/
│       │   ├── compiler/
│       │   ├── executor/
│       │   ├── audit/
│       │   └── api-keys/
│       ├── services/                  ← Business logic
│       ├── repositories/              ← Prisma data access layer
│       └── prisma/
│           └── schema.prisma          ← Backend-facing schema (symlink or copy)
│
├── frontend/                          ← React 19 + Vite (Phase 2)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── router/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── stores/                    ← Zustand state management
│       ├── api/                       ← API client (fetch wrappers)
│       └── types/                     ← Frontend-only types
│
├── database/
│   ├── prisma/
│   │   ├── schema.prisma              ← Master Prisma schema (all 9 models)
│   │   └── migrations/               ← Auto-generated migration files
│   └── seeds/
│       └── admin.seed.ts             ← Default admin + policy manager accounts
│
└── tests/                            ← Root-level cross-package tests
    ├── vitest.config.ts
    └── compiler/
        ├── lexer.stub.test.ts        ← Lexer interface stub tests
        └── pipeline.stub.test.ts     ← Pipeline interface stub tests
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| npm workspaces (not pnpm) | Broadest compatibility with CI runners and Node LTS |
| `@finpolicy/shared` types-only | Zero runtime cost; enables type sharing without bundling |
| Interfaces-first compiler | Locks the API contract before Phase 3 implementation begins |
| Prisma schema in `database/` | Single source of truth; backend references via symlink or path alias |
| Diagnostics threaded through pipeline | One error list avoids duplicating error-state per phase |
