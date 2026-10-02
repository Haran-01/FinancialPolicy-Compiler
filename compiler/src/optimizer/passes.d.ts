/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — The 12 IR Optimization Passes
 *
 * Implements all 12 production compiler optimization passes using the
 * Strategy Pattern (`OptimizationPass` contract):
 *
 *   Pass 1:  ConstantFoldingPass               (`CONSTANT_FOLDING`)
 *   Pass 2:  ConstantPropagationPass           (`CONSTANT_PROPAGATION`)
 *   Pass 3:  CopyPropagationPass               (`COPY_PROPAGATION`)
 *   Pass 4:  CommonSubexpressionEliminationPass(`COMMON_SUBEXPRESSION`)
 *   Pass 5:  DeadCodeEliminationPass           (`DEAD_CODE_ELIMINATION`)
 *   Pass 6:  DeadPolicyEliminationPass         (`DEAD_POLICY_ELIMINATION`)
 *   Pass 7:  StrengthReductionPass             (`STRENGTH_REDUCTION`)
 *   Pass 8:  AlgebraicSimplificationPass       (`ALGEBRAIC_SIMPLIFICATION`)
 *   Pass 9:  ConditionalSimplificationPass     (`CONDITIONAL_SIMPLIFICATION`)
 *   Pass 10: JumpOptimizationPass              (`JUMP_OPTIMIZATION`)
 *   Pass 11: BasicBlockOptimizationPass        (`BASIC_BLOCK_OPTIMIZATION`)
 *   Pass 12: RuleReorderingPass                (`RULE_REORDERING`)
 *
 * Every pass preserves program semantics, records granular
 * `TransformationRecord` entries in `OptimizationContext`, and returns a
 * freshly rebuilt, validated `IRProgram`.
 * ============================================================================
 */
import type { IRInstruction, IRProgram } from '../ir/ir.interface';
import { ControlFlowAnalyzer } from './control-flow-analyzer';
import { DataFlowAnalyzer } from './data-flow-analyzer';
import { OptimizationContext } from './optimization-context';
import type { OptimizationPass, OptimizationPassName, PassStatistics, TransformationRecord } from './optimizer.interface';
export declare abstract class BaseOptimizationPass implements OptimizationPass {
    abstract readonly name: OptimizationPassName;
    abstract readonly title: string;
    abstract readonly level: 0 | 1 | 2;
    abstract readonly description: string;
    protected readonly context: OptimizationContext;
    protected readonly dataFlow: DataFlowAnalyzer;
    protected readonly controlFlow: ControlFlowAnalyzer;
    private lastStats;
    private lastPassTransformations;
    constructor(context?: OptimizationContext);
    apply(program: IRProgram): IRProgram;
    stats(): PassStatistics;
    getTransformations(): TransformationRecord[];
    protected abstract transformInstructions(instructions: IRInstruction[], program: IRProgram): IRInstruction[];
}
/**
 * Pass 1 — Constant Folding:
 * Evaluates constant expressions at compile time:
 *   - Arithmetic: `10000 + 5000 -> 15000`, `20 * 3 -> 60`, `100 / 4 -> 25`
 *   - Comparison: `25 >= 21 -> true`, `50 == 50 -> true`
 *   - Logical:    `true AND false -> false`, `NOT false -> true`
 *   - Domain:     `10 % OF 500 -> 50`, `25 BETWEEN 21 AND 60 -> true`
 */
export declare class ConstantFoldingPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Constant Folding";
    readonly level: 1;
    readonly description = "Evaluates constant arithmetic, relational, logical, and financial expressions at compile time.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 2 — Constant Propagation:
 * Substitutes known compile-time constant values assigned to variables or
 * temporaries (`x = 100`) into subsequent instructions (`y = x + 20 -> y = 100 + 20`),
 * and folds resulting constant expressions immediately (`y = 120`).
 */
