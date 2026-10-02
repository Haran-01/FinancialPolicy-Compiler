"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationReporter = void 0;
class OptimizationReporter {
    /**
     * Builds the complete `OptimizationReport` including side-by-side diff rows
     * and formatted ASCII summary reports.
     */
    generateReport(params) {
        const sideBySideDiff = this.buildSideBySideDiff(params.originalProgram.threeAddressCode, params.optimizedProgram.threeAddressCode, params.transformations);
        const formattedDiffTable = this.formatSideBySideDiffTable(sideBySideDiff);
        const formattedReport = this.formatSummaryReport({
            policyName: params.originalProgram.policyName,
            optimizationLevel: params.optimizationLevel,
            passesExecuted: params.passesExecuted,
            metrics: params.metrics,
            passSnapshots: params.passSnapshots,
            transformations: params.transformations,
            deadEntityWarnings: params.deadEntityWarnings,
            formattedDiffTable,
        });
        return {
            policyName: params.originalProgram.policyName,
            optimizationLevel: params.optimizationLevel,
            passesExecuted: params.passesExecuted,
            metrics: params.metrics,
            passSnapshots: params.passSnapshots,
            transformations: params.transformations,
            deadEntityWarnings: params.deadEntityWarnings,
            sideBySideDiff,
            validation: params.optimizedProgram.validation,
            formattedReport,
            formattedDiffTable,
        };
    }
    /**
     * Aligns `before` and `after` Three Address Code streams by instruction ID
     * so developers can inspect exact line-by-line IR transformations.
     */
    buildSideBySideDiff(beforeTAC, afterTAC, transformations) {
        const rows = [];
        const afterById = new Map();
        for (const tac of afterTAC) {
            afterById.set(tac.id, tac);
        }
        // Map instructionId -> most recent transformation record
        const transformByInstId = new Map();
        for (const tr of transformations) {
            transformByInstId.set(tr.instructionId, tr);
        }
        const handledAfterIds = new Set();
        let rowNumber = 1;
        for (const beforeInst of beforeTAC) {
            const afterInst = afterById.get(beforeInst.id);
            const tr = transformByInstId.get(beforeInst.id);
            if (!afterInst) {
                // Instruction was eliminated!
                rows.push({
                    rowNumber: rowNumber++,
                    beforeIndex: beforeInst.index,
                    afterIndex: null,
                    beforeInstructionId: beforeInst.id,
                    afterInstructionId: null,
                    beforeBasicBlockId: beforeInst.basicBlockId,
                    afterBasicBlockId: null,
                    beforeTAC: beforeInst.text,
                    afterTAC: '[REMOVED]',
                    status: 'REMOVED',
                    passName: tr?.passName,
                    reason: tr?.reason ?? 'Eliminated during optimization',
                });
            }
            else {
                handledAfterIds.add(afterInst.id);
                const isModified = beforeInst.text !== afterInst.text || tr !== undefined;
                rows.push({
                    rowNumber: rowNumber++,
                    beforeIndex: beforeInst.index,
                    afterIndex: afterInst.index,
                    beforeInstructionId: beforeInst.id,
                    afterInstructionId: afterInst.id,
                    beforeBasicBlockId: beforeInst.basicBlockId,
                    afterBasicBlockId: afterInst.basicBlockId,
                    beforeTAC: beforeInst.text,
                    afterTAC: afterInst.text,
                    status: isModified ? 'MODIFIED' : 'UNCHANGED',
                    passName: tr?.passName,
                    reason: tr?.reason,
                });
            }
        }
        // Any instructions in `afterTAC` not present in `beforeTAC`
        for (const afterInst of afterTAC) {
            if (!handledAfterIds.has(afterInst.id)) {
                const tr = transformByInstId.get(afterInst.id);
                rows.push({
                    rowNumber: rowNumber++,
                    beforeIndex: null,
                    afterIndex: afterInst.index,
                    beforeInstructionId: null,
                    afterInstructionId: afterInst.id,
                    beforeBasicBlockId: null,
                    afterBasicBlockId: afterInst.basicBlockId,
                    beforeTAC: '',
                    afterTAC: afterInst.text,
                    status: 'ADDED',
                    passName: tr?.passName,
                    reason: tr?.reason,
                });
            }
        }
        return rows;
    }
    /**
     * Formats a side-by-side ASCII comparison table of Before vs. After TAC.
     */
    formatSideBySideDiffTable(rows) {
        const lines = [];
        const colWidth = 34;
        const pad = (str, len) => str.length > len ? str.slice(0, len - 1) + '…' : str.padEnd(len, ' ');
        lines.push('┌──────┬────────────────────────────────────┬────────────────────────────────────┬────────────┬──────────────────────────┐');
        lines.push('│ Row  │ Before Optimization (TAC)          │ After Optimization (TAC)           │ Status     │ Pass                     │');
        lines.push('├──────┼────────────────────────────────────┼────────────────────────────────────┼────────────┼──────────────────────────┤');
        for (const row of rows) {
            const rowStr = String(row.rowNumber).padStart(4, ' ');
            const beforeCol = pad(row.beforeTAC, colWidth);
            const afterCol = pad(row.afterTAC, colWidth);
            const statusCol = pad(row.status, 10);
            const passCol = pad(row.passName ?? '—', 24);
            lines.push(`│ ${rowStr} │ ${beforeCol} │ ${afterCol} │ ${statusCol} │ ${passCol} │`);
        }
        lines.push('└──────┴────────────────────────────────────┴────────────────────────────────────┴────────────┴──────────────────────────┘');
        return lines.join('\n');
    }
    /**
     * Formats the complete human-readable Optimization Report.
     */
    formatSummaryReport(params) {
        const { policyName, optimizationLevel, passesExecuted, metrics, transformations, deadEntityWarnings, formattedDiffTable, } = params;
        const lines = [];
        lines.push('================================================================================');
        lines.push(`FinPolicy Compiler (FPC) — IR Optimization Report (${policyName})`);
        lines.push('================================================================================');
        lines.push(`Optimization Level            : O${optimizationLevel}`);
        lines.push(`Passes Executed (${passesExecuted.length})          : ${passesExecuted.length > 0 ? passesExecuted.join(' -> ') : 'None'}`);
        lines.push(`Instructions Before           : ${metrics.instructionsBefore}`);
        lines.push(`Instructions After            : ${metrics.instructionsAfter}`);
        lines.push(`Instructions Eliminated       : ${metrics.instructionsEliminated} (${metrics.instructionReductionPercent}%)`);
        lines.push(`Temporary Variables Reduced   : ${metrics.temporariesEliminated} (${metrics.temporariesBefore} -> ${metrics.temporariesAfter})`);
        lines.push(`Basic Blocks Reduced          : ${metrics.basicBlocksEliminated} (${metrics.basicBlocksBefore} -> ${metrics.basicBlocksAfter})`);
        lines.push(`Jumps Eliminated              : ${metrics.jumpsEliminated} (${metrics.jumpsBefore} -> ${metrics.jumpsAfter})`);
        lines.push(`Execution Cost Reduction      : ${metrics.executionCostBefore} -> ${metrics.executionCostAfter}`);
        lines.push(`Estimated Runtime Improvement : ${metrics.estimatedRuntimeImprovementPercent}%`);
        lines.push(`Total Transformations Applied : ${metrics.totalTransformations}`);
        lines.push(`Optimization Duration         : ${metrics.totalDurationMs} ms`);
        lines.push('');
        if (transformations.length > 0) {
            lines.push('── Transformation History ──────────────────────────────────────────────────────');
            for (const tr of transformations) {
                lines.push(`  #${String(tr.step).padStart(2, '0')} [${tr.passName}] (${tr.instructionId}${tr.basicBlockId ? ` @ ${tr.basicBlockId}` : ''})`);
                lines.push(`      Before : ${tr.before}`);
                lines.push(`      After  : ${tr.after}`);
                lines.push(`      Reason : ${tr.reason}`);
            }
            lines.push('');
        }
        if (deadEntityWarnings.length > 0) {
            lines.push('── Dead Policy / Entity Warnings ───────────────────────────────────────────────');
            for (const warn of deadEntityWarnings) {
                lines.push(`  [${warn.code}] (${warn.entityKind.toUpperCase()}) ${warn.message}`);
            }
            lines.push('');
        }
        lines.push('── Side-by-Side IR Comparison ──────────────────────────────────────────────────');
        lines.push(formattedDiffTable);
        return lines.join('\n');
    }
}
exports.OptimizationReporter = OptimizationReporter;
//# sourceMappingURL=optimization-reporter.js.map