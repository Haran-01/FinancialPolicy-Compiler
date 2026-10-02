import { AppError } from './AppError'

/** A single compiler diagnostic message */
export interface Diagnostic {
  severity: 'error' | 'warning' | 'info'
  message: string
  line?: number
  column?: number
  source?: string
}

/**
 * 422 Compiler Error — source code could not be compiled.
 * Carries a structured list of compiler diagnostics.
 */
export class CompilerError extends AppError {
  public readonly diagnostics: Diagnostic[]

  constructor(message = 'Compilation failed', diagnostics: Diagnostic[] = []) {
    super(message, 422, 'COMPILER_ERROR', diagnostics)
    this.diagnostics = diagnostics
  }
}
