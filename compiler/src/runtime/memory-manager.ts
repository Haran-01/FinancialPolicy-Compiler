/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Memory Manager & Heap Manager
 *
 * Implements the 5-tier Memory Model of the Financial Policy Virtual Machine:
 *   1. Constant Pool (`constantPool`: immutable compile-time constants)
 *   2. Input / Output / Global Variable Storage (`inputs`, `outputs`, `globals`)
 *   3. Frame-Scoped Local Variables (`frame.locals`)
 *   4. Frame-Scoped Temporary Variable Storage (`frame.temporaries`: `t1, t2, ...`)
 *   5. Heap Manager (`HeapManager`: dynamic allocation, property/index access,
 *      null-reference & bounds checking, and byte-level memory accounting).
 * ============================================================================
 */

import type { IROperand } from '../ir/ir.interface';
import { RuntimeDiagnostics } from './runtime-diagnostics';
import type {
  DecodedInstruction,
  HeapObject,
  MemoryStatistics,
  VariableChangeDelta,
  VariableSnapshotView,
} from './runtime.interface';
import { CallStack, StackManager } from './stack-manager';

export class HeapManager {
  private readonly heap = new Map<string, HeapObject>();
  private heapIdCounter = 0;
  private maxHeapBytes: number;
  private allocatedBytes = 0;
  private readonly diagnostics: RuntimeDiagnostics;

  constructor(diagnostics: RuntimeDiagnostics, maxHeapBytes = 16 * 1024 * 1024) {
    this.diagnostics = diagnostics;
    this.maxHeapBytes = maxHeapBytes;
  }

  /**
   * Allocates an object or array in the VM Heap and returns its value (while
   * registering its heap descriptor for memory profiling and inspection).
   */
  public allocate(
    value: Record<string, unknown> | unknown[],
    currentInstruction: DecodedInstruction | null = null,
    callStackNames: string[] = [],
  ): Record<string, unknown> | unknown[] {
    const sizeBytes = this.estimateSizeBytes(value);
    if (this.allocatedBytes + sizeBytes > this.maxHeapBytes) {
      this.diagnostics.raiseError(
        'FPVM-R007',
        `Heap Out of Memory: allocation of ${sizeBytes} bytes exceeds maximum heap capacity (${this.maxHeapBytes} bytes).`,
        currentInstruction,
        callStackNames,
      );
    }

    const address = `@heap_${++this.heapIdCounter}`;
    const obj: HeapObject = {
      address,
      kind: Array.isArray(value) ? 'ARRAY' : 'OBJECT',
      sizeBytes,
      refCount: 1,
      value,
    };
    this.heap.set(address, obj);
    this.allocatedBytes += sizeBytes;
    return value;
  }

  public getHeapObjects(): HeapObject[] {
    return Array.from(this.heap.values());
  }

  public getObjectCount(): number {
    return this.heap.size;
  }

  public getAllocatedBytes(): number {
    return this.allocatedBytes;
  }

  public clear(): void {
    this.heap.clear();
    this.heapIdCounter = 0;
    this.allocatedBytes = 0;
  }

  public estimateSizeBytes(val: unknown): number {
    if (val === null || val === undefined) return 8;
    if (typeof val === 'boolean') return 8;
    if (typeof val === 'number') return 16;
    if (typeof val === 'string') return 24 + val.length * 2;
    if (Array.isArray(val)) {
      let sum = 32;
      for (const item of val) sum += this.estimateSizeBytes(item);
      return sum;
    }
    if (typeof val === 'object') {
      let sum = 48;
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        sum += 16 + k.length * 2 + this.estimateSizeBytes(v);
      }
      return sum;
    }
    return 16;
  }
}

export class MemoryManager {
  public readonly heapManager: HeapManager;
  private readonly constantPool = new Map<string, unknown>();
  private readonly inputs = new Map<string, unknown>();
  private readonly outputs = new Map<string, unknown>();
  private readonly globals = new Map<string, unknown>();

  private readonly stackManager: StackManager;
  private readonly callStack: CallStack;
  private readonly diagnostics: RuntimeDiagnostics;
  private peakMemoryBytes = 0;

  constructor(
    stackManager: StackManager,
    callStack: CallStack,
    diagnostics: RuntimeDiagnostics,
  ) {
    this.stackManager = stackManager;
    this.callStack = callStack;
    this.diagnostics = diagnostics;
    this.heapManager = new HeapManager(diagnostics);
  }

