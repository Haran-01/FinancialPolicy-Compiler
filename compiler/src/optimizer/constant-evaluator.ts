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

const NO_FOLD: ConstantFoldOutcome = {
  folded: false,
  value: null,
  dataType: 'unknown',
  explanation: '',
};

export class ConstantEvaluator {
  /**
   * Returns true if the given operand is a compile-time constant literal.
   */
  public isConstant(operand: IROperand | null | undefined): operand is IROperand & { kind: 'constant' } {
    return operand !== null && operand !== undefined && operand.kind === 'constant';
  }

  /**
   * Attempts to evaluate a unary or binary IR instruction whose operands are constants.
   */
  public evaluate(
    opcode: IROpcode,
    operands: IROperand[],
    fallbackType: FPLDataType = 'unknown',
  ): ConstantFoldOutcome {
    if (operands.length === 1) {
      return this.evaluateUnary(opcode, operands[0], fallbackType);
    }
    if (operands.length === 2) {
      return this.evaluateBinary(opcode, operands[0], operands[1], fallbackType);
    }
    if (operands.length === 3 && opcode === 'BETWEEN') {
      return this.evaluateBetween(operands[0], operands[1], operands[2]);
    }
    return NO_FOLD;
  }

  /**
   * Evaluates unary operations (`NEG`, `NOT`, `NULL_CHECK`, `ASSIGN`, `LOAD_CONST`) on a constant operand.
   */
  public evaluateUnary(
    opcode: IROpcode,
    op: IROperand,
    fallbackType: FPLDataType = 'unknown',
  ): ConstantFoldOutcome {
    if (!this.isConstant(op)) {
      return NO_FOLD;
    }

    const val = op.value;
    const type = op.dataType ?? fallbackType;

    switch (opcode) {
      case 'NEG': {
        if (typeof val === 'number') {
          const result = -val;
          return {
            folded: true,
            value: Object.is(result, -0) ? 0 : result,
            dataType: type !== 'unknown' ? type : Number.isInteger(result) ? 'int' : 'decimal',
            explanation: `Evaluated unary negation -(${val}) = ${result}`,
          };
        }
        return NO_FOLD;
      }

      case 'NOT': {
        if (typeof val === 'boolean') {
          const result = !val;
          return {
            folded: true,
            value: result,
            dataType: 'boolean',
            explanation: `Evaluated logical NOT(${val}) = ${result}`,
          };
        }
        return NO_FOLD;
      }

      case 'NULL_CHECK': {
        const result = val === null;
        return {
          folded: true,
          value: result,
          dataType: 'boolean',
          explanation: `Evaluated constant null check (${String(val)} IS NULL) = ${result}`,
        };
      }

      default:
        return NO_FOLD;
    }
  }

