/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Intermediate Representation (IR) Contracts
 *
 * Phase 3D: Defines the complete, machine-independent, strongly-typed IR
 * data structures for:
 *   1. Reusable IR Instructions (`IRInstruction`, `IROpcode`, `IROperand`)
 *   2. Three Address Code (`ThreeAddressInstruction`)
 *   3. Quadruples (`Quadruple`: Operator, Argument1, Argument2, Result)
 *   4. Triples (`Triple`: Index, Operator, Argument1, Argument2)
 *   5. Indirect Triples (`IndirectTriple`: PointerIndex -> TripleIndex)
 *   6. Basic Blocks (`BasicBlock`: Leader identification & instruction slices)
 *   7. Control Flow Graph (`ControlFlowGraph`, `CFGNode`, `CFGEdge`)
 *   8. IR Validation (`IRValidationIssue`, `IRValidationResult`)
 *   9. Temporary Variable & Label Metadata (`TemporaryVariableInfo`, `LabelInfo`)
 * ============================================================================
 */
import type { ASTProgram, ASTSourceLocation } from '../ast/ast.interface';
import type { ASTRepository } from '../ast/ast-repository';
import type { FPLDataType, ISymbolTable } from '../symbol-table/symbol-table.interface';
import type { SemanticResult } from '../semantic/semantic.interface';
export type IROpcode = 'ASSIGN' | 'LOAD' | 'STORE' | 'LOAD_CONST' | 'LOAD_FIELD' | 'STORE_FIELD' | 'LOAD_INDEX' | 'STORE_INDEX' | 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MOD' | 'POW' | 'NEG' | 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ' | 'NEQ' | 'AND' | 'OR' | 'NOT' | 'PERCENT_OF' | 'NULL_CHECK' | 'NULL_COALESCE' | 'IN_CHECK' | 'BETWEEN' | 'LABEL' | 'GOTO' | 'JUMP' | 'IF_FALSE' | 'IF_TRUE' | 'JUMP_IF' | 'JUMP_IF_NOT' | 'PARAM' | 'CALL' | 'POLICY_CALL' | 'RULE_APPLY' | 'RETURN' | 'APPROVE' | 'REJECT' | 'ALLOW' | 'DENY' | 'REVIEW' | 'EMIT' | 'LOG' | 'WARN' | 'ASSERT' | 'TRY_BEGIN' | 'TRY_END' | 'CATCH_BEGIN' | 'THROW' | 'NOP' | 'HALT';
/** Discriminated union representing any strongly-typed IR operand. */
export type IROperand = {
    kind: 'variable';
    name: string;
    dataType?: FPLDataType;
} | {
    kind: 'temporary';
    name: string;
    id: number;
    dataType?: FPLDataType;
} | {
    kind: 'constant';
    value: string | number | boolean | null;
    dataType?: FPLDataType;
} | {
    kind: 'label';
    name: string;
} | {
    kind: 'register';
    id: number;
    name?: string;
    dataType?: FPLDataType;
} | {
    kind: 'function';
    name: string;
    argCount?: number;
} | {
    kind: 'policy';
    name: string;
    argCount?: number;
};
/**
 * Every reusable IR instruction contains:
 * - Instruction ID (`id`, e.g. `inst_1`)
 * - Opcode (`opcode`)
 * - Operands (`operands`)
 * - Destination (`destination` / `result`)
 * - Source Location (`sourceLocation`, `sourceLine`)
 * - Basic Block (`basicBlockId`)
 * - Comments (`comment`)
 */
export interface IRInstruction {
    /** Unique Instruction ID (`inst_1`, `inst_2`, ...) */
    id: string;
    /** 0-based sequential index in the instruction stream */
    index: number;
    /** IR Operation code */
    opcode: IROpcode;
    /** Symbolic operator string (`+`, `-`, `*`, `/`, `%`, `>=`, `AND`, `IF_FALSE`, `GOTO`, etc.) */
    operatorSymbol: string;
    /** Ordered source operands (0, 1, or 2 operands, or call args) */
    operands: IROperand[];
    /** Destination operand (`t1`, `salary`, `L2`, or `null` for void/label ops) */
    destination: IROperand | null;
    /** Backward-compatible alias for `destination` */
    result: IROperand | null;
    /** Resolved FPL data type of the instruction result */
    resultType: FPLDataType;
    /** Enclosing policy or function name */
    containerName: string;
    /** Assigned Basic Block ID (`B1`, `B2`, ...) */
    basicBlockId: string | null;
    /** AST Source location where this instruction originated */
    sourceLocation?: ASTSourceLocation;
    /** 1-indexed source line number */
    sourceLine?: number;
    /** Optional human-readable compiler comment */
    comment?: string;
}
/**
 * Three Address Code (TAC) instruction entry.
 * Example: `t1 = salary >= 60000` or `IF_FALSE t3 GOTO L2`
 */
