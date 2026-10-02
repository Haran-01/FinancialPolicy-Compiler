/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Financial Policy Virtual Machine (FPVM) Contracts
 *
 * Phase 4: Defines the complete architecture contracts for the stack-based
 * Financial Policy Virtual Machine (FPVM) that executes Optimized IR:
 *   1. VM Registers (`IP`, `PC`, `SP`, `FP`) & Execution Status
 *   2. Stack Frames, Call Stack, Operand Stack & Heap Memory Model
 *   3. Decoded Instructions & Program Image (`LoadedProgramImage`)
 *   4. Execution Trace (`VMExecutionTraceStep`) with variable & stack deltas
 *   5. Runtime Diagnostics (`RuntimeDiagnostic`, `RuntimeErrorCode`) & Logs
 *   6. Profiler (`ProfilerReport`) & Interactive Debugger (`Breakpoint`, `DebuggerState`)
 *   7. Visualization Payloads (`FPVMVisualizationPayload`) for Frontend UI
 *   8. Public Runtime API (`IFinancialPolicyVM`, `IExecutionEngine`)
 *
 * Strict Phase Boundary:
 *   - Executes Optimized IR (`IRProgram` / `OptimizationResult`) directly.
 *   - Does NOT generate Assembly, Machine Code, or Native Binaries.
 * ============================================================================
 */
import type { CompiledArtifact, DecisionResult, ExecutionResult, ExecutionTrace } from '@finpolicy/shared';
import type { BasicBlock, ControlFlowGraph, IRInstruction, IROpcode, IROperand, IRProgram, Quadruple, ThreeAddressInstruction } from '../ir/ir.interface';
import type { OptimizationResult } from '../optimizer/optimizer.interface';
import type { ISymbolTable } from '../symbol-table/symbol-table.interface';
export type VMExecutionStatus = 'IDLE' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR' | 'TIMEOUT';
export type VMDecision = 'APPROVE' | 'REJECT' | 'ALLOW' | 'DENY' | 'REVIEW' | 'UNDECIDED';
/**
 * Hardware-inspired Virtual Machine Registers tracked on every cycle.
 */
