/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Factory
 *
 * Factory Pattern implementation for creating strongly-typed `IROperand`,
 * `IRInstruction`, `ThreeAddressInstruction`, `Quadruple`, `Triple`,
 * `IndirectTripleEntry`, and `BasicBlock` objects.
 * ============================================================================
 */
import type { ASTSourceLocation } from '../ast/ast.interface';
import type { FPLDataType } from '../symbol-table/symbol-table.interface';
import type { BasicBlock, BasicBlockKind, IROpcode, IROperand, IRInstruction, Quadruple, ThreeAddressInstruction, Triple, IndirectTripleEntry } from './ir.interface';
export interface CreateInstructionParams {
    id: string;
    index: number;
    opcode: IROpcode;
    operands?: IROperand[];
    destination?: IROperand | null;
    resultType?: FPLDataType;
    containerName?: string;
    basicBlockId?: string | null;
    sourceLocation?: ASTSourceLocation;
    sourceLine?: number;
    comment?: string;
}
export declare class IRFactory {
    static createVariableOperand(name: string, dataType?: FPLDataType): IROperand & {
        kind: 'variable';
    };
    static createTemporaryOperand(name: string, id: number, dataType?: FPLDataType): IROperand & {
        kind: 'temporary';
    };
    static createConstantOperand(value: string | number | boolean | null, dataType?: FPLDataType): IROperand & {
        kind: 'constant';
    };
    static createLabelOperand(name: string): IROperand & {
        kind: 'label';
    };
    static createFunctionOperand(name: string, argCount?: number): IROperand & {
        kind: 'function';
    };
    static createPolicyOperand(name: string, argCount?: number): IROperand & {
        kind: 'policy';
    };
    /**
     * Formats an `IROperand` as a clean string token (`salary`, `t1`, `60000`, `"Approved"`, `L2`).
     */
    static formatOperand(operand: IROperand | null | undefined): string | null;
    static createInstruction(params: CreateInstructionParams): IRInstruction;
    static createTACInstruction(params: ThreeAddressInstruction): ThreeAddressInstruction;
    static createQuadruple(params: Quadruple): Quadruple;
    static createTriple(params: Triple): Triple;
    static createIndirectTripleEntry(pointerIndex: number, tripleIndex: number, triple: Triple): IndirectTripleEntry;
    static createBasicBlock(params: {
        id: string;
        label: string;
        kind: BasicBlockKind;
        containerName: string;
        leaderInstructionId: string | null;
        leaderReason: BasicBlock['leaderReason'];
        startIndex: number;
        endIndex: number;
        instructions: IRInstruction[];
    }): BasicBlock;
}
//# sourceMappingURL=ir-factory.d.ts.map