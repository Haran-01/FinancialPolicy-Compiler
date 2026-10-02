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

import type {
  DecodedInstruction,
  RuntimeDiagnostic,
  RuntimeErrorCode,
  RuntimeLogEntry,
} from './runtime.interface';

/**
 * Structured exception thrown internally by the VM when a fatal runtime
 * error occurs (unless caught by an active `TRY_BEGIN ... CATCH_BEGIN` handler).
 */
export class FPVMRuntimeException extends Error {
  public readonly diagnostic: RuntimeDiagnostic;

  constructor(diagnostic: RuntimeDiagnostic) {
    super(`[${diagnostic.code}] ${diagnostic.message}`);
    this.name = 'FPVMRuntimeException';
    this.diagnostic = diagnostic;
  }
}

export class RuntimeDiagnostics {
  private readonly diagnostics: RuntimeDiagnostic[] = [];

  /**
   * Creates, records, and throws a fatal `FPVMRuntimeException`.
   */
  public raiseError(
    code: RuntimeErrorCode,
    message: string,
    instruction: DecodedInstruction | null,
    callStackNames: string[],
  ): never {
    const diagnostic: RuntimeDiagnostic = {
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
  public recordWarning(
    code: RuntimeErrorCode,
    message: string,
    instruction: DecodedInstruction | null,
    callStackNames: string[],
  ): RuntimeDiagnostic {
    const diagnostic: RuntimeDiagnostic = {
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

  public getDiagnostics(): RuntimeDiagnostic[] {
    return [...this.diagnostics];
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === 'ERROR');
  }

  public clear(): void {
    this.diagnostics.length = 0;
  }
}

export class RuntimeLogger {
  private readonly logs: RuntimeLogEntry[] = [];

  public log(
    level: RuntimeLogEntry['level'],
    message: string,
    step: number,
    instructionIndex: number,
    sourceLine: number,
  ): RuntimeLogEntry {
    const entry: RuntimeLogEntry = {
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

  public getLogs(): RuntimeLogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs.length = 0;
  }
}
