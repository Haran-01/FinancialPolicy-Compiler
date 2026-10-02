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
import type { DecodedInstruction, MemoryStatistics, ProfilerReport } from './runtime.interface';
export declare class Profiler {
    private totalTimeMs;
    private instructionsExecuted;
    private readonly opcodeCounts;
    private readonly basicBlockCounts;
    private readonly instructionProfiles;
    private branchCount;
    private takenBranchCount;
    private policyCallsCount;
    private readonly policiesExecuted;
    private functionCallsCount;
    private readonly functionsExecuted;
    recordPolicyStart(policyName: string): void;
    recordInstructionExecution(inst: DecodedInstruction, durationMs: number, options?: {
        isBranch?: boolean;
        branchTaken?: boolean;
        calledPolicy?: string;
        calledFunction?: string;
    }): void;
    getReport(memoryStats: MemoryStatistics, wallClockMs?: number): ProfilerReport;
    reset(): void;
}
//# sourceMappingURL=profiler.d.ts.map