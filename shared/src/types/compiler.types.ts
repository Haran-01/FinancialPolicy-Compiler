/**
 * Compiler domain types shared across backend, frontend, and compiler package.
 */

/** Lifecycle states of a compilation job. */
export type CompilationStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

/** Severity levels for compiler diagnostics. */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/** A single diagnostic message produced during compilation. */
export interface Diagnostic {
  severity: DiagnosticSeverity
  code: string
  message: string
  line: number
  column: number
  source: string
}

/** Options that control what the compiler emits. */
export interface CompileOptions {
  /** 0 = none, 1 = basic, 2 = aggressive */
  optimizationLevel: 0 | 1 | 2
  /** Include AST in the artifact */
  emitAst: boolean
  /** Include IR instructions in the artifact */
  emitIr: boolean
  /** Include Three Address Code in the artifact */
  emitTac: boolean
  /** Include Quadruples in the artifact */
  emitQuadruples: boolean
  /** Include Triples in the artifact */
  emitTriples: boolean
}

/** Full compilation job record returned by the API. */
export interface CompilationJob {
  id: string
  policyId: string | null
  versionId: string | null
  status: CompilationStatus
  source: string
  options: CompileOptions
  diagnostics: Diagnostic[]
  artifact: CompiledArtifact | null
  durationMs: number | null
  error: string | null
  userId: string
  createdAt: Date
  completedAt: Date | null
}

/**
 * The serialisable artifact produced by the compiler and stored in the
 * database for later execution.
 */
export interface CompiledArtifact {
  version: string
  policyId: string
  /** IR instruction list (always present) */
  ir: unknown[]
  /** Three Address Code (present when emitTac was true) */
  threeAddressCode?: unknown[]
  /** Quadruples representation (present when emitQuadruples was true) */
  quadruples?: unknown[]
  /** Triples representation (present when emitTriples was true) */
  triples?: unknown[]
  /** Abstract Syntax Tree (present when emitAst was true) */
  ast?: unknown
  /** Snapshot of the symbol table from semantic analysis */
  symbolTable?: unknown
  compiledAt: Date
}

/** Payload for submitting a compilation job (POST /api/compiler/compile). */
export interface CompileDto {
  source: string
  policyId?: string
  versionId?: string
  options: CompileOptions
}
