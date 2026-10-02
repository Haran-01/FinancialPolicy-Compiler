/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Engine Contracts
 *
 * Phase 3E: Defines the complete, modular, multi-pass IR Optimization Engine
 * contracts for:
 *   1. All 12 Optimization Pass Names (`OptimizationPassName`)
 *   2. Strategy-based Pass Interface (`OptimizationPass`)
 *   3. Transformation History Records (`TransformationRecord`)
 *   4. Dead Entity Warnings (`DeadEntityWarning`)
 *   5. Performance Metrics & Cost Modeling (`OptimizationMetricsSummary`)
 *   6. Side-by-Side IR Difference Rows (`SideBySideDiffRow`)
 *   7. Human-Readable & Structured Reports (`OptimizationReport`)
 *   8. Complete Optimizer Output (`OptimizationResult`, `IOptimizer`)
 *
 * Strict Phase Boundary:
 *   - Consumes `IRProgram`, optional `ISymbolTable`, and optional `ASTRepository`
 *   - Produces optimized `IRProgram` (Optimized TAC, Optimized Quadruples,
 *     Optimized Triples, Optimized Indirect Triples, Optimized Basic Blocks,
 *     Optimized CFG) plus full transformation history and metrics
 *   - Does NOT implement Runtime Execution, Policy Evaluation, Assembly,
 *     or Machine Code Generation.
 * ============================================================================
 */
import type { ASTRepository } from '../ast/ast-repository';
import type { BasicBlock, ControlFlowGraph, IndirectTripleTable, IRProgram, IRValidationResult, Quadruple, ThreeAddressInstruction, Triple } from '../ir/ir.interface';
import type { ISymbolTable } from '../symbol-table/symbol-table.interface';
export type OptimizationPassName = 'CONSTANT_FOLDING' | 'CONSTANT_PROPAGATION' | 'COPY_PROPAGATION' | 'COMMON_SUBEXPRESSION' | 'COMMON_SUBEXPRESSION_ELIMINATION' | 'DEAD_CODE_ELIMINATION' | 'DEAD_POLICY_ELIMINATION' | 'STRENGTH_REDUCTION' | 'ALGEBRAIC_SIMPLIFICATION' | 'CONDITIONAL_SIMPLIFICATION' | 'JUMP_OPTIMIZATION' | 'BASIC_BLOCK_OPTIMIZATION' | 'RULE_REORDERING' | 'PEEPHOLE';
/**
 * Records a single discrete IR transformation performed by an optimization pass.
 */
export interface TransformationRecord {
    /** Sequential 1-based step number across the optimization pipeline */
    step: number;
    /** Name of the pass that performed this transformation */
    passName: OptimizationPassName;
    /** Human-readable display title of the pass */
    passTitle: string;
    /** Category of transformation */
    action: 'FOLDED' | 'PROPAGATED' | 'ELIMINATED' | 'SIMPLIFIED' | 'REORDERED' | 'MERGED' | 'WARNED';
    /** Instruction ID affected (`inst_1`, `inst_2`, etc.) */
    instructionId: string;
    /** Basic Block ID where transformation occurred (`B1`, `B2`, etc.) */
    basicBlockId: string | null;
    /** Original TAC instruction text before transformation */
    before: string;
    /** Resulting TAC instruction text after transformation (or `"[REMOVED]"` if deleted) */
    after: string;
    /** Detailed compiler explanation of why this transformation is sound */
    reason: string;
    /** Source line number in FPL policy if available */
    sourceLine?: number;
}
/**
 * Warning emitted by Pass 6 (`DEAD_POLICY_ELIMINATION`) when unused entities
 * are discovered in the Symbol Table / IR.
 */
