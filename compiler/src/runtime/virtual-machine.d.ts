/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Financial Policy Virtual Machine (FPVM)
 *
 * Production-grade stack-based Virtual Machine that executes Optimized IR
 * (`IRProgram` / `OptimizationResult`) deterministically.
 *
 * Features:
 *   - Hardware-inspired VM Registers (`IP`, `PC`, `SP`, `FP`, `status`)
 *   - 5-Tier Memory Model (Operand Stack, Call Frames, Constant Pool,
 *     Globals/Inputs/Outputs, Heap Manager)
 *   - Nested & Recursive Function/Policy/Rule Call Stack
 *   - Full Execution Trace (`VMExecutionTraceStep[]`) with variable & stack deltas
 *   - Interactive Debugger (`stepInto`, `stepOver`, `stepOut`, `pause`,
 *     `resume`, `restart`, `setBreakpoint`, `removeBreakpoint`)
 *   - Runtime Profiler (`ProfilerReport`) & Runtime Diagnostics (`FPVM-R001..R010`)
 *   - Frontend Visualization Payloads (`getVisualizationState()`)
 * ============================================================================
 */
import type { CompiledArtifact, ExecutionResult } from '@finpolicy/shared';
import type { IRProgram } from '../ir/ir.interface';
import type { OptimizationResult } from '../optimizer/optimizer.interface';
import type { ISymbolTable } from '../symbol-table/symbol-table.interface';
import { VMDebugger } from './debugger';
import { InstructionDispatcher } from './instruction-dispatcher';
import { MemoryManager } from './memory-manager';
import { Profiler } from './profiler';
import { ProgramLoader } from './program-loader';
import { RuntimeDiagnostics, RuntimeLogger } from './runtime-diagnostics';
import type { Breakpoint, DecodedInstruction, ExecutionContext, ExecutionOptions, FPVMExecutionReport, FPVMVisualizationPayload, IExecutionEngine, IFinancialPolicyVM, LoadedProgramImage, MemoryStatistics, ProfilerReport, VMExecutionTraceStep, VMRegisterState, VariableSnapshotView } from './runtime.interface';
import { CallStack, StackManager } from './stack-manager';
export declare class FinancialPolicyVM implements IFinancialPolicyVM {
    readonly loader: ProgramLoader;
    readonly diagnostics: RuntimeDiagnostics;
    readonly logger: RuntimeLogger;
    readonly stackManager: StackManager;
    readonly callStack: CallStack;
    readonly memoryManager: MemoryManager;
    readonly dispatcher: InstructionDispatcher;
    readonly profiler: Profiler;
    readonly debugger: VMDebugger;
    private loadedProgram;
    private currentInputData;
    private currentOptions;
    private instructionPointer;
    private programCounter;
    private status;
    private decision;
    private decisionReason;
    private returnValue;
    private readonly trace;
    private executionStartTimeMs;
    private cumulativeTimeMs;
    constructor();
    /**
     * Loads an `IRProgram`, `OptimizationResult`, or `CompiledArtifact` into the VM
     * and prepares the initial execution state.
     */
    loadProgram(program: IRProgram | OptimizationResult | CompiledArtifact, symbolTable?: ISymbolTable): LoadedProgramImage;
    /**
     * Resets registers, memory, stack, trace, and profiler for a fresh run with `inputData`.
     */
    restart(inputData?: Record<string, unknown>, options?: ExecutionOptions): void;
    private initializeSession;
    /**
     * Executes the loaded IR program from start to completion (or until a breakpoint,
     * runtime error, or timeout is encountered) and returns a complete `FPVMExecutionReport`.
     */
    execute(inputData?: Record<string, unknown>, options?: ExecutionOptions): FPVMExecutionReport;
    /**
     * Resumes execution from a `PAUSED` debugger state until completion or the next breakpoint.
     */
    resume(): FPVMExecutionReport;
    /**
     * Alias for `stepInto()` — executes exactly one IR instruction and pauses.
     */
    step(): VMExecutionTraceStep | null;
    /**
     * Executes a single instruction (stepping into any `CALL` or `POLICY_CALL`) and pauses.
     */
    stepInto(): VMExecutionTraceStep | null;
    /**
     * Steps over the current instruction (if it is a `CALL` or `POLICY_CALL`, runs until
     * the call returns to the current frame depth).
     */
    stepOver(): VMExecutionTraceStep | null;
    /**
     * Runs until the current function or nested policy frame returns to its caller frame.
     */
    stepOut(): VMExecutionTraceStep | null;
    /**
     * Pauses the VM at the current `instructionPointer`.
     */
    pause(): void;
    private runLoop;
    /**
     * Executes one single Fetch-Dispatch-Trace cycle at `this.instructionPointer`.
     */
    private executeSingleCycle;
    setBreakpoint(target: {
        instructionIndex?: number;
        sourceLine?: number;
    }): Breakpoint;
    removeBreakpoint(idOrLineOrIndex: string | number): void;
    getRegisters(): VMRegisterState;
    getCurrentInstruction(): DecodedInstruction | null;
    getVariables(): VariableSnapshotView;
    getExecutionTrace(): VMExecutionTraceStep[];
    getMemoryStats(): MemoryStatistics;
    getProfiler(): ProfilerReport;
    /**
     * Returns the complete live state of the FPVM for Frontend Visualization
     * (Execution Timeline, Instruction Pointer, Memory Viewer, Call Stack Viewer,
     * Variable Viewer, Execution Trace, and Profiler).
     */
    getVisualizationState(): FPVMVisualizationPayload;
    /**
     * Builds the final `FPVMExecutionReport` after execution completes or halts.
     */
    buildExecutionReport(wallClockMs?: number): FPVMExecutionReport;
    private formatExecutionReport;
}
/**
 * Adapter implementing the shared `IExecutionEngine` interface using `FinancialPolicyVM`.
 */
export declare class ExecutionEngine implements IExecutionEngine {
    readonly vm: FinancialPolicyVM;
    private lastContext;
    load(artifact: CompiledArtifact | IRProgram | OptimizationResult): void;
    execute(inputData: Record<string, unknown>, options?: ExecutionOptions): Promise<ExecutionResult>;
    getContext(): ExecutionContext | null;
    reset(): void;
}
/** Alias for `FinancialPolicyVM` */
export { FinancialPolicyVM as VirtualMachine };
/**
 * Convenience helper to load and execute an `IRProgram` or `OptimizationResult`
 * in one call on the `FinancialPolicyVM`.
 */
export declare function executePolicyIR(program: IRProgram | OptimizationResult | CompiledArtifact, inputData?: Record<string, unknown>, options?: ExecutionOptions & {
    symbolTable?: ISymbolTable;
}): FPVMExecutionReport;
//# sourceMappingURL=virtual-machine.d.ts.map