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

import type {
  Breakpoint,
  DecodedInstruction,
  DebuggerState,
  StackFrameSnapshot,
  VMExecutionStatus,
  VMRegisterState,
} from './runtime.interface';

export type StepMode = 'NONE' | 'STEP_INTO' | 'STEP_OVER' | 'STEP_OUT';

export class VMDebugger {
  private readonly breakpoints = new Map<string, Breakpoint>();
  private bpIdCounter = 0;
  private activeBreakpoint: Breakpoint | null = null;
  private stepMode: StepMode = 'NONE';
  private targetCallDepthForStep = 0;

  /**
   * Registers a breakpoint by instruction index (`IP`) and/or source line number.
   */
  public setBreakpoint(target: {
    instructionIndex?: number;
    sourceLine?: number;
  }): Breakpoint {
    // Reuse existing breakpoint if matching target already exists
    for (const bp of this.breakpoints.values()) {
      if (
        bp.instructionIndex === target.instructionIndex &&
        bp.sourceLine === target.sourceLine
      ) {
        bp.enabled = true;
        return bp;
      }
    }

    const id = `bp_${++this.bpIdCounter}`;
    const bp: Breakpoint = {
      id,
      instructionIndex: target.instructionIndex,
      sourceLine: target.sourceLine,
      enabled: true,
      hitCount: 0,
    };
    this.breakpoints.set(id, bp);
    return bp;
  }

  /**
   * Removes a breakpoint by ID, instruction index, or source line number.
   */
  public removeBreakpoint(idOrLineOrIndex: string | number): void {
    if (typeof idOrLineOrIndex === 'string') {
      this.breakpoints.delete(idOrLineOrIndex);
      return;
    }
    for (const [id, bp] of Array.from(this.breakpoints.entries())) {
      if (
        bp.instructionIndex === idOrLineOrIndex ||
        bp.sourceLine === idOrLineOrIndex
      ) {
        this.breakpoints.delete(id);
      }
    }
  }

  public clearBreakpoints(): void {
    this.breakpoints.clear();
    this.activeBreakpoint = null;
  }

  public getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Checks if execution should pause at `instruction` before executing it.
   */
  public checkBreakpoint(instruction: DecodedInstruction): Breakpoint | null {
    for (const bp of this.breakpoints.values()) {
      if (!bp.enabled) continue;
      const matchIndex =
        bp.instructionIndex !== undefined && bp.instructionIndex === instruction.index;
      const matchLine =
        bp.sourceLine !== undefined &&
        bp.sourceLine > 0 &&
        bp.sourceLine === instruction.sourceLine;

      if (matchIndex || matchLine) {
        bp.hitCount++;
        this.activeBreakpoint = bp;
        return bp;
      }
    }
    this.activeBreakpoint = null;
    return null;
  }

  public prepareStepInto(): void {
    this.stepMode = 'STEP_INTO';
    this.activeBreakpoint = null;
  }

  public prepareStepOver(currentCallDepth: number): void {
    this.stepMode = 'STEP_OVER';
    this.targetCallDepthForStep = currentCallDepth;
    this.activeBreakpoint = null;
  }

  public prepareStepOut(currentCallDepth: number): void {
    this.stepMode = 'STEP_OUT';
    this.targetCallDepthForStep = Math.max(1, currentCallDepth - 1);
    this.activeBreakpoint = null;
  }

  public clearStepMode(): void {
    this.stepMode = 'NONE';
    this.activeBreakpoint = null;
  }

  public getStepMode(): StepMode {
    return this.stepMode;
  }

  public shouldStopAfterStep(currentCallDepth: number): boolean {
    if (this.stepMode === 'STEP_INTO') {
      return true;
    }
    if (this.stepMode === 'STEP_OVER' && currentCallDepth <= this.targetCallDepthForStep) {
      return true;
    }
    if (this.stepMode === 'STEP_OUT' && currentCallDepth <= this.targetCallDepthForStep) {
      return true;
    }
    return false;
  }

  public getState(params: {
    status: VMExecutionStatus;
    currentInstruction: DecodedInstruction | null;
    callStackFrames: StackFrameSnapshot[];
    operandStack: unknown[];
    registers: VMRegisterState;
  }): DebuggerState {
    return {
      status: params.status,
      currentInstructionIndex: params.registers.instructionPointer,
      currentInstruction: params.currentInstruction,
      currentSourceLine: params.currentInstruction?.sourceLine ?? 0,
      activeBreakpoint: this.activeBreakpoint,
      breakpoints: this.getBreakpoints(),
      callStackFrames: params.callStackFrames,
      operandStack: params.operandStack,
      registers: { ...params.registers },
    };
  }
}
