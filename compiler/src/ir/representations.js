"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Classical IR Representations
 *
 * Implements the 4 classical compiler IR generators from the unified
 * `IRInstruction[]` stream:
 *   1. `TACGenerator`           — Three Address Code (`t1 = salary >= 60000`)
 *   2. `QuadrupleGenerator`     — 4-tuple `(op, arg1, arg2, result)`
 *   3. `TripleGenerator`        — Indexed 3-tuple `(index, op, arg1, arg2)`
 *                                 where temporaries are replaced by `(i)`
 *   4. `IndirectTripleGenerator`— Pointer table `P0 -> (0)` decoupling
 *                                 execution order from Triple storage
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndirectTripleGenerator = exports.TripleGenerator = exports.QuadrupleGenerator = exports.TACGenerator = void 0;
const ir_factory_1 = require("./ir-factory");
// ─────────────────────────────────────────────────────────────────────────────
// 1. Three Address Code (TAC) Generator
// ─────────────────────────────────────────────────────────────────────────────
class TACGenerator {
    /**
     * Transforms a list of `IRInstruction` objects into canonical
     * `ThreeAddressInstruction` records.
     */
    generate(instructions) {
        return instructions.map((inst, idx) => {
            const dest = ir_factory_1.IRFactory.formatOperand(inst.destination);
            const op1 = ir_factory_1.IRFactory.formatOperand(inst.operands[0]);
            const op2 = ir_factory_1.IRFactory.formatOperand(inst.operands[1]);
            const op3 = ir_factory_1.IRFactory.formatOperand(inst.operands[2]);
            let text = '';
            let label;
            switch (inst.opcode) {
                case 'LABEL':
                    label = dest ?? 'L?';
                    text = `${label}`;
                    break;
                case 'GOTO':
                case 'JUMP':
                    label = dest ?? op1 ?? 'L?';
                    text = `GOTO ${label}`;
                    break;
                case 'IF_FALSE':
                case 'JUMP_IF_NOT':
                    label = dest ?? op2 ?? 'L?';
                    text = `IF_FALSE ${op1 ?? '?'} GOTO ${label}`;
                    break;
                case 'IF_TRUE':
                case 'JUMP_IF':
                    label = dest ?? op2 ?? 'L?';
                    text = `IF_TRUE ${op1 ?? '?'} GOTO ${label}`;
                    break;
                case 'ASSIGN':
                case 'LOAD':
                case 'STORE':
                case 'LOAD_CONST':
                    text = `${dest ?? '_'} = ${op1 ?? 'null'}`;
                    break;
                case 'EMIT':
                    text = `${dest ?? '_'} = ${op1 ?? 'null'}`;
                    break;
                case 'LOAD_FIELD':
                    text = `${dest ?? '_'} = ${op1 ?? 'obj'}.${op2?.replace(/^"|"$/g, '') ?? 'field'}`;
                    break;
                case 'STORE_FIELD':
                    text = `${op1 ?? 'obj'}.${op2?.replace(/^"|"$/g, '') ?? 'field'} = ${op3 ?? 'null'}`;
                    break;
                case 'LOAD_INDEX':
                    text = `${dest ?? '_'} = ${op1 ?? 'arr'}[${op2 ?? '0'}]`;
                    break;
                case 'STORE_INDEX':
                    text = `${op1 ?? 'arr'}[${op2 ?? '0'}] = ${op3 ?? 'null'}`;
                    break;
                case 'NEG':
                    text = `${dest ?? '_'} = -${op1 ?? '0'}`;
                    break;
                case 'NOT':
                    text = `${dest ?? '_'} = NOT ${op1 ?? 'false'}`;
                    break;
                case 'PARAM':
                    text = `PARAM ${op1 ?? ''}`;
                    break;
                case 'CALL':
                    text = dest
                        ? `${dest} = CALL ${op1 ?? 'fn'}, ${op2 ?? '0'}`
                        : `CALL ${op1 ?? 'fn'}, ${op2 ?? '0'}`;
                    break;
                case 'POLICY_CALL':
                    text = dest
                        ? `${dest} = POLICY_CALL ${op1 ?? 'Policy'}`
                        : `POLICY_CALL ${op1 ?? 'Policy'}`;
                    break;
                case 'RULE_APPLY':
                    text = `RULE_APPLY ${op1 ?? 'Rule'}`;
                    break;
                case 'APPROVE':
                case 'ALLOW':
                    text = op1 ? `APPROVE ${op1}` : 'APPROVE';
                    break;
                case 'REJECT':
                case 'DENY':
                    text = op1 ? `REJECT ${op1}` : 'REJECT';
                    break;
                case 'REVIEW':
                    text = op1 ? `REVIEW ${op1}` : 'REVIEW';
                    break;
                case 'RETURN':
                    text = op1 ? `RETURN ${op1}` : 'RETURN';
                    break;
                case 'LOG':
                    text = `LOG ${op1 ?? ''}`;
                    break;
                case 'WARN':
                    text = `WARN ${op1 ?? ''}`;
                    break;
                case 'ASSERT':
                    text = op2 ? `ASSERT ${op1}, ${op2}` : `ASSERT ${op1 ?? ''}`;
                    break;
                case 'BETWEEN':
                    text = `${dest ?? '_'} = ${op1} BETWEEN ${op2} AND ${op3}`;
                    break;
                default:
                    // Standard binary operation: `t1 = salary >= 60000`
                    text = `${dest ?? '_'} = ${op1 ?? ''} ${inst.operatorSymbol} ${op2 ?? ''}`.trim();
                    break;
            }
            return ir_factory_1.IRFactory.createTACInstruction({
                id: inst.id,
                index: idx,
                result: dest,
                op: inst.operatorSymbol,
                arg1: op1,
                arg2: op2,
                label,
                text,
                basicBlockId: inst.basicBlockId,
                sourceLine: inst.sourceLine,
                comment: inst.comment,
            });
        });
    }
}
exports.TACGenerator = TACGenerator;
// ─────────────────────────────────────────────────────────────────────────────
// 2. Quadruple Generator: (Operator, Argument1, Argument2, Result)
// ─────────────────────────────────────────────────────────────────────────────
class QuadrupleGenerator {
    /**
     * Converts `IRInstruction[]` into a table of `Quadruple` records:
     * `(index, op, arg1, arg2, result)`
     */
    generate(instructions) {
        return instructions.map((inst, index) => {
            const dest = ir_factory_1.IRFactory.formatOperand(inst.destination);
            const op1 = ir_factory_1.IRFactory.formatOperand(inst.operands[0]);
            const op2 = ir_factory_1.IRFactory.formatOperand(inst.operands[1]);
            return ir_factory_1.IRFactory.createQuadruple({
                index,
                op: inst.operatorSymbol,
                arg1: op1,
                arg2: op2,
                result: dest,
                basicBlockId: inst.basicBlockId,
                sourceLine: inst.sourceLine,
            });
        });
    }
}
exports.QuadrupleGenerator = QuadrupleGenerator;
// ─────────────────────────────────────────────────────────────────────────────
// 3. Triple Generator: (Index, Operator, Argument1, Argument2)
// ─────────────────────────────────────────────────────────────────────────────
class TripleGenerator {
    /**
     * Converts `IRInstruction[]` into an indexed `Triple[]` table where
     * temporary variable names (`t1`, `t2`, ...) are replaced by their defining
     * triple index reference (`(0)`, `(1)`, ...).
     */
    generate(instructions) {
        const tempToTripleIndex = new Map();
        // First pass: record which triple index defines each temporary `t_k`
        instructions.forEach((inst, index) => {
            if (inst.destination?.kind === 'temporary') {
                tempToTripleIndex.set(inst.destination.name, index);
            }
        });
        const resolveArg = (raw) => {
            if (!raw)
                return null;
            const refIdx = tempToTripleIndex.get(raw);
            return refIdx !== undefined ? `(${refIdx})` : raw;
        };
        return instructions.map((inst, index) => {
            const dest = ir_factory_1.IRFactory.formatOperand(inst.destination);
            const op1 = resolveArg(ir_factory_1.IRFactory.formatOperand(inst.operands[0]));
            const op2 = resolveArg(ir_factory_1.IRFactory.formatOperand(inst.operands[1]));
            // In Triple representation:
            // - For `ASSIGN` / `EMIT` (`salary = t1`), arg1 is `salary` and arg2 is `(0)`
            // - For `IF_FALSE t3 GOTO L2`, arg1 is `(2)` and arg2 is `L2`
            // - For `GOTO L3` / `LABEL L1`, arg1 is `L3` / `L1`
            if (inst.opcode === 'ASSIGN' || inst.opcode === 'EMIT') {
                return ir_factory_1.IRFactory.createTriple({
                    index,
                    op: inst.operatorSymbol,
                    arg1: dest,
                    arg2: op1,
                    basicBlockId: inst.basicBlockId,
                    sourceLine: inst.sourceLine,
                });
            }
            if (inst.opcode === 'IF_FALSE' || inst.opcode === 'IF_TRUE') {
                return ir_factory_1.IRFactory.createTriple({
                    index,
                    op: inst.operatorSymbol,
                    arg1: op1,
                    arg2: dest,
                    basicBlockId: inst.basicBlockId,
                    sourceLine: inst.sourceLine,
                });
            }
            if (inst.opcode === 'GOTO' || inst.opcode === 'LABEL') {
                return ir_factory_1.IRFactory.createTriple({
                    index,
                    op: inst.operatorSymbol,
                    arg1: dest ?? op1,
                    arg2: null,
                    basicBlockId: inst.basicBlockId,
                    sourceLine: inst.sourceLine,
                });
            }
            return ir_factory_1.IRFactory.createTriple({
                index,
                op: inst.operatorSymbol,
                arg1: op1,
                arg2: op2,
                basicBlockId: inst.basicBlockId,
                sourceLine: inst.sourceLine,
            });
        });
    }
}
exports.TripleGenerator = TripleGenerator;
// ─────────────────────────────────────────────────────────────────────────────
// 4. Indirect Triple Generator: Pointer Table + Triple Pool
// ─────────────────────────────────────────────────────────────────────────────
class IndirectTripleGenerator {
    tripleGenerator;
    constructor(tripleGenerator = new TripleGenerator()) {
        this.tripleGenerator = tripleGenerator;
    }
    /**
     * Generates an `IndirectTripleTable` consisting of:
     * - `pointers`: Execution order slots (`P0 -> (0)`, `P1 -> (1)`, ...)
     * - `triples`: The underlying indexed `Triple[]` records
     */
    generate(instructions) {
        const triples = this.tripleGenerator.generate(instructions);
        const pointers = triples.map((triple, idx) => ir_factory_1.IRFactory.createIndirectTripleEntry(idx, triple.index, triple));
        return {
            pointers,
            triples,
        };
    }
}
exports.IndirectTripleGenerator = IndirectTripleGenerator;
//# sourceMappingURL=representations.js.map