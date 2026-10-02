/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Control Flow Analyzer
 *
 * Provides control-flow graph and branch/label analysis utilities for:
 *   1. Detecting terminal control-flow instructions (`RETURN`, `GOTO`,
 *      `THROW`, `HALT`)
 *   2. Identifying referenced labels across all jump/branch instructions
 *   3. Building Jump-to-Jump forwarding maps (`L1 -> GOTO L2 => L1 -> L2`)
 *   4. Detecting consecutive redundant labels (`LABEL L1; LABEL L2`)
 *   5. Identifying unreachable Basic Blocks in the CFG
 * ============================================================================
 */
import type { BasicBlock, IRInstruction, IROpcode } from '../ir/ir.interface';
export declare class ControlFlowAnalyzer {
    /**
     * Returns true if the opcode unconditionally transfers control or terminates policy execution.
     */
    isUnconditionalTerminator(opcode: IROpcode): boolean;
    /**
     * Returns true if the instruction is a conditional or unconditional jump.
     */
    isBranchInstruction(inst: IRInstruction): boolean;
    /**
     * Returns the set of all label names referenced as branch targets in `instructions`.
     */
    getReferencedLabels(instructions: IRInstruction[]): Set<string>;
    /**
     * Detects when a label `L1` is immediately followed by an unconditional `GOTO L2`.
     * Returns a map `L1 -> L2` (transitively resolved, cycle-safe) so jumps to `L1`
     * can be threaded directly to `L2`.
     */
    buildJumpThreadingMap(instructions: IRInstruction[]): Map<string, string>;
    /**
     * Detects adjacent `LABEL` instructions (`LABEL L1` immediately followed by `LABEL L2`
     * in the same container) and maps the secondary label to the primary label.
     */
    findConsecutiveLabelAliases(instructions: IRInstruction[]): Map<string, string>;
    /**
     * Returns the set of unreachable Basic Block IDs (excluding `ENTRY` and `EXIT`).
     */
    getUnreachableBlockIds(blocks: BasicBlock[]): Set<string>;
}
//# sourceMappingURL=control-flow-analyzer.d.ts.map