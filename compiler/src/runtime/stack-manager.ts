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
import type {
  DecodedInstruction,
  StackFrame,
  StackFrameKind,
  StackFrameSnapshot,
} from './runtime.interface';

export class StackManager {
  private readonly operandStack: unknown[] = [];
  private maxCapacity: number;
  private maxDepthObserved = 0;
  private readonly diagnostics: RuntimeDiagnostics;

  constructor(diagnostics: RuntimeDiagnostics, maxCapacity = 1024) {
    this.diagnostics = diagnostics;
    this.maxCapacity = maxCapacity;
  }

  public setMaxCapacity(maxCapacity: number): void {
    this.maxCapacity = maxCapacity;
  }

  /**
   * Pushes a value onto the top of the VM Operand Stack and increments `SP`.
   */
  public push(
    value: unknown,
    currentInstruction: DecodedInstruction | null = null,
    callStackNames: string[] = [],
  ): void {
    if (this.operandStack.length >= this.maxCapacity) {
      this.diagnostics.raiseError(
        'FPVM-R002',
        `Operand Stack Overflow: exceeded maximum operand stack capacity (${this.maxCapacity}).`,
        currentInstruction,
        callStackNames,
      );
    }
    this.operandStack.push(value);
    if (this.operandStack.length > this.maxDepthObserved) {
      this.maxDepthObserved = this.operandStack.length;
    }
  }

  /**
   * Pops and returns the top value from the VM Operand Stack and decrements `SP`.
   */
  public pop(
    currentInstruction: DecodedInstruction | null = null,
    callStackNames: string[] = [],
  ): unknown {
    if (this.operandStack.length === 0) {
      this.diagnostics.raiseError(
        'FPVM-R003',
        'Operand Stack Underflow: attempted to POP from an empty VM operand stack.',
        currentInstruction,
        callStackNames,
      );
    }
    return this.operandStack.pop();
  }

  /**
   * Pops `count` arguments from the operand stack in call order (FIFO relative to push order).
   */
  public popArguments(
    count: number,
    currentInstruction: DecodedInstruction | null = null,
    callStackNames: string[] = [],
  ): unknown[] {
    if (count <= 0) return [];
    if (this.operandStack.length < count) {
      this.diagnostics.raiseError(
        'FPVM-R003',
        `Operand Stack Underflow: expected ${count} call argument(s) on stack, found ${this.operandStack.length}.`,
        currentInstruction,
        callStackNames,
      );
    }
    const startIdx = this.operandStack.length - count;
    return this.operandStack.splice(startIdx, count);
  }

  /**
   * Peeks at the top value on the VM Operand Stack without removing it.
   */
  public peek(
    currentInstruction: DecodedInstruction | null = null,
    callStackNames: string[] = [],
  ): unknown {
    if (this.operandStack.length === 0) {
      this.diagnostics.raiseError(
        'FPVM-R003',
        'Operand Stack Underflow: attempted to PEEK an empty VM operand stack.',
        currentInstruction,
        callStackNames,
      );
    }
    return this.operandStack[this.operandStack.length - 1];
  }

  /**
   * Current Stack Pointer (`SP`): `-1` when empty, `length - 1` otherwise.
   */
  public getStackPointer(): number {
    return this.operandStack.length - 1;
  }

  public getDepth(): number {
    return this.operandStack.length;
  }

  public getMaxDepth(): number {
    return this.maxDepthObserved;
  }

  public getSnapshot(): unknown[] {
    return [...this.operandStack];
  }

  public clear(): void {
    this.operandStack.length = 0;
    this.maxDepthObserved = 0;
  }
}

export class FrameManager {
  private frameCounter = 0;

  /**
   * Allocates a new isolated activation `StackFrame`.
   */
  public createFrame(params: {
    frameIndex: number;
    containerName: string;
    kind: StackFrameKind;
    returnAddress: number;
    returnDestination: IROperand | null;
    previousFramePointer: number;
    arguments?: unknown[];
    parameterNames?: string[];
  }): StackFrame {
    const frameId = `frame_${++this.frameCounter}`;
    const locals = new Map<string, unknown>();
    const args = params.arguments ?? [];

    if (params.parameterNames) {
      for (let i = 0; i < params.parameterNames.length; i++) {
        locals.set(params.parameterNames[i], args[i] ?? null);
      }
    }

    return {
      frameId,
      frameIndex: params.frameIndex,
      containerName: params.containerName,
      kind: params.kind,
      returnAddress: params.returnAddress,
      returnDestination: params.returnDestination,
      previousFramePointer: params.previousFramePointer,
      locals,
      temporaries: new Map<string, unknown>(),
      arguments: [...args],
    };
  }

