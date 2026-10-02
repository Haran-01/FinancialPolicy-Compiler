# FinPolicy Compiler (FPC) — Intermediate Representation (IR) Generation Engine API

## 1. Architecture Overview

The **Intermediate Representation (IR) Generation Engine** (`compiler/src/ir/`) is Phase 3D of the FinPolicy Compiler pipeline. It consumes the semantically validated **`ASTRepository`**, **`SymbolTable`**, and **`SemanticMetadataDecorator`** and lowers the AST into a machine-independent, strongly-typed IR suite ready for downstream optimization and execution.

```text
Validated ASTRepository + SymbolTable + SemanticMetadata
      │
      ▼
IRVisitor & InstructionBuilder
      ├──► TemporaryVariableGenerator (t1, t2, t3, ...)
      └──► LabelGenerator (L1, L2, L3, ...)
      │
      ▼
Reusable IRInstruction[] Stream
      │
      ├──────────► TACGenerator             (Three Address Code)
      ├──────────► QuadrupleGenerator       (op, arg1, arg2, result)
      ├──────────► TripleGenerator          (index, op, arg1, arg2)
      ├──────────► IndirectTripleGenerator  (Pointer P0 -> Triple (0))
      ├──────────► BasicBlockBuilder        (Leader identification -> B1..Bn)
      ├──────────► ControlFlowBuilder       (CFG: ENTRY -> B1..Bn -> EXIT + Mermaid)
      ├──────────► IRValidator              (IR-V001..IR-V005 verification)
      └──────────► IRPrettyPrinter & IRSerializer (JSON, Text, Binary Envelope)
```

---

## 2. Folder Structure

```text
compiler/src/ir/
├── ir.interface.ts          # IRInstruction, TAC, Quadruple, Triple, IndirectTriple, BasicBlock, CFG
├── temporary-manager.ts     # TemporaryVariableGenerator (t1, t2, t3, ...)
├── label-manager.ts         # LabelGenerator (L1, L2, L3, ...)
├── ir-factory.ts            # IRFactory (Operands, Instructions, Representations, BasicBlocks)
├── instruction-builder.ts   # InstructionBuilder / IRBuilder (Builder Pattern)
├── representations.ts       # TACGenerator, QuadrupleGenerator, TripleGenerator, IndirectTripleGenerator
├── basic-block-builder.ts   # BasicBlockBuilder (Leader identification & partitioning)
├── cfg-builder.ts           # ControlFlowBuilder / CFGBuilder (CFG & Mermaid generator)
├── ir-validator.ts          # IRValidator (Structural & control-flow verifier)
├── ir-pretty-printer.ts     # IRPrettyPrinter (Formatted TAC, Quadruple, Triple, Indirect Triple, CFG)
├── ir-serializer.ts         # IRSerializer (JSON, Audit Text, Binary Envelope)
├── ir-generator.ts          # IRVisitor, IRGenerator, generateIR()
└── index.ts                 # Public Barrel Exports
```

---

## 3. Sample Input & Generated Representations

### Source FPL Policy
```fpl
POLICY LoanApproval
INPUT
  salary : decimal
  age : int
OUTPUT
  interest : decimal
WHEN
  salary >= 60000 AND age >= 21
THEN
  ALLOW
  EMIT interest = 8.5
ELSE
  DENY
END
```

### 3.1 Three Address Code (TAC)
```text
----------------------------------
L1
t1 = salary >= 60000
t2 = age >= 21
t3 = t1 AND t2
IF_FALSE t3 GOTO L2
APPROVE
interest = 8.5
GOTO L3
L2
REJECT
L3
RETURN
----------------------------------
```

### 3.2 Quadruples `(Index, Operator, Argument1, Argument2, Result)`
```text
--------------------------------------------------------------------------
Index   Operator        Argument1         Argument2         Result
--------------------------------------------------------------------------
(0)     LABEL           —                 —                 L1
(1)     >=              salary            60000             t1
(2)     >=              age               21                t2
(3)     AND             t1                t2                t3
(4)     IF_FALSE        t3                —                 L2
(5)     APPROVE         —                 —                 —
(6)     EMIT            8.5               —                 interest
(7)     GOTO            —                 —                 L3
(8)     LABEL           —                 —                 L2
(9)     REJECT          —                 —                 —
(10)    LABEL           —                 —                 L3
(11)    RETURN          —                 —                 —
--------------------------------------------------------------------------
```

### 3.3 Triples `(Index, Operator, Argument1, Argument2)`
```text
------------------------------------------------------------
Index     Operator        Argument1         Argument2
------------------------------------------------------------
(0)       LABEL           L1                —
(1)       >=              salary            60000
(2)       >=              age               21
(3)       AND             (1)               (2)
(4)       IF_FALSE        (3)               L2
(5)       APPROVE         —                 —
(6)       EMIT            interest          8.5
(7)       GOTO            L3                —
(8)       LABEL           L2                —
(9)       REJECT          —                 —
(10)      LABEL           L3                —
(11)      RETURN          —                 —
------------------------------------------------------------
```

### 3.4 Basic Blocks & Control Flow Graph (CFG)
- **`ENTRY`** → `B1 (L1)`
- **`B1 (L1)`** *(Leader: First Instruction)*: Evaluates `t1`, `t2`, `t3`, and branches via `IF_FALSE t3 GOTO L2` → Successors: **`B2`** (`t3 == true`), **`B3 (L2)`** (`t3 == false`)
- **`B2`** *(Leader: Follows `IF_FALSE`)*: Executes `APPROVE`, `interest = 8.5`, `GOTO L3` → Successor: **`B4 (L3)`**
- **`B3 (L2)`** *(Leader: Jump Target `L2`)*: Executes `REJECT` → Successor: **`B4 (L3)`**
- **`B4 (L3)`** *(Leader: Jump Target `L3`)*: Executes `RETURN` → Successor: **`EXIT`**

---

## 4. IR Validation Codes

| Code | Severity | Description |
| :--- | :--- | :--- |
| `IR-V001` | Error | Jump instruction (`GOTO`, `IF_FALSE`, `IF_TRUE`) references an undefined label |
| `IR-V002` | Error | Duplicate label definition in the instruction stream |
| `IR-V003` | Error | Temporary variable (`t_k`) read before being defined |
| `IR-V004` | Error | Broken CFG edge referencing a non-existent Basic Block |
| `IR-V005` | Warning | Unreachable Basic Block detected from `ENTRY` |