export interface ThreeAddressInstruction {
    /** Instruction ID (`inst_1`, ...) */
    id: string;
    /** 0-based instruction index */
    index: number;
    /** Destination variable/temporary (`t1`, `salary`, or `null`) */
    result: string | null;
    /** Operator or directive (`>=`, `AND`, `+`, `:=`, `IF_FALSE`, `GOTO`, `LABEL`, `APPROVE`, `REJECT`, `RETURN`) */
    op: string;
    /** First operand string (`salary`, `t1`, etc.) */
    arg1: string | null;
    /** Second operand string (`60000`, `t2`, etc.) */
    arg2: string | null;
    /** Jump target or label name (`L1`, `L2`, etc.) */
    label?: string;
    /** Formatted canonical TAC line (e.g., `t1 = salary >= 60000`) */
    text: string;
    /** Basic Block ID (`B1`, `B2`, ...) */
    basicBlockId: string | null;
    /** Source line number */
    sourceLine?: number;
    /** Optional comment */
    comment?: string;
}
/**
 * Quadruple Representation: `(Index, Operator, Argument1, Argument2, Result)`
 */
export interface Quadruple {
    /** 0-based row index */
    index: number;
    /** Operator (`>=`, `+`, `AND`, `=`, `IF_FALSE`, `GOTO`, `LABEL`, `CALL`, `APPROVE`, `REJECT`, `RETURN`) */
    op: string;
    /** Argument 1 */
    arg1: string | null;
    /** Argument 2 */
    arg2: string | null;
    /** Result destination (`t1`, `salary`, `L2`, etc.) */
    result: string | null;
    /** Basic Block ID */
    basicBlockId?: string | null;
    /** Source line number */
    sourceLine?: number;
}
/**
 * Triple Representation: `(Index, Operator, Argument1, Argument2)`
 * Temporary variables are eliminated; references to prior computations use `(index)`.
 */
export interface Triple {
    /** 0-based triple index */
    index: number;
    /** Operator */
    op: string;
    /** First argument: identifier, literal, or `(index)` reference such as `"(0)"` */
    arg1: string | number | null;
    /** Second argument: identifier, literal, or `(index)` reference such as `"(1)"` */
    arg2: string | number | null;
    /** Basic Block ID */
    basicBlockId?: string | null;
    /** Source line number */
    sourceLine?: number;
}
/**
 * Indirect Triple Representation:
 * Separates execution order pointers (`pointerIndex -> tripleIndex`) from the Triple table
 * so optimizers can reorder instructions without rewriting `(index)` references.
 */