  /**
   * Initializes the Constant Pool and Input Variable bindings before execution.
   */
  public initialize(
    constants: Map<string, unknown>,
    inputData: Record<string, unknown>,
  ): void {
    this.constantPool.clear();
    this.inputs.clear();
    this.outputs.clear();
    this.globals.clear();
    this.heapManager.clear();
    this.peakMemoryBytes = 0;

    for (const [k, v] of constants.entries()) {
      this.constantPool.set(k, v);
    }

    for (const [k, v] of Object.entries(inputData)) {
      if (v !== null && typeof v === 'object') {
        this.heapManager.allocate(v as Record<string, unknown> | unknown[]);
      }
      this.inputs.set(k, v);
    }

    this.updatePeakMemory();
  }

  /**
   * Resolves the runtime value of an `IROperand`.
   */
  public readOperand(op: IROperand): unknown {
    switch (op.kind) {
      case 'constant':
        return op.value;
      case 'temporary':
        return this.readTemporary(op.name);
      case 'variable':
        return this.readVariable(op.name);
      case 'register':
        return this.readTemporary(op.name ?? `r${op.id}`);
      case 'label':
      case 'function':
      case 'policy':
        return op.name;
    }
  }

  /**
   * Reads a temporary variable (`t1`, `t2`, ...) from the active `StackFrame`
   * (falling back to the root frame if needed).
   */
  public readTemporary(name: string): unknown {
    const frame = this.callStack.currentFrame();
    if (frame && frame.temporaries.has(name)) {
      return frame.temporaries.get(name);
    }
    const root = this.callStack.rootFrame();
    if (root && root.temporaries.has(name)) {
      return root.temporaries.get(name);
    }
    return undefined;
  }

  /**
   * Writes a temporary variable (`t1`, `t2`, ...) in the active `StackFrame`
   * and returns a `VariableChangeDelta`.
   */
  public writeTemporary(name: string, value: unknown): VariableChangeDelta {
    const frame = this.callStack.currentFrame();
    const before = frame?.temporaries.get(name);
    if (frame) {
      frame.temporaries.set(name, value);
    }
    this.updatePeakMemory();
    return {
      scope: 'TEMPORARY',
      name,
      before,
      after: value,
    };
  }

  /**
   * Reads a named variable by searching:
   *   1. Active frame `locals`
   *   2. Policy `outputs`
   *   3. Policy `inputs` (case-exact, then case-insensitive fallback for `AGE`/`age`)
   *   4. Module `constantPool`
   *   5. Module `globals`
   */
  public readVariable(name: string): unknown {
    const frame = this.callStack.currentFrame();
    if (frame && frame.locals.has(name)) {
      return frame.locals.get(name);
    }
    if (this.outputs.has(name)) {
      return this.outputs.get(name);
    }
    if (this.inputs.has(name)) {
      return this.inputs.get(name);
    }
    // Case-insensitive input lookup so e.g. `AGE` and `age` both resolve cleanly
    const lower = name.toLowerCase();
    for (const [k, v] of this.inputs.entries()) {
      if (k.toLowerCase() === lower) {
        return v;
      }
    }
    if (this.constantPool.has(name)) {
      return this.constantPool.get(name);
    }
    if (this.globals.has(name)) {
      return this.globals.get(name);
    }
    const root = this.callStack.rootFrame();
    if (root && root.locals.has(name)) {
      return root.locals.get(name);
    }
    return undefined;
  }

  /**
   * Writes a named variable (`LET`, `VAR`, `SET`, or `CONST`) and returns a `VariableChangeDelta`.
   */
  public writeVariable(
    name: string,
    value: unknown,
    isGlobal = false,
  ): VariableChangeDelta {
    if (value !== null && typeof value === 'object') {
      this.heapManager.allocate(value as Record<string, unknown> | unknown[]);
    }

    const frame = this.callStack.currentFrame();
    if (isGlobal || !frame || frame.containerName === 'global') {
      const before = this.globals.get(name) ?? this.constantPool.get(name);
      this.globals.set(name, value);
      if (!this.constantPool.has(name)) {
        this.constantPool.set(name, value);
      }
      this.updatePeakMemory();
      return { scope: 'GLOBAL', name, before, after: value };
    }

    const before = frame.locals.get(name) ?? this.inputs.get(name);
    frame.locals.set(name, value);
    // If this variable is set inside the root policy frame (`SET interest = 8.5`), also record it in outputs
    if (frame.frameIndex === 0 && frame.kind === 'POLICY') {
      this.outputs.set(name, value);
    }
    this.updatePeakMemory();
    return { scope: 'LOCAL', name, before, after: value };
  }

