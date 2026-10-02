/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Instruction Builder & IR Builder
 *
 * Builder Pattern implementation for constructing linear IR instruction
 * streams while automatically managing Temporary Variables (`t1`, `t2`, ...)
 * and Control-Flow Labels (`L1`, `L2`, ...).
 * ============================================================================
 */
import type { ASTSourceLocation } from '../ast/ast.interface';
import type { FPLDataType } from '../symbol-table/symbol-table.interface';
import type { IROpcode, IROperand, IRInstruction } from './ir.interface';
import { LabelGenerator } from './label-manager';
import { TemporaryVariableGenerator } from './temporary-manager';
export declare class InstructionBuilder {
    readonly tempManager: TemporaryVariableGenerator;
    readonly labelManager: LabelGenerator;
    private readonly instructions;
    private nextInstNumber;
    private currentContainer;
    constructor(tempManager?: TemporaryVariableGenerator, labelManager?: LabelGenerator);
    reset(): void;
    setContainer(containerName: string): void;
    getContainer(): string;
    getInstructions(): IRInstruction[];
    /**
     * Low-level emit helper that constructs an `IRInstruction`, binds temporary
     * definitions/usages, and records jump target label references.
     */
    emit(params: {
        opcode: IROpcode;
        operands?: IROperand[];
        destination?: IROperand | null;
        resultType?: FPLDataType;
        sourceLocation?: ASTSourceLocation;
        sourceLine?: number;
        comment?: string;
    }): IRInstruction;
    /**
     * Emits a binary operation (`ADD`, `SUB`, `MUL`, `DIV`, `MOD`, `GT`, `LT`, `GTE`, `LTE`, `EQ`, `NEQ`, `AND`, `OR`, `PERCENT_OF`)
     * into a newly allocated temporary variable `t_n` and returns `t_n`.
     */
    emitBinaryOp(opcode: IROpcode, left: IROperand, right: IROperand, resultType: FPLDataType, sourceLocation?: ASTSourceLocation, comment?: string): IROperand & {
        kind: 'temporary';
    };
    /**
     * Emits a unary operation (`NEG`, `NOT`, `NULL_CHECK`) into a newly allocated temporary `t_n`.
     */
    emitUnaryOp(opcode: IROpcode, operand: IROperand, resultType: FPLDataType, sourceLocation?: ASTSourceLocation, comment?: string): IROperand & {
        kind: 'temporary';
    };
    /**
     * Emits an assignment: `target = source`
     */
    emitAssign(target: IROperand, source: IROperand, resultType?: FPLDataType, sourceLocation?: ASTSourceLocation, comment?: string): IRInstruction;
    /**
     * Emits a label marker (`L1`, `L2`, ...) and binds its instruction index in `LabelGenerator`.
     */
    emitLabel(label: IROperand & {
        kind: 'label';
    }, comment?: string, sourceLocation?: ASTSourceLocation): IRInstruction;
    /**
     * Emits an unconditional jump (`GOTO Lx`).
     */
    emitGoto(targetLabel: IROperand & {
        kind: 'label';
    }, sourceLocation?: ASTSourceLocation, comment?: string): IRInstruction;
    /**
     * Emits a conditional jump on false (`IF_FALSE <cond> GOTO <label>`).
     */
    emitIfFalse(condition: IROperand, targetLabel: IROperand & {
        kind: 'label';
    }, sourceLocation?: ASTSourceLocation, comment?: string): IRInstruction;
    /**
     * Emits a conditional jump on true (`IF_TRUE <cond> GOTO <label>`).
     */
    emitIfTrue(condition: IROperand, targetLabel: IROperand & {
        kind: 'label';
    }, sourceLocation?: ASTSourceLocation, comment?: string): IRInstruction;
    /**
     * Emits a function call (`t_n = CALL fnName, args...`) and returns the result temporary.
     */
    emitFunctionCall(fnName: string, args: IROperand[], returnType?: FPLDataType, sourceLocation?: ASTSourceLocation): IROperand & {
        kind: 'temporary';
    };
    /**
     * Emits a policy call (`POLICY_CALL PolicyName`).
     */
    emitPolicyCall(policyName: string, args?: IROperand[], returnBinding?: string | null, sourceLocation?: ASTSourceLocation): IRInstruction;
    /**
     * Emits a terminal decision (`APPROVE`, `REJECT`, `REVIEW`).
     */
    emitDecision(decision: 'APPROVE' | 'REJECT' | 'ALLOW' | 'DENY' | 'REVIEW', reasonOperand?: IROperand | null, sourceLocation?: ASTSourceLocation): IRInstruction;
    /**
     * Emits a `RETURN` instruction (`RETURN` or `RETURN <val>`).
     */
    emitReturn(valueOperand?: IROperand | null, returnType?: FPLDataType, sourceLocation?: ASTSourceLocation): IRInstruction;
}
export { InstructionBuilder as IRBuilder };
//# sourceMappingURL=instruction-builder.d.ts.map