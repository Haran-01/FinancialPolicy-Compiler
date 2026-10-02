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
export declare class TemporaryVariableGenerator {
    private nextId;
    private readonly temporaries;
    /**
     * Resets the temporary counter back to `t1`.
     */
    reset(): void;
    /**
     * Allocates a fresh temporary variable (`t1`, `t2`, `t3`, ...) and returns
     * both its metadata and a strongly-typed `IROperand`.
     */
    allocate(dataType?: FPLDataType, expressionSummary?: string, definedAtInstructionId?: string, sourceLine?: number): {
        operand: IROperand & {
            kind: 'temporary';
        };
        info: TemporaryVariableInfo;
    };
    /**
     * Updates the defining instruction ID or basic block ID for a temporary.
     */
    bindDefinition(name: string, instructionId: string, expressionSummary?: string, basicBlockId?: string | null): void;
    /**
     * Records that temporary `name` is read by `instructionId`.
     */
    recordUsage(name: string, instructionId: string): void;
    /**
     * Checks whether `name` is a known allocated temporary variable.
     */
    has(name: string): boolean;
    /**
     * Retrieves metadata for temporary `name`.
     */
    get(name: string): TemporaryVariableInfo | undefined;
    /**
     * Returns all allocated temporary variables in allocation order (`t1`, `t2`, ...).
     */
    getAll(): TemporaryVariableInfo[];
    /**
     * Total count of allocated temporary variables.
     */
    count(): number;
}
export { TemporaryVariableGenerator as TemporaryVariableManager };
//# sourceMappingURL=temporary-manager.d.ts.map