"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Instruction Builder & IR Builder
 *
 * Builder Pattern implementation for constructing linear IR instruction
 * streams while automatically managing Temporary Variables (`t1`, `t2`, ...)
 * and Control-Flow Labels (`L1`, `L2`, ...).
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRBuilder = exports.InstructionBuilder = void 0;
const ir_factory_1 = require("./ir-factory");
const label_manager_1 = require("./label-manager");
const temporary_manager_1 = require("./temporary-manager");
class InstructionBuilder {
    tempManager;
    labelManager;
    instructions = [];
    nextInstNumber = 1;
    currentContainer = 'Global';
    constructor(tempManager = new temporary_manager_1.TemporaryVariableGenerator(), labelManager = new label_manager_1.LabelGenerator()) {
        this.tempManager = tempManager;
        this.labelManager = labelManager;
    }
    reset() {
        this.instructions.length = 0;
        this.nextInstNumber = 1;
        this.currentContainer = 'Global';
        this.tempManager.reset();
        this.labelManager.reset();
    }
    setContainer(containerName) {
        this.currentContainer = containerName;
    }
    getContainer() {
        return this.currentContainer;
    }
    getInstructions() {
        return [...this.instructions];
    }
    /**
     * Low-level emit helper that constructs an `IRInstruction`, binds temporary
     * definitions/usages, and records jump target label references.
     */
    emit(params) {
        const id = `inst_${this.nextInstNumber++}`;
        const index = this.instructions.length;
        const instruction = ir_factory_1.IRFactory.createInstruction({
            id,
            index,
            opcode: params.opcode,
            operands: params.operands,
            destination: params.destination,
            resultType: params.resultType,
            containerName: this.currentContainer,
            sourceLocation: params.sourceLocation,
            sourceLine: params.sourceLine,
            comment: params.comment,
        });
        // Track temporary definitions & usages
        if (instruction.destination?.kind === 'temporary') {
            const exprSummary = instruction.operands
                .map((op) => ir_factory_1.IRFactory.formatOperand(op))
                .filter(Boolean)
                .join(` ${instruction.operatorSymbol} `);
            this.tempManager.bindDefinition(instruction.destination.name, instruction.id, exprSummary || instruction.operatorSymbol);
        }
        for (const op of instruction.operands) {
            if (op.kind === 'temporary') {
                this.tempManager.recordUsage(op.name, instruction.id);
            }
            else if (op.kind === 'label') {
                this.labelManager.recordJumpReference(op.name, instruction.id);
            }
        }
        if (instruction.destination?.kind === 'label' &&
            instruction.opcode !== 'LABEL') {
            this.labelManager.recordJumpReference(instruction.destination.name, instruction.id);
        }
        this.instructions.push(instruction);
        return instruction;
    }
    // ─── High-Level Builder Methods ───────────────────────────────────────────
    /**
     * Emits a binary operation (`ADD`, `SUB`, `MUL`, `DIV`, `MOD`, `GT`, `LT`, `GTE`, `LTE`, `EQ`, `NEQ`, `AND`, `OR`, `PERCENT_OF`)
     * into a newly allocated temporary variable `t_n` and returns `t_n`.
     */
    emitBinaryOp(opcode, left, right, resultType, sourceLocation, comment) {
        const { operand: temp } = this.tempManager.allocate(resultType, '', '', sourceLocation?.line);
        this.emit({
            opcode,
            operands: [left, right],
            destination: temp,
            resultType,
            sourceLocation,
            comment,
        });
        return temp;
    }
    /**
     * Emits a unary operation (`NEG`, `NOT`, `NULL_CHECK`) into a newly allocated temporary `t_n`.
     */
    emitUnaryOp(opcode, operand, resultType, sourceLocation, comment) {
        const { operand: temp } = this.tempManager.allocate(resultType, '', '', sourceLocation?.line);
        this.emit({
            opcode,
            operands: [operand],
            destination: temp,
            resultType,
            sourceLocation,
            comment,
        });
        return temp;
    }
    /**
     * Emits an assignment: `target = source`
     */
    emitAssign(target, source, resultType = 'unknown', sourceLocation, comment) {
        return this.emit({
            opcode: 'ASSIGN',
            operands: [source],
            destination: target,
            resultType,
            sourceLocation,
            comment,
        });
    }
    /**
     * Emits a label marker (`L1`, `L2`, ...) and binds its instruction index in `LabelGenerator`.
     */
    emitLabel(label, comment, sourceLocation) {
        const index = this.instructions.length;
        this.labelManager.bindLabelPosition(label.name, index);
        return this.emit({
            opcode: 'LABEL',
            operands: [],
            destination: label,
            resultType: 'void',
            sourceLocation,
            comment,
        });
    }
    /**
     * Emits an unconditional jump (`GOTO Lx`).
     */
    emitGoto(targetLabel, sourceLocation, comment) {
        return this.emit({
            opcode: 'GOTO',
            operands: [],
            destination: targetLabel,
            resultType: 'void',
            sourceLocation,
            comment,
        });
    }
    /**
     * Emits a conditional jump on false (`IF_FALSE <cond> GOTO <label>`).
     */
    emitIfFalse(condition, targetLabel, sourceLocation, comment) {
        return this.emit({
            opcode: 'IF_FALSE',
            operands: [condition],
            destination: targetLabel,
            resultType: 'void',
            sourceLocation,
            comment,
        });
    }
    /**
     * Emits a conditional jump on true (`IF_TRUE <cond> GOTO <label>`).
     */
    emitIfTrue(condition, targetLabel, sourceLocation, comment) {
        return this.emit({
            opcode: 'IF_TRUE',
            operands: [condition],
            destination: targetLabel,
            resultType: 'void',
            sourceLocation,
            comment,
        });
    }
    /**
     * Emits a function call (`t_n = CALL fnName, args...`) and returns the result temporary.
     */
    emitFunctionCall(fnName, args, returnType = 'unknown', sourceLocation) {
        for (const arg of args) {
            this.emit({
                opcode: 'PARAM',
                operands: [arg],
                destination: null,
                resultType: 'void',
                sourceLocation,
            });
        }
        const { operand: temp } = this.tempManager.allocate(returnType, `CALL ${fnName}`, '', sourceLocation?.line);
        const fnOp = ir_factory_1.IRFactory.createFunctionOperand(fnName, args.length);
        const countOp = ir_factory_1.IRFactory.createConstantOperand(args.length, 'int');
        this.emit({
            opcode: 'CALL',
            operands: [fnOp, countOp, ...args],
            destination: temp,
            resultType: returnType,
            sourceLocation,
        });
        return temp;
    }
    /**
     * Emits a policy call (`POLICY_CALL PolicyName`).
     */
    emitPolicyCall(policyName, args = [], returnBinding, sourceLocation) {
        for (const arg of args) {
            this.emit({
                opcode: 'PARAM',
                operands: [arg],
                destination: null,
                resultType: 'void',
                sourceLocation,
            });
        }
        const polOp = ir_factory_1.IRFactory.createPolicyOperand(policyName, args.length);
        const dest = returnBinding
            ? ir_factory_1.IRFactory.createVariableOperand(returnBinding, 'policy_result')
            : null;
        return this.emit({
            opcode: 'POLICY_CALL',
            operands: [polOp, ...args],
            destination: dest,
            resultType: 'policy_result',
            sourceLocation,
        });
    }
    /**
     * Emits a terminal decision (`APPROVE`, `REJECT`, `REVIEW`).
     */
    emitDecision(decision, reasonOperand, sourceLocation) {
        const normalizedOpcode = decision === 'ALLOW'
            ? 'APPROVE'
            : decision === 'DENY'
                ? 'REJECT'
                : decision;
        return this.emit({
            opcode: normalizedOpcode,
            operands: reasonOperand ? [reasonOperand] : [],
            destination: null,
            resultType: 'policy_result',
            sourceLocation,
        });
    }
    /**
     * Emits a `RETURN` instruction (`RETURN` or `RETURN <val>`).
     */
    emitReturn(valueOperand, returnType = 'void', sourceLocation) {
        return this.emit({
            opcode: 'RETURN',
            operands: valueOperand ? [valueOperand] : [],
            destination: null,
            resultType: returnType,
            sourceLocation,
        });
    }
}
exports.InstructionBuilder = InstructionBuilder;
exports.IRBuilder = InstructionBuilder;
//# sourceMappingURL=instruction-builder.js.map