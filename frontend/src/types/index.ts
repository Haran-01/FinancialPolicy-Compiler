// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'POLICY_MANAGER' | 'AUDITOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Policy ───────────────────────────────────────────────────────────────────

export type PolicyStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'ARCHIVED';
export type PolicyCategory =
  | 'CREDIT_RISK'
  | 'FRAUD_DETECTION'
  | 'COMPLIANCE'
  | 'PRICING'
  | 'UNDERWRITING'
  | 'AML'
  | 'KYC'
  | 'GENERAL';

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  status: PolicyStatus;
  tags: string[];
  authorId: string;
  authorName: string;
  organizationId: string;
  currentVersionId: string | null;
  currentVersionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  source: string;
  changelog: string;
  compiledAt: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

// ─── Compilation ─────────────────────────────────────────────────────────────

export type CompilationStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
export type DiagnosticSeverity = 'ERROR' | 'WARNING' | 'INFO' | 'HINT';

export interface Diagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  source?: string;
  suggestion?: string;
}

export interface CompilationArtifact {
  id: string;
  checksum: string;
  sizeBytes: number;
  ir: string;
  ast: unknown;
  tac: string;
  quadruples: Quadruple[];
  triples: Triple[];
}

export interface Quadruple {
  index: number;
  op: string;
  arg1: string;
  arg2: string;
  result: string;
}

export interface Triple {
  index: number;
  op: string;
  arg1: string;
  arg2: string;
}

export interface CompilationJob {
  id: string;
  policyId: string;
  policyVersionId: string;
  status: CompilationStatus;
  diagnostics: Diagnostic[];
  artifact: CompilationArtifact | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: string;
}

// ─── Execution ────────────────────────────────────────────────────────────────

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
export type DecisionResult = 'ALLOW' | 'DENY' | 'REVIEW';

export interface ExecutionTrace {
  step: number;
  rule: string;
  matched: boolean;
  duration: number;
}

export interface ExecutionResult {
  decision: DecisionResult;
  output: Record<string, unknown>;
  reason: string;
  confidence: number;
  durationMs: number;
  trace: ExecutionTrace[];
}

export interface ExecutionJob {
  id: string;
  policyId: string;
  artifactId: string;
  inputData: Record<string, unknown>;
  status: ExecutionStatus;
  result: ExecutionResult | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  totalPolicies: number;
  activePolicies: number;
  executionsToday: number;
  executionsThisWeek: number;
  compilationErrors: number;
  avgExecutionMs: number;
  successRate: number;
  activeUsers: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface PolicyMetric {
  policyId: string;
  policyName: string;
  executionCount: number;
  successRate: number;
  avgDurationMs: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  role: UserRole;
  actionCount: number;
  lastActive: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'DEPRECATE'
  | 'COMPILE'
  | 'EXECUTE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'INVITE'
  | 'REVOKE';

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  resource: string;
  resourceId: string;
  resourceName: string;
  ip: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  secret?: string; // Only returned on creation
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PolicyFormData {
  name: string;
  description: string;
  category: PolicyCategory;
  tags: string[];
  source: string;
  changelog: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface InviteUserFormData {
  email: string;
  name: string;
  role: UserRole;
}

export interface CreateApiKeyFormData {
  name: string;
  scopes: string[];
  expiresAt: string | null;
}
