/**
 * Execution engine domain types shared across backend, frontend, and runtime.
 */

/** Lifecycle states of a policy execution job. */
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'

/** The terminal decision produced by a policy execution. */
export type DecisionResult = 'ALLOW' | 'DENY' | 'REVIEW'

/** Full execution job record returned by the API. */
export interface ExecutionJob {
  id: string
  policyId: string
  artifactId: string
  inputData: Record<string, unknown>
  status: ExecutionStatus
  result: ExecutionResult | null
  durationMs: number | null
  error: string | null
  userId: string
  createdAt: Date
  completedAt: Date | null
}

/** The outcome of running a policy against input data. */
export interface ExecutionResult {
  decision: DecisionResult
  reason: string
  output: Record<string, unknown>
  trace: ExecutionTrace[] | null
  durationMs: number
}

/** A single step in the execution trace (instruction-level audit trail). */
export interface ExecutionTrace {
  step: number
  instruction: string
  inputState: Record<string, unknown>
  outputState: Record<string, unknown>
  timestamp: number
}

/** Payload for submitting an execution job (POST /api/executor/execute). */
export interface ExecuteDto {
  artifactId: string
  inputData: Record<string, unknown>
  /** Execution timeout in milliseconds (default: 5000) */
  timeoutMs?: number
  /** Whether to capture a step-by-step execution trace */
  recordTrace?: boolean
}
