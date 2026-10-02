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
import type {
  BasicBlock,
  BasicBlockKind,
  IROpcode,
  IROperand,
  IRInstruction,
  Quadruple,
  ThreeAddressInstruction,
  Triple,
  IndirectTripleEntry,
} from './ir.interface';

const OPCODE_TO_SYMBOL: Record<IROpcode, string> = {
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

export class IRFactory {
  // ─── Operand Factories ────────────────────────────────────────────────────

  public static createVariableOperand(
    name: string,
    dataType: FPLDataType = 'unknown',
  ): IROperand & { kind: 'variable' } {
    return { kind: 'variable', name, dataType };
  }

  public static createTemporaryOperand(
    name: string,
    id: number,
    dataType: FPLDataType = 'unknown',
  ): IROperand & { kind: 'temporary' } {
    return { kind: 'temporary', name, id, dataType };
  }

  public static createConstantOperand(
    value: string | number | boolean | null,
    dataType: FPLDataType = 'unknown',
  ): IROperand & { kind: 'constant' } {
    return { kind: 'constant', value, dataType };
  }

  public static createLabelOperand(name: string): IROperand & { kind: 'label' } {
    return { kind: 'label', name };
  }

  public static createFunctionOperand(
    name: string,
    argCount = 0,
  ): IROperand & { kind: 'function' } {
    return { kind: 'function', name, argCount };
  }

  public static createPolicyOperand(
    name: string,
    argCount = 0,
  ): IROperand & { kind: 'policy' } {
    return { kind: 'policy', name, argCount };
  }

  /**
   * Formats an `IROperand` as a clean string token (`salary`, `t1`, `60000`, `"Approved"`, `L2`).
   */
  public static formatOperand(operand: IROperand | null | undefined): string | null {
    if (!operand) return null;
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
        if (operand.value === null) return 'null';
        return String(operand.value);
    }
  }

  // ─── Instruction Factory ──────────────────────────────────────────────────

  public static createInstruction(params: CreateInstructionParams): IRInstruction {
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

  public static createTACInstruction(
    params: ThreeAddressInstruction,
  ): ThreeAddressInstruction {
    return { ...params };
  }

  public static createQuadruple(params: Quadruple): Quadruple {
    return { ...params };
  }

  public static createTriple(params: Triple): Triple {
    return { ...params };
  }

  public static createIndirectTripleEntry(
    pointerIndex: number,
    tripleIndex: number,
    triple: Triple,
  ): IndirectTripleEntry {
    return {
      pointerIndex,
      pointerLabel: `P${pointerIndex}`,
      tripleIndex,
      triple,
    };
  }

  public static createBasicBlock(params: {
    id: string;
    label: string;
    kind: BasicBlockKind;
    containerName: string;
    leaderInstructionId: string | null;
    leaderReason: BasicBlock['leaderReason'];
    startIndex: number;
    endIndex: number;
    instructions: IRInstruction[];
  }): BasicBlock {
    return {
      ...params,
      tacLines: [],
      predecessors: [],
      successors: [],
      isReachable: true,
    };
  }
}