export interface IndirectTripleEntry {
    /** Execution order slot (`0`, `1`, `2`, ...) */
    pointerIndex: number;
    /** Pointer reference display (`P0`, `P1`, ...) */
    pointerLabel: string;
    /** Index into the underlying `Triple[]` table */
    tripleIndex: number;
    /** Snapshot of the referenced Triple */
    triple: Triple;
}
export interface IndirectTripleTable {
    /** Execution pointer table (`pointerIndex -> tripleIndex`) */
    pointers: IndirectTripleEntry[];
    /** Underlying deduplicated/indexed Triple pool */
    triples: Triple[];
}
export interface TemporaryVariableInfo {
    /** Temporary name (`t1`, `t2`, `t3`, ...) */
    name: string;
    /** 1-based numeric ID */
    id: number;
    /** Inferred FPL data type */
    dataType: FPLDataType;
    /** Expression description that produced this temporary */
    expressionSummary: string;
    /** Instruction ID where defined */
    definedAtInstructionId: string;
    /** Instruction IDs where used */
    usedAtInstructionIds: string[];
    /** Basic Block ID */
    basicBlockId: string | null;
    /** Source line number */
    sourceLine?: number;
}
export interface LabelInfo {
    /** Label name (`L1`, `L2`, `L3`, ...) */
    name: string;
    /** 1-based numeric ID */
    id: number;
    /** Semantic role of the label (`POLICY_ENTRY`, `THEN_BRANCH`, `ELSE_BRANCH`, `MERGE_END`, `LOOP_HEAD`, `LOOP_EXIT`) */
    role: string;
    /** Instruction index where this label is placed (`-1` if unresolved) */
    instructionIndex: number;
    /** Basic Block ID that starts with this label */
    basicBlockId: string | null;
    /** Instruction IDs that jump to this label */
    referencedByInstructionIds: string[];
}
export type BasicBlockKind = 'ENTRY' | 'NORMAL' | 'CONDITIONAL' | 'DECISION' | 'LOOP_HEADER' | 'LOOP_BODY' | 'EXIT';
export interface BasicBlock {
    /** Unique Block ID (`ENTRY`, `B1`, `B2`, ..., `EXIT`) */
    id: string;
    /** Human-readable title (e.g. `B1 (L1: Condition)` or `B2 (Then / Approve)`) */
    label: string;
    /** Grammatical classification of the basic block */
    kind: BasicBlockKind;
    /** Enclosing policy or function name */
    containerName: string;
    /** Leader instruction ID (first instruction of the block) */
    leaderInstructionId: string | null;
    /** Reason why the first instruction was chosen as a Leader */
    leaderReason: 'FIRST_INSTRUCTION' | 'JUMP_TARGET_LABEL' | 'FOLLOWS_BRANCH_OR_TERMINATOR' | 'SYNTHETIC_BOUNDARY';
    /** Start instruction index (inclusive) */
    startIndex: number;
    /** End instruction index (inclusive) */
    endIndex: number;
    /** Ordered IR instructions belonging to this Basic Block */
    instructions: IRInstruction[];
    /** Formatted TAC strings inside this Basic Block */
    tacLines: string[];
    /** Predecessor Basic Block IDs */
    predecessors: string[];
    /** Successor Basic Block IDs */
    successors: string[];
    /** True if reachable from ENTRY block */
    isReachable: boolean;
}
export type CFGEdgeKind = 'ENTRY_EDGE' | 'TRUE_BRANCH' | 'FALSE_BRANCH' | 'UNCONDITIONAL_JUMP' | 'FALLTHROUGH' | 'LOOP_BACK' | 'POLICY_CALL' | 'EXIT_EDGE';
export interface CFGEdge {
    id: string;
    from: string;
    to: string;
    kind: CFGEdgeKind;
    label: string;
    conditionTemp?: string;
}
export interface ControlFlowGraph {
    /** Policy or program name */
    name: string;
    /** Entry Basic Block ID (`ENTRY`) */
    entryBlockId: string;
    /** Exit Basic Block ID (`EXIT`) */
    exitBlockId: string;
    /** All Basic Blocks in topological/sequential order */
    blocks: BasicBlock[];
    /** Directed control-flow edges between Basic Blocks */
    edges: CFGEdge[];
    /** Mermaid flowchart diagram source for UI / documentation visualization */
    mermaidDiagram: string;
}
export type IRValidationCode = 'IR-V001' | 'IR-V002' | 'IR-V003' | 'IR-V004' | 'IR-V005' | 'IR-V006';
export interface IRValidationIssue {
    code: IRValidationCode;
    severity: 'ERROR' | 'WARNING';
    message: string;
    instructionId?: string;
    basicBlockId?: string;
}
export interface IRValidationResult {
    valid: boolean;
    issues: IRValidationIssue[];
    errors: IRValidationIssue[];
    warnings: IRValidationIssue[];
}
export interface IRProgram {
    /** Name of the primary policy or module */
    policyName: string;
    /** Ordered list of reusable IR instructions */
    instructions: IRInstruction[];
    /** Three Address Code (TAC) instruction list */
    threeAddressCode: ThreeAddressInstruction[];
    /** Quadruple table `(op, arg1, arg2, result)` */
    quadruples: Quadruple[];
    /** Triple table `(index, op, arg1, arg2)` */
    triples: Triple[];
    /** Indirect Triple table (`pointers` + `triples`) */
    indirectTriples: IndirectTripleTable;
    /** Partitioned Basic Blocks (`ENTRY`, `B1`, `B2`, ..., `EXIT`) */
    basicBlocks: BasicBlock[];
    /** Complete Control Flow Graph (CFG) */
    cfg: ControlFlowGraph;
    /** Allocated Temporary Variables (`t1`, `t2`, ...) */
    temporaries: TemporaryVariableInfo[];
    /** Allocated Labels (`L1`, `L2`, ...) */
    labelsMeta: LabelInfo[];
    /** Named compile-time constants */
    constants: Record<string, unknown>;
    /** Maps label names (`L1`, `L2`) to instruction indices */
    labels: Map<string, number>;
    /** IR Validation report */
    validation: IRValidationResult;
    /** Formatted Pretty-Printed TAC text */
    prettyPrintedTAC: string;
    /** Formatted Quadruple ASCII table */
    prettyPrintedQuadruples: string;
    /** Formatted Triple ASCII table */
    prettyPrintedTriples: string;
    /** Formatted Indirect Triple ASCII table */
    prettyPrintedIndirectTriples: string;
    /** Formatted Basic Blocks & CFG ASCII report */
    prettyPrintedCFG: string;
}
export interface IRGenerationInput {
    repository: ASTRepository;
    symbolTable?: ISymbolTable;
    semanticResult?: SemanticResult;
}
export interface IIRGenerator {
    /**
     * Lowers the semantically validated AST / ASTRepository into a complete {@link IRProgram}.
     */
    generate(sourceOfTruth: ASTRepository | ASTProgram | SemanticResult, symbolTable?: ISymbolTable): IRProgram;
    /**
     * Returns the flat list of IR instructions from the most recent generation run.
     */
    getInstructions(): IRInstruction[];
}
//# sourceMappingURL=ir.interface.d.ts.map