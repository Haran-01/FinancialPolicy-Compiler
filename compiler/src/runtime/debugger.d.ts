/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Interactive Debugger
 *
 * Manages interactive debugging controls for the Financial Policy Virtual Machine:
 *   - Breakpoints by IR Instruction Index (`IP`) or FPL Source Line (`sourceLine`)
 *   - Hit count tracking per breakpoint
 *   - Step modes:
 *       * `STEP_INTO` (advance 1 instruction, entering calls)
 *       * `STEP_OVER` (advance 1 instruction at current or shallower call depth)
 *       * `STEP_OUT`  (continue until current call frame returns to caller)
 *       * `CONTINUE`  (run until next breakpoint or program termination)
 *   - Instruction highlighting & live `DebuggerState` snapshots
 * ============================================================================
 */
import type { Breakpoint, DecodedInstruction, DebuggerState, StackFrameSnapshot, VMExecutionStatus, VMRegisterState } from './runtime.interface';
export type StepMode = 'NONE' | 'STEP_INTO' | 'STEP_OVER' | 'STEP_OUT';
export declare class VMDebugger {
    private readonly breakpoints;
    private bpIdCounter;
    private activeBreakpoint;
    private stepMode;
    private targetCallDepthForStep;
    /**
     * Registers a breakpoint by instruction index (`IP`) and/or source line number.
     */
    setBreakpoint(target: {
        instructionIndex?: number;
        sourceLine?: number;
    }): Breakpoint;
    /**
     * Removes a breakpoint by ID, instruction index, or source line number.
     */
    removeBreakpoint(idOrLineOrIndex: string | number): void;
    clearBreakpoints(): void;
    getBreakpoints(): Breakpoint[];
    /**
     * Checks if execution should pause at `instruction` before executing it.
     */
    checkBreakpoint(instruction: DecodedInstruction): Breakpoint | null;
    prepareStepInto(): void;
    prepareStepOver(currentCallDepth: number): void;
    prepareStepOut(currentCallDepth: number): void;
    clearStepMode(): void;
    getStepMode(): StepMode;
    shouldStopAfterStep(currentCallDepth: number): boolean;
    getState(params: {
        status: VMExecutionStatus;
        currentInstruction: DecodedInstruction | null;
        callStackFrames: StackFrameSnapshot[];
        operandStack: unknown[];
        registers: VMRegisterState;
    }): DebuggerState;
}
//# sourceMappingURL=debugger.d.ts.map