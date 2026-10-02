# FinPolicy Compiler (FPC) — Semantic Analysis & Symbol Table Engine API

## 1. Architecture Overview

The **Semantic Analysis Engine** (`compiler/src/semantic/` & `compiler/src/symbol-table/`) is the third core stage of the FinPolicy Compiler pipeline. It consumes the central **`ASTRepository`** ("Source of Truth") produced by the Recursive Descent Parser, validates all static typing, scoping, mutability, and termination guarantees of the Financial Policy Language (FPL), and enriches the `ASTRepository` in-place with resolved type and symbol annotations for downstream compiler phases and IDE tooling.

```
ASTRepository (Source of Truth)
      │
      ▼
Pass 1: Top-Level Symbol Registration (Constants, Functions, Policies, Rules)
      │
      ▼
Pass 2: Deep AST Semantic Traversal (SemanticVisitor)
      ├──► ScopeManager (Global → Policy / Function → If / Loop / Try Blocks)
      ├──► SymbolTable (Declarations, Definite Assignment, Reference Counting)
      ├──► TypeChecker & TypeResolver (Financial Domain Coercions & Entity Schemas)
      ├──► ReferenceResolver (Identifiers, Standard Library & Custom Functions, Policies)
      └──► SemanticMetadataDecorator (Annotates ASTRepository nodes in-place)
      │
      ▼
Pass 3: Call & Policy Dependency Graph Analysis (DependencyAnalyzer)
      ├──► Circular Policy Call Detection (FPL-T012)
      ├──► Recursive Function Detection (FPL-T011)
      └──► Unused Symbol / Parameter Warnings (FPL-W001)
```

---

## 2. Module Structure

```text
compiler/src/
├── symbol-table/
│   ├── symbol-table.interface.ts   # Symbol, Scope, FPLDataType, SymbolTableViewRow
│   ├── scope-manager.ts            # GlobalScope, PolicyScope, FunctionScope, BlockScope, ScopeStack
│   ├── symbol-table.ts             # SymbolTable + 30+ built-in FPL standard library functions
│   └── index.ts                    # Barrel exports
└── semantic/
    ├── semantic.interface.ts       # SemanticResult, DependencyGraph, ISemanticAnalyzer
    ├── type-system.ts              # DOMAIN_ENTITY_SCHEMAS, TypeResolver, TypeChecker
    ├── semantic-metadata.ts        # SemanticMetadataDecorator, NodeSemanticMetadata, Hover API
    ├── semantic-diagnostics.ts     # SemanticDiagnostics & FPL-T001..FPL-T016 / FPL-W001 codes
    ├── reference-resolver.ts       # ConstantResolver, ReferenceResolver, FunctionResolver, PolicyResolver
    ├── dependency-analyzer.ts      # DependencyAnalyzer (DFS cycle detection for policies & functions)
    ├── semantic-analyzer.ts        # SemanticVisitor & SemanticAnalyzer orchestrator
    └── index.ts                    # Barrel exports
```

---

## 3. FPL Type System & Compatibility Rules

### Supported Data Types (`FPLDataType`)
- **Primitives:** `int`, `decimal`, `currency`, `percentage`, `boolean`, `string`, `date`, `null`, `void`
- **Collections:** `array<T>`, `object`
- **Financial Domain Entities:**
  - `customer` (`id`, `age`, `annual_income`, `monthly_income`, `credit_score`, `employment_status`, `employment_years`, `existing_debt`, `dti_ratio`, `is_existing_customer`, `kyc_verified`, `risk_tier`, `country`, `state`, `account_age_days`)
  - `loan` (`id`, `amount`, `principal`, `interest_rate`, `tenure_months`, `tenure_years`, `loan_type`, `collateral_value`, `ltv_ratio`, `emi`, `purpose`, `down_payment`, `is_secured`)
  - `account` (`id`, `balance`, `average_balance`, `minimum_balance`, `account_type`, `status`, `opened_date`, `overdraft_limit`, `daily_withdrawal_amount`, `transaction_count`, `is_frozen`)
  - `policy_result` (`decision`, `reason`, `score`, `policy_name`)

### Safe Widening & Numeric Compatibility
- `int` safely widens to `decimal` and `currency`.
- `decimal` and `currency` are compatible in arithmetic and comparison operations (`int + decimal → decimal`, `currency + decimal → currency`, `percentage OF currency → currency`).
- Incompatible assignments (e.g., `decimal = string` or `boolean = int`) emit `FPL-T001`.
- `WHEN`, `IF`, `ELSEIF`, `WHILE`, and `ASSERT` conditions must strictly evaluate to `boolean` (`FPL-T007`).

---

## 4. Diagnostic Error & Warning Codes

| Code | Severity | Description |
| :--- | :--- | :--- |
| `FPL-T001` | Error | Type mismatch in assignment, initialization, or binary/unary operator |
| `FPL-T002` | Error | Undeclared variable or constant identifier |
| `FPL-T003` | Error | Call to undefined function |
| `FPL-T004` | Error | Reference to undefined policy in `APPLY` / `CALL` |
| `FPL-T005` | Error | Duplicate symbol declaration in the same lexical scope |
| `FPL-T006` | Error | Reassignment to immutable symbol (`CONST`, `LET`, or `INPUT` parameter) |
| `FPL-T007` | Error | Non-boolean expression in conditional clause (`WHEN`, `IF`, `WHILE`, `ASSERT`) |
| `FPL-T008` | Error | Function call argument count mismatch |
| `FPL-T009` | Error | Function call argument type mismatch |
| `FPL-T010` | Error | `RETURN` value type mismatch with function `RETURNS` signature |
| `FPL-T011` | Error | Recursive function call detected (forbidden for bounded termination) |
| `FPL-T012` | Error | Circular policy dependency cycle detected (`PolicyA → PolicyB → PolicyA`) |
| `FPL-T013` | Error | Variable read before definite initialization |
| `FPL-T014` | Error | Unreachable statement after terminal `ALLOW`, `DENY`, `REVIEW`, `RETURN`, or `THROW` |
| `FPL-T015` | Error | Invalid control flow (`BREAK`/`CONTINUE` outside loop, `EMIT` outside policy) |
| `FPL-T016` | Error | Division or modulo by constant zero |
| `FPL-W001` | Warning | Unused local variable or parameter |

---

## 5. Usage Example

```typescript
import { parseSource } from '@finpolicy/compiler';
import { analyzeSemantics, SemanticMetadataDecorator } from '@finpolicy/compiler';

const source = `
POLICY LoanApproval
INPUT
  AGE : int
  SALARY : decimal
WHEN
  AGE >= 21 AND SALARY >= 60000
THEN
  ALLOW "Approved"
ELSE
  DENY "Rejected"
END
`;

const parseResult = parseSource(source);
if (parseResult.repository) {
  const semanticResult = analyzeSemantics(parseResult.repository, source);

  console.log(semanticResult.formattedSymbolTable);
  console.log('Dependency Graph:', semanticResult.dependencyGraph);

  // Inspect hover metadata at line 7, column 3
  const decorator = new SemanticMetadataDecorator(semanticResult.repository);
  const hover = decorator.getHoverInfoAtPosition(7, 3);
  console.log('Hover Info:', hover);
}
```
