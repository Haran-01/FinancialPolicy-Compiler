"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Profiler
 *
 * Collects fine-grained runtime performance telemetry during VM execution:
 *   - Total Execution Time (ms)
 *   - Total Instruction Count & Opcode Execution Frequencies
 *   - Basic Block Execution Counts (Hot Block Heatmap)
 *   - Branch Count & Taken Branch Count
 *   - Policy Call Count & Distinct Policies Executed
 *   - Function Call Count & Distinct Functions Executed
 *   - Maximum Operand Stack & Call Stack Depths
 *   - Peak Memory Usage (bytes)
 *   - Top Hot Instructions sorted by execution frequency
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profiler = void 0;
class Profiler {
    totalTimeMs = 0;
    instructionsExecuted = 0;
    opcodeCounts = new Map();
    basicBlockCounts = new Map();
    instructionProfiles = new Map();
    branchCount = 0;
    takenBranchCount = 0;
    policyCallsCount = 0;
    policiesExecuted = new Set();
    functionCallsCount = 0;
    functionsExecuted = new Set();
    recordPolicyStart(policyName) {
        this.policiesExecuted.add(policyName);
    }
    recordInstructionExecution(inst, durationMs, options) {
        this.instructionsExecuted++;
        this.totalTimeMs += durationMs;
        this.opcodeCounts.set(inst.opcode, (this.opcodeCounts.get(inst.opcode) ?? 0) + 1);
        if (inst.basicBlockId) {
            this.basicBlockCounts.set(inst.basicBlockId, (this.basicBlockCounts.get(inst.basicBlockId) ?? 0) + 1);
        }
        let bucket = this.instructionProfiles.get(inst.id);
        if (!bucket) {
            bucket = {
                instructionId: inst.id,
                instructionIndex: inst.index,
                tacText: inst.tacText,
                executionCount: 0,
                totalTimeMs: 0,
            };
            this.instructionProfiles.set(inst.id, bucket);
        }
        bucket.executionCount++;
        bucket.totalTimeMs = Number((bucket.totalTimeMs + durationMs).toFixed(4));
        if (options?.isBranch) {
            this.branchCount++;
            if (options.branchTaken) {
                this.takenBranchCount++;
            }
        }
        if (options?.calledPolicy) {
            this.policyCallsCount++;
            this.policiesExecuted.add(options.calledPolicy);
        }
        if (options?.calledFunction) {
            this.functionCallsCount++;
            this.functionsExecuted.add(options.calledFunction);
        }
    }
    getReport(memoryStats, wallClockMs) {
        const hotInstructions = Array.from(this.instructionProfiles.values())
            .sort((a, b) => b.executionCount - a.executionCount || b.totalTimeMs - a.totalTimeMs)
            .slice(0, 15)
            .map((b) => ({ ...b }));
        return {
            executionTimeMs: Number((wallClockMs ?? this.totalTimeMs).toFixed(3)),
            instructionsExecuted: this.instructionsExecuted,
            opcodeCounts: Object.fromEntries(this.opcodeCounts.entries()),
            basicBlockCounts: Object.fromEntries(this.basicBlockCounts.entries()),
            branchCount: this.branchCount,
            takenBranchCount: this.takenBranchCount,
            policyCallsCount: this.policyCallsCount,
            policiesExecuted: Array.from(this.policiesExecuted),
            functionCallsCount: this.functionCallsCount,
            functionsExecuted: Array.from(this.functionsExecuted),
            maxOperandStackDepth: memoryStats.maxOperandStackDepth,
            maxCallStackDepth: memoryStats.maxCallStackDepth,
            peakMemoryBytes: memoryStats.peakMemoryBytes,
            hotInstructions,
        };
    }
    reset() {
        this.totalTimeMs = 0;
        this.instructionsExecuted = 0;
        this.opcodeCounts.clear();
        this.basicBlockCounts.clear();
        this.instructionProfiles.clear();
        this.branchCount = 0;
        this.takenBranchCount = 0;
        this.policyCallsCount = 0;
        this.policiesExecuted.clear();
        this.functionCallsCount = 0;
        this.functionsExecuted.clear();
    }
}
exports.Profiler = Profiler;
//# sourceMappingURL=profiler.js.map