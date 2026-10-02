"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionAnalyzer = void 0;
const COMMUTATIVE_OPCODES = new Set([
    'ADD',
    'MUL',
    'EQ',
    'NEQ',
    'AND',
    'OR',
]);
const PURE_EXPRESSION_OPCODES = new Set([
    'ADD',
    'SUB',
    'MUL',
    'DIV',
    'MOD',
    'POW',
    'NEG',
    'GT',
    'LT',
    'GTE',
    'LTE',
    'EQ',
    'NEQ',
    'AND',
    'OR',
    'NOT',
    'PERCENT_OF',
    'NULL_CHECK',
    'NULL_COALESCE',
    'IN_CHECK',
    'BETWEEN',
    'LOAD_FIELD',
    'LOAD_INDEX',
]);
class ExpressionAnalyzer {
    /**
     * Returns true if the instruction is a pure expression computation without
     * control-flow or external side effects (eligible for CSE and DCE if unused).
     */
    isPureComputation(inst) {
        if (!inst.destination)
            return false;
        if (inst.opcode === 'ASSIGN' ||
            inst.opcode === 'LOAD' ||
            inst.opcode === 'LOAD_CONST') {
            return true;
        }
        return PURE_EXPRESSION_OPCODES.has(inst.opcode);
    }
    /**
     * Returns true if the instruction is a non-trivial expression eligible for
     * Common Subexpression Elimination (CSE).
     */
    isCSEEligible(inst) {
        return (inst.destination !== null &&
            PURE_EXPRESSION_OPCODES.has(inst.opcode) &&
            inst.operands.length >= 1);
    }
    /**
     * Serializes an `IROperand` into a canonical token key.
     */
    serializeOperand(op) {
        switch (op.kind) {
            case 'variable':
                return `var:${op.name}`;
            case 'temporary':
                return `tmp:${op.name}`;
            case 'constant':
                return `const:${typeof op.value}:${String(op.value)}`;
            case 'label':
                return `lbl:${op.name}`;
            case 'register':
                return `reg:${op.name ?? op.id}`;
            case 'function':
                return `fn:${op.name}`;
            case 'policy':
                return `pol:${op.name}`;
        }
    }
    /**
     * Returns true if two operands refer to the exact same variable, temporary, or constant.
     */
    areOperandsEqual(a, b) {
        if (!a || !b)
            return false;
        return this.serializeOperand(a) === this.serializeOperand(b);
    }
    /**
     * Computes a canonical signature key for an expression instruction.
     * Normalizes operand ordering for commutative operators (`+`, `*`, `==`, `!=`, `AND`, `OR`)
     * so that `salary + bonus` and `bonus + salary` hash to the exact same key!
     */
    computeExpressionKey(inst) {
        if (!this.isCSEEligible(inst)) {
            return null;
        }
        const serializedArgs = inst.operands.map((op) => this.serializeOperand(op));
        if (COMMUTATIVE_OPCODES.has(inst.opcode) && serializedArgs.length === 2) {
            serializedArgs.sort();
        }
        return `${inst.opcode}(${serializedArgs.join(',')})`;
    }
    /**
     * Extracts all variable and temporary names referenced as source operands in `inst`.
     */
    getReferencedNames(inst) {
        const names = [];
        for (const op of inst.operands) {
            if (op.kind === 'variable' || op.kind === 'temporary') {
                names.push(op.name);
            }
        }
        return names;
    }
    /**
     * Extracts the defined destination variable or temporary name, if any.
     */
    getDefinedName(inst) {
        if (!inst.destination)
            return null;
        if (inst.destination.kind === 'variable' || inst.destination.kind === 'temporary') {
            return inst.destination.name;
        }
        return null;
    }
    // ───────────────────────────────────────────────────────────────────────────
    // Pass 7: Strength Reduction Pattern Matcher
    // ───────────────────────────────────────────────────────────────────────────
    /**
     * Detects expensive operations that can be replaced with cheaper equivalents:
     * - `x * 2` or `2 * x`  -> `x + x`
     * - `x ^ 2`             -> `x * x`
     * - `x ^ 1`             -> `x`
     * - `x ^ 0`             -> `1`
     * - `x / 1`             -> `x`
     */
    matchStrengthReduction(inst) {
        const noMatch = {
            matched: false,
            replacementOpcode: inst.opcode,
            replacementOperatorSymbol: inst.operatorSymbol,
            replacementOperands: inst.operands,
            explanation: '',
        };
        if (inst.operands.length !== 2) {
            return noMatch;
        }
        const [left, right] = inst.operands;
        // 1. `x * 2` or `2 * x` -> `x + x`
        if (inst.opcode === 'MUL') {
            if (right.kind === 'constant' && right.value === 2 && left.kind !== 'constant') {
                return {
                    matched: true,
                    replacementOpcode: 'ADD',
                    replacementOperatorSymbol: '+',
                    replacementOperands: [{ ...left }, { ...left }],
                    explanation: `Strength reduction: replaced multiplication '${this.formatOperand(left)} * 2' with addition '${this.formatOperand(left)} + ${this.formatOperand(left)}'`,
                };
            }
            if (left.kind === 'constant' && left.value === 2 && right.kind !== 'constant') {
                return {
                    matched: true,
                    replacementOpcode: 'ADD',
                    replacementOperatorSymbol: '+',
                    replacementOperands: [{ ...right }, { ...right }],
                    explanation: `Strength reduction: replaced multiplication '2 * ${this.formatOperand(right)}' with addition '${this.formatOperand(right)} + ${this.formatOperand(right)}'`,
                };
            }
        }
        // 2. `x ^ 2` -> `x * x`, `x ^ 1` -> `x`, `x ^ 0` -> `1`
        if (inst.opcode === 'POW' && right.kind === 'constant') {
            if (right.value === 2) {
                return {
                    matched: true,
                    replacementOpcode: 'MUL',
                    replacementOperatorSymbol: '*',
                    replacementOperands: [{ ...left }, { ...left }],
                    explanation: `Strength reduction: replaced exponentiation '${this.formatOperand(left)} ^ 2' with multiplication '${this.formatOperand(left)} * ${this.formatOperand(left)}'`,
                };
            }
            if (right.value === 1) {
                return {
                    matched: true,
                    replacementOpcode: 'ASSIGN',
                    replacementOperatorSymbol: '=',
                    replacementOperands: [{ ...left }],
                    explanation: `Strength reduction: replaced exponentiation '${this.formatOperand(left)} ^ 1' with direct assignment '${this.formatOperand(left)}'`,
                };
            }
            if (right.value === 0) {
                return {
                    matched: true,
                    replacementOpcode: 'ASSIGN',
                    replacementOperatorSymbol: '=',
                    replacementOperands: [{ kind: 'constant', value: 1, dataType: 'int' }],
                    explanation: `Strength reduction: replaced exponentiation '${this.formatOperand(left)} ^ 0' with constant 1`,
                };
            }
        }
        // 3. `x / 1` -> `x`
        if (inst.opcode === 'DIV' && right.kind === 'constant' && right.value === 1) {
            return {
                matched: true,
                replacementOpcode: 'ASSIGN',
                replacementOperatorSymbol: '=',
                replacementOperands: [{ ...left }],
                explanation: `Strength reduction: replaced division '${this.formatOperand(left)} / 1' with direct assignment '${this.formatOperand(left)}'`,
            };
        }
        return noMatch;
    }
    // ───────────────────────────────────────────────────────────────────────────
    // Pass 8: Algebraic Simplification Pattern Matcher
    // ───────────────────────────────────────────────────────────────────────────
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
    matchAlgebraicSimplification(inst) {
        const noMatch = {
            matched: false,
            replacementOpcode: inst.opcode,
            replacementOperatorSymbol: inst.operatorSymbol,
            replacementOperands: inst.operands,
            explanation: '',
        };
        if (inst.operands.length !== 2) {
            return noMatch;
        }
        const [left, right] = inst.operands;
        const sameOperand = this.areOperandsEqual(left, right);
        switch (inst.opcode) {
            case 'ADD': {
                if (right.kind === 'constant' && right.value === 0) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Algebraic identity: ${this.formatOperand(left)} + 0 = ${this.formatOperand(left)}`,
                    };
                }
                if (left.kind === 'constant' && left.value === 0) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...right }],
                        explanation: `Algebraic identity: 0 + ${this.formatOperand(right)} = ${this.formatOperand(right)}`,
                    };
                }
                break;
            }
            case 'SUB': {
                if (right.kind === 'constant' && right.value === 0) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Algebraic identity: ${this.formatOperand(left)} - 0 = ${this.formatOperand(left)}`,
                    };
                }
                if (sameOperand) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ kind: 'constant', value: 0, dataType: inst.resultType || 'int' }],
                        explanation: `Algebraic self-subtraction: ${this.formatOperand(left)} - ${this.formatOperand(right)} = 0`,
                    };
                }
                break;
            }
            case 'MUL': {
                if (right.kind === 'constant' && right.value === 1) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Algebraic multiplicative identity: ${this.formatOperand(left)} * 1 = ${this.formatOperand(left)}`,
                    };
                }
                if (left.kind === 'constant' && left.value === 1) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...right }],
                        explanation: `Algebraic multiplicative identity: 1 * ${this.formatOperand(right)} = ${this.formatOperand(right)}`,
                    };
                }
                if ((right.kind === 'constant' && right.value === 0) ||
                    (left.kind === 'constant' && left.value === 0)) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ kind: 'constant', value: 0, dataType: inst.resultType || 'int' }],
                        explanation: `Algebraic zero property: ${this.formatOperand(left)} * ${this.formatOperand(right)} = 0`,
                    };
                }
                break;
            }
            case 'DIV': {
                if (right.kind === 'constant' && right.value === 1) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Algebraic division identity: ${this.formatOperand(left)} / 1 = ${this.formatOperand(left)}`,
                    };
                }
                break;
            }
            case 'AND': {
                if (right.kind === 'constant' && right.value === true) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Boolean identity: ${this.formatOperand(left)} AND true = ${this.formatOperand(left)}`,
                    };
                }
                if (left.kind === 'constant' && left.value === true) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...right }],
                        explanation: `Boolean identity: true AND ${this.formatOperand(right)} = ${this.formatOperand(right)}`,
                    };
                }
                if ((right.kind === 'constant' && right.value === false) ||
                    (left.kind === 'constant' && left.value === false)) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ kind: 'constant', value: false, dataType: 'boolean' }],
                        explanation: `Boolean annihilation: ${this.formatOperand(left)} AND ${this.formatOperand(right)} = false`,
                    };
                }
                if (sameOperand) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Boolean idempotence: ${this.formatOperand(left)} AND ${this.formatOperand(right)} = ${this.formatOperand(left)}`,
                    };
                }
                break;
            }
            case 'OR': {
                if (right.kind === 'constant' && right.value === false) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Boolean identity: ${this.formatOperand(left)} OR false = ${this.formatOperand(left)}`,
                    };
                }
                if (left.kind === 'constant' && left.value === false) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...right }],
                        explanation: `Boolean identity: false OR ${this.formatOperand(right)} = ${this.formatOperand(right)}`,
                    };
                }
                if ((right.kind === 'constant' && right.value === true) ||
                    (left.kind === 'constant' && left.value === true)) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ kind: 'constant', value: true, dataType: 'boolean' }],
                        explanation: `Boolean domination: ${this.formatOperand(left)} OR ${this.formatOperand(right)} = true`,
                    };
                }
                if (sameOperand) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ ...left }],
                        explanation: `Boolean idempotence: ${this.formatOperand(left)} OR ${this.formatOperand(right)} = ${this.formatOperand(left)}`,
                    };
                }
                break;
            }
            case 'EQ':
            case 'GTE':
            case 'LTE': {
                if (sameOperand) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ kind: 'constant', value: true, dataType: 'boolean' }],
                        explanation: `Reflexive comparison: ${this.formatOperand(left)} ${inst.operatorSymbol} ${this.formatOperand(right)} = true`,
                    };
                }
                break;
            }
            case 'NEQ':
            case 'GT':
            case 'LT': {
                if (sameOperand) {
                    return {
                        matched: true,
                        replacementOpcode: 'ASSIGN',
                        replacementOperatorSymbol: '=',
                        replacementOperands: [{ kind: 'constant', value: false, dataType: 'boolean' }],
                        explanation: `Irreflexive comparison: ${this.formatOperand(left)} ${inst.operatorSymbol} ${this.formatOperand(right)} = false`,
                    };
                }
                break;
            }
            default:
                break;
        }
        return noMatch;
    }
    /**
     * Estimates the abstract execution cost of a single `IRInstruction`.
     * Used by Pass 12 (`RuleReorderingPass`) and `OptimizationMetrics`.
     */
    estimateInstructionCost(inst) {
        switch (inst.opcode) {
            case 'LABEL':
            case 'NOP':
                return 0;
            case 'ASSIGN':
            case 'LOAD':
            case 'STORE':
            case 'LOAD_CONST':
            case 'PARAM':
            case 'EMIT':
                return 1;
            case 'ADD':
            case 'SUB':
            case 'NEG':
            case 'AND':
            case 'OR':
            case 'NOT':
            case 'EQ':
            case 'NEQ':
            case 'GT':
            case 'LT':
            case 'GTE':
            case 'LTE':
            case 'NULL_CHECK':
            case 'NULL_COALESCE':
            case 'GOTO':
            case 'JUMP':
            case 'IF_FALSE':
            case 'IF_TRUE':
            case 'JUMP_IF':
            case 'JUMP_IF_NOT':
            case 'APPROVE':
            case 'REJECT':
            case 'ALLOW':
            case 'DENY':
            case 'REVIEW':
            case 'RETURN':
            case 'HALT':
                return 2;
            case 'MUL':
            case 'LOAD_FIELD':
            case 'STORE_FIELD':
            case 'LOAD_INDEX':
            case 'STORE_INDEX':
            case 'BETWEEN':
                return 3;
            case 'DIV':
            case 'MOD':
            case 'PERCENT_OF':
            case 'IN_CHECK':
            case 'LOG':
            case 'WARN':
            case 'ASSERT':
                return 5;
            case 'POW':
                return 6;
            case 'CALL':
            case 'RULE_APPLY':
                return 12;
            case 'POLICY_CALL':
                return 20;
            default:
                return 2;
        }
    }
    formatOperand(op) {
        switch (op.kind) {
            case 'variable':
            case 'temporary':
            case 'label':
            case 'function':
            case 'policy':
                return op.name;
            case 'register':
                return op.name ?? `r${op.id}`;
            case 'constant':
                return typeof op.value === 'string' ? `"${op.value}"` : String(op.value);
        }
    }
}
exports.ExpressionAnalyzer = ExpressionAnalyzer;
//# sourceMappingURL=expression-analyzer.js.map