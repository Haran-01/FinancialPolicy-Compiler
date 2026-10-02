/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Metrics & Cost Calculator
 *
 * Computes quantitative performance metrics comparing the unoptimized
 * `IRProgram` against the optimized `IRProgram`:
 *   - Instruction Count Reduction & Percentage
 *   - Temporary Variable Reduction & Percentage
 *   - Basic Block Count Reduction (excluding synthetic ENTRY/EXIT or total)
 *   - Jump/Branch Instruction Reduction
 *   - Weighted Execution Cost Before vs. After & Estimated Runtime Improvement %
 * ============================================================================
 */
import type { IRInstruction, IRProgram } from '../ir/ir.interface';
import type { OptimizationMetricsSummary, PassExecutionSnapshot, TransformationRecord } from './optimizer.interface';
export declare class OptimizationMetrics {
    private readonly expressionAnalyzer;
    /**
     * Computes the complete `OptimizationMetricsSummary` for an optimization run.
     */
    computeMetrics(originalProgram: IRProgram, optimizedProgram: IRProgram, transformations: TransformationRecord[], passSnapshots: PassExecutionSnapshot[], totalDurationMs: number): OptimizationMetricsSummary;
    /**
     * Computes the weighted execution cost of an instruction list.
     */
    computeTotalExecutionCost(instructions: IRInstruction[]): number;
    /**
     * Counts conditional and unconditional jump instructions.
     */
    countJumpInstructions(instructions: IRInstruction[]): number;
}
//# sourceMappingURL=optimization-metrics.d.ts.map