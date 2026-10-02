"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallStack = exports.FrameManager = exports.StackManager = void 0;
class StackManager {
    operandStack = [];
    maxCapacity;
    maxDepthObserved = 0;
    diagnostics;
    constructor(diagnostics, maxCapacity = 1024) {
        this.diagnostics = diagnostics;
        this.maxCapacity = maxCapacity;
    }
    setMaxCapacity(maxCapacity) {
        this.maxCapacity = maxCapacity;
    }
    /**
     * Pushes a value onto the top of the VM Operand Stack and increments `SP`.
     */
    push(value, currentInstruction = null, callStackNames = []) {
        if (this.operandStack.length >= this.maxCapacity) {
            this.diagnostics.raiseError('FPVM-R002', `Operand Stack Overflow: exceeded maximum operand stack capacity (${this.maxCapacity}).`, currentInstruction, callStackNames);
        }
        this.operandStack.push(value);
        if (this.operandStack.length > this.maxDepthObserved) {
            this.maxDepthObserved = this.operandStack.length;
        }
    }
    /**
     * Pops and returns the top value from the VM Operand Stack and decrements `SP`.
     */
    pop(currentInstruction = null, callStackNames = []) {
        if (this.operandStack.length === 0) {
            this.diagnostics.raiseError('FPVM-R003', 'Operand Stack Underflow: attempted to POP from an empty VM operand stack.', currentInstruction, callStackNames);
        }
        return this.operandStack.pop();
    }
    /**
     * Pops `count` arguments from the operand stack in call order (FIFO relative to push order).
     */
    popArguments(count, currentInstruction = null, callStackNames = []) {
        if (count <= 0)
            return [];
        if (this.operandStack.length < count) {
            this.diagnostics.raiseError('FPVM-R003', `Operand Stack Underflow: expected ${count} call argument(s) on stack, found ${this.operandStack.length}.`, currentInstruction, callStackNames);
        }
        const startIdx = this.operandStack.length - count;
        return this.operandStack.splice(startIdx, count);
    }
    /**
     * Peeks at the top value on the VM Operand Stack without removing it.
     */
    peek(currentInstruction = null, callStackNames = []) {
        if (this.operandStack.length === 0) {
            this.diagnostics.raiseError('FPVM-R003', 'Operand Stack Underflow: attempted to PEEK an empty VM operand stack.', currentInstruction, callStackNames);
        }
        return this.operandStack[this.operandStack.length - 1];
    }
    /**
     * Current Stack Pointer (`SP`): `-1` when empty, `length - 1` otherwise.
     */
    getStackPointer() {
        return this.operandStack.length - 1;
    }
    getDepth() {
        return this.operandStack.length;
    }
    getMaxDepth() {
        return this.maxDepthObserved;
    }
    getSnapshot() {
        return [...this.operandStack];
    }
    clear() {
        this.operandStack.length = 0;
        this.maxDepthObserved = 0;
    }
}
exports.StackManager = StackManager;
class FrameManager {
    frameCounter = 0;
    /**
     * Allocates a new isolated activation `StackFrame`.
     */
    createFrame(params) {
        const frameId = `frame_${++this.frameCounter}`;
        const locals = new Map();
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
            temporaries: new Map(),
            arguments: [...args],
        };
    }
    toSnapshot(frame) {
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
    reset() {
        this.frameCounter = 0;
    }
}
exports.FrameManager = FrameManager;
class CallStack {
    frames = [];
    maxCallDepth;
    maxDepthObserved = 0;
    frameManager = new FrameManager();
    diagnostics;
    constructor(diagnostics, maxCallDepth = 256) {
        this.diagnostics = diagnostics;
        this.maxCallDepth = maxCallDepth;
    }
    setMaxCallDepth(maxCallDepth) {
        this.maxCallDepth = maxCallDepth;
    }
    /**
     * Pushes a new activation frame onto the Call Stack (for Root Policy, Function Call,
     * Policy Call, or Rule Application). Enforces recursion/call depth limits (`FPVM-R002`).
     */
    pushFrame(params, currentInstruction = null) {
        if (this.frames.length >= this.maxCallDepth) {
            this.diagnostics.raiseError('FPVM-R002', `Call Stack Overflow: maximum call stack depth (${this.maxCallDepth}) exceeded while calling '${params.containerName}'. Possible infinite recursion.`, currentInstruction, this.getFrameNames());
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
    popFrame(currentInstruction = null) {
        if (this.frames.length === 0) {
            this.diagnostics.raiseError('FPVM-R003', 'Call Stack Underflow: attempted to return from an empty call stack.', currentInstruction, []);
        }
        return this.frames.pop();
    }
    /**
     * Returns the currently active top `StackFrame`, or `null` if empty.
     */
    currentFrame() {
        return this.frames.length > 0 ? this.frames[this.frames.length - 1] : null;
    }
    /**
     * Returns the root policy `StackFrame`.
     */
    rootFrame() {
        return this.frames.length > 0 ? this.frames[0] : null;
    }
    /**
     * Current Frame Pointer (`FP`): index of the active frame (`0` for root, `-1` when empty).
     */
    getFramePointer() {
        return this.frames.length - 1;
    }
    getDepth() {
        return this.frames.length;
    }
    getMaxDepth() {
        return this.maxDepthObserved;
    }
    getFrameNames() {
        return this.frames.map((f) => f.containerName);
    }
    getFrames() {
        return [...this.frames];
    }
    getSnapshots() {
        return this.frames.map((f) => this.frameManager.toSnapshot(f));
    }
    clear() {
        this.frames.length = 0;
        this.maxDepthObserved = 0;
        this.frameManager.reset();
    }
}
exports.CallStack = CallStack;
//# sourceMappingURL=stack-manager.js.map