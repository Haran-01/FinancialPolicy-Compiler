/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Optimization Reporter & Diff Generator
 *
 * Generates:
 *   1. Side-by-Side IR Difference Rows (`SideBySideDiffRow[]`) aligning
 *      unoptimized TAC instructions with optimized TAC instructions by
 *      `instructionId` and annotating `UNCHANGED`, `MODIFIED`, `REMOVED`,
 *      or `ADDED` status along with the responsible pass and reason.
 *   2. Human-readable ASCII Optimization Report (`formattedReport`) and
 *      Side-by-Side Diff Table (`formattedDiffTable`).
 * ============================================================================
 */
import type { IRProgram, ThreeAddressInstruction } from '../ir/ir.interface';
import type { DeadEntityWarning, OptimizationMetricsSummary, OptimizationReport, PassExecutionSnapshot, SideBySideDiffRow, TransformationRecord } from './optimizer.interface';
export declare class OptimizationReporter {
    /**
     * Builds the complete `OptimizationReport` including side-by-side diff rows
     * and formatted ASCII summary reports.
     */
    generateReport(params: {
        originalProgram: IRProgram;
        optimizedProgram: IRProgram;
        optimizationLevel: 0 | 1 | 2;
        passesExecuted: string[];
        metrics: OptimizationMetricsSummary;
        passSnapshots: PassExecutionSnapshot[];
        transformations: TransformationRecord[];
        deadEntityWarnings: DeadEntityWarning[];
    }): OptimizationReport;
    /**
     * Aligns `before` and `after` Three Address Code streams by instruction ID
     * so developers can inspect exact line-by-line IR transformations.
     */
    buildSideBySideDiff(beforeTAC: ThreeAddressInstruction[], afterTAC: ThreeAddressInstruction[], transformations: TransformationRecord[]): SideBySideDiffRow[];
    /**
     * Formats a side-by-side ASCII comparison table of Before vs. After TAC.
     */
    formatSideBySideDiffTable(rows: SideBySideDiffRow[]): string;
    /**
     * Formats the complete human-readable Optimization Report.
     */
    formatSummaryReport(params: {
        policyName: string;
        optimizationLevel: 0 | 1 | 2;
        passesExecuted: string[];
        metrics: OptimizationMetricsSummary;
        passSnapshots: PassExecutionSnapshot[];
        transformations: TransformationRecord[];
        deadEntityWarnings: DeadEntityWarning[];
        formattedDiffTable: string;
    }): string;
}
//# sourceMappingURL=optimization-reporter.d.ts.map