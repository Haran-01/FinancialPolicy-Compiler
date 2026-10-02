import type { PolicyCategory, PolicyStatus, UserRole, AuditAction } from '@/types';

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',

  // Policies
  POLICIES: '/policies',
  POLICY: (id: string) => `/policies/${id}`,
  POLICY_PUBLISH: (id: string) => `/policies/${id}/publish`,
  POLICY_DEPRECATE: (id: string) => `/policies/${id}/deprecate`,
  POLICY_VERSIONS: (id: string) => `/policies/${id}/versions`,
  POLICY_VERSION_ROLLBACK: (id: string, versionId: string) =>
    `/policies/${id}/versions/${versionId}/rollback`,

  // Compiler
  COMPILER_COMPILE: '/compiler/compile',
  COMPILER_RUN: '/compiler/run',
  COMPILER_JOBS: '/compiler/jobs',
  COMPILER_JOB: (id: string) => `/compiler/jobs/${id}`,
  COMPILER_AST: (id: string) => `/compiler/jobs/${id}/ast`,
  COMPILER_IR: (id: string) => `/compiler/jobs/${id}/ir`,
  COMPILER_TAC: (id: string) => `/compiler/jobs/${id}/tac`,
  COMPILER_QUADRUPLES: (id: string) => `/compiler/jobs/${id}/quadruples`,
  COMPILER_TRIPLES: (id: string) => `/compiler/jobs/${id}/triples`,

  // Execution
  EXECUTION_RUN: '/execution/run',
  EXECUTION_JOBS: '/execution/jobs',
  EXECUTION_JOB: (id: string) => `/execution/jobs/${id}`,
  EXECUTION_RESULT: (id: string) => `/execution/jobs/${id}/result`,
  EXECUTION_TRACE: (id: string) => `/execution/jobs/${id}/trace`,

  // Analytics
  ANALYTICS_OVERVIEW: '/analytics/overview',
  ANALYTICS_EXECUTIONS: '/analytics/executions',
  ANALYTICS_COMPILATIONS: '/analytics/compilations',
  ANALYTICS_TOP_POLICIES: '/analytics/top-policies',
  ANALYTICS_ERROR_POLICIES: '/analytics/error-policies',
  ANALYTICS_USER_ACTIVITY: '/analytics/user-activity',

  // Audit
  AUDIT_LOGS: '/audit/logs',
  AUDIT_LOG: (id: string) => `/audit/logs/${id}`,
  AUDIT_EXPORT: '/audit/logs/export',

  // Users
  USERS: '/users',
  USER: (id: string) => `/users/${id}`,
  USER_INVITE: '/users/invite',
  USER_ROLE: (id: string) => `/users/${id}/role`,
  USER_DEACTIVATE: (id: string) => `/users/${id}/deactivate`,

  // API Keys
  API_KEYS: '/api-keys',
  API_KEY: (id: string) => `/api-keys/${id}`,
  API_KEY_REVOKE: (id: string) => `/api-keys/${id}/revoke`,

  // Settings
  PROFILE_UPDATE: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',
  ORGANIZATION: '/organization',
} as const;

// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'FinPolicy Compiler';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';

export const JWT_TOKEN_KEY = 'finpolicy_token';
export const REFRESH_TOKEN_KEY = 'finpolicy_refresh_token';
export const USER_STORAGE_KEY = 'finpolicy_user';

// ─── Policy Categories ────────────────────────────────────────────────────────

export const POLICY_CATEGORIES: { value: PolicyCategory; label: string }[] = [
  { value: 'CREDIT_RISK', label: 'Credit Risk' },
  { value: 'FRAUD_DETECTION', label: 'Fraud Detection' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'PRICING', label: 'Pricing' },
  { value: 'UNDERWRITING', label: 'Underwriting' },
  { value: 'AML', label: 'Anti-Money Laundering' },
  { value: 'KYC', label: 'Know Your Customer' },
  { value: 'GENERAL', label: 'General' },
];

// ─── Policy Statuses ──────────────────────────────────────────────────────────

