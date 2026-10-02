/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Pipeline & Optimization Manager
 *
 * Orchestrates the 12 IR Optimization Passes in dependency order:
 *   1. Constant Folding               (`CONSTANT_FOLDING`)
 *   2. Constant Propagation           (`CONSTANT_PROPAGATION`)
 *   3. Copy Propagation               (`COPY_PROPAGATION`)
 *   4. Common Subexpression Elim.     (`COMMON_SUBEXPRESSION`)
 *   5. Strength Reduction             (`STRENGTH_REDUCTION`)
 *   6. Algebraic Simplification       (`ALGEBRAIC_SIMPLIFICATION`)
 *   7. Conditional Simplification     (`CONDITIONAL_SIMPLIFICATION`)
 *   8. Rule Reordering                (`RULE_REORDERING`)
 *   9. Dead Code Elimination          (`DEAD_CODE_ELIMINATION`)
 *  10. Dead Policy Elimination        (`DEAD_POLICY_ELIMINATION`)
 *  11. Jump Optimization              (`JUMP_OPTIMIZATION`)
 *  12. Basic Block Optimization       (`BASIC_BLOCK_OPTIMIZATION`)
 *
 * Supports:
 *   - Optimization levels (`0` = None, `1` = Basic, `2` = Full 12-pass pipeline)
 *   - Enabling / disabling individual passes dynamically
 *   - Running a single pass in isolation (`runSinglePass`)
 *   - Multi-iteration fixed-point cascading so transformations unlocked by
 *     earlier passes (e.g., CSE -> Copy Propagation -> DCE, or Algebraic
 *     Simplification -> Conditional Simplification -> Jump/Block merging)
 *     are cleaned up completely.
 * ============================================================================
 */
import type { IRProgram } from '../ir/ir.interface';
import { OptimizationContext } from './optimization-context';
import { OptimizationMetrics } from './optimization-metrics';
import { OptimizationReporter } from './optimization-reporter';
import type { IOptimizer, OptimizationOptions, OptimizationPass, OptimizationPassName, OptimizationResult, PassExecutionSnapshot } from './optimizer.interface';
import { AlgebraicSimplificationPass, BasicBlockOptimizationPass, CommonSubexpressionEliminationPass, ConditionalSimplificationPass, ConstantFoldingPass, ConstantPropagationPass, CopyPropagationPass, DeadCodeEliminationPass, DeadPolicyEliminationPass, JumpOptimizationPass, RuleReorderingPass, StrengthReductionPass } from './passes';
export declare class OptimizationPipeline {
    readonly context: OptimizationContext;
    private passes;
    private readonly enabledStates;
    constructor(context?: OptimizationContext);
    /**
     * Registers an optimization pass in the pipeline and enables it by default.
     */
    registerPass(pass: OptimizationPass): void;
    /**
     * Enables a specific pass by name.
     */
    enablePass(name: OptimizationPassName): void;
    /**
     * Disables a specific pass by name.
     */
    disablePass(name: OptimizationPassName): void;
    /**
     * Sets whether a specific pass is enabled.
     */
    setPassEnabled(name: OptimizationPassName, enabled: boolean): void;
    /**
     * Returns true if the given pass is currently enabled.
     */
    isPassEnabled(name: OptimizationPassName): boolean;
    /**
     * Returns all registered optimization passes in execution order.
     */
    getPasses(): OptimizationPass[];
    /**
     * Replaces the pass execution order with the provided list of pass names.
     */
    setPassOrder(order: OptimizationPassName[]): void;
    /**
     * Executes a single named optimization pass in isolation on `program`.
     */
    runSinglePass(program: IRProgram, passName: OptimizationPassName): IRProgram;
    /**
     * Executes all enabled passes applicable at `level` across up to `maxIterations`
     * fixed-point rounds.
     */
    execute(program: IRProgram, level?: 0 | 1 | 2, options?: OptimizationOptions): {
        optimizedProgram: IRProgram;
        passesApplied: string[];
        passSnapshots: PassExecutionSnapshot[];
    };
}
/**
 * High-level Optimization Manager implementing `IOptimizer`.
 */
export declare class OptimizationManager implements IOptimizer {
    readonly pipeline: OptimizationPipeline;
    readonly metricsCalculator: OptimizationMetrics;
    readonly reporter: OptimizationReporter;
    constructor(pipeline?: OptimizationPipeline);
    /**
     * Runs the optimization pipeline on `program` at the specified `level` (`0 | 1 | 2`, default `2`).
     */
    optimize(program: IRProgram, level?: 0 | 1 | 2, options?: OptimizationOptions): OptimizationResult;
    registerPass(pass: OptimizationPass): void;
    getPasses(): OptimizationPass[];
    enablePass(name: OptimizationPassName): void;
    disablePass(name: OptimizationPassName): void;
}
/** Alias for `OptimizationManager` */
export { OptimizationManager as Optimizer };
/**
 * Convenience helper to optimize an `IRProgram` with all 12 passes (or custom options).
 */
export declare function optimizeIR(program: IRProgram, options?: OptimizationOptions): OptimizationResult;
export { ConstantFoldingPass, ConstantPropagationPass, CopyPropagationPass, CommonSubexpressionEliminationPass, DeadCodeEliminationPass, DeadPolicyEliminationPass, StrengthReductionPass, AlgebraicSimplificationPass, ConditionalSimplificationPass, JumpOptimizationPass, BasicBlockOptimizationPass, RuleReorderingPass, };
//# sourceMappingURL=optimization-pipeline.d.ts.map