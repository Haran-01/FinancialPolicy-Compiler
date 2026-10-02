/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Expression Analyzer
 *
 * Provides pure expression analysis utilities used across multiple passes:
 *   1. Canonical Expression Key Hashing (with commutativity normalization)
 *      for Common Subexpression Elimination (Pass 4)
 *   2. Algebraic Identity Detection (Pass 8: `x + 0 -> x`, `x * 1 -> x`,
 *      `x * 0 -> 0`, `x AND true -> x`, `x OR false -> x`, `x == x -> true`, etc.)
 *   3. Strength Reduction Pattern Detection (Pass 7: `x * 2 -> x + x`,
 *      `x ^ 2 -> x * x`, `x ^ 1 -> x`, `x ^ 0 -> 1`, `x / 1 -> x`)
 *   4. Instruction Cost Estimation for Rule Reordering (Pass 12) & Metrics
 * ============================================================================
 */
import type { IRInstruction, IROpcode, IROperand } from '../ir/ir.interface';
export interface AlgebraicSimplificationMatch {
    matched: boolean;
    replacementOpcode: IROpcode;
    replacementOperatorSymbol: string;
    replacementOperands: IROperand[];
    explanation: string;
}
export interface StrengthReductionMatch {
    matched: boolean;
    replacementOpcode: IROpcode;
    replacementOperatorSymbol: string;
    replacementOperands: IROperand[];
    explanation: string;
}
export declare class ExpressionAnalyzer {
    /**
     * Returns true if the instruction is a pure expression computation without
     * control-flow or external side effects (eligible for CSE and DCE if unused).
     */
    isPureComputation(inst: IRInstruction): boolean;
    /**
     * Returns true if the instruction is a non-trivial expression eligible for
     * Common Subexpression Elimination (CSE).
     */
    isCSEEligible(inst: IRInstruction): boolean;
    /**
     * Serializes an `IROperand` into a canonical token key.
     */
    serializeOperand(op: IROperand): string;
    /**
     * Returns true if two operands refer to the exact same variable, temporary, or constant.
     */
    areOperandsEqual(a: IROperand | undefined, b: IROperand | undefined): boolean;
    /**
     * Computes a canonical signature key for an expression instruction.
     * Normalizes operand ordering for commutative operators (`+`, `*`, `==`, `!=`, `AND`, `OR`)
     * so that `salary + bonus` and `bonus + salary` hash to the exact same key!
     */
    computeExpressionKey(inst: IRInstruction): string | null;
    /**
     * Extracts all variable and temporary names referenced as source operands in `inst`.
     */
    getReferencedNames(inst: IRInstruction): string[];
    /**
     * Extracts the defined destination variable or temporary name, if any.
     */
    getDefinedName(inst: IRInstruction): string | null;
    /**
     * Detects expensive operations that can be replaced with cheaper equivalents:
     * - `x * 2` or `2 * x`  -> `x + x`
     * - `x ^ 2`             -> `x * x`
     * - `x ^ 1`             -> `x`
     * - `x ^ 0`             -> `1`
     * - `x / 1`             -> `x`
     */
    matchStrengthReduction(inst: IRInstruction): StrengthReductionMatch;
    /**
     * Detects algebraic identities and simplifies them into direct assignments or constants:
     * - `x + 0 -> x`, `0 + x -> x`
     * - `x - 0 -> x`, `x - x -> 0`
     * - `x * 1 -> x`, `1 * x -> x`
     * - `x * 0 -> 0`, `0 * x -> 0`
     * - `x / 1 -> x`
     * - `x AND true -> x`, `true AND x -> x`
     * - `x AND false -> false`, `false AND x -> false`
     * - `x AND x -> x`
     * - `x OR false -> x`, `false OR x -> x`
     * - `x OR true -> true`, `true OR x -> true`
     * - `x OR x -> x`
     * - `x == x -> true`, `x != x -> false`, `x >= x -> true`, `x <= x -> true`, `x > x -> false`, `x < x -> false`
     * - `x == true -> x`, `x == false -> NOT x`
     */
    matchAlgebraicSimplification(inst: IRInstruction): AlgebraicSimplificationMatch;
    /**
     * Estimates the abstract execution cost of a single `IRInstruction`.
     * Used by Pass 12 (`RuleReorderingPass`) and `OptimizationMetrics`.
     */
    estimateInstructionCost(inst: IRInstruction): number;
    formatOperand(op: IROperand): string;
}
//# sourceMappingURL=expression-analyzer.d.ts.map