export const POLICY_STATUSES: { value: PolicyStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DEPRECATED', label: 'Deprecated' },
  { value: 'ARCHIVED', label: 'Archived' },
];

// ─── User Roles ───────────────────────────────────────────────────────────────

export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access including user management',
  },
  {
    value: 'POLICY_MANAGER',
    label: 'Policy Manager',
    description: 'Create, edit, compile, and publish policies',
  },
  {
    value: 'AUDITOR',
    label: 'Auditor',
    description: 'Read-only access with full audit log visibility',
  },
  {
    value: 'VIEWER',
    label: 'Viewer',
    description: 'Read-only access to policies and executions',
  },
];

// ─── Audit Actions ────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS: { value: AuditAction; label: string }[] = [
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'PUBLISH', label: 'Publish' },
  { value: 'DEPRECATE', label: 'Deprecate' },
  { value: 'COMPILE', label: 'Compile' },
  { value: 'EXECUTE', label: 'Execute' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'INVITE', label: 'Invite User' },
  { value: 'REVOKE', label: 'Revoke' },
];

// ─── API Key Scopes ───────────────────────────────────────────────────────────

export const API_KEY_SCOPES = [
  { value: 'policies:read', label: 'Policies: Read' },
  { value: 'policies:write', label: 'Policies: Write' },
  { value: 'compiler:run', label: 'Compiler: Run' },
  { value: 'execution:run', label: 'Execution: Run' },
  { value: 'execution:read', label: 'Execution: Read' },
  { value: 'analytics:read', label: 'Analytics: Read' },
  { value: 'audit:read', label: 'Audit: Read' },
] as const;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ─── Compiler ─────────────────────────────────────────────────────────────────

export const COMPILER_POLL_INTERVAL = 1500; // ms
export const COMPILER_MAX_POLL_ATTEMPTS = 60;

export const COMPILATION_STATUS_LABELS = {
  PENDING: 'Queued',
  RUNNING: 'Compiling',
  SUCCESS: 'Success',
  FAILED: 'Failed',
} as const;

export const EXECUTION_STATUS_LABELS = {
  PENDING: 'Queued',
  RUNNING: 'Running',
  SUCCESS: 'Completed',
  FAILED: 'Failed',
  TIMEOUT: 'Timeout',
} as const;

// ─── Date Formats ─────────────────────────────────────────────────────────────

export const DATE_FORMAT = 'MMM d, yyyy';
export const DATETIME_FORMAT = 'MMM d, yyyy HH:mm';
export const DATETIME_FULL_FORMAT = 'MMM d, yyyy HH:mm:ss';
export const ISO_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";

// ─── FPL Sample ───────────────────────────────────────────────────────────────

export const FPL_SAMPLE_POLICY = `POLICY LoanApproval
INPUT
  age : int
  salary : decimal
  creditScore : int
OUTPUT
  eligibleLimit : decimal
  taxDeduction : decimal
WHEN
  age >= 21
  AND creditScore >= 680
  AND salary >= 60000.00
THEN
  CALL CreditScorePolicy
  CALL KYCPolicy
  LET maxLoan : decimal = salary * 5.0
  CALL IncomeVerificationPolicy
  EMIT eligibleLimit = maxLoan
  IF age >= 30 THEN
    LOG "Prime applicant tier verified"
  END
  ALLOW "Loan Approved"
ELSE
  EMIT taxDeduction = salary * 0.10 + salary * 0.05
  DENY "Eligibility criteria not met"
END

POLICY CreditScorePolicy
INPUT
  creditScore : int
WHEN
  creditScore >= 680
THEN
  ALLOW "Credit score verified"
ELSE
  DENY "Insufficient credit score"
END

POLICY KYCPolicy
INPUT
  kycVerified : boolean
WHEN
  kycVerified == true
THEN
  ALLOW "KYC Passed"
ELSE
  DENY "KYC Failed"
END

POLICY IncomeVerificationPolicy
INPUT
  annualIncome : decimal
WHEN
  annualIncome >= 60000.00
THEN
  ALLOW "Income verified"
ELSE
  REVIEW "Manual income audit required"
END
`;