  /**
   * Writes an explicit policy output variable (`EMIT`) and returns a `VariableChangeDelta`.
   */
  public writeOutput(name: string, value: unknown): VariableChangeDelta {
    const before = this.outputs.get(name);
    this.outputs.set(name, value);
    const frame = this.callStack.currentFrame();
    if (frame) {
      frame.locals.set(name, value);
    }
    this.updatePeakMemory();
    return { scope: 'OUTPUT', name, before, after: value };
  }

  /**
   * Writes to any destination `IROperand` (`temporary` or `variable`).
   */
  public writeDestination(
    dest: IROperand,
    value: unknown,
    isGlobal = false,
  ): VariableChangeDelta | null {
    if (dest.kind === 'temporary' || dest.kind === 'register') {
      return this.writeTemporary(dest.name ?? `r${dest.id}`, value);
    }
    if (dest.kind === 'variable') {
      return this.writeVariable(dest.name, value, isGlobal);
    }
    return null;
  }

  /**
   * Reads a property from an object (`LOAD_FIELD`), raising `FPVM-R006` on null/undefined.
   */
  public readObjectField(
    targetObj: unknown,
    fieldName: string,
    currentInstruction: DecodedInstruction | null,
    callStackNames: string[],
  ): unknown {
    if (targetObj === null || targetObj === undefined) {
      this.diagnostics.raiseError(
        'FPVM-R006',
        `Null Reference Error: cannot read field '${fieldName}' of null or undefined object.`,
        currentInstruction,
        callStackNames,
      );
    }
    if (typeof targetObj !== 'object') {
      this.diagnostics.raiseError(
        'FPVM-R007',
        `Memory Type Error: cannot access field '${fieldName}' on non-object value '${String(targetObj)}'.`,
        currentInstruction,
        callStackNames,
      );
    }
    return (targetObj as Record<string, unknown>)[fieldName];
  }

  /**
   * Writes a property on an object (`STORE_FIELD`), raising `FPVM-R006` on null/undefined.
   */
  public writeObjectField(
    targetObj: unknown,
    fieldName: string,
    value: unknown,
    currentInstruction: DecodedInstruction | null,
    callStackNames: string[],
  ): void {
    if (targetObj === null || targetObj === undefined || typeof targetObj !== 'object') {
      this.diagnostics.raiseError(
        'FPVM-R006',
        `Null Reference Error: cannot assign field '${fieldName}' on null or non-object value.`,
        currentInstruction,
        callStackNames,
      );
    }
    (targetObj as Record<string, unknown>)[fieldName] = value;
    this.updatePeakMemory();
  }

  /**
   * Reads an element from an array (`LOAD_INDEX`), enforcing null & bounds checks (`FPVM-R006`, `FPVM-R007`).
   */
  public readArrayIndex(
    targetArr: unknown,
    indexVal: unknown,
    currentInstruction: DecodedInstruction | null,
    callStackNames: string[],
  ): unknown {
    if (targetArr === null || targetArr === undefined) {
      this.diagnostics.raiseError(
        'FPVM-R006',
        `Null Reference Error: cannot index into null or undefined array.`,
        currentInstruction,
        callStackNames,
      );
    }
    if (!Array.isArray(targetArr)) {
      this.diagnostics.raiseError(
        'FPVM-R007',
        `Memory Type Error: indexed target is not an array.`,
        currentInstruction,
        callStackNames,
      );
    }
    const idx = Number(indexVal);
    if (!Number.isInteger(idx) || idx < 0 || idx >= targetArr.length) {
      this.diagnostics.raiseError(
        'FPVM-R007',
        `Memory Bounds Error: array index ${String(indexVal)} is out of bounds for array of length ${targetArr.length}.`,
        currentInstruction,
        callStackNames,
      );
    }
    return targetArr[idx];
  }

