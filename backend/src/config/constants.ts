// ─── User Roles ────────────────────────────────────────────────────────────────
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  POLICY_MANAGER: 'POLICY_MANAGER',
  AUDITOR: 'AUDITOR',
  VIEWER: 'VIEWER',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

// ─── Policy Statuses ────────────────────────────────────────────────────────────
export const POLICY_STATUSES = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  DEPRECATED: 'DEPRECATED',
  ARCHIVED: 'ARCHIVED',
} as const

export type PolicyStatus = (typeof POLICY_STATUSES)[keyof typeof POLICY_STATUSES]

// ─── Compilation Statuses ───────────────────────────────────────────────────────
export const COMPILATION_STATUSES = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const

export type CompilationStatus = (typeof COMPILATION_STATUSES)[keyof typeof COMPILATION_STATUSES]

// ─── Execution Statuses ─────────────────────────────────────────────────────────
export const EXECUTION_STATUSES = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
} as const

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[keyof typeof EXECUTION_STATUSES]

// ─── Decision Results ───────────────────────────────────────────────────────────
export const DECISION_RESULTS = {
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  REVIEW: 'REVIEW',
} as const

export type DecisionResult = (typeof DECISION_RESULTS)[keyof typeof DECISION_RESULTS]

// ─── Audit Actions ──────────────────────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  // Auth
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_PROFILE_UPDATED: 'USER_PROFILE_UPDATED',
  USER_SESSION_REVOKED: 'USER_SESSION_REVOKED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',

  // Users (admin)
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',

  // Policies
  POLICY_CREATED: 'POLICY_CREATED',
  POLICY_UPDATED: 'POLICY_UPDATED',
  POLICY_PUBLISHED: 'POLICY_PUBLISHED',
  POLICY_DEPRECATED: 'POLICY_DEPRECATED',
  POLICY_ARCHIVED: 'POLICY_ARCHIVED',
  POLICY_DELETED: 'POLICY_DELETED',
  POLICY_VERSION_SAVED: 'POLICY_VERSION_SAVED',
  POLICY_VERSION_RESTORED: 'POLICY_VERSION_RESTORED',

  // Compilation
  COMPILATION_STARTED: 'COMPILATION_STARTED',
  COMPILATION_SUCCEEDED: 'COMPILATION_SUCCEEDED',
  COMPILATION_FAILED: 'COMPILATION_FAILED',

  // Execution
  EXECUTION_STARTED: 'EXECUTION_STARTED',
  EXECUTION_SUCCEEDED: 'EXECUTION_SUCCEEDED',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  EXECUTION_TIMED_OUT: 'EXECUTION_TIMED_OUT',

  // Analytics
  ANALYTICS_EXPORTED: 'ANALYTICS_EXPORTED',

  // Audit
  AUDIT_LOG_EXPORTED: 'AUDIT_LOG_EXPORTED',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

// ─── Policy Categories ──────────────────────────────────────────────────────────
export const POLICY_CATEGORIES = [
  'LOAN',
  'TAX',
  'PAYROLL',
  'INSURANCE',
  'CASHBACK',
  'INVESTMENT',
  'FRAUD',
  'BANKING',
  'OTHER',
] as const

export type PolicyCategory = (typeof POLICY_CATEGORIES)[number]

// ─── Optimization Levels ────────────────────────────────────────────────────────
export const OPTIMIZATION_LEVELS = {
  NONE: 0,
  BASIC: 1,
  STANDARD: 2,
  AGGRESSIVE: 3,
} as const

export type OptimizationLevel = (typeof OPTIMIZATION_LEVELS)[keyof typeof OPTIMIZATION_LEVELS]

// ─── Pagination Defaults ────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// ─── Token Types ────────────────────────────────────────────────────────────────
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const
