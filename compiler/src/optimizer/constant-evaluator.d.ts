/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Constant Evaluator
 *
 * Safely evaluates compile-time constant expressions across arithmetic,
 * comparison, logical, and FPL financial domain opcodes.
 *
 * Guarantees:
 *   - Never folds division/modulo by zero (leaves instruction untouched for
 *     runtime diagnostics).
 *   - Preserves FPL data types (`int`, `decimal`, `boolean`, `string`, `currency`, `percentage`).
 *   - Handles both binary and unary constant operations deterministically.
 * ============================================================================
 */
import type { IROpcode, IROperand } from '../ir/ir.interface';
import type { FPLDataType } from '../symbol-table/symbol-table.interface';
export interface ConstantFoldOutcome {
    folded: boolean;
    value: string | number | boolean | null;
    dataType: FPLDataType;
    explanation: string;
}
export declare class ConstantEvaluator {
    /**
     * Returns true if the given operand is a compile-time constant literal.
     */
    isConstant(operand: IROperand | null | undefined): operand is IROperand & {
        kind: 'constant';
    };
    /**
     * Attempts to evaluate a unary or binary IR instruction whose operands are constants.
     */
    evaluate(opcode: IROpcode, operands: IROperand[], fallbackType?: FPLDataType): ConstantFoldOutcome;
    /**
     * Evaluates unary operations (`NEG`, `NOT`, `NULL_CHECK`, `ASSIGN`, `LOAD_CONST`) on a constant operand.
     */
    evaluateUnary(opcode: IROpcode, op: IROperand, fallbackType?: FPLDataType): ConstantFoldOutcome;
    /**
     * Evaluates binary operations on two constant operands.
     */
    evaluateBinary(opcode: IROpcode, leftOp: IROperand, rightOp: IROperand, fallbackType?: FPLDataType): ConstantFoldOutcome;
    /**
     * Evaluates ternary `BETWEEN` (`val BETWEEN lo AND hi`) when all 3 operands are numeric constants.
     */
    evaluateBetween(valOp: IROperand, loOp: IROperand, hiOp: IROperand): ConstantFoldOutcome;
    /**
     * Avoids IEEE-754 floating point drift (e.g. `0.1 + 0.2 -> 0.3`).
     */
    private roundPrecision;
    private resolveNumericType;
}
//# sourceMappingURL=constant-evaluator.d.ts.map