export interface DeadEntityWarning {
    code: 'OPT-W001' | 'OPT-W002' | 'OPT-W003' | 'OPT-W004';
    entityKind: 'policy' | 'function' | 'variable' | 'constant' | 'rule';
    entityName: string;
    containerName: string;
    line?: number;
    message: string;
    eliminatedFromIR: boolean;
}
export interface PassStatistics {
    instructionsBefore: number;
    instructionsAfter: number;
    optimizationsApplied: number;
    temporariesBefore?: number;
    temporariesAfter?: number;
    basicBlocksBefore?: number;
    basicBlocksAfter?: number;
    durationMs?: number;
}
export interface PassExecutionSnapshot {
    passName: OptimizationPassName;
    passTitle: string;
    description: string;
    enabled: boolean;
    executed: boolean;
    instructionsBefore: number;
    instructionsAfter: number;
    temporariesBefore: number;
    temporariesAfter: number;
    basicBlocksBefore: number;
    basicBlocksAfter: number;
    optimizationsApplied: number;
    durationMs: number;
    transformations: TransformationRecord[];
    tacSnapshotAfter: string[];
}
export interface OptimizationMetricsSummary {
    /** Total IR instructions before optimization */
    instructionsBefore: number;
    /** Total IR instructions after optimization */
    instructionsAfter: number;
    /** Net instructions removed (`instructionsBefore - instructionsAfter`) */
    instructionsEliminated: number;
    /** Percentage reduction in instruction count (`0` to `100`) */
    instructionReductionPercent: number;
    /** Total temporary variables (`t1, t2, ...`) referenced before optimization */
    temporariesBefore: number;
    /** Total temporary variables referenced after optimization */
    temporariesAfter: number;
    /** Net temporary variables eliminated */
    temporariesEliminated: number;
    /** Percentage reduction in temporary variables */
    temporaryReductionPercent: number;
    /** Total Basic Blocks (`B1, B2, ...`) before optimization */
    basicBlocksBefore: number;
    /** Total Basic Blocks after optimization */
    basicBlocksAfter: number;
    /** Net Basic Blocks eliminated/merged */
    basicBlocksEliminated: number;
    /** Total jump/branch instructions (`GOTO`, `IF_FALSE`, `IF_TRUE`) before optimization */
    jumpsBefore: number;
    /** Total jump/branch instructions after optimization */
    jumpsAfter: number;
    /** Net jump instructions eliminated */
    jumpsEliminated: number;
    /** Weighted abstract execution cost before optimization */
    executionCostBefore: number;
    /** Weighted abstract execution cost after optimization */
    executionCostAfter: number;
    /** Estimated runtime execution improvement percentage (`0` to `100`) */
    estimatedRuntimeImprovementPercent: number;
    /** Total discrete transformations applied across all passes */
    totalTransformations: number;
    /** Total passes executed */
    passesExecutedCount: number;
    /** Total optimization wall-clock duration in milliseconds */
    totalDurationMs: number;
}
export interface SideBySideDiffRow {
    rowNumber: number;
    beforeIndex: number | null;
    afterIndex: number | null;
    beforeInstructionId: string | null;
    afterInstructionId: string | null;
    beforeBasicBlockId: string | null;
    afterBasicBlockId: string | null;
    beforeTAC: string;
    afterTAC: string;
    status: 'UNCHANGED' | 'MODIFIED' | 'REMOVED' | 'ADDED';
    passName?: OptimizationPassName;
    reason?: string;
}
export interface OptimizationReport {
    policyName: string;
    optimizationLevel: 0 | 1 | 2;
    passesExecuted: string[];
    metrics: OptimizationMetricsSummary;
    passSnapshots: PassExecutionSnapshot[];
    transformations: TransformationRecord[];
    deadEntityWarnings: DeadEntityWarning[];
    sideBySideDiff: SideBySideDiffRow[];
    validation: IRValidationResult;
    formattedReport: string;
    formattedDiffTable: string;
}
/**
 * Individual, self-contained optimization pass (Strategy Pattern).
 */
