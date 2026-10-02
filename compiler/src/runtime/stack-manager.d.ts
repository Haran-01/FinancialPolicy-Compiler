/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Stack Manager, Frame Manager & Call Stack
 *
 * Implements the two core stack structures of the Financial Policy Virtual
 * Machine:
 *   1. `StackManager`: The VM Operand Stack (`push`, `pop`, `peek`, `popN`,
 *      `stackPointer` `SP`, `maxDepth`), enforcing strict overflow and
 *      underflow protection (`FPVM-R002`, `FPVM-R003`).
 *   2. `FrameManager` & `CallStack`: Manages activation `StackFrame` records
 *      for Policy Calls, Function Calls, Rule Invocations, Nested Calls, and
 *      Recursive Calls, maintaining the `framePointer` (`FP`), return
 *      addresses (`IP`), and isolated per-frame local/temporary variable maps.
 * ============================================================================
 */
import type { IROperand } from '../ir/ir.interface';
import { RuntimeDiagnostics } from './runtime-diagnostics';
import type { DecodedInstruction, StackFrame, StackFrameKind, StackFrameSnapshot } from './runtime.interface';
export declare class StackManager {
    private readonly operandStack;
    private maxCapacity;
    private maxDepthObserved;
    private readonly diagnostics;
    constructor(diagnostics: RuntimeDiagnostics, maxCapacity?: number);
    setMaxCapacity(maxCapacity: number): void;
    /**
     * Pushes a value onto the top of the VM Operand Stack and increments `SP`.
     */
    push(value: unknown, currentInstruction?: DecodedInstruction | null, callStackNames?: string[]): void;
    /**
     * Pops and returns the top value from the VM Operand Stack and decrements `SP`.
     */
    pop(currentInstruction?: DecodedInstruction | null, callStackNames?: string[]): unknown;
    /**
     * Pops `count` arguments from the operand stack in call order (FIFO relative to push order).
     */
    popArguments(count: number, currentInstruction?: DecodedInstruction | null, callStackNames?: string[]): unknown[];
    /**
     * Peeks at the top value on the VM Operand Stack without removing it.
     */
    peek(currentInstruction?: DecodedInstruction | null, callStackNames?: string[]): unknown;
    /**
     * Current Stack Pointer (`SP`): `-1` when empty, `length - 1` otherwise.
     */
    getStackPointer(): number;
    getDepth(): number;
    getMaxDepth(): number;
    getSnapshot(): unknown[];
    clear(): void;
}
export declare class FrameManager {
    private frameCounter;
    /**
     * Allocates a new isolated activation `StackFrame`.
     */
    createFrame(params: {
        frameIndex: number;
        containerName: string;
        kind: StackFrameKind;
        returnAddress: number;
        returnDestination: IROperand | null;
        previousFramePointer: number;
        arguments?: unknown[];
        parameterNames?: string[];
    }): StackFrame;
    toSnapshot(frame: StackFrame): StackFrameSnapshot;
    reset(): void;
}
export declare class CallStack {
    private readonly frames;
    private maxCallDepth;
    private maxDepthObserved;
    private readonly frameManager;
    private readonly diagnostics;
    constructor(diagnostics: RuntimeDiagnostics, maxCallDepth?: number);
    setMaxCallDepth(maxCallDepth: number): void;
    /**
     * Pushes a new activation frame onto the Call Stack (for Root Policy, Function Call,
     * Policy Call, or Rule Application). Enforces recursion/call depth limits (`FPVM-R002`).
     */
    pushFrame(params: {
        containerName: string;
        kind: StackFrameKind;
        returnAddress: number;
        returnDestination?: IROperand | null;
        arguments?: unknown[];
        parameterNames?: string[];
    }, currentInstruction?: DecodedInstruction | null): StackFrame;
    /**
     * Pops and returns the top activation frame from the Call Stack.
     */
    popFrame(currentInstruction?: DecodedInstruction | null): StackFrame;
    /**
     * Returns the currently active top `StackFrame`, or `null` if empty.
     */
    currentFrame(): StackFrame | null;
    /**
     * Returns the root policy `StackFrame`.
     */
    rootFrame(): StackFrame | null;
    /**
     * Current Frame Pointer (`FP`): index of the active frame (`0` for root, `-1` when empty).
     */
    getFramePointer(): number;
    getDepth(): number;
    getMaxDepth(): number;
    getFrameNames(): string[];
    getFrames(): StackFrame[];
    getSnapshots(): StackFrameSnapshot[];
    clear(): void;
}
//# sourceMappingURL=stack-manager.d.ts.map