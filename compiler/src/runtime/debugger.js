"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VMDebugger = void 0;
class VMDebugger {
    breakpoints = new Map();
    bpIdCounter = 0;
    activeBreakpoint = null;
    stepMode = 'NONE';
    targetCallDepthForStep = 0;
    /**
     * Registers a breakpoint by instruction index (`IP`) and/or source line number.
     */
    setBreakpoint(target) {
        // Reuse existing breakpoint if matching target already exists
        for (const bp of this.breakpoints.values()) {
            if (bp.instructionIndex === target.instructionIndex &&
                bp.sourceLine === target.sourceLine) {
                bp.enabled = true;
                return bp;
            }
        }
        const id = `bp_${++this.bpIdCounter}`;
        const bp = {
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
    removeBreakpoint(idOrLineOrIndex) {
        if (typeof idOrLineOrIndex === 'string') {
            this.breakpoints.delete(idOrLineOrIndex);
            return;
        }
        for (const [id, bp] of Array.from(this.breakpoints.entries())) {
            if (bp.instructionIndex === idOrLineOrIndex ||
                bp.sourceLine === idOrLineOrIndex) {
                this.breakpoints.delete(id);
            }
        }
    }
    clearBreakpoints() {
        this.breakpoints.clear();
        this.activeBreakpoint = null;
    }
    getBreakpoints() {
        return Array.from(this.breakpoints.values());
    }
    /**
     * Checks if execution should pause at `instruction` before executing it.
     */
    checkBreakpoint(instruction) {
        for (const bp of this.breakpoints.values()) {
            if (!bp.enabled)
                continue;
            const matchIndex = bp.instructionIndex !== undefined && bp.instructionIndex === instruction.index;
            const matchLine = bp.sourceLine !== undefined &&
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
    prepareStepInto() {
        this.stepMode = 'STEP_INTO';
        this.activeBreakpoint = null;
    }
    prepareStepOver(currentCallDepth) {
        this.stepMode = 'STEP_OVER';
        this.targetCallDepthForStep = currentCallDepth;
        this.activeBreakpoint = null;
    }
    prepareStepOut(currentCallDepth) {
        this.stepMode = 'STEP_OUT';
        this.targetCallDepthForStep = Math.max(1, currentCallDepth - 1);
        this.activeBreakpoint = null;
    }
    clearStepMode() {
        this.stepMode = 'NONE';
        this.activeBreakpoint = null;
    }
    getStepMode() {
        return this.stepMode;
    }
    shouldStopAfterStep(currentCallDepth) {
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
    getState(params) {
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
exports.VMDebugger = VMDebugger;
//# sourceMappingURL=debugger.js.map