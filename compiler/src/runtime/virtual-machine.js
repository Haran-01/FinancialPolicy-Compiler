"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualMachine = exports.ExecutionEngine = exports.FinancialPolicyVM = void 0;
exports.executePolicyIR = executePolicyIR;
const debugger_1 = require("./debugger");
const instruction_dispatcher_1 = require("./instruction-dispatcher");
const memory_manager_1 = require("./memory-manager");
const profiler_1 = require("./profiler");
const program_loader_1 = require("./program-loader");
const runtime_diagnostics_1 = require("./runtime-diagnostics");
const stack_manager_1 = require("./stack-manager");
class FinancialPolicyVM {
    loader = new program_loader_1.ProgramLoader();
    diagnostics = new runtime_diagnostics_1.RuntimeDiagnostics();
    logger = new runtime_diagnostics_1.RuntimeLogger();
    stackManager;
    callStack;
    memoryManager;
    dispatcher;
    profiler = new profiler_1.Profiler();
    debugger = new debugger_1.VMDebugger();
    loadedProgram = null;
    currentInputData = {};
    currentOptions = {};
    instructionPointer = 0;
    programCounter = 0;
    status = 'IDLE';
    decision = 'UNDECIDED';
    decisionReason = 'Policy execution completed without reaching an explicit terminal decision.';
    returnValue = null;
    trace = [];
    executionStartTimeMs = 0;
    cumulativeTimeMs = 0;
    constructor() {
        this.stackManager = new stack_manager_1.StackManager(this.diagnostics, 1024);
        this.callStack = new stack_manager_1.CallStack(this.diagnostics, 256);
        this.memoryManager = new memory_manager_1.MemoryManager(this.stackManager, this.callStack, this.diagnostics);
        this.dispatcher = new instruction_dispatcher_1.InstructionDispatcher({
            memory: this.memoryManager,
            stack: this.stackManager,
            callStack: this.callStack,
            diagnostics: this.diagnostics,
            logger: this.logger,
        });
    }
    // ───────────────────────────────────────────────────────────────────────────
    // 1. Program Loading & Session Initialization
    // ───────────────────────────────────────────────────────────────────────────
    /**
     * Loads an `IRProgram`, `OptimizationResult`, or `CompiledArtifact` into the VM
     * and prepares the initial execution state.
     */
    loadProgram(program, symbolTable) {
        this.loadedProgram = this.loader.load(program, symbolTable);
        this.initializeSession(this.currentInputData, this.currentOptions);
        return this.loadedProgram;
    }
    /**
     * Resets registers, memory, stack, trace, and profiler for a fresh run with `inputData`.
     */
    restart(inputData = this.currentInputData, options = this.currentOptions) {
        this.initializeSession(inputData, options);
    }
    initializeSession(inputData, options) {
        this.currentInputData = { ...inputData };
        this.currentOptions = { ...options };
        this.diagnostics.clear();
        this.logger.clear();
        this.stackManager.clear();
        if (options.maxOperandStackDepth) {
            this.stackManager.setMaxCapacity(options.maxOperandStackDepth);
        }
        this.callStack.clear();
        if (options.maxCallStackDepth) {
            this.callStack.setMaxCallDepth(options.maxCallStackDepth);
        }
        this.profiler.reset();
        this.debugger.clearStepMode();
        this.trace.length = 0;
        this.decision = 'UNDECIDED';
        this.decisionReason =
            'Policy execution completed without reaching an explicit terminal decision.';
        this.returnValue = null;
        this.programCounter = 0;
        this.cumulativeTimeMs = 0;
        this.executionStartTimeMs = performance.now();
        if (!this.loadedProgram) {
            this.instructionPointer = 0;
            this.status = 'IDLE';
            return;
        }
        // Push root Policy activation frame onto the Call Stack
        this.callStack.pushFrame({
            containerName: this.loadedProgram.policyName,
            kind: 'POLICY',
            returnAddress: -1,
            returnDestination: null,
        });
        this.profiler.recordPolicyStart(this.loadedProgram.policyName);
        this.memoryManager.initialize(this.loadedProgram.constantPool, this.currentInputData);
        this.instructionPointer = this.loadedProgram.entryInstructionIndex;
        this.status = 'READY';
    }
    // ───────────────────────────────────────────────────────────────────────────
    // 2. Full Execution & Single-Cycle Stepping
    // ───────────────────────────────────────────────────────────────────────────
    /**
     * Executes the loaded IR program from start to completion (or until a breakpoint,
     * runtime error, or timeout is encountered) and returns a complete `FPVMExecutionReport`.
     */
    execute(inputData = {}, options) {
        if (!this.loadedProgram) {
            throw new Error('No program loaded in FPVM. Call loadProgram() before execute().');
        }
        this.initializeSession(inputData, options ?? this.currentOptions);
        return this.runLoop(false);
    }
    /**
     * Resumes execution from a `PAUSED` debugger state until completion or the next breakpoint.
     */
    resume() {
        if (!this.loadedProgram) {
            throw new Error('No program loaded in FPVM.');
        }
        this.debugger.clearStepMode();
        return this.runLoop(true);
    }
    /**
     * Alias for `stepInto()` — executes exactly one IR instruction and pauses.
     */
    step() {
        return this.stepInto();
    }
    /**
     * Executes a single instruction (stepping into any `CALL` or `POLICY_CALL`) and pauses.
     */
    stepInto() {
        if (!this.loadedProgram)
            return null;
        if (this.status === 'COMPLETED' || this.status === 'ERROR' || this.status === 'TIMEOUT') {
            return null;
        }
        this.debugger.prepareStepInto();
        const stepRecord = this.executeSingleCycle(true);
        if (this.status === 'RUNNING') {
            this.status = 'PAUSED';
        }
        return stepRecord;
    }
    /**
     * Steps over the current instruction (if it is a `CALL` or `POLICY_CALL`, runs until
     * the call returns to the current frame depth).
     */
    stepOver() {
        if (!this.loadedProgram)
            return null;
        if (this.status === 'COMPLETED' || this.status === 'ERROR' || this.status === 'TIMEOUT') {
            return null;
        }
        const startingDepth = this.callStack.getDepth();
        this.debugger.prepareStepOver(startingDepth);
        let lastStep = null;
        const maxIterations = this.currentOptions.maxIterations ?? 10000;
        let guard = 0;
        while (guard++ < maxIterations) {
            lastStep = this.executeSingleCycle(guard === 1);
            const statusAfterStep = this.getRegisters().status;
            if (statusAfterStep === 'COMPLETED' ||
                statusAfterStep === 'ERROR' ||
                statusAfterStep === 'TIMEOUT' ||
                statusAfterStep === 'PAUSED') {
                break;
            }
            if (this.debugger.shouldStopAfterStep(this.callStack.getDepth())) {
                this.status = 'PAUSED';
                break;
            }
        }
        return lastStep;
    }
    /**
     * Runs until the current function or nested policy frame returns to its caller frame.
     */
    stepOut() {
        if (!this.loadedProgram)
            return null;
        if (this.status === 'COMPLETED' || this.status === 'ERROR' || this.status === 'TIMEOUT') {
            return null;
        }
        const startingDepth = this.callStack.getDepth();
        this.debugger.prepareStepOut(startingDepth);
        let lastStep = null;
        const maxIterations = this.currentOptions.maxIterations ?? 10000;
        let guard = 0;
        while (guard++ < maxIterations) {
            lastStep = this.executeSingleCycle(guard === 1);
            const statusAfterStep = this.getRegisters().status;
            if (statusAfterStep === 'COMPLETED' ||
                statusAfterStep === 'ERROR' ||
                statusAfterStep === 'TIMEOUT' ||
                statusAfterStep === 'PAUSED') {
                break;
            }
            if (this.debugger.shouldStopAfterStep(this.callStack.getDepth())) {
                this.status = 'PAUSED';
                break;
            }
        }
        return lastStep;
    }
    /**
     * Pauses the VM at the current `instructionPointer`.
     */
    pause() {
        if (this.status === 'RUNNING' || this.status === 'READY') {
            this.status = 'PAUSED';
        }
    }
    // ───────────────────────────────────────────────────────────────────────────
    // 3. Internal Fetch-Decode-Execute Cycle
    // ───────────────────────────────────────────────────────────────────────────
    runLoop(ignoreBreakpointOnFirstCycle) {
        if (!this.loadedProgram) {
            throw new Error('No program loaded in FPVM.');
        }
        const maxIterations = this.currentOptions.maxIterations ?? 10000;
        const timeoutMs = this.currentOptions.timeoutMs ?? 5000;
        const loopStart = performance.now();
        this.status = 'RUNNING';
        let firstCycle = true;
        while (this.status === 'RUNNING') {
            if (this.instructionPointer < 0 || this.instructionPointer >= this.loadedProgram.instructions.length) {
                this.status = 'COMPLETED';
                break;
            }
            // Guard 1: Max iteration / instruction counter check
            if (this.programCounter >= maxIterations) {
                const currentInst = this.loadedProgram.instructions[this.instructionPointer] ?? null;
                try {
                    this.diagnostics.raiseError('FPVM-R010', `Execution Limit Exceeded: policy exceeded maximum allowed instructions (${maxIterations}). Possible infinite loop.`, currentInst, this.callStack.getFrameNames());
                }
                catch {
                    this.status = 'TIMEOUT';
                    break;
                }
            }
            // Guard 2: Wall-clock timeout check
            const elapsed = performance.now() - loopStart;
            if (elapsed > timeoutMs) {
                const currentInst = this.loadedProgram.instructions[this.instructionPointer] ?? null;
                try {
                    this.diagnostics.raiseError('FPVM-R010', `Execution Timeout: policy execution exceeded ${timeoutMs} ms limit.`, currentInst, this.callStack.getFrameNames());
                }
                catch {
                    this.status = 'TIMEOUT';
                    break;
                }
            }
            const bypassBp = firstCycle && ignoreBreakpointOnFirstCycle;
            firstCycle = false;
            this.executeSingleCycle(bypassBp);
        }
        const totalElapsed = Number((performance.now() - this.executionStartTimeMs).toFixed(3));
        return this.buildExecutionReport(totalElapsed);
    }
    /**
     * Executes one single Fetch-Dispatch-Trace cycle at `this.instructionPointer`.
     */
    executeSingleCycle(bypassBreakpointCheck) {
        if (!this.loadedProgram)
            return null;
        if (this.instructionPointer < 0 ||
            this.instructionPointer >= this.loadedProgram.instructions.length) {
            this.status = 'COMPLETED';
            return null;
        }
        const inst = this.loadedProgram.instructions[this.instructionPointer];
        // Check breakpoint before executing `inst`
        if (!bypassBreakpointCheck) {
            const hitBp = this.debugger.checkBreakpoint(inst);
            if (hitBp) {
                this.status = 'PAUSED';
                return null;
            }
        }
        this.status = 'RUNNING';
        const cycleStart = performance.now();
        const stepNumber = this.programCounter + 1;
        try {
            const outcome = this.dispatcher.dispatch(inst, this.loadedProgram, stepNumber, this.currentOptions);
            const cycleDurationMs = Number((performance.now() - cycleStart).toFixed(4));
            this.cumulativeTimeMs = Number((this.cumulativeTimeMs + cycleDurationMs).toFixed(4));
            this.programCounter++;
            this.instructionPointer = outcome.nextInstructionPointer;
            if (outcome.decision) {
                this.decision = outcome.decision;
                if (outcome.decisionReason) {
                    this.decisionReason = outcome.decisionReason;
                }
            }
            if (outcome.returnValue !== undefined) {
                this.returnValue = outcome.returnValue;
            }
            if (outcome.halted ||
                this.instructionPointer < 0 ||
                this.instructionPointer >= this.loadedProgram.instructions.length) {
                this.status = 'COMPLETED';
            }
            this.profiler.recordInstructionExecution(inst, cycleDurationMs, {
                isBranch: outcome.isBranch,
                branchTaken: outcome.branchTaken,
                calledPolicy: outcome.calledPolicy,
                calledFunction: outcome.calledFunction,
            });
            const registersAfter = this.getRegisters();
            const traceStep = {
                step: stepNumber,
                instructionId: inst.id,
                instructionIndex: inst.index,
                opcode: inst.opcode,
                tacText: inst.tacText,
                basicBlockId: inst.basicBlockId,
                containerName: inst.containerName,
                sourceLine: inst.sourceLine,
                executionTimeMs: cycleDurationMs,
                cumulativeTimeMs: this.cumulativeTimeMs,
                variableChanges: outcome.variableChanges,
                stackChanges: outcome.stackChanges,
                registersAfter,
                branchTaken: outcome.isBranch ? outcome.branchTaken : undefined,
                jumpTargetIndex: outcome.branchTaken ? outcome.nextInstructionPointer : undefined,
            };
            if (this.currentOptions.recordTrace !== false) {
                this.trace.push(traceStep);
            }
            return traceStep;
        }
        catch (err) {
            if (err instanceof runtime_diagnostics_1.FPVMRuntimeException) {
                this.status = 'ERROR';
                this.logger.log('ERROR', err.message, stepNumber, inst.index, inst.sourceLine);
                return null;
            }
            throw err;
        }
    }
    // ───────────────────────────────────────────────────────────────────────────
    // 4. Breakpoints, Inspection & Visualization APIs
    // ───────────────────────────────────────────────────────────────────────────
    setBreakpoint(target) {
        return this.debugger.setBreakpoint(target);
    }
    removeBreakpoint(idOrLineOrIndex) {
        this.debugger.removeBreakpoint(idOrLineOrIndex);
    }
    getRegisters() {
        return {
            instructionPointer: this.instructionPointer,
            programCounter: this.programCounter,
            stackPointer: this.stackManager.getStackPointer(),
            framePointer: this.callStack.getFramePointer(),
            status: this.status,
        };
    }
    getCurrentInstruction() {
        if (!this.loadedProgram)
            return null;
        return this.loadedProgram.instructions[this.instructionPointer] ?? null;
    }
    getVariables() {
        return this.memoryManager.getVariablesSnapshot();
    }
    getExecutionTrace() {
        return [...this.trace];
    }
    getMemoryStats() {
        return this.memoryManager.getMemoryStatistics();
    }
    getProfiler() {
        return this.profiler.getReport(this.getMemoryStats(), this.cumulativeTimeMs);
    }
    /**
     * Returns the complete live state of the FPVM for Frontend Visualization
     * (Execution Timeline, Instruction Pointer, Memory Viewer, Call Stack Viewer,
     * Variable Viewer, Execution Trace, and Profiler).
     */
    getVisualizationState() {
        const registers = this.getRegisters();
        const currentInstruction = this.getCurrentInstruction();
        const callStack = this.callStack.getSnapshots();
        const operandStack = this.stackManager.getSnapshot();
        const memoryStats = this.getMemoryStats();
        return {
            registers,
            currentInstruction,
            decision: this.decision,
            variables: this.getVariables(),
            operandStack,
            callStack,
            heapObjects: this.memoryManager.heapManager.getHeapObjects(),
            memoryStats,
            executionTimeline: this.getExecutionTrace(),
            profiler: this.profiler.getReport(memoryStats, this.cumulativeTimeMs),
            debuggerState: this.debugger.getState({
                status: this.status,
                currentInstruction,
                callStackFrames: callStack,
                operandStack,
                registers,
            }),
            diagnostics: this.diagnostics.getDiagnostics(),
            logs: this.logger.getLogs(),
        };
    }
    /**
     * Builds the final `FPVMExecutionReport` after execution completes or halts.
     */
    buildExecutionReport(wallClockMs) {
        const policyName = this.loadedProgram?.policyName ?? 'MainPolicy';
        const memoryStats = this.getMemoryStats();
        const profilerReport = this.profiler.getReport(memoryStats, wallClockMs);
        const variables = this.getVariables();
        const diagnostics = this.diagnostics.getDiagnostics();
        const logs = this.logger.getLogs();
        const normalizedDecision = this.decision === 'APPROVE' || this.decision === 'ALLOW'
            ? 'ALLOW'
            : this.decision === 'REVIEW'
                ? 'REVIEW'
                : 'DENY';
        const maximumStackDepth = Math.max(memoryStats.maxCallStackDepth, memoryStats.maxOperandStackDepth);
        const formattedReport = this.formatExecutionReport({
            policyName,
            decision: this.decision,
            reason: this.decisionReason,
            executionTimeMs: profilerReport.executionTimeMs,
            instructionsExecuted: profilerReport.instructionsExecuted,
            maximumStackDepth,
            peakMemoryUsageBytes: memoryStats.peakMemoryBytes,
            policiesExecuted: profilerReport.policiesExecuted,
            functionsExecuted: profilerReport.functionsExecuted,
            variables,
            diagnostics,
        });
        return {
            policyName,
            decision: this.decision,
            normalizedDecision,
            reason: diagnostics.length > 0
                ? `[${diagnostics[0].code}] ${diagnostics[0].message}`
                : this.decisionReason,
            returnValue: this.returnValue,
            executionTimeMs: profilerReport.executionTimeMs,
            instructionsExecuted: profilerReport.instructionsExecuted,
            maximumStackDepth,
            peakMemoryUsageBytes: memoryStats.peakMemoryBytes,
            policiesExecuted: profilerReport.policiesExecuted,
            functionsExecuted: profilerReport.functionsExecuted,
            variables,
            trace: this.getExecutionTrace(),
            diagnostics,
            logs,
            memoryStats,
            profiler: profilerReport,
            formattedReport,
        };
    }
    formatExecutionReport(params) {
        const lines = [];
        lines.push('================================================================================');
        lines.push(`Financial Policy Virtual Machine (FPVM) — Execution Report (${params.policyName})`);
        lines.push('================================================================================');
        lines.push(`Decision             : ${params.decision}`);
        lines.push(`Reason               : ${params.reason}`);
        lines.push(`Execution Time       : ${params.executionTimeMs} ms`);
        lines.push(`Instructions Executed: ${params.instructionsExecuted}`);
        lines.push(`Maximum Stack Depth  : ${params.maximumStackDepth}`);
        lines.push(`Peak Memory Usage    : ${params.peakMemoryUsageBytes} bytes`);
        lines.push(`Policies Executed    : ${params.policiesExecuted.length > 0 ? params.policiesExecuted.join(', ') : params.policyName}`);
        lines.push(`Functions Executed   : ${params.functionsExecuted.length > 0 ? params.functionsExecuted.join(', ') : 'None'}`);
        lines.push(`Outputs              : ${JSON.stringify(params.variables.outputs)}`);
        if (params.diagnostics.length > 0) {
            lines.push('Diagnostics          :');
            for (const d of params.diagnostics) {
                lines.push(`  - [${d.code}] ${d.message} (line ${d.sourceLine})`);
            }
        }
        lines.push('================================================================================');
        return lines.join('\n');
    }
}
exports.FinancialPolicyVM = FinancialPolicyVM;
exports.VirtualMachine = FinancialPolicyVM;
/**
 * Adapter implementing the shared `IExecutionEngine` interface using `FinancialPolicyVM`.
 */
