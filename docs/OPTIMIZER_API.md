# FinPolicy Compiler (FPC) — Phase 3E: IR Optimization Engine API & Architecture Reference

## 1. Overview & Strict Scope Boundaries

The **FinPolicy Compiler Optimization Engine** (`compiler/src/optimizer/`) transforms the machine-independent Intermediate Representation (`IRProgram`) produced by Phase 3D into a minimal, canonical, high-performance `IRProgram` while strictly preserving program semantics.

- **Inputs**:
  - `IRProgram` (`IRInstruction[]`, `ThreeAddressInstruction[]`, `Quadruple[]`, `Triple[]`, `IndirectTripleTable`, `BasicBlock[]`, `ControlFlowGraph`, `TemporaryVariableInfo[]`, `LabelInfo[]`)
  - Optional `ISymbolTable` & `ASTRepository` (used by `DeadPolicyEliminationPass` to detect unreferenced policies, helper functions, rules, constants, and variables)
- **Outputs**:
  - `OptimizationResult`:
    - `optimizedProgram`: Rebuilt and validated `IRProgram`
    - `optimizedTAC`: Optimized Three Address Code (`ThreeAddressInstruction[]`)
    - `optimizedQuadruples`: Optimized Quadruples (`Quadruple[]`)
    - `optimizedTriples`: Optimized Triples (`Triple[]`)
    - `optimizedIndirectTriples`: Optimized Indirect Triples (`IndirectTripleTable`)
    - `optimizedBasicBlocks`: Optimized Basic Blocks (`BasicBlock[]`)
    - `optimizedCFG`: Optimized Control Flow Graph (`ControlFlowGraph` + Mermaid diagram)
    - `transformationHistory`: Step-by-step `TransformationRecord[]`
    - `deadEntityWarnings`: `DeadEntityWarning[]`
    - `statistics`: `OptimizationMetricsSummary`
    - `sideBySideDiff`: `SideBySideDiffRow[]`
    - `report`: `OptimizationReport` (`formattedReport` & `formattedDiffTable`)
- **Strict Phase Boundary**: Does **not** implement Runtime Execution, Policy Evaluation, Assembly Generation, or Machine Code Generation.

---

## 2. Folder Structure (`compiler/src/optimizer/`)

```text
compiler/src/optimizer/
├── optimizer.interface.ts      # Contracts for all 12 passes, metrics, diff rows, reports, and IOptimizer
├── constant-evaluator.ts       # Safe compile-time evaluator for arithmetic, comparison, logical & domain ops
├── expression-analyzer.ts      # Canonical CSE hashing, commutativity normalization, algebraic & strength patterns
├── data-flow-analyzer.ts       # Use-def counting, overwritten store detection, loop-carried variable analysis
├── control-flow-analyzer.ts    # Terminator detection, jump threading, consecutive label coalescing & reachability
├── ir-rewriter.ts              # Immutable instruction cloning, TAC formatting, and full IRProgram reconstruction
├── optimization-context.ts     # Shared pipeline context recording TransformationRecord[] and DeadEntityWarning[]
├── passes.ts                   # Strategy-pattern implementations of all 12 Optimization Passes
├── optimization-metrics.ts     # Instruction, temporary, basic block, jump & weighted execution cost calculator
├── optimization-reporter.ts    # Side-by-side Before/After TAC diff builder and ASCII report formatter
├── optimization-pipeline.ts    # OptimizationPipeline, OptimizationManager (Optimizer), and optimizeIR()
└── index.ts                    # Public barrel exports
```

---

## 3. The 12 Optimization Passes (Strategy Pattern)

Each pass extends [`BaseOptimizationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) and implements [`OptimizationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/optimizer.interface.ts):

