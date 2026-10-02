/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Label Generator & Manager
 *
 * Automatically generates sequential control-flow labels (`L1`, `L2`, `L3`, ...)
 * supporting nested `IF`/`ELSEIF`/`ELSE`, `WHEN`/`THEN`/`ELSE`, `FOR`/`WHILE`
 * loops, and policy entry/exit points.
 * ============================================================================
 */

import type { IROperand, LabelInfo } from './ir.interface';

export interface ConditionalLabelSet {
  falseOrElseLabel: IROperand & { kind: 'label' };
  endMergeLabel: IROperand & { kind: 'label' };
}

export interface LoopLabelSet {
  headerLabel: IROperand & { kind: 'label' };
  bodyLabel: IROperand & { kind: 'label' };
  continueStepLabel: IROperand & { kind: 'label' };
  exitLabel: IROperand & { kind: 'label' };
}

export class LabelGenerator {
  private nextId = 1;
  private readonly labels = new Map<string, LabelInfo>();

  /**
   * Resets label numbering back to `L1`.
   */
  public reset(): void {
    this.nextId = 1;
    this.labels.clear();
  }

  /**
   * Allocates a new unique label (`L1`, `L2`, `L3`, ...) with a descriptive role.
   */
  public allocate(role = 'BRANCH_TARGET'): {
    operand: IROperand & { kind: 'label' };
    info: LabelInfo;
  } {
    const id = this.nextId++;
    const name = `L${id}`;

    const info: LabelInfo = {
      name,
      id,
      role,
      instructionIndex: -1,
      basicBlockId: null,
      referencedByInstructionIds: [],
    };

    this.labels.set(name, info);

    return {
      operand: { kind: 'label', name },
      info,
    };
  }

  /**
   * Allocates a pair of labels (`elseLabel`, `endMergeLabel`) for an `IF`/`WHEN`
   * statement with an `ELSE` branch.
   */
  public allocateConditionalLabels(hasElse: boolean): ConditionalLabelSet {
    if (hasElse) {
      const elseLbl = this.allocate('ELSE_BRANCH').operand;
      const mergeLbl = this.allocate('MERGE_END').operand;
      return {
        falseOrElseLabel: elseLbl,
        endMergeLabel: mergeLbl,
      };
    }
    const mergeLbl = this.allocate('IF_END').operand;
    return {
      falseOrElseLabel: mergeLbl,
      endMergeLabel: mergeLbl,
    };
  }

  /**
   * Allocates labels for a `FOR`, `WHILE`, or `FOREACH` loop.
   */
  public allocateLoopLabels(): LoopLabelSet {
    return {
      headerLabel: this.allocate('LOOP_HEADER').operand,
      bodyLabel: this.allocate('LOOP_BODY').operand,
      continueStepLabel: this.allocate('LOOP_STEP').operand,
      exitLabel: this.allocate('LOOP_EXIT').operand,
    };
  }

  /**
   * Marks where a label (`L1`, `L2`, ...) is emitted in the instruction stream.
   */
  public bindLabelPosition(
    name: string,
    instructionIndex: number,
    basicBlockId?: string | null,
  ): void {
    let info = this.labels.get(name);
    if (!info) {
      const numericPart = Number.parseInt(name.replace(/^L/i, ''), 10);
      info = {
        name,
        id: Number.isNaN(numericPart) ? this.nextId++ : numericPart,
        role: 'CUSTOM_LABEL',
        instructionIndex,
        basicBlockId: basicBlockId ?? null,
        referencedByInstructionIds: [],
      };
      this.labels.set(name, info);
    } else {
      info.instructionIndex = instructionIndex;
      if (basicBlockId !== undefined) {
        info.basicBlockId = basicBlockId;
      }
    }
  }

  /**
   * Records that `instructionId` jumps to label `name`.
   */
  public recordJumpReference(name: string, instructionId: string): void {
    const info = this.labels.get(name);
    if (!info) return;
    if (!info.referencedByInstructionIds.includes(instructionId)) {
      info.referencedByInstructionIds.push(instructionId);
    }
  }

  /**
   * Returns a map of `labelName -> instructionIndex` for resolved labels.
   */
  public toIndexMap(): Map<string, number> {
    const map = new Map<string, number>();
    for (const [name, info] of this.labels.entries()) {
      if (info.instructionIndex >= 0) {
        map.set(name, info.instructionIndex);
      }
    }
    return map;
  }

  public get(name: string): LabelInfo | undefined {
    return this.labels.get(name);
  }

  public getAll(): LabelInfo[] {
    return [...this.labels.values()];
  }

  public count(): number {
    return this.labels.size;
  }
}

export { LabelGenerator as LabelManager };
