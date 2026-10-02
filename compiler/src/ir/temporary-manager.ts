/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Temporary Variable Generator & Manager
 *
 * Automatically allocates unique temporary variables (`t1`, `t2`, `t3`, ...)
 * during IR generation, tracks their inferred FPL data types, records the
 * defining and consuming instruction IDs, and provides a Temporary Variable
 * Viewer table for the Frontend Compiler Console.
 * ============================================================================
 */

import type { FPLDataType } from '../symbol-table/symbol-table.interface';
import type { IROperand, TemporaryVariableInfo } from './ir.interface';

export class TemporaryVariableGenerator {
  private nextId = 1;
  private readonly temporaries = new Map<string, TemporaryVariableInfo>();

  /**
   * Resets the temporary counter back to `t1`.
   */
  public reset(): void {
    this.nextId = 1;
    this.temporaries.clear();
  }

  /**
   * Allocates a fresh temporary variable (`t1`, `t2`, `t3`, ...) and returns
   * both its metadata and a strongly-typed `IROperand`.
   */
  public allocate(
    dataType: FPLDataType = 'unknown',
    expressionSummary = '',
    definedAtInstructionId = '',
    sourceLine?: number,
  ): { operand: IROperand & { kind: 'temporary' }; info: TemporaryVariableInfo } {
    const id = this.nextId++;
    const name = `t${id}`;

    const info: TemporaryVariableInfo = {
      name,
      id,
      dataType,
      expressionSummary,
      definedAtInstructionId,
      usedAtInstructionIds: [],
      basicBlockId: null,
      sourceLine,
    };

    this.temporaries.set(name, info);

    const operand: IROperand & { kind: 'temporary' } = {
      kind: 'temporary',
      name,
      id,
      dataType,
    };

    return { operand, info };
  }

  /**
   * Updates the defining instruction ID or basic block ID for a temporary.
   */
  public bindDefinition(
    name: string,
    instructionId: string,
    expressionSummary?: string,
    basicBlockId?: string | null,
  ): void {
    const info = this.temporaries.get(name);
    if (!info) return;
    info.definedAtInstructionId = instructionId;
    if (expressionSummary !== undefined) {
      info.expressionSummary = expressionSummary;
    }
    if (basicBlockId !== undefined) {
      info.basicBlockId = basicBlockId;
    }
  }

  /**
   * Records that temporary `name` is read by `instructionId`.
   */
  public recordUsage(name: string, instructionId: string): void {
    const info = this.temporaries.get(name);
    if (!info) return;
    if (!info.usedAtInstructionIds.includes(instructionId)) {
      info.usedAtInstructionIds.push(instructionId);
    }
  }

  /**
   * Checks whether `name` is a known allocated temporary variable.
   */
  public has(name: string): boolean {
    return this.temporaries.has(name);
  }

  /**
   * Retrieves metadata for temporary `name`.
   */
  public get(name: string): TemporaryVariableInfo | undefined {
    return this.temporaries.get(name);
  }

  /**
   * Returns all allocated temporary variables in allocation order (`t1`, `t2`, ...).
   */
  public getAll(): TemporaryVariableInfo[] {
    return [...this.temporaries.values()];
  }

  /**
   * Total count of allocated temporary variables.
   */
  public count(): number {
    return this.temporaries.size;
  }
}

export { TemporaryVariableGenerator as TemporaryVariableManager };