  public toSnapshot(frame: StackFrame): StackFrameSnapshot {
    return {
      frameId: frame.frameId,
      frameIndex: frame.frameIndex,
      containerName: frame.containerName,
      kind: frame.kind,
      returnAddress: frame.returnAddress,
      locals: Object.fromEntries(frame.locals.entries()),
      temporaries: Object.fromEntries(frame.temporaries.entries()),
      arguments: [...frame.arguments],
    };
  }

  public reset(): void {
    this.frameCounter = 0;
  }
}

export class CallStack {
  private readonly frames: StackFrame[] = [];
  private maxCallDepth: number;
  private maxDepthObserved = 0;
  private readonly frameManager = new FrameManager();
  private readonly diagnostics: RuntimeDiagnostics;

  constructor(diagnostics: RuntimeDiagnostics, maxCallDepth = 256) {
    this.diagnostics = diagnostics;
    this.maxCallDepth = maxCallDepth;
  }

  public setMaxCallDepth(maxCallDepth: number): void {
    this.maxCallDepth = maxCallDepth;
  }

  /**
   * Pushes a new activation frame onto the Call Stack (for Root Policy, Function Call,
   * Policy Call, or Rule Application). Enforces recursion/call depth limits (`FPVM-R002`).
   */
  public pushFrame(
    params: {
      containerName: string;
      kind: StackFrameKind;
      returnAddress: number;
      returnDestination?: IROperand | null;
      arguments?: unknown[];
      parameterNames?: string[];
    },
    currentInstruction: DecodedInstruction | null = null,
  ): StackFrame {
    if (this.frames.length >= this.maxCallDepth) {
      this.diagnostics.raiseError(
        'FPVM-R002',
        `Call Stack Overflow: maximum call stack depth (${this.maxCallDepth}) exceeded while calling '${params.containerName}'. Possible infinite recursion.`,
        currentInstruction,
        this.getFrameNames(),
      );
    }

    const previousFramePointer = this.getFramePointer();
    const frame = this.frameManager.createFrame({
      frameIndex: this.frames.length,
      containerName: params.containerName,
      kind: params.kind,
      returnAddress: params.returnAddress,
      returnDestination: params.returnDestination ?? null,
      previousFramePointer,
      arguments: params.arguments,
      parameterNames: params.parameterNames,
    });

    this.frames.push(frame);
    if (this.frames.length > this.maxDepthObserved) {
      this.maxDepthObserved = this.frames.length;
    }

    return frame;
  }

  /**
   * Pops and returns the top activation frame from the Call Stack.
   */
  public popFrame(currentInstruction: DecodedInstruction | null = null): StackFrame {
    if (this.frames.length === 0) {
      this.diagnostics.raiseError(
        'FPVM-R003',
        'Call Stack Underflow: attempted to return from an empty call stack.',
        currentInstruction,
        [],
      );
    }
    return this.frames.pop()!;
  }

  /**
   * Returns the currently active top `StackFrame`, or `null` if empty.
   */
  public currentFrame(): StackFrame | null {
    return this.frames.length > 0 ? this.frames[this.frames.length - 1] : null;
  }

  /**
   * Returns the root policy `StackFrame`.
   */
  public rootFrame(): StackFrame | null {
    return this.frames.length > 0 ? this.frames[0] : null;
  }

  /**
   * Current Frame Pointer (`FP`): index of the active frame (`0` for root, `-1` when empty).
   */
  public getFramePointer(): number {
    return this.frames.length - 1;
  }

  public getDepth(): number {
    return this.frames.length;
  }

  public getMaxDepth(): number {
    return this.maxDepthObserved;
  }

  public getFrameNames(): string[] {
    return this.frames.map((f) => f.containerName);
  }

  public getFrames(): StackFrame[] {
    return [...this.frames];
  }

  public getSnapshots(): StackFrameSnapshot[] {
    return this.frames.map((f) => this.frameManager.toSnapshot(f));
  }

  public clear(): void {
    this.frames.length = 0;
    this.maxDepthObserved = 0;
    this.frameManager.reset();
  }
}
