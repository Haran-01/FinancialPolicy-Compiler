"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Data Flow Analyzer
 *
 * Provides data-flow and liveness analysis over `IRInstruction[]` and
 * `BasicBlock[]`:
 *   1. Use-Def & Reference Counting (`computeUseCounts`) for temporary
 *      variables and user variables
 *   2. Dead Overwritten Store Detection (`findOverwrittenStores`) within a
 *      Basic Block (`x = 100; x = 200` where the first `x` is never read)
 *   3. Unused Temporary Detection (`findUnusedTemporaries`)
 *   4. Loop Back-Edge Target Detection (`findLoopHeaderLabels`) so constant
 *      and copy propagation never unsafely propagate across loop-carried variables
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFlowAnalyzer = void 0;
class DataFlowAnalyzer {
    /**
     * Computes global use-def statistics across the entire instruction stream.
     */
    analyzeUseDef(instructions) {
        const useCounts = new Map();
        const definitions = new Map();
        const uses = new Map();
        for (const inst of instructions) {
            // Record uses first
            for (const op of inst.operands) {
                if (op.kind === 'variable' || op.kind === 'temporary') {
                    useCounts.set(op.name, (useCounts.get(op.name) ?? 0) + 1);
                    const list = uses.get(op.name) ?? [];
                    list.push(inst.id);
                    uses.set(op.name, list);
                }
            }
            // Record definitions
            if (inst.destination &&
                (inst.destination.kind === 'variable' || inst.destination.kind === 'temporary')) {
                // Note: STORE_FIELD and STORE_INDEX read/mutate part of the destination object/array
                if (inst.opcode === 'STORE_FIELD' || inst.opcode === 'STORE_INDEX') {
                    useCounts.set(inst.destination.name, (useCounts.get(inst.destination.name) ?? 0) + 1);
                }
                else {
                    const defList = definitions.get(inst.destination.name) ?? [];
                    defList.push(inst.id);
                    definitions.set(inst.destination.name, defList);
                }
            }
        }
        return { useCounts, definitions, uses };
    }
    /**
     * Identifies instructions within the same Basic Block that assign to a variable
     * or temporary (`x = 100`) and are immediately or subsequently overwritten (`x = 200`)
     * before `x` is ever read, without any intervening branch, label, or call.
     */
    findOverwrittenStoreIndices(instructions) {
        const deadIndices = new Set();
        // Maps variable/temp name -> instruction index of its last unread definition in the current basic block
        const pendingUnreadDefs = new Map();
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];
            // 1. Any control-flow boundary or call conservatively flushes pending variable defs
            if (inst.opcode === 'LABEL' ||
                inst.opcode === 'GOTO' ||
                inst.opcode === 'JUMP' ||
                inst.opcode === 'IF_FALSE' ||
                inst.opcode === 'IF_TRUE' ||
                inst.opcode === 'JUMP_IF' ||
                inst.opcode === 'JUMP_IF_NOT' ||
                inst.opcode === 'RETURN' ||
                inst.opcode === 'APPROVE' ||
                inst.opcode === 'REJECT' ||
                inst.opcode === 'ALLOW' ||
                inst.opcode === 'DENY' ||
                inst.opcode === 'REVIEW' ||
                inst.opcode === 'HALT' ||
                inst.opcode === 'THROW') {
                // Notice: Before flushing on a conditional jump or return, mark any operand read by this instruction as used!
                for (const op of inst.operands) {
                    if (op.kind === 'variable' || op.kind === 'temporary') {
                        pendingUnreadDefs.delete(op.name);
                    }
                }
                pendingUnreadDefs.clear();
                continue;
            }
            // 2. Mark all operands read by this instruction as live (not dead)
            for (const op of inst.operands) {
                if (op.kind === 'variable' || op.kind === 'temporary') {
                    pendingUnreadDefs.delete(op.name);
                }
            }
            // If this instruction has side effects (e.g., CALL, POLICY_CALL, EMIT, LOG), don't treat it as a removable store
            if (inst.opcode === 'CALL' ||
                inst.opcode === 'POLICY_CALL' ||
                inst.opcode === 'RULE_APPLY' ||
                inst.opcode === 'EMIT' ||
                inst.opcode === 'LOG' ||
                inst.opcode === 'WARN' ||
                inst.opcode === 'ASSERT') {
                if (inst.destination &&
                    (inst.destination.kind === 'variable' || inst.destination.kind === 'temporary')) {
                    pendingUnreadDefs.delete(inst.destination.name);
                }
                continue;
            }
            // 3. If this instruction defines a variable or temporary via pure computation/assignment:
            if (inst.destination &&
                (inst.destination.kind === 'variable' || inst.destination.kind === 'temporary') &&
                inst.opcode !== 'STORE_FIELD' &&
                inst.opcode !== 'STORE_INDEX') {
                const destName = inst.destination.name;
                const previousUnreadIdx = pendingUnreadDefs.get(destName);
                if (previousUnreadIdx !== undefined) {
                    // Previous assignment to `destName` in the same basic block was never read before being overwritten!
                    deadIndices.add(previousUnreadIdx);
                }
                pendingUnreadDefs.set(destName, i);
            }
        }
        return deadIndices;
    }
    /**
     * Detects variables that are modified inside loops (labels that have back-edges jumping
     * backward to them). Propagating pre-loop constants into loop induction variables would
     * be unsound, so we identify all variables mutated between a backward-target label and its jump.
     */
    findLoopMutatedVariables(instructions) {
        const labelIndices = new Map();
        const loopMutated = new Set();
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];
            if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
                labelIndices.set(inst.destination.name, i);
            }
        }
        for (let i = 0; i < instructions.length; i++) {
            const inst = instructions[i];
            if ((inst.opcode === 'GOTO' ||
                inst.opcode === 'JUMP' ||
                inst.opcode === 'IF_FALSE' ||
                inst.opcode === 'IF_TRUE' ||
                inst.opcode === 'JUMP_IF' ||
                inst.opcode === 'JUMP_IF_NOT') &&
                inst.destination?.kind === 'label') {
                const targetIdx = labelIndices.get(inst.destination.name);
                if (targetIdx !== undefined && targetIdx <= i) {
                    // Back-edge detected: [targetIdx .. i] is a loop body
                    for (let k = targetIdx; k <= i; k++) {
                        const bodyInst = instructions[k];
                        if (bodyInst.destination &&
                            (bodyInst.destination.kind === 'variable' ||
                                bodyInst.destination.kind === 'temporary')) {
                            loopMutated.add(bodyInst.destination.name);
                        }
                    }
                }
            }
        }
        return loopMutated;
    }
}
exports.DataFlowAnalyzer = DataFlowAnalyzer;
//# sourceMappingURL=data-flow-analyzer.js.map