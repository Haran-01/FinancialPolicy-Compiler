"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlFlowAnalyzer = void 0;
const UNCONDITIONAL_TERMINATORS = new Set([
    'GOTO',
    'JUMP',
    'RETURN',
    'THROW',
    'HALT',
]);
const BRANCH_OPCODES = new Set([
    'GOTO',
    'JUMP',
    'IF_FALSE',
    'IF_TRUE',
    'JUMP_IF',
    'JUMP_IF_NOT',
]);
class ControlFlowAnalyzer {
    /**
     * Returns true if the opcode unconditionally transfers control or terminates policy execution.
     */
    isUnconditionalTerminator(opcode) {
        return UNCONDITIONAL_TERMINATORS.has(opcode);
    }
    /**
     * Returns true if the instruction is a conditional or unconditional jump.
     */
    isBranchInstruction(inst) {
        return BRANCH_OPCODES.has(inst.opcode);
    }
    /**
     * Returns the set of all label names referenced as branch targets in `instructions`.
     */
    getReferencedLabels(instructions) {
        const referenced = new Set();
        for (const inst of instructions) {
            if (this.isBranchInstruction(inst) && inst.destination?.kind === 'label') {
                referenced.add(inst.destination.name);
            }
        }
        return referenced;
    }
    /**
     * Detects when a label `L1` is immediately followed by an unconditional `GOTO L2`.
     * Returns a map `L1 -> L2` (transitively resolved, cycle-safe) so jumps to `L1`
     * can be threaded directly to `L2`.
     */
    buildJumpThreadingMap(instructions) {
        const directMap = new Map();
        for (let i = 0; i < instructions.length - 1; i++) {
            const curr = instructions[i];
            const next = instructions[i + 1];
            if (curr.opcode === 'LABEL' &&
                curr.destination?.kind === 'label' &&
                (next.opcode === 'GOTO' || next.opcode === 'JUMP') &&
                next.destination?.kind === 'label' &&
                curr.destination.name !== next.destination.name) {
                directMap.set(curr.destination.name, next.destination.name);
            }
        }
        // Resolve transitive chains (L1 -> L2 -> L3 => L1 -> L3) while guarding against infinite loops
        const resolvedMap = new Map();
        for (const [fromLabel, initialTarget] of directMap.entries()) {
            let target = initialTarget;
            const visited = new Set([fromLabel]);
            while (directMap.has(target) && !visited.has(target)) {
                visited.add(target);
                target = directMap.get(target);
            }
            if (target !== fromLabel) {
                resolvedMap.set(fromLabel, target);
            }
        }
        return resolvedMap;
    }
    /**
     * Detects adjacent `LABEL` instructions (`LABEL L1` immediately followed by `LABEL L2`
     * in the same container) and maps the secondary label to the primary label.
     */
    findConsecutiveLabelAliases(instructions) {
        const aliases = new Map();
        let activePrimaryLabel = null;
        let activeContainer = null;
        for (const inst of instructions) {
            if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
                const labelName = inst.destination.name;
                // Do not alias top-level policy/function entry labels (`L1` or `L_FUNC_*` / `L_RULE_*`)
                const isEntryLabel = labelName === 'L1' ||
                    labelName.startsWith('L_FUNC_') ||
                    labelName.startsWith('L_RULE_');
                if (activePrimaryLabel !== null &&
                    activeContainer === inst.containerName &&
                    !isEntryLabel) {
                    aliases.set(labelName, activePrimaryLabel);
                }
                else {
                    activePrimaryLabel = labelName;
                    activeContainer = inst.containerName;
                }
            }
            else {
                activePrimaryLabel = null;
                activeContainer = null;
            }
        }
        return aliases;
    }
    /**
     * Returns the set of unreachable Basic Block IDs (excluding `ENTRY` and `EXIT`).
     */
    getUnreachableBlockIds(blocks) {
        const unreachable = new Set();
        for (const block of blocks) {
            if (block.id !== 'ENTRY' && block.id !== 'EXIT' && !block.isReachable) {
                unreachable.add(block.id);
            }
        }
        return unreachable;
    }
}
exports.ControlFlowAnalyzer = ControlFlowAnalyzer;
//# sourceMappingURL=control-flow-analyzer.js.map