export interface OptimizationPass {
    name: OptimizationPassName;
    /** Human-readable title of the pass */
    title?: string;
    /** Minimum optimization level required to apply this pass (`1` or `2`) */
    level: 0 | 1 | 2;
    /** Human-readable description of what this pass does */
    description: string;
    /**
     * Applies this optimization pass to the given IR program.
     * Preserves program semantics and returns a freshly rebuilt, validated {@link IRProgram}.
     *
     * @param program - The IR program to optimize (treated as immutable).
     * @returns A new {@link IRProgram} with the pass applied.
     */
    apply(program: IRProgram): IRProgram;
    /**
     * Returns statistics captured during the most recent call to {@link apply}.
     */
    stats(): PassStatistics;
    /**
     * Returns transformation records captured during the most recent call to {@link apply}.
     */
    getTransformations?(): TransformationRecord[];
}
export interface OptimizationOptions {
    /** Optimization aggressiveness level (`0` = None, `1` = Basic, `2` = Full 12-pass pipeline; default `2`) */
    level?: 0 | 1 | 2;
    /** Optional explicit whitelist of passes to enable */
    enabledPasses?: OptimizationPassName[];
    /** Optional explicit blacklist of passes to disable */
    disabledPasses?: OptimizationPassName[];
    /** Optional Symbol Table from Semantic Analysis for Dead Policy/Variable/Constant detection */
    symbolTable?: ISymbolTable;
    /** Optional AST Repository for semantic metadata lookup */
    astRepository?: ASTRepository;
    /** Number of fixed-point iterations for cascading optimizations (default `2`) */
    maxIterations?: number;
}
/**
 * Complete output returned by the Optimization Engine (`OptimizationManager` / `Optimizer`).
 */
export interface OptimizationResult {
    /** The original, unmodified IR program */
    originalProgram: IRProgram;
    /** The IR program after all applicable passes have been applied */
    optimizedProgram: IRProgram;
    /** Names of the passes that were run, in application order */
    passesApplied: string[];
    /** Instruction count before optimization */
    totalInstructionsBefore: number;
    /** Instruction count after optimization */
    totalInstructionsAfter: number;
    /** Optimized Three Address Code instructions */
    optimizedTAC: ThreeAddressInstruction[];
    /** Optimized Quadruple table */
    optimizedQuadruples: Quadruple[];
    /** Optimized Triple table */
    optimizedTriples: Triple[];
    /** Optimized Indirect Triple table */
    optimizedIndirectTriples: IndirectTripleTable;
    /** Optimized Basic Blocks */
    optimizedBasicBlocks: BasicBlock[];
    /** Optimized Control Flow Graph */
    optimizedCFG: ControlFlowGraph;
    /** Complete Transformation History across all passes */
    transformationHistory: TransformationRecord[];
    /** Dead Policy / Function / Variable / Constant warnings */
    deadEntityWarnings: DeadEntityWarning[];
    /** Detailed Performance & Reduction Metrics */
    statistics: OptimizationMetricsSummary;
    /** Side-by-Side Before vs. After IR Diff rows */
    sideBySideDiff: SideBySideDiffRow[];
    /** Per-pass execution timeline and snapshots */
    passSnapshots: PassExecutionSnapshot[];
    /** Complete structured and human-readable Optimization Report */
    report: OptimizationReport;
}
export interface IOptimizer {
    /**
     * Runs all registered optimization passes that are applicable at the
     * specified optimization level, in dependency order.
     *
     * @param program - The IR program to optimize.
     * @param level   - Optimization aggressiveness (`0 | 1 | 2`, default `2`).
     * @param options - Optional fine-grained pass configuration and symbol table.
     * @returns {@link OptimizationResult} containing both programs, reports, and statistics.
     */
    optimize(program: IRProgram, level?: 0 | 1 | 2, options?: OptimizationOptions): OptimizationResult;
    /**
     * Registers a custom optimization pass.
     */
    registerPass(pass: OptimizationPass): void;
    /**
     * Returns all currently registered passes in registration order.
     */
    getPasses(): OptimizationPass[];
}
//# sourceMappingURL=optimizer.interface.d.ts.map