  /**
   * Evaluates binary operations on two constant operands.
   */
  public evaluateBinary(
    opcode: IROpcode,
    leftOp: IROperand,
    rightOp: IROperand,
    fallbackType: FPLDataType = 'unknown',
  ): ConstantFoldOutcome {
    // Special short-circuit constant folding even when only ONE operand is constant
    // e.g., `false AND x -> false`, `true OR x -> true` (only when other operand is pure variable/temp)
    if (!this.isConstant(leftOp) || !this.isConstant(rightOp)) {
      return NO_FOLD;
    }

    const left = leftOp.value;
    const right = rightOp.value;
    const inferredNumericType = this.resolveNumericType(
      leftOp.dataType,
      rightOp.dataType,
      left,
      right,
      fallbackType,
    );

    // ── Arithmetic Operations ──────────────────────────────────────────────
    if (typeof left === 'number' && typeof right === 'number') {
      switch (opcode) {
        case 'ADD': {
          const res = this.roundPrecision(left + right);
          return {
            folded: true,
            value: res,
            dataType: inferredNumericType,
            explanation: `Constant folded ${left} + ${right} = ${res}`,
          };
        }
        case 'SUB': {
          const res = this.roundPrecision(left - right);
          return {
            folded: true,
            value: res,
            dataType: inferredNumericType,
            explanation: `Constant folded ${left} - ${right} = ${res}`,
          };
        }
        case 'MUL': {
          const res = this.roundPrecision(left * right);
          return {
            folded: true,
            value: res,
            dataType: inferredNumericType,
            explanation: `Constant folded ${left} * ${right} = ${res}`,
          };
        }
        case 'DIV': {
          if (right === 0) {
            return NO_FOLD; // Never fold division by zero at compile time
          }
          const raw = left / right;
          const res =
            inferredNumericType === 'int' && Number.isInteger(raw)
              ? raw
              : this.roundPrecision(raw);
          return {
            folded: true,
            value: res,
            dataType: Number.isInteger(res) && inferredNumericType === 'int' ? 'int' : 'decimal',
            explanation: `Constant folded ${left} / ${right} = ${res}`,
          };
        }
        case 'MOD': {
          if (right === 0) {
            return NO_FOLD;
          }
          const res = this.roundPrecision(left % right);
          return {
            folded: true,
            value: res,
            dataType: inferredNumericType,
            explanation: `Constant folded ${left} % ${right} = ${res}`,
          };
        }
        case 'POW': {
          const res = this.roundPrecision(Math.pow(left, right));
          if (!Number.isFinite(res)) {
            return NO_FOLD;
          }
          return {
            folded: true,
            value: res,
            dataType: inferredNumericType,
            explanation: `Constant folded ${left} ^ ${right} = ${res}`,
          };
        }
        case 'PERCENT_OF': {
          const res = this.roundPrecision((left / 100) * right);
          return {
            folded: true,
            value: res,
            dataType: 'decimal',
            explanation: `Constant folded ${left}% OF ${right} = ${res}`,
          };
        }
        case 'GT':
          return {
            folded: true,
            value: left > right,
            dataType: 'boolean',
            explanation: `Constant folded comparison ${left} > ${right} = ${left > right}`,
          };
        case 'LT':
          return {
            folded: true,
            value: left < right,
            dataType: 'boolean',
            explanation: `Constant folded comparison ${left} < ${right} = ${left < right}`,
          };
        case 'GTE':
          return {
            folded: true,
            value: left >= right,
            dataType: 'boolean',
            explanation: `Constant folded comparison ${left} >= ${right} = ${left >= right}`,
          };
        case 'LTE':
          return {
            folded: true,
            value: left <= right,
            dataType: 'boolean',
            explanation: `Constant folded comparison ${left} <= ${right} = ${left <= right}`,
          };
        case 'EQ':
          return {
            folded: true,
            value: left === right,
            dataType: 'boolean',
            explanation: `Constant folded equality ${left} == ${right} = ${left === right}`,
          };
        case 'NEQ':
          return {
            folded: true,
            value: left !== right,
            dataType: 'boolean',
            explanation: `Constant folded inequality ${left} != ${right} = ${left !== right}`,
          };
        default:
          break;
      }
    }

    // ── String Concatenation & String Equality ─────────────────────────────
    if (typeof left === 'string' && typeof right === 'string') {
      if (opcode === 'ADD') {
        const res = left + right;
        return {
          folded: true,
          value: res,
          dataType: 'string',
          explanation: `Constant folded string concatenation "${left}" + "${right}" = "${res}"`,
        };
      }
      if (opcode === 'EQ') {
        return {
          folded: true,
          value: left === right,
          dataType: 'boolean',
          explanation: `Constant folded string equality "${left}" == "${right}" = ${left === right}`,
        };
      }
      if (opcode === 'NEQ') {
        return {
          folded: true,
          value: left !== right,
          dataType: 'boolean',
          explanation: `Constant folded string inequality "${left}" != "${right}" = ${left !== right}`,
        };
      }
    }

    // ── Boolean Logical Operations ─────────────────────────────────────────
    if (typeof left === 'boolean' && typeof right === 'boolean') {
      switch (opcode) {
        case 'AND':
          return {
            folded: true,
            value: left && right,
            dataType: 'boolean',
            explanation: `Constant folded logical ${left} AND ${right} = ${left && right}`,
          };
        case 'OR':
          return {
            folded: true,
            value: left || right,
            dataType: 'boolean',
            explanation: `Constant folded logical ${left} OR ${right} = ${left || right}`,
          };
        case 'EQ':
          return {
            folded: true,
            value: left === right,
            dataType: 'boolean',
            explanation: `Constant folded boolean equality ${left} == ${right} = ${left === right}`,
          };
        case 'NEQ':
          return {
            folded: true,
            value: left !== right,
            dataType: 'boolean',
            explanation: `Constant folded boolean inequality ${left} != ${right}" = ${left !== right}`,
          };
        default:
          break;
      }
    }

    // ── Null Coalescing (`left ?? right`) ──────────────────────────────────
    if (opcode === 'NULL_COALESCE') {
      const chosen = left !== null ? left : right;
      const chosenType = left !== null ? (leftOp.dataType ?? fallbackType) : (rightOp.dataType ?? fallbackType);
      return {
        folded: true,
        value: chosen,
        dataType: chosenType,
        explanation: `Constant folded null coalesce ${String(left)} ?? ${String(right)} = ${String(chosen)}`,
      };
    }

    return NO_FOLD;
  }

  /**
   * Evaluates ternary `BETWEEN` (`val BETWEEN lo AND hi`) when all 3 operands are numeric constants.
   */
  public evaluateBetween(
    valOp: IROperand,
    loOp: IROperand,
    hiOp: IROperand,
  ): ConstantFoldOutcome {
    if (
      this.isConstant(valOp) &&
      this.isConstant(loOp) &&
      this.isConstant(hiOp) &&
      typeof valOp.value === 'number' &&
      typeof loOp.value === 'number' &&
      typeof hiOp.value === 'number'
    ) {
      const result = valOp.value >= loOp.value && valOp.value <= hiOp.value;
      return {
        folded: true,
        value: result,
        dataType: 'boolean',
        explanation: `Constant folded ${valOp.value} BETWEEN ${loOp.value} AND ${hiOp.value} = ${result}`,
      };
    }
    return NO_FOLD;
  }

  /**
   * Avoids IEEE-754 floating point drift (e.g. `0.1 + 0.2 -> 0.3`).
   */
  private roundPrecision(num: number): number {
    if (Number.isInteger(num)) {
      return Object.is(num, -0) ? 0 : num;
    }
    return Number(num.toFixed(10));
  }

  private resolveNumericType(
    leftType: FPLDataType | undefined,
    rightType: FPLDataType | undefined,
    leftVal: unknown,
    rightVal: unknown,
    fallbackType: FPLDataType,
  ): FPLDataType {
    if (leftType === 'currency' || rightType === 'currency') return 'currency';
    if (leftType === 'percentage' || rightType === 'percentage') return 'percentage';
    if (leftType === 'decimal' || rightType === 'decimal') return 'decimal';
    if (
      typeof leftVal === 'number' &&
      typeof rightVal === 'number' &&
      (!Number.isInteger(leftVal) || !Number.isInteger(rightVal))
    ) {
      return 'decimal';
    }
    if (leftType === 'int' && rightType === 'int') return 'int';
    if (fallbackType !== 'unknown') return fallbackType;
    return 'int';
  }
}
