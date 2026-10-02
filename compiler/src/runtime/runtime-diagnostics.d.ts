/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Runtime Diagnostics & Logger
 *
 * Detects, records, and formats runtime errors and console logs emitted
 * during Financial Policy Virtual Machine (FPVM) execution:
 *   - `FPVM-R001`: Division or Modulo by Zero
 *   - `FPVM-R002`: Stack Overflow (Operand Stack or Call Stack limit exceeded)
 *   - `FPVM-R003`: Stack Underflow (Pop from empty Operand Stack or Call Stack)
 *   - `FPVM-R004`: Invalid Policy Call (Policy not found)
 *   - `FPVM-R005`: Invalid Function Call (Function not found or invalid arguments)
 *   - `FPVM-R006`: Null Reference Error (Property/index access or math on null)
 *   - `FPVM-R007`: Memory Error (Out-of-bounds array index or invalid heap ref)
 *   - `FPVM-R008`: Invalid Jump Target (Unresolved label or out-of-range IP)
 *   - `FPVM-R009`: Policy Assertion Failure (`ASSERT`) or Explicit `THROW`
 *   - `FPVM-R010`: Execution Timeout / Infinite Loop Guard Triggered
 * ============================================================================
 */
import type { DecodedInstruction, RuntimeDiagnostic, RuntimeErrorCode, RuntimeLogEntry } from './runtime.interface';
/**
 * Structured exception thrown internally by the VM when a fatal runtime
 * error occurs (unless caught by an active `TRY_BEGIN ... CATCH_BEGIN` handler).
 */
export declare class FPVMRuntimeException extends Error {
    readonly diagnostic: RuntimeDiagnostic;
    constructor(diagnostic: RuntimeDiagnostic);
}
export declare class RuntimeDiagnostics {
    private readonly diagnostics;
    /**
     * Creates, records, and throws a fatal `FPVMRuntimeException`.
     */
    raiseError(code: RuntimeErrorCode, message: string, instruction: DecodedInstruction | null, callStackNames: string[]): never;
    /**
     * Records a non-fatal runtime warning diagnostic.
     */
    recordWarning(code: RuntimeErrorCode, message: string, instruction: DecodedInstruction | null, callStackNames: string[]): RuntimeDiagnostic;
    getDiagnostics(): RuntimeDiagnostic[];
    hasErrors(): boolean;
    clear(): void;
}
export declare class RuntimeLogger {
    private readonly logs;
    log(level: RuntimeLogEntry['level'], message: string, step: number, instructionIndex: number, sourceLine: number): RuntimeLogEntry;
    getLogs(): RuntimeLogEntry[];
    clear(): void;
}
//# sourceMappingURL=runtime-diagnostics.d.ts.map