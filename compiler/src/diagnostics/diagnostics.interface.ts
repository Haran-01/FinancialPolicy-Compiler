/**
 * FPL Diagnostics Interface
 *
 * Collects, deduplicates, and formats error and warning messages produced by
 * all compiler phases (lexer → parser → semantic → IR → optimizer → codegen).
 *
 * A single IDiagnostics instance is threaded through the entire pipeline so
 * all phases share one unified error list, avoiding repeated allocation.
 *
 * Diagnostic IDs use the format: `FPL-<phase-initial><sequence>`
 *   e.g. "FPL-L001" = Lexer error 001
 *        "FPL-P042" = Parser error 042
 *        "FPL-S017" = Semantic error 017
 */

// ─────────────────────────────────────────────────────────────────────────────
// Phase & Severity
// ─────────────────────────────────────────────────────────────────────────────

/** Compiler phase that produced a diagnostic. */
export type CompilerPhase =
  | 'lexer'
  | 'parser'
  | 'semantic'
  | 'ir'
  | 'optimizer'
  | 'codegen'
  | 'runtime'

/** Severity level of a compiler diagnostic. */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

// ─────────────────────────────────────────────────────────────────────────────
// CompilerDiagnostic Shape
// ─────────────────────────────────────────────────────────────────────────────

/** A single diagnostic message produced by the compiler. */
export interface CompilerDiagnostic {
  /** Globally unique diagnostic identifier (e.g. "FPL-L001") */
  id: string
  /** Short error code classifying the error type (e.g. "UNEXPECTED_TOKEN") */
  code: string
  severity: DiagnosticSeverity
  /** Full human-readable error message */
  message: string
  /** The compiler phase that produced this diagnostic */
  phase: CompilerPhase
  /** 1-indexed line number of the offending source text */
  line: number
  /** 1-indexed column of the offending source text */
  column: number
  /** Byte length of the offending span (for underline rendering) */
  length: number
  /** The raw source text of the offending span */
  source: string
  /** Optional auto-fix or refactoring suggestion shown in the editor */
  suggestion?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// IDiagnostics Contract
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contract that the Diagnostics collector implementation must satisfy.
 *
 * Implementations must be safe to call from multiple pipeline phases in
 * sequential order (not concurrent).
 */
export interface IDiagnostics {
  /**
   * Records a new diagnostic.
   * The implementation is responsible for generating the unique `id` field.
   *
   * @param diagnostic - All fields of {@link CompilerDiagnostic} except `id`.
   */
  report(diagnostic: Omit<CompilerDiagnostic, 'id'>): void

  /**
   * Returns all recorded diagnostics in the order they were reported,
   * across all phases.
   */
  getAll(): CompilerDiagnostic[]

  /**
   * Returns all diagnostics reported by a specific compiler phase.
   *
   * @param phase - The phase to filter by.
   */
  getByPhase(phase: CompilerPhase): CompilerDiagnostic[]

  /**
   * Returns `true` if any `'error'`-severity diagnostics have been recorded.
   * Used by the pipeline to decide whether to abort subsequent stages.
   */
  hasErrors(): boolean

  /**
   * Clears all recorded diagnostics. Used between compilation jobs to
   * prevent cross-contamination when the same instance is reused.
   */
  clear(): void

  /**
   * Formats all diagnostics as a human-readable multi-line string, suitable
   * for terminal output or inclusion in error API responses.
   *
   * Example output:
   * ```
   * [ERROR] FPL-L001 (line 3, col 5): Unexpected character '@'
   * [WARN]  FPL-S042 (line 12, col 1): Variable 'rate' is declared but never used
   * ```
   */
  format(): string
}
