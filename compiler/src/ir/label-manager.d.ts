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
    falseOrElseLabel: IROperand & {
        kind: 'label';
    };
    endMergeLabel: IROperand & {
        kind: 'label';
    };
}
export interface LoopLabelSet {
    headerLabel: IROperand & {
        kind: 'label';
    };
    bodyLabel: IROperand & {
        kind: 'label';
    };
    continueStepLabel: IROperand & {
        kind: 'label';
    };
    exitLabel: IROperand & {
        kind: 'label';
    };
}
export declare class LabelGenerator {
    private nextId;
    private readonly labels;
    /**
     * Resets label numbering back to `L1`.
     */
    reset(): void;
    /**
     * Allocates a new unique label (`L1`, `L2`, `L3`, ...) with a descriptive role.
     */
    allocate(role?: string): {
        operand: IROperand & {
            kind: 'label';
        };
        info: LabelInfo;
    };
    /**
     * Allocates a pair of labels (`elseLabel`, `endMergeLabel`) for an `IF`/`WHEN`
     * statement with an `ELSE` branch.
     */
    allocateConditionalLabels(hasElse: boolean): ConditionalLabelSet;
    /**
     * Allocates labels for a `FOR`, `WHILE`, or `FOREACH` loop.
     */
    allocateLoopLabels(): LoopLabelSet;
    /**
     * Marks where a label (`L1`, `L2`, ...) is emitted in the instruction stream.
     */
    bindLabelPosition(name: string, instructionIndex: number, basicBlockId?: string | null): void;
    /**
     * Records that `instructionId` jumps to label `name`.
     */
    recordJumpReference(name: string, instructionId: string): void;
    /**
     * Returns a map of `labelName -> instructionIndex` for resolved labels.
     */
    toIndexMap(): Map<string, number>;
    get(name: string): LabelInfo | undefined;
    getAll(): LabelInfo[];
    count(): number;
}
export { LabelGenerator as LabelManager };
//# sourceMappingURL=label-manager.d.ts.map