  /**
   * Writes an element into an array (`STORE_INDEX`), enforcing null & bounds checks.
   */
  public writeArrayIndex(
    targetArr: unknown,
    indexVal: unknown,
    value: unknown,
    currentInstruction: DecodedInstruction | null,
    callStackNames: string[],
  ): void {
    if (targetArr === null || targetArr === undefined || !Array.isArray(targetArr)) {
      this.diagnostics.raiseError(
        'FPVM-R006',
        `Null Reference Error: cannot assign array element on null or non-array target.`,
        currentInstruction,
        callStackNames,
      );
    }
    const idx = Number(indexVal);
    if (!Number.isInteger(idx) || idx < 0 || idx > targetArr.length) {
      this.diagnostics.raiseError(
        'FPVM-R007',
        `Memory Bounds Error: array write index ${String(indexVal)} is out of bounds for array of length ${targetArr.length}.`,
        currentInstruction,
        callStackNames,
      );
    }
    targetArr[idx] = value;
    this.updatePeakMemory();
  }

  /**
   * Returns a complete snapshot of all variables across all scopes.
   */
  public getVariablesSnapshot(): VariableSnapshotView {
    const inputsObj = Object.fromEntries(this.inputs.entries());
    const outputsObj = Object.fromEntries(this.outputs.entries());
    const globalsObj = Object.fromEntries(this.globals.entries());
    const constantsObj = Object.fromEntries(this.constantPool.entries());

    const activeFrame = this.callStack.currentFrame() ?? this.callStack.rootFrame();
    const localsObj = activeFrame ? Object.fromEntries(activeFrame.locals.entries()) : {};
    const tempsObj = activeFrame ? Object.fromEntries(activeFrame.temporaries.entries()) : {};

    return {
      inputs: inputsObj,
      outputs: outputsObj,
      globals: globalsObj,
      constants: constantsObj,
      locals: localsObj,
      temporaries: tempsObj,
      allVariables: {
        ...constantsObj,
        ...globalsObj,
        ...inputsObj,
        ...localsObj,
        ...outputsObj,
      },
    };
  }

  /**
   * Computes current and peak `MemoryStatistics`.
   */
  public getMemoryStatistics(): MemoryStatistics {
    let localVariableCount = 0;
    let temporaryVariableCount = 0;
    for (const frame of this.callStack.getFrames()) {
      localVariableCount += frame.locals.size;
      temporaryVariableCount += frame.temporaries.size;
    }

    const currentMemoryBytes = this.estimateTotalMemoryBytes(
      localVariableCount,
      temporaryVariableCount,
    );
    if (currentMemoryBytes > this.peakMemoryBytes) {
      this.peakMemoryBytes = currentMemoryBytes;
    }

    return {
      operandStackDepth: this.stackManager.getDepth(),
      maxOperandStackDepth: this.stackManager.getMaxDepth(),
      callStackDepth: this.callStack.getDepth(),
      maxCallStackDepth: this.callStack.getMaxDepth(),
      heapObjectCount: this.heapManager.getObjectCount(),
      heapAllocatedBytes: this.heapManager.getAllocatedBytes(),
      currentMemoryBytes,
      peakMemoryBytes: this.peakMemoryBytes,
      constantPoolCount: this.constantPool.size,
      globalVariableCount: this.inputs.size + this.outputs.size + this.globals.size,
      localVariableCount,
      temporaryVariableCount,
    };
  }

  private updatePeakMemory(): void {
    let localCount = 0;
    let tempCount = 0;
    for (const frame of this.callStack.getFrames()) {
      localCount += frame.locals.size;
      tempCount += frame.temporaries.size;
    }
    const curr = this.estimateTotalMemoryBytes(localCount, tempCount);
    if (curr > this.peakMemoryBytes) {
      this.peakMemoryBytes = curr;
    }
  }

  private estimateTotalMemoryBytes(localCount: number, tempCount: number): number {
    const stackBytes = this.stackManager.getDepth() * 16;
    const frameHeaderBytes = this.callStack.getDepth() * 64;
    const varSlotBytes =
      (this.constantPool.size +
        this.inputs.size +
        this.outputs.size +
        this.globals.size +
        localCount +
        tempCount) *
      24;
    return stackBytes + frameHeaderBytes + varSlotBytes + this.heapManager.getAllocatedBytes();
  }
}