export declare class ConstantPropagationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Constant Propagation";
    readonly level: 1;
    readonly description = "Propagates known compile-time constant values assigned to variables and temporaries into downstream uses.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 3 — Copy Propagation:
 * Replaces occurrences of targets of direct assignments (`a = salary; b = a`)
 * with the original source variable/temporary (`b = salary`).
 */
export declare class CopyPropagationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Copy Propagation";
    readonly level: 2;
    readonly description = "Replaces variable and temporary copy chains (a = salary; b = a) with direct references to the original value (b = salary).";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 4 — Common Subexpression Elimination (CSE):
 * Detects repeated computations of the same expression (`t1 = salary + bonus; t2 = salary + bonus`
 * or commutative `t2 = bonus + salary`) within a Basic Block and replaces the duplicate
 * computation with a direct reference (`t2 = t1`).
 */
export declare class CommonSubexpressionEliminationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Common Subexpression Elimination (CSE)";
    readonly level: 2;
    readonly description = "Eliminates duplicate arithmetic, relational, and logical computations by reusing previously computed temporary results.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 5 — Dead Code Elimination (DCE):
 * Eliminates three classes of dead IR instructions:
 *   1. Unreachable instructions immediately following unconditional terminators
 *      (`RETURN`, `GOTO`, `THROW`, `HALT`)
 *      up to the next `LABEL`.
 *   2. Overwritten dead variable assignments within a Basic Block (`x = 100; x = 200`
 *      where `x = 100` is never read before being overwritten).
 *   3. Unused temporary variable definitions (`t_k = ...` where `t_k` is never referenced
 *      by any live instruction), iterated to a fixed point.
 */
export declare class DeadCodeEliminationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Dead Code Elimination (DCE)";
    readonly level: 1;
    readonly description = "Removes unreachable instructions after terminal decisions/jumps, overwritten variable stores, and unused temporary computations.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 6 — Dead Policy Elimination:
 * Detects and warns about:
 *   - Unused helper functions (`L_FUNC_<name>` never invoked by `CALL`)
 *   - Unused rules (`L_RULE_<name>` never applied by `RULE_APPLY`)
 *   - Unreferenced secondary policies (`OPT-W001`)
 *   - Unused local variables (`LET`/`VAR`) and constants (`CONST`) whose values
 *     are never read anywhere in the policy (`OPT-W003`, `OPT-W004`)
 * Also removes pure dead variable/constant initialization instructions that have
 * zero downstream uses.
 */
export declare class DeadPolicyEliminationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Dead Policy & Symbol Elimination";
    readonly level: 2;
    readonly description = "Detects unused policies, unused functions, unused rules, unused variables, and unused constants, generating warnings and pruning dead initializers.";
    protected transformInstructions(instructions: IRInstruction[], program: IRProgram): IRInstruction[];
}
/**
 * Pass 7 — Strength Reduction:
 * Replaces expensive arithmetic operations with cheaper equivalents:
 *   - `salary * 2` or `2 * salary` -> `salary + salary`
 *   - `x ^ 2`                      -> `x * x`
 *   - `x ^ 1`                      -> `x`
 *   - `x ^ 0`                      -> `1`
 *   - `x / 1`                      -> `x`
 */
export declare class StrengthReductionPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Strength Reduction";
    readonly level: 2;
    readonly description = "Replaces expensive operations (such as multiplication by 2 or exponentiation by 2) with faster addition or multiplication instructions.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 8 — Algebraic Simplification:
 * Simplifies mathematical and boolean identities:
 *   - `x + 0 -> x`, `0 + x -> x`
 *   - `x - 0 -> x`, `x - x -> 0`
 *   - `x * 1 -> x`, `1 * x -> x`
 *   - `x * 0 -> 0`, `0 * x -> 0`
 *   - `x / 1 -> x`
 *   - `x AND true -> x`, `x AND false -> false`, `x AND x -> x`
 *   - `x OR false -> x`, `x OR true -> true`, `x OR x -> x`
 *   - `x == x -> true`, `x != x -> false`, `x >= x -> true`, `x <= x -> true`
 */
