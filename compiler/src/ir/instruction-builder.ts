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
import { IRFactory } from './ir-factory';
import type { IROpcode, IROperand, IRInstruction } from './ir.interface';
import { LabelGenerator } from './label-manager';
import { TemporaryVariableGenerator } from './temporary-manager';

export class InstructionBuilder {
  public readonly tempManager: TemporaryVariableGenerator;
  public readonly labelManager: LabelGenerator;

  private readonly instructions: IRInstruction[] = [];
  private nextInstNumber = 1;
  private currentContainer = 'Global';

  constructor(
    tempManager = new TemporaryVariableGenerator(),
    labelManager = new LabelGenerator(),
  ) {
    this.tempManager = tempManager;
    this.labelManager = labelManager;
  }

  public reset(): void {
    this.instructions.length = 0;
    this.nextInstNumber = 1;
    this.currentContainer = 'Global';
    this.tempManager.reset();
    this.labelManager.reset();
  }

  public setContainer(containerName: string): void {
    this.currentContainer = containerName;
  }

  public getContainer(): string {
    return this.currentContainer;
  }

  public getInstructions(): IRInstruction[] {
    return [...this.instructions];
  }

  /**
   * Low-level emit helper that constructs an `IRInstruction`, binds temporary
   * definitions/usages, and records jump target label references.
   */
  public emit(params: {
    opcode: IROpcode;
    operands?: IROperand[];
    destination?: IROperand | null;
    resultType?: FPLDataType;
    sourceLocation?: ASTSourceLocation;
    sourceLine?: number;
    comment?: string;
  }): IRInstruction {
    const id = `inst_${this.nextInstNumber++}`;
    const index = this.instructions.length;

    const instruction = IRFactory.createInstruction({
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
        .map((op) => IRFactory.formatOperand(op))
        .filter(Boolean)
        .join(` ${instruction.operatorSymbol} `);
      this.tempManager.bindDefinition(
        instruction.destination.name,
        instruction.id,
        exprSummary || instruction.operatorSymbol,
      );
    }

    for (const op of instruction.operands) {
      if (op.kind === 'temporary') {
        this.tempManager.recordUsage(op.name, instruction.id);
      } else if (op.kind === 'label') {
        this.labelManager.recordJumpReference(op.name, instruction.id);
      }
    }

    if (
      instruction.destination?.kind === 'label' &&
      instruction.opcode !== 'LABEL'
    ) {
      this.labelManager.recordJumpReference(
        instruction.destination.name,
        instruction.id,
      );
    }

    this.instructions.push(instruction);
    return instruction;
  }

  // ─── High-Level Builder Methods ───────────────────────────────────────────

  /**
   * Emits a binary operation (`ADD`, `SUB`, `MUL`, `DIV`, `MOD`, `GT`, `LT`, `GTE`, `LTE`, `EQ`, `NEQ`, `AND`, `OR`, `PERCENT_OF`)
   * into a newly allocated temporary variable `t_n` and returns `t_n`.
   */
  public emitBinaryOp(
    opcode: IROpcode,
    left: IROperand,
    right: IROperand,
    resultType: FPLDataType,
    sourceLocation?: ASTSourceLocation,
    comment?: string,
  ): IROperand & { kind: 'temporary' } {
    const { operand: temp } = this.tempManager.allocate(
      resultType,
      '',
      '',
      sourceLocation?.line,
    );

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
  public emitUnaryOp(
    opcode: IROpcode,
    operand: IROperand,
    resultType: FPLDataType,
    sourceLocation?: ASTSourceLocation,
    comment?: string,
  ): IROperand & { kind: 'temporary' } {
    const { operand: temp } = this.tempManager.allocate(
      resultType,
      '',
      '',
      sourceLocation?.line,
    );

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
  public emitAssign(
    target: IROperand,
    source: IROperand,
    resultType: FPLDataType = 'unknown',
    sourceLocation?: ASTSourceLocation,
    comment?: string,
  ): IRInstruction {
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
  public emitLabel(
    label: IROperand & { kind: 'label' },
    comment?: string,
    sourceLocation?: ASTSourceLocation,
  ): IRInstruction {
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
  public emitGoto(
    targetLabel: IROperand & { kind: 'label' },
    sourceLocation?: ASTSourceLocation,
    comment?: string,
  ): IRInstruction {
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
  public emitIfFalse(
    condition: IROperand,
    targetLabel: IROperand & { kind: 'label' },
    sourceLocation?: ASTSourceLocation,
    comment?: string,
  ): IRInstruction {
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
  public emitIfTrue(
    condition: IROperand,
    targetLabel: IROperand & { kind: 'label' },
    sourceLocation?: ASTSourceLocation,
    comment?: string,
  ): IRInstruction {
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
  public emitFunctionCall(
    fnName: string,
    args: IROperand[],
    returnType: FPLDataType = 'unknown',
    sourceLocation?: ASTSourceLocation,
  ): IROperand & { kind: 'temporary' } {
    for (const arg of args) {
      this.emit({
        opcode: 'PARAM',
        operands: [arg],
        destination: null,
        resultType: 'void',
        sourceLocation,
      });
    }

    const { operand: temp } = this.tempManager.allocate(
      returnType,
      `CALL ${fnName}`,
      '',
      sourceLocation?.line,
    );

    const fnOp = IRFactory.createFunctionOperand(fnName, args.length);
    const countOp = IRFactory.createConstantOperand(args.length, 'int');

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
  public emitPolicyCall(
    policyName: string,
    args: IROperand[] = [],
    returnBinding?: string | null,
    sourceLocation?: ASTSourceLocation,
  ): IRInstruction {
    for (const arg of args) {
      this.emit({
        opcode: 'PARAM',
        operands: [arg],
        destination: null,
        resultType: 'void',
        sourceLocation,
      });
    }

    const polOp = IRFactory.createPolicyOperand(policyName, args.length);
    const dest = returnBinding
      ? IRFactory.createVariableOperand(returnBinding, 'policy_result')
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
  public emitDecision(
    decision: 'APPROVE' | 'REJECT' | 'ALLOW' | 'DENY' | 'REVIEW',
    reasonOperand?: IROperand | null,
    sourceLocation?: ASTSourceLocation,
  ): IRInstruction {
    const normalizedOpcode: IROpcode =
      decision === 'ALLOW'
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
  public emitReturn(
    valueOperand?: IROperand | null,
    returnType: FPLDataType = 'void',
    sourceLocation?: ASTSourceLocation,
  ): IRInstruction {
    return this.emit({
      opcode: 'RETURN',
      operands: valueOperand ? [valueOperand] : [],
      destination: null,
      resultType: returnType,
      sourceLocation,
    });
  }
}

export { InstructionBuilder as IRBuilder };
