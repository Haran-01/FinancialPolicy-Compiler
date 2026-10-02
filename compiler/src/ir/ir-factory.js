"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Factory
 *
 * Factory Pattern implementation for creating strongly-typed `IROperand`,
 * `IRInstruction`, `ThreeAddressInstruction`, `Quadruple`, `Triple`,
 * `IndirectTripleEntry`, and `BasicBlock` objects.
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFactory = void 0;
const OPCODE_TO_SYMBOL = {
    ASSIGN: '=',
    LOAD: 'LOAD',
    STORE: 'STORE',
    LOAD_CONST: 'CONST',
    LOAD_FIELD: 'FIELD_GET',
    STORE_FIELD: 'FIELD_SET',
    LOAD_INDEX: 'INDEX_GET',
    STORE_INDEX: 'INDEX_SET',
    ADD: '+',
    SUB: '-',
    MUL: '*',
    DIV: '/',
    MOD: '%',
    POW: '^',
    NEG: 'UMINUS',
    GT: '>',
    LT: '<',
    GTE: '>=',
    LTE: '<=',
    EQ: '==',
    NEQ: '!=',
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT',
    PERCENT_OF: '% OF',
    NULL_CHECK: 'IS_NULL',
    NULL_COALESCE: '??',
    IN_CHECK: 'IN',
    BETWEEN: 'BETWEEN',
    LABEL: 'LABEL',
    GOTO: 'GOTO',
    JUMP: 'GOTO',
    IF_FALSE: 'IF_FALSE',
    IF_TRUE: 'IF_TRUE',
    JUMP_IF: 'IF_TRUE',
    JUMP_IF_NOT: 'IF_FALSE',
    PARAM: 'PARAM',
    CALL: 'CALL',
    POLICY_CALL: 'POLICY_CALL',
    RULE_APPLY: 'RULE_APPLY',
    RETURN: 'RETURN',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
    ALLOW: 'APPROVE',
    DENY: 'REJECT',
    REVIEW: 'REVIEW',
    EMIT: 'EMIT',
    LOG: 'LOG',
    WARN: 'WARN',
    ASSERT: 'ASSERT',
    TRY_BEGIN: 'TRY_BEGIN',
    TRY_END: 'TRY_END',
    CATCH_BEGIN: 'CATCH_BEGIN',
    THROW: 'THROW',
    NOP: 'NOP',
    HALT: 'HALT',
};
class IRFactory {
    // ─── Operand Factories ────────────────────────────────────────────────────
    static createVariableOperand(name, dataType = 'unknown') {
        return { kind: 'variable', name, dataType };
    }
    static createTemporaryOperand(name, id, dataType = 'unknown') {
        return { kind: 'temporary', name, id, dataType };
    }
    static createConstantOperand(value, dataType = 'unknown') {
        return { kind: 'constant', value, dataType };
    }
    static createLabelOperand(name) {
        return { kind: 'label', name };
    }
    static createFunctionOperand(name, argCount = 0) {
        return { kind: 'function', name, argCount };
    }
    static createPolicyOperand(name, argCount = 0) {
        return { kind: 'policy', name, argCount };
    }
    /**
     * Formats an `IROperand` as a clean string token (`salary`, `t1`, `60000`, `"Approved"`, `L2`).
     */
    static formatOperand(operand) {
        if (!operand)
            return null;
        switch (operand.kind) {
            case 'variable':
            case 'temporary':
            case 'label':
            case 'function':
            case 'policy':
                return operand.name;
            case 'register':
                return operand.name ?? `r${operand.id}`;
            case 'constant':
                if (typeof operand.value === 'string') {
                    return `"${operand.value}"`;
                }
                if (operand.value === null)
                    return 'null';
                return String(operand.value);
        }
    }
    // ─── Instruction Factory ──────────────────────────────────────────────────
    static createInstruction(params) {
        const destination = params.destination ?? null;
        return {
            id: params.id,
            index: params.index,
            opcode: params.opcode,
            operatorSymbol: OPCODE_TO_SYMBOL[params.opcode] ?? params.opcode,
            operands: params.operands ? [...params.operands] : [],
            destination,
            result: destination,
            resultType: params.resultType ?? 'void',
            containerName: params.containerName ?? 'Global',
            basicBlockId: params.basicBlockId ?? null,
            sourceLocation: params.sourceLocation,
            sourceLine: params.sourceLine ?? params.sourceLocation?.line,
            comment: params.comment,
        };
    }
    // ─── Representation Factories ─────────────────────────────────────────────
    static createTACInstruction(params) {
        return { ...params };
    }
    static createQuadruple(params) {
        return { ...params };
    }
    static createTriple(params) {
        return { ...params };
    }
    static createIndirectTripleEntry(pointerIndex, tripleIndex, triple) {
        return {
            pointerIndex,
            pointerLabel: `P${pointerIndex}`,
            tripleIndex,
            triple,
        };
    }
    static createBasicBlock(params) {
        return {
            ...params,
            tacLines: [],
            predecessors: [],
            successors: [],
            isReachable: true,
        };
    }
}
exports.IRFactory = IRFactory;
//# sourceMappingURL=ir-factory.js.map