export interface VMRegisterState {
    /** Instruction Pointer: index of the next IR instruction to execute (`0 .. N-1`) */
    instructionPointer: number;
    /** Program Counter: total number of instructions executed so far */
    programCounter: number;
    /** Stack Pointer: current top index of the VM Operand Stack (`-1` when empty) */
    stackPointer: number;
    /** Frame Pointer: current index in the Call Stack (`0` for root policy frame) */
    framePointer: number;
    /** Current VM lifecycle state */
    status: VMExecutionStatus;
}
export type StackFrameKind = 'POLICY' | 'FUNCTION' | 'RULE';
export interface StackFrame {
    /** Unique activation frame ID (`frame_1`, `frame_2`, ...) */
    frameId: string;
    /** Index of this frame in the Call Stack (`0` = root) */
    frameIndex: number;
    /** Name of the executing policy, function, or rule */
    containerName: string;
    /** Frame category */
    kind: StackFrameKind;
    /** Instruction index (`IP`) to return to when this frame completes (`-1` for root) */
    returnAddress: number;
    /** Caller destination operand to receive the function/policy return value */
    returnDestination: IROperand | null;
    /** Caller Frame Pointer (`FP`) restored on return */
    previousFramePointer: number;
    /** Local variables bound within this activation frame */
    locals: Map<string, unknown>;
    /** Temporary variables (`t1`, `t2`, ...) bound within this activation frame */
    temporaries: Map<string, unknown>;
    /** Passed positional arguments */
    arguments: unknown[];
}
export interface StackFrameSnapshot {
    frameId: string;
    frameIndex: number;
    containerName: string;
    kind: StackFrameKind;
    returnAddress: number;
    locals: Record<string, unknown>;
    temporaries: Record<string, unknown>;
    arguments: unknown[];
}
export interface HeapObject {
    /** Heap reference handle (e.g., `@heap_1`) */
    address: string;
    /** Object or Array classification */
    kind: 'OBJECT' | 'ARRAY';
    /** Approximate memory footprint in bytes */
    sizeBytes: number;
    /** Active reference count */
    refCount: number;
    /** Underlying key-value record or array elements */
    value: Record<string, unknown> | unknown[];
}
export interface MemoryStatistics {
    /** Current number of values on the VM Operand Stack */
    operandStackDepth: number;
    /** Peak number of values on the VM Operand Stack during execution */
    maxOperandStackDepth: number;
    /** Current number of activation frames on the Call Stack */
    callStackDepth: number;
    /** Peak number of activation frames on the Call Stack during execution */
    maxCallStackDepth: number;
    /** Number of allocated objects/arrays in the VM Heap */
    heapObjectCount: number;
    /** Current bytes allocated in the VM Heap */
    heapAllocatedBytes: number;
    /** Total estimated memory usage across Stack, Globals, Temps, Constants, and Heap */
    currentMemoryBytes: number;
    /** Peak memory usage in bytes observed during execution */
    peakMemoryBytes: number;
    /** Number of immutable entries in the Constant Pool */
    constantPoolCount: number;
    /** Number of global / input / output variables */
    globalVariableCount: number;
    /** Number of local variables in active frames */
    localVariableCount: number;
    /** Number of temporary variables in active frames */
    temporaryVariableCount: number;
}
export type DecodedOpcode = IROpcode | 'PUSH' | 'POP';
export interface DecodedInstruction {
    /** Original IRInstruction */
    raw: IRInstruction;
    /** Instruction ID (`inst_1`, ...) */
    id: string;
    /** 0-based index in the program instruction array (`IP`) */
    index: number;
    /** Normalized opcode */
    opcode: DecodedOpcode;
    /** Symbolic operator (`+`, `-`, `>=`, `=`, etc.) */
    operatorSymbol: string;
    /** Source operands */
    operands: IROperand[];
    /** Destination operand */
    destination: IROperand | null;
    /** Formatted TAC text (`t1 = salary >= 60000`) */
    tacText: string;
    /** Basic Block ID (`B1`, `B2`, ...) */
    basicBlockId: string | null;
    /** Enclosing policy or function name */
    containerName: string;
    /** 1-based source line number in FPL policy */
    sourceLine: number;
}
export interface SubroutineMetadata {
    name: string;
    kind: StackFrameKind;
    entryInstructionIndex: number;
    labelName: string;
    parameterNames: string[];
}
export interface LoadedProgramImage {
    policyName: string;
    instructions: DecodedInstruction[];
    threeAddressCode: ThreeAddressInstruction[];
    quadruples: Quadruple[];
    basicBlocks: BasicBlock[];
    cfg: ControlFlowGraph;
    constantPool: Map<string, unknown>;
    labelToIndex: Map<string, number>;
    functions: Map<string, SubroutineMetadata>;
    policies: Map<string, SubroutineMetadata>;
    rules: Map<string, SubroutineMetadata>;
    entryInstructionIndex: number;
    symbolTable?: ISymbolTable;
}
export type RuntimeErrorCode = 'FPVM-R001' | 'FPVM-R002' | 'FPVM-R003' | 'FPVM-R004' | 'FPVM-R005' | 'FPVM-R006' | 'FPVM-R007' | 'FPVM-R008' | 'FPVM-R009' | 'FPVM-R010';
export interface RuntimeDiagnostic {
    code: RuntimeErrorCode;
    severity: 'ERROR' | 'WARNING';
    message: string;
    instructionIndex: number;
    instructionId: string;
    tacText: string;
    sourceLine: number;
    containerName: string;
    callStackSnapshot: string[];
}
export interface RuntimeLogEntry {
    step: number;
    level: 'LOG' | 'WARN' | 'ERROR';
    message: string;
    instructionIndex: number;
    sourceLine: number;
    timestampMs: number;
}
export interface VariableChangeDelta {
    scope: 'GLOBAL' | 'INPUT' | 'OUTPUT' | 'LOCAL' | 'TEMPORARY';
    name: string;
    before: unknown;
    after: unknown;
}
export interface StackChangeDelta {
    action: 'PUSH' | 'POP' | 'FRAME_PUSH' | 'FRAME_POP' | 'NONE';
    valuesPushed?: unknown[];
    valuesPopped?: unknown[];
    operandStackDepthAfter: number;
    callStackDepthAfter: number;
}
export interface VMExecutionTraceStep {
    /** 1-based execution step number */
    step: number;
    /** Instruction ID (`inst_1`, ...) */
    instructionId: string;
    /** Instruction Pointer (`IP`) executed */
    instructionIndex: number;
    /** Opcode executed */
    opcode: string;
    /** Formatted TAC string (`t1 = salary >= 60000`) */
    tacText: string;
    /** Basic Block ID (`B1`, `B2`, ...) */
    basicBlockId: string | null;
    /** Enclosing policy/function name */
    containerName: string;
    /** 1-based FPL source line number */
    sourceLine: number;
    /** Wall-clock execution duration of this instruction in milliseconds */
    executionTimeMs: number;
    /** Cumulative elapsed time since VM start in milliseconds */
    cumulativeTimeMs: number;
    /** Variable/temporary mutations caused by this instruction */
    variableChanges: VariableChangeDelta[];
    /** Operand stack or Call stack changes caused by this instruction */
    stackChanges: StackChangeDelta;
    /** Snapshot of VM registers immediately after executing this instruction */
    registersAfter: VMRegisterState;
    /** True if a conditional or unconditional branch was taken on this step */
    branchTaken?: boolean;
    /** Target IP if a jump/call/return occurred */
    jumpTargetIndex?: number;
}
export interface HotInstructionProfile {
    instructionId: string;
    instructionIndex: number;
    tacText: string;
    executionCount: number;
    totalTimeMs: number;
}
export interface ProfilerReport {
    /** Total execution wall-clock time in milliseconds */
    executionTimeMs: number;
    /** Total IR instructions executed */
    instructionsExecuted: number;
    /** Execution count per opcode (`ADD`, `GTE`, `IF_FALSE`, etc.) */
    opcodeCounts: Record<string, number>;
    /** Execution count per Basic Block ID (`B1`, `B2`, ...) */
    basicBlockCounts: Record<string, number>;
    /** Total conditional & unconditional branch instructions executed */
    branchCount: number;
    /** Number of branches that transferred control to a non-fallthrough target */
    takenBranchCount: number;
    /** Number of `POLICY_CALL` invocations executed */
    policyCallsCount: number;
    /** Names of policies executed */
    policiesExecuted: string[];
    /** Number of `CALL` function invocations executed */
    functionCallsCount: number;
    /** Names of functions executed */
    functionsExecuted: string[];
    /** Peak operand stack depth */
    maxOperandStackDepth: number;
    /** Peak call stack depth */
    maxCallStackDepth: number;
    /** Peak memory usage in bytes */
    peakMemoryBytes: number;
    /** Top executed instructions sorted by execution count */
    hotInstructions: HotInstructionProfile[];
}
export interface Breakpoint {
    id: string;
    /** Breakpoint target: instruction index (`IP`) or 1-based `sourceLine` */
    instructionIndex?: number;
    sourceLine?: number;
    enabled: boolean;
    hitCount: number;
}
export interface DebuggerState {
    status: VMExecutionStatus;
    currentInstructionIndex: number;
    currentInstruction: DecodedInstruction | null;
    currentSourceLine: number;
    activeBreakpoint: Breakpoint | null;
    breakpoints: Breakpoint[];
    callStackFrames: StackFrameSnapshot[];
    operandStack: unknown[];
    registers: VMRegisterState;
}
export interface VariableSnapshotView {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    globals: Record<string, unknown>;
    constants: Record<string, unknown>;
    locals: Record<string, unknown>;
    temporaries: Record<string, unknown>;
    allVariables: Record<string, unknown>;
}
export interface FPVMExecutionReport {
    /** Primary policy name */
    policyName: string;
    /** Final policy decision (`APPROVE` / `ALLOW`, `REJECT` / `DENY`, `REVIEW`, `UNDECIDED`) */
    decision: VMDecision;
    /** Normalized shared decision (`ALLOW` | `DENY` | `REVIEW`) */
    normalizedDecision: DecisionResult;
    /** Human-readable explanation of how the decision was reached */
    reason: string;
    /** Return value if a function or policy returned an explicit value */
    returnValue: unknown;
    /** Total execution duration in milliseconds */
    executionTimeMs: number;
    /** Total instructions executed */
    instructionsExecuted: number;
    /** Maximum call/operand stack depth */
    maximumStackDepth: number;
    /** Peak memory usage in bytes */
    peakMemoryUsageBytes: number;
    /** Distinct policies executed */
    policiesExecuted: string[];
    /** Distinct functions executed */
    functionsExecuted: string[];
    /** Final variable & output state */
    variables: VariableSnapshotView;
    /** Step-by-step execution trace */
    trace: VMExecutionTraceStep[];
    /** Runtime diagnostics (errors/warnings) */
    diagnostics: RuntimeDiagnostic[];
    /** Runtime console logs (`LOG`, `WARN`) */
    logs: RuntimeLogEntry[];
    /** Memory statistics */
    memoryStats: MemoryStatistics;
    /** Profiler report */
    profiler: ProfilerReport;
    /** Formatted ASCII execution report */
    formattedReport: string;
}
export interface FPVMVisualizationPayload {
    registers: VMRegisterState;
    currentInstruction: DecodedInstruction | null;
    decision: VMDecision;
    variables: VariableSnapshotView;
    operandStack: unknown[];
    callStack: StackFrameSnapshot[];
    heapObjects: HeapObject[];
    memoryStats: MemoryStatistics;
    executionTimeline: VMExecutionTraceStep[];
    profiler: ProfilerReport;
    debuggerState: DebuggerState;
    diagnostics: RuntimeDiagnostic[];
    logs: RuntimeLogEntry[];
}
export interface ExecutionContext {
    policyName: string;
    inputData: Record<string, unknown>;
    outputData: Record<string, unknown>;
    variables: Map<string, unknown>;
    callStack: string[];
    traceEnabled: boolean;
    trace: ExecutionTrace[];
    startTime: number;
    timeoutMs: number;
    iterationCount: number;
    maxIterations: number;
}
export interface RuntimeError {
    code: string;
    message: string;
    instructionIndex: number;
    context: Partial<ExecutionContext>;
}
export interface ExecutionOptions {
    /** Override default timeout in ms (default: `5000`) */
    timeoutMs?: number;
    /** Capture step-by-step execution trace (default: `true`) */
    recordTrace?: boolean;
    /** Maximum instructions/iterations before loop guard triggers (default: `10000`) */
    maxIterations?: number;
    /** Maximum Call Stack frame depth (default: `256`) */
    maxCallStackDepth?: number;
    /** Maximum Operand Stack depth (default: `1024`) */
    maxOperandStackDepth?: number;
    /** Optional custom external functions callable via `CALL` */
    externalFunctions?: Record<string, (...args: unknown[]) => unknown>;
    /** Optional custom external policies callable via `POLICY_CALL` */
    externalPolicies?: Record<string, (inputs: Record<string, unknown>) => VMDecision | Record<string, unknown>>;
}
export interface IFinancialPolicyVM {
    loadProgram(program: IRProgram | OptimizationResult | CompiledArtifact, symbolTable?: ISymbolTable): LoadedProgramImage;
    execute(inputData?: Record<string, unknown>, options?: ExecutionOptions): FPVMExecutionReport;
    step(): VMExecutionTraceStep | null;
    stepInto(): VMExecutionTraceStep | null;
    stepOver(): VMExecutionTraceStep | null;
    stepOut(): VMExecutionTraceStep | null;
    pause(): void;
    resume(): FPVMExecutionReport;
    restart(inputData?: Record<string, unknown>): void;
    setBreakpoint(target: {
        instructionIndex?: number;
        sourceLine?: number;
    }): Breakpoint;
    removeBreakpoint(idOrLineOrIndex: string | number): void;
    getVariables(): VariableSnapshotView;
    getExecutionTrace(): VMExecutionTraceStep[];
    getProfiler(): ProfilerReport;
    getMemoryStats(): MemoryStatistics;
    getVisualizationState(): FPVMVisualizationPayload;
}
export interface IExecutionEngine {
    load(artifact: CompiledArtifact | IRProgram | OptimizationResult): void;
    execute(inputData: Record<string, unknown>, options?: ExecutionOptions): Promise<ExecutionResult>;
    getContext(): ExecutionContext | null;
    reset(): void;
}
export interface IRExecutor {
    executeInstruction(instruction: IRInstruction, ctx: ExecutionContext): void;
}
export type { IRProgram };
//# sourceMappingURL=runtime.interface.d.ts.map