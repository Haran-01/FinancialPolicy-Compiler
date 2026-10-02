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
import type { DecodedInstruction, HeapObject, MemoryStatistics, VariableChangeDelta, VariableSnapshotView } from './runtime.interface';
import { CallStack, StackManager } from './stack-manager';
export declare class HeapManager {
    private readonly heap;
    private heapIdCounter;
    private maxHeapBytes;
    private allocatedBytes;
    private readonly diagnostics;
    constructor(diagnostics: RuntimeDiagnostics, maxHeapBytes?: number);
    /**
     * Allocates an object or array in the VM Heap and returns its value (while
     * registering its heap descriptor for memory profiling and inspection).
     */
    allocate(value: Record<string, unknown> | unknown[], currentInstruction?: DecodedInstruction | null, callStackNames?: string[]): Record<string, unknown> | unknown[];
    getHeapObjects(): HeapObject[];
    getObjectCount(): number;
    getAllocatedBytes(): number;
    clear(): void;
    estimateSizeBytes(val: unknown): number;
}
export declare class MemoryManager {
    readonly heapManager: HeapManager;
    private readonly constantPool;
    private readonly inputs;
    private readonly outputs;
    private readonly globals;
    private readonly stackManager;
    private readonly callStack;
    private readonly diagnostics;
    private peakMemoryBytes;
    constructor(stackManager: StackManager, callStack: CallStack, diagnostics: RuntimeDiagnostics);
    /**
     * Initializes the Constant Pool and Input Variable bindings before execution.
     */
    initialize(constants: Map<string, unknown>, inputData: Record<string, unknown>): void;
    /**
     * Resolves the runtime value of an `IROperand`.
     */
    readOperand(op: IROperand): unknown;
    /**
     * Reads a temporary variable (`t1`, `t2`, ...) from the active `StackFrame`
     * (falling back to the root frame if needed).
     */
    readTemporary(name: string): unknown;
    /**
     * Writes a temporary variable (`t1`, `t2`, ...) in the active `StackFrame`
     * and returns a `VariableChangeDelta`.
     */
    writeTemporary(name: string, value: unknown): VariableChangeDelta;
    /**
     * Reads a named variable by searching:
     *   1. Active frame `locals`
     *   2. Policy `outputs`
     *   3. Policy `inputs` (case-exact, then case-insensitive fallback for `AGE`/`age`)
     *   4. Module `constantPool`
     *   5. Module `globals`
     */
    readVariable(name: string): unknown;
    /**
     * Writes a named variable (`LET`, `VAR`, `SET`, or `CONST`) and returns a `VariableChangeDelta`.
     */
    writeVariable(name: string, value: unknown, isGlobal?: boolean): VariableChangeDelta;
    /**
     * Writes an explicit policy output variable (`EMIT`) and returns a `VariableChangeDelta`.
     */
    writeOutput(name: string, value: unknown): VariableChangeDelta;
    /**
     * Writes to any destination `IROperand` (`temporary` or `variable`).
     */
    writeDestination(dest: IROperand, value: unknown, isGlobal?: boolean): VariableChangeDelta | null;
    /**
     * Reads a property from an object (`LOAD_FIELD`), raising `FPVM-R006` on null/undefined.
     */
    readObjectField(targetObj: unknown, fieldName: string, currentInstruction: DecodedInstruction | null, callStackNames: string[]): unknown;
    /**
     * Writes a property on an object (`STORE_FIELD`), raising `FPVM-R006` on null/undefined.
     */
    writeObjectField(targetObj: unknown, fieldName: string, value: unknown, currentInstruction: DecodedInstruction | null, callStackNames: string[]): void;
    /**
     * Reads an element from an array (`LOAD_INDEX`), enforcing null & bounds checks (`FPVM-R006`, `FPVM-R007`).
     */
    readArrayIndex(targetArr: unknown, indexVal: unknown, currentInstruction: DecodedInstruction | null, callStackNames: string[]): unknown;
    /**
     * Writes an element into an array (`STORE_INDEX`), enforcing null & bounds checks.
     */
    writeArrayIndex(targetArr: unknown, indexVal: unknown, value: unknown, currentInstruction: DecodedInstruction | null, callStackNames: string[]): void;
    /**
     * Returns a complete snapshot of all variables across all scopes.
     */
    getVariablesSnapshot(): VariableSnapshotView;
    /**
     * Computes current and peak `MemoryStatistics`.
     */
    getMemoryStatistics(): MemoryStatistics;
    private updatePeakMemory;
    private estimateTotalMemoryBytes;
}
//# sourceMappingURL=memory-manager.d.ts.map