| # | Pass Class | Pass Name | Level | Description & Transformation Example |
|---|---|---|---|---|
| **1** | [`ConstantFoldingPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `CONSTANT_FOLDING` | `O1` | Evaluates constant expressions at compile time: `t1 = 10000 + 5000` $\rightarrow$ `t1 = 15000` |
| **2** | [`ConstantPropagationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `CONSTANT_PROPAGATION` | `O1` | Propagates constant variable/temporary values into uses: `x = 100; y = x + 20` $\rightarrow$ `y = 120` |
| **3** | [`CopyPropagationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `COPY_PROPAGATION` | `O2` | Replaces copy chains with original source operand: `a = salary; b = a` $\rightarrow$ `b = salary` |
| **4** | [`CommonSubexpressionEliminationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `COMMON_SUBEXPRESSION` | `O2` | Eliminates duplicate computations (including commutative `bonus + salary`): `t1 = salary + bonus; t2 = salary + bonus` $\rightarrow$ `t2 = t1` |
| **5** | [`DeadCodeEliminationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `DEAD_CODE_ELIMINATION` | `O1` | Removes overwritten stores (`x = 100; x = 200`), unused temporaries (`t_k`), and unreachable code after `APPROVE`/`REJECT`/`RETURN`/`GOTO` |
| **6** | [`DeadPolicyEliminationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `DEAD_POLICY_ELIMINATION` | `O2` | Detects unused policies (`OPT-W001`), unused functions (`OPT-W002`), unused variables (`OPT-W003`), and unused constants (`OPT-W004`), pruning dead IR |
| **7** | [`StrengthReductionPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `STRENGTH_REDUCTION` | `O2` | Replaces expensive operations with cheaper ones: `salary * 2` $\rightarrow$ `salary + salary`, `x ^ 2` $\rightarrow$ `x * x`, `x / 1` $\rightarrow$ `x` |
| **8** | [`AlgebraicSimplificationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `ALGEBRAIC_SIMPLIFICATION` | `O2` | Simplifies identities: `x + 0` $\rightarrow$ `x`, `x * 1` $\rightarrow$ `x`, `x * 0` $\rightarrow$ `0`, `x AND true` $\rightarrow$ `x`, `x OR false` $\rightarrow$ `x`, `x == x` $\rightarrow$ `true` |
| **9** | [`ConditionalSimplificationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `CONDITIONAL_SIMPLIFICATION` | `O1` | Folds constant branches (`IF_FALSE true GOTO L2` $\rightarrow$ removed; `IF_FALSE false GOTO L2` $\rightarrow$ `GOTO L2`) and prunes dead branches |
| **10** | [`JumpOptimizationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `JUMP_OPTIMIZATION` | `O2` | Removes `GOTO Lx` immediately preceding `LABEL Lx`, threads `L1: GOTO L2` chains, and coalesces consecutive labels |
| **11** | [`BasicBlockOptimizationPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `BASIC_BLOCK_OPTIMIZATION` | `O2` | Eliminates unreachable Basic Blocks, collapses redundant branches, and merges adjacent linear Basic Blocks |
| **12** | [`RuleReorderingPass`](file:///c:/Users/User/Desktop/compiler-project/compiler/src/optimizer/passes.ts) | `RULE_REORDERING` | `O2` | Schedules cheap relational comparisons (`age >= 21`) before expensive `CALL`/`POLICY_CALL` instructions |

---

## 4. Programmatic Usage

### 4.1 Full 12-Pass Optimization (`optimizeIR`)

```typescript
import { parseSource } from '@finpolicy/compiler/parser';
import { analyzeSemantics } from '@finpolicy/compiler/semantic';
import { generateIR } from '@finpolicy/compiler/ir';
import { optimizeIR } from '@finpolicy/compiler/optimizer';

const parseRes = parseSource(fplSource);
const semRes = analyzeSemantics(parseRes.repository!, fplSource);
const irProgram = generateIR(semRes, semRes.symbolTable);

const optResult = optimizeIR(irProgram, {
  level: 2,
  symbolTable: semRes.symbolTable,
  astRepository: parseRes.repository!,
});

console.log(optResult.report.formattedReport);
```

### 4.2 Custom Pipeline & Enabling/Disabling Passes

```typescript
import { OptimizationManager } from '@finpolicy/compiler/optimizer';

const optimizer = new OptimizationManager();
optimizer.disablePass('RULE_REORDERING');
optimizer.enablePass('CONSTANT_FOLDING');

const result = optimizer.optimize(irProgram, 2);
```
