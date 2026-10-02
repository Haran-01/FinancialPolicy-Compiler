"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeLogger = exports.RuntimeDiagnostics = exports.FPVMRuntimeException = void 0;
/**
 * Structured exception thrown internally by the VM when a fatal runtime
 * error occurs (unless caught by an active `TRY_BEGIN ... CATCH_BEGIN` handler).
 */
class FPVMRuntimeException extends Error {
    diagnostic;
    constructor(diagnostic) {
        super(`[${diagnostic.code}] ${diagnostic.message}`);
        this.name = 'FPVMRuntimeException';
        this.diagnostic = diagnostic;
    }
}
exports.FPVMRuntimeException = FPVMRuntimeException;
class RuntimeDiagnostics {
    diagnostics = [];
    /**
     * Creates, records, and throws a fatal `FPVMRuntimeException`.
     */
    raiseError(code, message, instruction, callStackNames) {
        const diagnostic = {
            code,
            severity: 'ERROR',
            message,
            instructionIndex: instruction?.index ?? -1,
            instructionId: instruction?.id ?? 'unknown',
            tacText: instruction?.tacText ?? '',
            sourceLine: instruction?.sourceLine ?? 0,
            containerName: instruction?.containerName ?? 'global',
            callStackSnapshot: [...callStackNames],
        };
        this.diagnostics.push(diagnostic);
        throw new FPVMRuntimeException(diagnostic);
    }
    /**
     * Records a non-fatal runtime warning diagnostic.
     */
    recordWarning(code, message, instruction, callStackNames) {
        const diagnostic = {
            code,
            severity: 'WARNING',
            message,
            instructionIndex: instruction?.index ?? -1,
            instructionId: instruction?.id ?? 'unknown',
            tacText: instruction?.tacText ?? '',
            sourceLine: instruction?.sourceLine ?? 0,
            containerName: instruction?.containerName ?? 'global',
            callStackSnapshot: [...callStackNames],
        };
        this.diagnostics.push(diagnostic);
        return diagnostic;
    }
    getDiagnostics() {
        return [...this.diagnostics];
    }
    hasErrors() {
        return this.diagnostics.some((d) => d.severity === 'ERROR');
    }
    clear() {
        this.diagnostics.length = 0;
    }
}
exports.RuntimeDiagnostics = RuntimeDiagnostics;
class RuntimeLogger {
    logs = [];
    log(level, message, step, instructionIndex, sourceLine) {
        const entry = {
            step,
            level,
            message,
            instructionIndex,
            sourceLine,
            timestampMs: Date.now(),
        };
        this.logs.push(entry);
        return entry;
    }
    getLogs() {
        return [...this.logs];
    }
    clear() {
        this.logs.length = 0;
    }
}
exports.RuntimeLogger = RuntimeLogger;
//# sourceMappingURL=runtime-diagnostics.js.map