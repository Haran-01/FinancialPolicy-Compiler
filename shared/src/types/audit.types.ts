/**
 * Audit log domain types shared across backend and frontend.
 */

/** Immutable audit log entry recording an actor's action on a resource. */
export interface AuditLog {
  id: string
  /** ID of the user who performed the action */
  actorId: string
  /** Display name of the actor at the time of the action */
  actorName: string
  /** Role of the actor at the time of the action */
  actorRole: string
  /** Verb describing the action (e.g. "policy.compiled", "user.created") */
  action: string
  /** Resource type (e.g. "Policy", "User", "CompilationJob") */
  resource: string
  /** ID of the affected resource, if applicable */
  resourceId: string | null
  /** IPv4/IPv6 address of the request originator */
  ipAddress: string | null
  userAgent: string | null
  /** Arbitrary structured metadata relevant to the action */
  metadata: Record<string, unknown> | null
  createdAt: Date
}

/** Payload for creating an audit log entry (internal use by middleware). */
export interface CreateAuditLogDto {
  actorId: string
  actorName: string
  actorRole: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}