class ExecutionEngine {
    vm = new FinancialPolicyVM();
    lastContext = null;
    load(artifact) {
        this.vm.loadProgram(artifact);
    }
    async execute(inputData, options) {
        const report = this.vm.execute(inputData, options);
        const varsMap = new Map(Object.entries(report.variables.allVariables));
        const sharedTrace = report.trace.map((t) => ({
            step: t.step,
            instruction: t.tacText,
            inputState: report.variables.inputs,
            outputState: report.variables.outputs,
            timestamp: t.cumulativeTimeMs,
        }));
        this.lastContext = {
            policyName: report.policyName,
            inputData,
            outputData: report.variables.outputs,
            variables: varsMap,
            callStack: report.policiesExecuted,
            traceEnabled: options?.recordTrace ?? true,
            trace: sharedTrace,
            startTime: Date.now(),
            timeoutMs: options?.timeoutMs ?? 5000,
            iterationCount: report.instructionsExecuted,
            maxIterations: options?.maxIterations ?? 10000,
        };
        return {
            decision: report.normalizedDecision,
            reason: report.reason,
            output: report.variables.outputs,
            trace: options?.recordTrace === false ? null : sharedTrace,
            durationMs: report.executionTimeMs,
        };
    }
    getContext() {
        return this.lastContext;
    }
    reset() {
        this.lastContext = null;
        this.vm.restart({});
    }
}
exports.ExecutionEngine = ExecutionEngine;
/**
 * Convenience helper to load and execute an `IRProgram` or `OptimizationResult`
 * in one call on the `FinancialPolicyVM`.
 */
function executePolicyIR(program, inputData = {}, options) {
    const vm = new FinancialPolicyVM();
    vm.loadProgram(program, options?.symbolTable);
    return vm.execute(inputData, options);
}
//# sourceMappingURL=virtual-machine.js.map