export declare class AlgebraicSimplificationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Algebraic Simplification";
    readonly level: 2;
    readonly description = "Simplifies algebraic and boolean identity expressions (x + 0 -> x, x * 1 -> x, x * 0 -> 0, x AND true -> x, x OR false -> x).";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 9 — Conditional Simplification:
 * Simplifies conditional branches (`IF_FALSE` / `IF_TRUE`) whose condition operand
 * is a known compile-time boolean constant:
 *   - `IF_FALSE true GOTO L_else`: Branch is never taken -> remove the branch instruction!
 *   - `IF_FALSE false GOTO L_else`: Branch is always taken -> replace with `GOTO L_else`!
 *   - `IF_TRUE true GOTO L_then`: Branch is always taken -> replace with `GOTO L_then`!
 *   - `IF_TRUE false GOTO L_then`: Branch is never taken -> remove the branch instruction!
 * Also prunes dead target blocks that become completely unreferenced as a result.
 */
export declare class ConditionalSimplificationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Conditional Simplification";
    readonly level: 1;
    readonly description = "Simplifies conditional branches with constant boolean conditions (IF TRUE / IF FALSE) and eliminates unreachable branches.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 10 — Jump Optimization:
 * Optimizes control-flow transfers:
 *   1. Coalesces consecutive labels (`LABEL L2; LABEL L3` -> redirects `L3` to `L2`).
 *   2. Threads jump-to-jump chains (`GOTO L1` where `L1: GOTO L2` -> `GOTO L2`).
 *   3. Eliminates redundant jumps to the immediately following label (`GOTO L3; LABEL L3`).
 *   4. Removes unreferenced internal branch labels (preserving entry labels `L1`, `L_FUNC_*`, `L_RULE_*`).
 */
export declare class JumpOptimizationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Jump & Label Optimization";
    readonly level: 2;
    readonly description = "Removes redundant jumps to the next instruction, threads jump-to-jump chains, and coalesces consecutive labels.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Pass 11 — Basic Block Optimization:
 * Optimizes the Control Flow Graph and Basic Block structure:
 *   1. Removes instructions in unreachable Basic Blocks (`!block.isReachable`).
 *   2. Eliminates redundant conditional branches where both True and False paths
 *      lead to the exact same target label.
 *   3. Merges adjacent linear Basic Blocks by removing unreferenced internal labels
 *      (preserving top-level policy/function/rule entry labels `L1`, `L_FUNC_*`, `L_RULE_*`).
 */
export declare class BasicBlockOptimizationPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Basic Block & CFG Optimization";
    readonly level: 2;
    readonly description = "Merges adjacent linear basic blocks, eliminates unreachable basic blocks, and removes redundant conditional branches.";
    protected transformInstructions(instructions: IRInstruction[], program: IRProgram): IRInstruction[];
}
/**
 * Pass 12 — Rule Reordering:
 * Optimizes condition evaluation order:
 *   1. Within a Basic Block, when an expensive `CALL` / `POLICY_CALL` temporary
 *      computation immediately precedes a cheap relational comparison (`age >= 21`)
 *      and both feed a logical `AND` / `OR` conjunction without data hazards,
 *      reorders the cheap comparison before the expensive call.
 *   2. Normalizes `AND` / `OR` operand order so the cheaper temporary/constant
 *      operand is evaluated as `arg1` before the expensive call temporary `arg2`.
 */
export declare class RuleReorderingPass extends BaseOptimizationPass {
    readonly name: OptimizationPassName;
    readonly title = "Rule & Condition Reordering";
    readonly level: 2;
    readonly description = "Reorders independent rule conditions so constant and simple relational checks execute before expensive function or policy calls.";
    protected transformInstructions(instructions: IRInstruction[]): IRInstruction[];
}
/**
 * Factory helper returning all 12 standard optimization passes bound to a shared `OptimizationContext`.
 */
export declare function createStandardOptimizationPasses(context: OptimizationContext): BaseOptimizationPass[];
//# sourceMappingURL=passes.d.ts.map