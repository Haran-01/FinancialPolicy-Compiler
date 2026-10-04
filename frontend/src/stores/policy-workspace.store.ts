/**
 * Enterprise Policy Workspace Store (Zustand)
 * Phase 5: Central state management for Policy CRUD, Version Control & Side-by-Side Diff,
 * Compiler Pipeline Integration, FPVM Execution Integration, Nested Folders,
 * Categories, Tags, Search/Filters, Import/Export (.fpl), Audit Trail, and RBAC.
 */

import { create } from 'zustand'
import {
  analyzePolicySource,
  detectPolicySourceLanguage,
  executePolicyVM,
  generatePolicyIR,
} from '@/lib/c-policy-engine'

export type WorkspaceUserRole = 'ADMIN' | 'POLICY_MANAGER' | 'AUDITOR' | 'VIEWER'
export type WorkspacePolicyStatus = 'DRAFT' | 'COMPILED' | 'PUBLISHED' | 'ARCHIVED' | 'DEPRECATED'
export type WorkspaceCompileStatus = 'NEVER' | 'SUCCESS' | 'FAILED' | 'WARNING'
export type WorkspaceExecStatus = 'NEVER' | 'SUCCESS' | 'FAILED'

export type WorkspaceAuditAction =
  | 'CREATE'
  | 'EDIT'
  | 'RENAME'
  | 'DUPLICATE'
  | 'DELETE'
  | 'COMPILE'
  | 'EXECUTE'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'VERSION_CREATE'
  | 'VERSION_RESTORE'
  | 'IMPORT'
  | 'EXPORT'

export interface WorkspaceFolder {
  id: string
  name: string
  slug: string
  parentId: string | null
  color: string
  icon: string
}

export interface WorkspaceCategory {
  id: string
  name: string
  slug: string
  color: string
  description: string
}

export interface WorkspaceTag {
  id: string
  name: string
  slug: string
  color: string
}

export interface WorkspacePolicyVersion {
  id: string
  policyId: string
  versionNumber: number
  sourceCode: string
  sourceLanguage?: 'fpl' | 'c-policy'
  changelog: string
  isLatest: boolean
  compilationStatus: WorkspaceCompileStatus
  createdById: string
  createdByName: string
  createdAt: string
}

export interface WorkspaceCompilationRecord {
  id: string
  policyId: string
  policyName: string
  versionNumber: number
  status: 'SUCCESS' | 'FAILED' | 'WARNING'
  compilationTimeMs: number
  tokenCount: number
  astNodeCount: number
  errorCount: number
  warningCount: number
  errors: Array<{ code: string; message: string; line: number; column: number }>
  warnings: Array<{ code: string; message: string; line: number; column: number }>
  optimizationSummary: {
    passesExecuted: number
    totalTransformations: number
    instructionsBefore: number
    instructionsAfter: number
    instructionReductionPercent: number
  }
  tacText: string
  optimizedTacText: string
  createdAt: string
}

export interface WorkspaceExecutionRecord {
  id: string
  policyId: string
  policyName: string
  versionNumber: number
  status: 'SUCCESS' | 'FAILED'
  decision: 'APPROVE' | 'REJECT' | 'REVIEW' | 'NONE'
  executionTimeMs: number
  instructionsExecuted: number
  memoryUsageBytes: number
  inputs: Record<string, number | string | boolean>
  variables: Record<string, unknown>
  outputs: Record<string, unknown>
  traceSummary: Array<{
    step: number
    ip: number
    blockId: string
    opcode: string
    statementText: string
    changes: string
  }>
  errorMessage: string | null
  createdAt: string
}

export interface WorkspaceAuditRecord {
  id: string
  actorId: string
  actorName: string
  actorRole: WorkspaceUserRole
  action: WorkspaceAuditAction
  policyId: string | null
  policyName: string | null
  summary: string
  createdAt: string
}

export interface WorkspacePolicy {
  id: string
  name: string
  slug: string
  description: string
  sourceCode: string
  sourceLanguage?: 'fpl' | 'c-policy'
  status: WorkspacePolicyStatus
  categoryId: string
  categoryName: string
  folderId: string | null
  tags: string[]
  isFavorite: boolean
  isPinned: boolean
  isArchived: boolean
  latestVersion: number
  authorId: string
  authorName: string
  lastCompilationStatus: WorkspaceCompileStatus
  lastExecutionStatus: WorkspaceExecStatus
  lastDecision: 'APPROVE' | 'REJECT' | 'REVIEW' | 'NONE' | null
  compilationCount: number
  executionCount: number
  errorCount: number
  warningCount: number
  lastCompiledAt: string | null
  lastExecutedAt: string | null
  lastOpenedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface VersionDiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified'
  leftLineNumber: number | null
  rightLineNumber: number | null
  leftContent: string
  rightContent: string
}

export interface VersionComparisonResult {
  policyId: string
  leftVersion: WorkspacePolicyVersion
  rightVersion: WorkspacePolicyVersion
  linesAdded: number
  linesRemoved: number
  linesModified: number
  linesUnchanged: number
  diffLines: VersionDiffLine[]
}

export const WORKSPACE_CATEGORIES: WorkspaceCategory[] = [
  { id: 'cat-loan', name: 'Loan', slug: 'LOAN', color: '#2563EB', description: 'Retail, mortgage & corporate loan underwriting' },
  { id: 'cat-insurance', name: 'Insurance', slug: 'INSURANCE', color: '#8B5CF6', description: 'Underwriting & actuarial claim rules' },
  { id: 'cat-payroll', name: 'Payroll', slug: 'PAYROLL', color: '#10B981', description: 'Compensation, bonuses & deductions' },
  { id: 'cat-tax', name: 'Tax', slug: 'TAX', color: '#F59E0B', description: 'Withholding & statutory tax calculation' },
  { id: 'cat-investment', name: 'Investment', slug: 'INVESTMENT', color: '#06B6D4', description: 'Portfolio allocation & margin checks' },
  { id: 'cat-fraud', name: 'Fraud Detection', slug: 'FRAUD', color: '#EF4444', description: 'Real-time AML & velocity checks' },
  { id: 'cat-scholarship', name: 'Scholarship', slug: 'SCHOLARSHIP', color: '#EC4899', description: 'Academic merit & financial aid grants' },
  { id: 'cat-custom', name: 'Custom', slug: 'CUSTOM', color: '#64748B', description: 'Custom enterprise financial rules' },
]

export const WORKSPACE_TAGS: WorkspaceTag[] = [
  { id: 'tag-banking', name: 'Banking', slug: 'banking', color: '#3B82F6' },
  { id: 'tag-hr', name: 'HR', slug: 'hr', color: '#10B981' },
  { id: 'tag-gov', name: 'Government', slug: 'government', color: '#F59E0B' },
  { id: 'tag-edu', name: 'Education', slug: 'education', color: '#EC4899' },
  { id: 'tag-health', name: 'Healthcare', slug: 'healthcare', color: '#8B5CF6' },
]

const INITIAL_FOLDERS: WorkspaceFolder[] = [
  { id: 'fld-banking', name: 'Retail Banking', slug: 'retail-banking', parentId: null, color: '#2563EB', icon: 'Landmark' },
  { id: 'fld-mortgages', name: 'Mortgage Underwriting', slug: 'mortgage-underwriting', parentId: 'fld-banking', color: '#3B82F6', icon: 'Home' },
  { id: 'fld-risk', name: 'Fraud & Compliance', slug: 'fraud-compliance', parentId: null, color: '#EF4444', icon: 'ShieldAlert' },
  { id: 'fld-payroll-tax', name: 'Payroll & Tax', slug: 'payroll-tax', parentId: null, color: '#10B981', icon: 'Calculator' },
  { id: 'fld-education', name: 'Education & Grants', slug: 'education-grants', parentId: null, color: '#EC4899', icon: 'GraduationCap' },
]

const INITIAL_POLICIES: WorkspacePolicy[] = [
  {
    id: 'pol-loan-approval',
    name: 'LoanApproval',
    slug: 'loan-approval',
    description: 'Automated retail personal loan underwriting evaluating applicant age, salary, and credit score.',
    sourceCode: `POLICY LoanApproval
INPUT
  age: int
  salary: decimal
  creditScore: int
OUTPUT
  interestRate: decimal
WHEN
  age >= 21 AND salary >= 60000 AND creditScore >= 700
THEN
  APPROVE
  SET interestRate = 8.5
ELSE
  REJECT
  SET interestRate = 14.0
END`,
    status: 'PUBLISHED',
    categoryId: 'cat-loan',
    categoryName: 'Loan',
    folderId: 'fld-banking',
    tags: ['Banking'],
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    latestVersion: 2,
    authorId: 'usr-admin-01',
    authorName: 'Aarav Mehta',
    lastCompilationStatus: 'SUCCESS',
    lastExecutionStatus: 'SUCCESS',
    lastDecision: 'APPROVE',
    compilationCount: 14,
    executionCount: 42,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: '2026-10-02T09:15:00.000Z',
    lastExecutedAt: '2026-10-02T10:30:00.000Z',
    lastOpenedAt: '2026-10-02T11:00:00.000Z',
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-10-02T10:30:00.000Z',
  },
  {
    id: 'pol-fraud-guard',
    name: 'HighValueWireFraudGuard',
    slug: 'high-value-wire-fraud-guard',
    description: 'Flags high-value wire transfers with elevated velocity risk score for AML compliance.',
    sourceCode: `POLICY HighValueWireFraudGuard
INPUT
  amount: decimal
  riskScore: int
  accountAgeDays: int
OUTPUT
  riskTier: int
WHEN
  amount <= 50000 AND riskScore < 40 AND accountAgeDays >= 90
THEN
  APPROVE
  SET riskTier = 1
ELSE
  REJECT
  SET riskTier = 3
END`,
    status: 'PUBLISHED',
    categoryId: 'cat-fraud',
    categoryName: 'Fraud Detection',
    folderId: 'fld-risk',
    tags: ['Banking', 'Government'],
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    latestVersion: 1,
    authorId: 'usr-admin-01',
    authorName: 'Aarav Mehta',
    lastCompilationStatus: 'SUCCESS',
    lastExecutionStatus: 'SUCCESS',
    lastDecision: 'APPROVE',
    compilationCount: 9,
    executionCount: 31,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: '2026-10-01T14:20:00.000Z',
    lastExecutedAt: '2026-10-02T08:45:00.000Z',
    lastOpenedAt: '2026-10-02T09:00:00.000Z',
    createdAt: '2026-09-24T11:00:00.000Z',
    updatedAt: '2026-10-02T08:45:00.000Z',
  },
  {
    id: 'pol-payroll-bonus',
    name: 'ExecutivePayrollBonus',
    slug: 'executive-payroll-bonus',
    description: 'Annual performance bonus and statutory withholding policy for senior staff.',
    sourceCode: `POLICY ExecutivePayrollBonus
INPUT
  baseSalary: decimal
  performanceRating: int
  tenureYears: int
OUTPUT
  bonusAmount: decimal
WHEN
  performanceRating >= 4 AND tenureYears >= 2
THEN
  APPROVE
  SET bonusAmount = 15000
ELSE
  REJECT
  SET bonusAmount = 0
END`,
    status: 'COMPILED',
    categoryId: 'cat-payroll',
    categoryName: 'Payroll',
    folderId: 'fld-payroll-tax',
    tags: ['HR'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    latestVersion: 1,
    authorId: 'usr-pm-02',
    authorName: 'Priya Nair',
    lastCompilationStatus: 'SUCCESS',
    lastExecutionStatus: 'SUCCESS',
    lastDecision: 'APPROVE',
    compilationCount: 5,
    executionCount: 12,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: '2026-10-01T16:00:00.000Z',
    lastExecutedAt: '2026-10-01T16:15:00.000Z',
    lastOpenedAt: '2026-10-01T16:20:00.000Z',
    createdAt: '2026-09-26T09:30:00.000Z',
    updatedAt: '2026-10-01T16:15:00.000Z',
  },
  {
    id: 'pol-scholarship-grant',
    name: 'MeritScholarshipGrant',
    slug: 'merit-scholarship-grant',
    description: 'Evaluates university merit scholarship eligibility based on GPA and household income.',
    sourceCode: `POLICY MeritScholarshipGrant
INPUT
  gpa: decimal
  familyIncome: decimal
OUTPUT
  grantAmount: decimal
WHEN
  gpa >= 3.7 AND familyIncome <= 85000
THEN
  APPROVE
  SET grantAmount = 12500
ELSE
  REJECT
  SET grantAmount = 0
END`,
    status: 'DRAFT',
    categoryId: 'cat-scholarship',
    categoryName: 'Scholarship',
    folderId: 'fld-education',
    tags: ['Education', 'Government'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    latestVersion: 1,
    authorId: 'usr-pm-02',
    authorName: 'Priya Nair',
    lastCompilationStatus: 'SUCCESS',
    lastExecutionStatus: 'NEVER',
    lastDecision: null,
    compilationCount: 2,
    executionCount: 0,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: '2026-10-01T12:00:00.000Z',
    lastExecutedAt: null,
    lastOpenedAt: '2026-10-01T12:05:00.000Z',
    createdAt: '2026-09-29T15:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
  },
  {
    id: 'pol-c-loan-approval',
    name: 'CLoanApproval',
    slug: 'c-loan-approval',
    description: 'C Policy Mode sample for personal loan approval using a supported C subset.',
    sourceCode: `// @policy CLoanApproval
int age;
float salary;
int creditScore;
float interestRate;

if (age >= 21 && salary >= 60000 && creditScore >= 700) {
  approve();
  interestRate = 8.5;
} else {
  reject();
  interestRate = 14.0;
}`,
    sourceLanguage: 'c-policy',
    status: 'DRAFT',
    categoryId: 'cat-loan',
    categoryName: 'Loan',
    folderId: 'fld-banking',
    tags: ['Banking'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    latestVersion: 1,
    authorId: 'usr-admin-01',
    authorName: 'Aarav Mehta',
    lastCompilationStatus: 'NEVER',
    lastExecutionStatus: 'NEVER',
    lastDecision: null,
    compilationCount: 0,
    executionCount: 0,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: null,
    lastExecutedAt: null,
    lastOpenedAt: null,
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-04T10:00:00.000Z',
  },
  {
    id: 'pol-insurance-claim',
    name: 'HealthInsuranceClaimAutoApprove',
    slug: 'health-insurance-claim-auto-approve',
    description: 'Automated adjudication for outpatient healthcare insurance claims.',
    sourceCode: `POLICY HealthInsuranceClaimAutoApprove
INPUT
  claimAmount: decimal
  coverageActive: int
  deductibleMet: int
OUTPUT
  reimbursementRate: decimal
WHEN
  claimAmount <= 10000 AND coverageActive == 1 AND deductibleMet == 1
THEN
  APPROVE
  SET reimbursementRate = 90.0
ELSE
  REJECT
  SET reimbursementRate = 0.0
END`,
    status: 'PUBLISHED',
    categoryId: 'cat-insurance',
    categoryName: 'Insurance',
    folderId: 'fld-banking',
    tags: ['Healthcare', 'Banking'],
    isFavorite: true,
    isPinned: false,
    isArchived: false,
    latestVersion: 1,
    authorId: 'usr-admin-01',
    authorName: 'Aarav Mehta',
    lastCompilationStatus: 'SUCCESS',
    lastExecutionStatus: 'SUCCESS',
    lastDecision: 'APPROVE',
    compilationCount: 7,
    executionCount: 19,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: '2026-10-01T17:30:00.000Z',
    lastExecutedAt: '2026-10-02T07:20:00.000Z',
    lastOpenedAt: '2026-10-02T07:25:00.000Z',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-10-02T07:20:00.000Z',
  },
  {
    id: 'pol-tax-calculation',
    name: 'CorporateTaxWithholding',
    slug: 'corporate-tax-withholding',
    description: 'Statutory corporate tax calculation and R&D credit deduction policy.',
    sourceCode: `POLICY CorporateTaxWithholding
INPUT
  taxableIncome: decimal
  rdCreditEligible: int
OUTPUT
  effectiveTaxRate: decimal
WHEN
  taxableIncome >= 250000 AND rdCreditEligible == 1
THEN
  APPROVE
  SET effectiveTaxRate = 18.5
ELSE
  APPROVE
  SET effectiveTaxRate = 24.0
END`,
    status: 'PUBLISHED',
    categoryId: 'cat-tax',
    categoryName: 'Tax',
    folderId: 'fld-payroll-tax',
    tags: ['Government', 'Banking'],
    isFavorite: true,
    isPinned: false,
    isArchived: false,
    latestVersion: 1,
    authorId: 'usr-admin-01',
    authorName: 'Aarav Mehta',
    lastCompilationStatus: 'SUCCESS',
    lastExecutionStatus: 'SUCCESS',
    lastDecision: 'APPROVE',
    compilationCount: 6,
    executionCount: 17,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: '2026-10-01T18:00:00.000Z',
    lastExecutedAt: '2026-10-02T08:10:00.000Z',
    lastOpenedAt: '2026-10-02T08:15:00.000Z',
    createdAt: '2026-09-27T11:00:00.000Z',
    updatedAt: '2026-10-02T08:10:00.000Z',
  },
  {
    id: 'pol-investment-margin',
    name: 'InstitutionalPortfolioMargin',
    slug: 'institutional-portfolio-margin',
    description: 'Evaluates institutional investment portfolio leverage, liquidity ratio, and margin compliance.',
    sourceCode: `POLICY InstitutionalPortfolioMargin
INPUT
  portfolioNav: decimal
  leverageRatio: decimal
  liquidityScore: int
OUTPUT
  marginRequirement: decimal
WHEN
  portfolioNav >= 500000 AND leverageRatio <= 2.5 AND liquidityScore >= 75
THEN
  APPROVE
  SET marginRequirement = 15.0
ELSE
  REJECT
  SET marginRequirement = 35.0
END`,
    status: 'PUBLISHED',
    categoryId: 'cat-investment',
    categoryName: 'Investment',
    folderId: 'fld-banking',
    tags: ['Banking'],
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    latestVersion: 1,
    authorId: 'usr-admin-01',
    authorName: 'Aarav Mehta',
    lastCompilationStatus: 'SUCCESS',
    lastExecutionStatus: 'SUCCESS',
    lastDecision: 'APPROVE',
    compilationCount: 8,
    executionCount: 23,
    errorCount: 0,
    warningCount: 0,
    lastCompiledAt: '2026-10-01T19:00:00.000Z',
    lastExecutedAt: '2026-10-02T09:40:00.000Z',
    lastOpenedAt: '2026-10-02T09:45:00.000Z',
    createdAt: '2026-09-28T09:00:00.000Z',
    updatedAt: '2026-10-02T09:40:00.000Z',
  },
]

const INITIAL_VERSIONS: WorkspacePolicyVersion[] = [
  {
    id: 'ver-loan-1',
    policyId: 'pol-loan-approval',
    versionNumber: 1,
    sourceCode: `POLICY LoanApproval
INPUT
  age: int
  salary: decimal
OUTPUT
  interestRate: decimal
WHEN
  age >= 21 AND salary >= 50000
THEN
  APPROVE
  SET interestRate = 9.25
ELSE
  REJECT
  SET interestRate = 15.0
END`,
    changelog: 'Initial v1 retail loan underwriting rule (salary >= 50000)',
    isLatest: false,
    compilationStatus: 'SUCCESS',
    createdById: 'usr-admin-01',
    createdByName: 'Aarav Mehta',
    createdAt: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'ver-loan-2',
    policyId: 'pol-loan-approval',
    versionNumber: 2,
    sourceCode: INITIAL_POLICIES[0].sourceCode,
    sourceLanguage: INITIAL_POLICIES[0].sourceLanguage ?? 'fpl',
    changelog: 'Raised minimum salary threshold to 60000, added creditScore >= 700, lowered prime rate to 8.5%',
    isLatest: true,
    compilationStatus: 'SUCCESS',
    createdById: 'usr-admin-01',
    createdByName: 'Aarav Mehta',
    createdAt: '2026-10-02T09:15:00.000Z',
  },
  ...INITIAL_POLICIES.slice(1).map((pol) => ({
    id: `ver-${pol.id}-1`,
    policyId: pol.id,
    versionNumber: 1,
    sourceCode: pol.sourceCode,
    sourceLanguage: pol.sourceLanguage ?? detectPolicySourceLanguage(pol.sourceCode),
    changelog: 'Initial policy version v1',
    isLatest: true,
    compilationStatus: pol.lastCompilationStatus,
    createdById: pol.authorId,
    createdByName: pol.authorName,
    createdAt: pol.createdAt,
  })),
]

const INITIAL_AUDIT_LOGS: WorkspaceAuditRecord[] = [
  {
    id: 'aud-101',
    actorId: 'usr-admin-01',
    actorName: 'Aarav Mehta',
    actorRole: 'ADMIN',
    action: 'CREATE',
    policyId: 'pol-loan-approval',
    policyName: 'LoanApproval',
    summary: 'Created policy LoanApproval (v1) in category Loan',
    createdAt: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'aud-102',
    actorId: 'usr-admin-01',
    actorName: 'Aarav Mehta',
    actorRole: 'ADMIN',
    action: 'VERSION_CREATE',
    policyId: 'pol-loan-approval',
    policyName: 'LoanApproval',
    summary: 'Created version v2: Raised minimum salary threshold to 60000 & added creditScore >= 700',
    createdAt: '2026-10-02T09:15:00.000Z',
  },
  {
    id: 'aud-103',
    actorId: 'usr-admin-01',
    actorName: 'Aarav Mehta',
    actorRole: 'ADMIN',
    action: 'COMPILE',
    policyId: 'pol-loan-approval',
    policyName: 'LoanApproval',
    summary: 'Compiled LoanApproval v2 in 1.84 ms (0 errors, 0 warnings)',
    createdAt: '2026-10-02T09:15:30.000Z',
  },
  {
    id: 'aud-104',
    actorId: 'usr-admin-01',
    actorName: 'Aarav Mehta',
    actorRole: 'ADMIN',
    action: 'PUBLISH',
    policyId: 'pol-loan-approval',
    policyName: 'LoanApproval',
    summary: 'Published policy LoanApproval v2 to production runtime',
    createdAt: '2026-10-02T09:16:00.000Z',
  },
  {
    id: 'aud-105',
    actorId: 'usr-admin-01',
    actorName: 'Aarav Mehta',
    actorRole: 'ADMIN',
    action: 'EXECUTE',
    policyId: 'pol-loan-approval',
    policyName: 'LoanApproval',
    summary: 'Executed LoanApproval v2 on FPVM -> Decision: APPROVE (0.42 ms)',
    createdAt: '2026-10-02T10:30:00.000Z',
  },
]

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatFplPolicyCode(sourceCode: string): string {
  const lines = sourceCode.replace(/\r\n/g, '\n').split('\n')
  const formatted: string[] = []
  let indentLevel = 0
  const topHeaders = new Set(['POLICY', 'RULE', 'FUNCTION', 'INPUT', 'OUTPUT', 'WHEN', 'THEN', 'ELSE', 'END'])

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('')
      }
      continue
    }
    const firstWord = trimmed.split(/\s+/)[0].toUpperCase()
    if (firstWord === 'END') {
      indentLevel = 0
      formatted.push('END')
      continue
    }
    if (['INPUT', 'OUTPUT', 'WHEN', 'THEN', 'ELSE'].includes(firstWord)) {
      indentLevel = 1
      formatted.push(trimmed)
      continue
    }
    if (['POLICY', 'RULE', 'FUNCTION'].includes(firstWord)) {
      indentLevel = 1
      formatted.push(trimmed)
      continue
    }
    const indent = topHeaders.has(firstWord) ? '' : '  '.repeat(indentLevel)
    formatted.push(`${indent}${trimmed}`)
  }

  return formatted.join('\n').trim() + '\n'
}

export function computeSideBySideDiff(
  policyId: string,
  leftVer: WorkspacePolicyVersion,
  rightVer: WorkspacePolicyVersion,
): VersionComparisonResult {
  const leftLines = leftVer.sourceCode.replace(/\r\n/g, '\n').split('\n')
  const rightLines = rightVer.sourceCode.replace(/\r\n/g, '\n').split('\n')
  const maxLen = Math.max(leftLines.length, rightLines.length)

  const diffLines: VersionDiffLine[] = []
  let linesAdded = 0
  let linesRemoved = 0
  let linesModified = 0
  let linesUnchanged = 0

  for (let i = 0; i < maxLen; i++) {
    const l = i < leftLines.length ? leftLines[i] : undefined
    const r = i < rightLines.length ? rightLines[i] : undefined

    if (l !== undefined && r !== undefined) {
      if (l === r) {
        linesUnchanged++
        diffLines.push({
          type: 'unchanged',
          leftLineNumber: i + 1,
          rightLineNumber: i + 1,
          leftContent: l,
          rightContent: r,
        })
      } else {
        linesModified++
        diffLines.push({
          type: 'modified',
          leftLineNumber: i + 1,
          rightLineNumber: i + 1,
          leftContent: l,
          rightContent: r,
        })
      }
    } else if (l === undefined && r !== undefined) {
      linesAdded++
      diffLines.push({
        type: 'added',
        leftLineNumber: null,
        rightLineNumber: i + 1,
        leftContent: '',
        rightContent: r,
      })
    } else if (l !== undefined && r === undefined) {
      linesRemoved++
      diffLines.push({
        type: 'removed',
        leftLineNumber: i + 1,
        rightLineNumber: null,
        leftContent: l,
        rightContent: '',
      })
    }
  }

  return {
    policyId,
    leftVersion: leftVer,
    rightVersion: rightVer,
    linesAdded,
    linesRemoved,
    linesModified,
    linesUnchanged,
    diffLines,
  }
}

interface PolicyWorkspaceState {
  currentRole: WorkspaceUserRole
  policies: WorkspacePolicy[]
  versions: WorkspacePolicyVersion[]
  folders: WorkspaceFolder[]
  categories: WorkspaceCategory[]
  tags: WorkspaceTag[]
  compilations: WorkspaceCompilationRecord[]
  executions: WorkspaceExecutionRecord[]
  auditLogs: WorkspaceAuditRecord[]

  setRole: (role: WorkspaceUserRole) => void
  createPolicy: (input: {
    name: string
    description?: string
    sourceCode?: string
    sourceLanguage?: 'fpl' | 'c-policy'
    categoryId?: string
    folderId?: string | null
    tags?: string[]
  }) => WorkspacePolicy
  openPolicy: (policyId: string) => WorkspacePolicy | undefined
  updatePolicy: (
    policyId: string,
    updates: {
      name?: string
      description?: string
      sourceCode?: string
      sourceLanguage?: 'fpl' | 'c-policy'
      categoryId?: string
      folderId?: string | null
      tags?: string[]
      createNewVersion?: boolean
      versionNotes?: string
    },
  ) => WorkspacePolicy | undefined
  renamePolicy: (policyId: string, newName: string) => WorkspacePolicy | undefined
  duplicatePolicy: (policyId: string) => WorkspacePolicy | undefined
  deletePolicy: (policyId: string, hardDelete?: boolean) => void
  publishPolicy: (policyId: string) => WorkspacePolicy | undefined
  archivePolicy: (policyId: string) => WorkspacePolicy | undefined
  restorePolicy: (policyId: string) => WorkspacePolicy | undefined
  toggleFavorite: (policyId: string) => void
  togglePin: (policyId: string) => void
  movePolicyToFolder: (policyId: string, folderId: string | null) => void
  createFolder: (name: string, parentId?: string | null, color?: string) => WorkspaceFolder

  createVersion: (policyId: string, sourceCode: string, changelog: string) => WorkspacePolicyVersion | undefined
  restoreVersion: (policyId: string, versionNumber: number) => WorkspacePolicy | undefined
  getPolicyVersions: (policyId: string) => WorkspacePolicyVersion[]

  compilePolicy: (policyId: string, sourceOverride?: string) => WorkspaceCompilationRecord
  executePolicy: (
    policyId: string,
    inputs: Record<string, number | string | boolean>,
    sourceOverride?: string,
  ) => WorkspaceExecutionRecord

  importFplFile: (fileName: string, content: string, categoryId?: string, folderId?: string | null) => WorkspacePolicy
  exportFplFile: (policyId: string) => { fileName: string; content: string } | null
  exportWorkspaceBackup: () => string
  importWorkspaceBackup: (jsonBackup: string) => { restoredPolicies: number; restoredVersions: number }
}

export const usePolicyWorkspaceStore = create<PolicyWorkspaceState>((set, get) => ({
  currentRole: 'ADMIN',
  policies: INITIAL_POLICIES,
  versions: INITIAL_VERSIONS,
  folders: INITIAL_FOLDERS,
  categories: WORKSPACE_CATEGORIES,
  tags: WORKSPACE_TAGS,
  compilations: [],
  executions: [],
  auditLogs: INITIAL_AUDIT_LOGS,

  setRole: (role) => set({ currentRole: role }),

  createPolicy: (input) => {
    const state = get()
    const now = new Date().toISOString()
    const id = `pol-${Date.now()}`
    const category =
      state.categories.find((c) => c.id === input.categoryId) ?? state.categories[0]
    const defaultSource =
      input.sourceCode?.trim() ||
      `POLICY ${input.name.replace(/[^A-Za-z0-9_]/g, '') || 'NewFinancialPolicy'}
INPUT
  age: int
  salary: decimal
OUTPUT
  interestRate: decimal
WHEN
  age >= 21 AND salary >= 50000
THEN
  APPROVE
  SET interestRate = 8.5
ELSE
  REJECT
  SET interestRate = 14.0
END`
    const sourceLanguage = input.sourceLanguage ?? detectPolicySourceLanguage(defaultSource)

    const newPolicy: WorkspacePolicy = {
      id,
      name: input.name.trim(),
      slug: `${slugify(input.name)}-${Math.floor(Math.random() * 900 + 100)}`,
      description: input.description ?? 'Enterprise Financial Policy rule.',
      sourceCode: defaultSource,
      sourceLanguage,
      status: 'DRAFT',
      categoryId: category.id,
      categoryName: category.name,
      folderId: input.folderId ?? 'fld-banking',
      tags: input.tags ?? ['Banking'],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      latestVersion: 1,
      authorId: 'usr-admin-01',
      authorName: 'Aarav Mehta',
      lastCompilationStatus: 'NEVER',
      lastExecutionStatus: 'NEVER',
      lastDecision: null,
      compilationCount: 0,
      executionCount: 0,
      errorCount: 0,
      warningCount: 0,
      lastCompiledAt: null,
      lastExecutedAt: null,
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    const v1: WorkspacePolicyVersion = {
      id: `ver-${id}-1`,
      policyId: id,
      versionNumber: 1,
      sourceCode: defaultSource,
      sourceLanguage,
      changelog: 'Initial policy version v1',
      isLatest: true,
      compilationStatus: 'NEVER',
      createdById: 'usr-admin-01',
      createdByName: 'Aarav Mehta',
      createdAt: now,
    }

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'CREATE',
      policyId: id,
      policyName: newPolicy.name,
      summary: `Created policy "${newPolicy.name}" (v1) in category ${category.name}`,
      createdAt: now,
    }

    set({
      policies: [newPolicy, ...state.policies],
      versions: [v1, ...state.versions],
      auditLogs: [audit, ...state.auditLogs],
    })

    return newPolicy
  },

  openPolicy: (policyId) => {
    const state = get()
    const target = state.policies.find((p) => p.id === policyId)
    if (!target) return undefined
    const now = new Date().toISOString()
    set({
      policies: state.policies.map((p) =>
        p.id === policyId ? { ...p, lastOpenedAt: now } : p,
      ),
    })
    return { ...target, lastOpenedAt: now }
  },

  updatePolicy: (policyId, updates) => {
    const state = get()
    const existing = state.policies.find((p) => p.id === policyId)
    if (!existing) return undefined

    const now = new Date().toISOString()
    const category = updates.categoryId
      ? state.categories.find((c) => c.id === updates.categoryId) ??
        state.categories.find((c) => c.id === existing.categoryId)!
      : state.categories.find((c) => c.id === existing.categoryId)!

    const nextSource = updates.sourceCode !== undefined ? updates.sourceCode : existing.sourceCode
    const nextSourceLanguage =
      updates.sourceLanguage ?? existing.sourceLanguage ?? detectPolicySourceLanguage(nextSource)
    const sourceChanged = updates.sourceCode !== undefined && updates.sourceCode !== existing.sourceCode
    const shouldVersion = Boolean(updates.createNewVersion || sourceChanged)
    const nextVersionNumber = shouldVersion ? existing.latestVersion + 1 : existing.latestVersion

    const updatedPolicy: WorkspacePolicy = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      description: updates.description !== undefined ? updates.description : existing.description,
      sourceCode: nextSource,
      sourceLanguage: nextSourceLanguage,
      categoryId: category.id,
      categoryName: category.name,
      folderId: updates.folderId !== undefined ? updates.folderId : existing.folderId,
      tags: updates.tags !== undefined ? updates.tags : existing.tags,
      latestVersion: nextVersionNumber,
      updatedAt: now,
    }

    let nextVersions = state.versions
    if (shouldVersion) {
      const newVer: WorkspacePolicyVersion = {
        id: `ver-${policyId}-${nextVersionNumber}-${Date.now()}`,
        policyId,
        versionNumber: nextVersionNumber,
        sourceCode: nextSource,
        sourceLanguage: nextSourceLanguage,
        changelog: updates.versionNotes || `Updated policy to v${nextVersionNumber}`,
        isLatest: true,
        compilationStatus: existing.lastCompilationStatus,
        createdById: 'usr-admin-01',
        createdByName: 'Aarav Mehta',
        createdAt: now,
      }
      nextVersions = [
        newVer,
        ...state.versions.map((v) =>
          v.policyId === policyId ? { ...v, isLatest: false } : v,
        ),
      ]
    }

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'EDIT',
      policyId,
      policyName: updatedPolicy.name,
      summary: shouldVersion
        ? `Saved policy "${updatedPolicy.name}" and created snapshot v${nextVersionNumber}`
        : `Updated metadata for policy "${updatedPolicy.name}"`,
      createdAt: now,
    }

    set({
      policies: state.policies.map((p) => (p.id === policyId ? updatedPolicy : p)),
      versions: nextVersions,
      auditLogs: [audit, ...state.auditLogs],
    })

    return updatedPolicy
  },

  renamePolicy: (policyId, newName) => {
    const state = get()
    const existing = state.policies.find((p) => p.id === policyId)
    if (!existing || !newName.trim()) return undefined
    const now = new Date().toISOString()
    const updated = { ...existing, name: newName.trim(), updatedAt: now }
    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'RENAME',
      policyId,
      policyName: updated.name,
      summary: `Renamed policy from "${existing.name}" to "${updated.name}"`,
      createdAt: now,
    }
    set({
      policies: state.policies.map((p) => (p.id === policyId ? updated : p)),
      auditLogs: [audit, ...state.auditLogs],
    })
    return updated
  },

  duplicatePolicy: (policyId) => {
    const state = get()
    const orig = state.policies.find((p) => p.id === policyId)
    if (!orig) return undefined
    const copy = state.createPolicy({
      name: `${orig.name}_Copy`,
      description: `Copy of ${orig.name}: ${orig.description}`,
      sourceCode: orig.sourceCode.replace(
        new RegExp(`POLICY\\s+${orig.name}\\b`),
        `POLICY ${orig.name}_Copy`,
      ),
      categoryId: orig.categoryId,
      folderId: orig.folderId,
      tags: [...orig.tags],
    })
    return copy
  },

  deletePolicy: (policyId, hardDelete = false) => {
    const state = get()
    const existing = state.policies.find((p) => p.id === policyId)
    if (!existing) return
    const now = new Date().toISOString()
    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'DELETE',
      policyId,
      policyName: existing.name,
      summary: hardDelete
        ? `Permanently deleted policy "${existing.name}"`
        : `Deleted/archived policy "${existing.name}"`,
      createdAt: now,
    }
    if (hardDelete) {
      set({
        policies: state.policies.filter((p) => p.id !== policyId),
        versions: state.versions.filter((v) => v.policyId !== policyId),
        auditLogs: [audit, ...state.auditLogs],
      })
    } else {
      set({
        policies: state.policies.map((p) =>
          p.id === policyId ? { ...p, status: 'ARCHIVED', isArchived: true, updatedAt: now } : p,
        ),
        auditLogs: [audit, ...state.auditLogs],
      })
    }
  },

  publishPolicy: (policyId) => {
    const state = get()
    const existing = state.policies.find((p) => p.id === policyId)
    if (!existing) return undefined
    const now = new Date().toISOString()
    const updated: WorkspacePolicy = {
      ...existing,
      status: 'PUBLISHED',
      isArchived: false,
      updatedAt: now,
    }
    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'PUBLISH',
      policyId,
      policyName: updated.name,
      summary: `Published policy "${updated.name}" (v${updated.latestVersion})`,
      createdAt: now,
    }
    set({
      policies: state.policies.map((p) => (p.id === policyId ? updated : p)),
      auditLogs: [audit, ...state.auditLogs],
    })
    return updated
  },

  archivePolicy: (policyId) => {
    const state = get()
    const existing = state.policies.find((p) => p.id === policyId)
    if (!existing) return undefined
    const now = new Date().toISOString()
    const updated: WorkspacePolicy = {
      ...existing,
      status: 'ARCHIVED',
      isArchived: true,
      updatedAt: now,
    }
    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'ARCHIVE',
      policyId,
      policyName: updated.name,
      summary: `Archived policy "${updated.name}"`,
      createdAt: now,
    }
    set({
      policies: state.policies.map((p) => (p.id === policyId ? updated : p)),
      auditLogs: [audit, ...state.auditLogs],
    })
    return updated
  },

  restorePolicy: (policyId) => {
    const state = get()
    const existing = state.policies.find((p) => p.id === policyId)
    if (!existing) return undefined
    const now = new Date().toISOString()
    const updated: WorkspacePolicy = {
      ...existing,
      status: existing.lastCompilationStatus === 'SUCCESS' ? 'COMPILED' : 'DRAFT',
      isArchived: false,
      updatedAt: now,
    }
    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'RESTORE',
      policyId,
      policyName: updated.name,
      summary: `Restored policy "${updated.name}" from archive`,
      createdAt: now,
    }
    set({
      policies: state.policies.map((p) => (p.id === policyId ? updated : p)),
      auditLogs: [audit, ...state.auditLogs],
    })
    return updated
  },

  toggleFavorite: (policyId) => {
    const state = get()
    set({
      policies: state.policies.map((p) =>
        p.id === policyId ? { ...p, isFavorite: !p.isFavorite } : p,
      ),
    })
  },

  togglePin: (policyId) => {
    const state = get()
    set({
      policies: state.policies.map((p) =>
        p.id === policyId ? { ...p, isPinned: !p.isPinned } : p,
      ),
    })
  },

  movePolicyToFolder: (policyId, folderId) => {
    const state = get()
    set({
      policies: state.policies.map((p) =>
        p.id === policyId ? { ...p, folderId, updatedAt: new Date().toISOString() } : p,
      ),
    })
  },

  createFolder: (name, parentId = null, color = '#3B82F6') => {
    const state = get()
    const folder: WorkspaceFolder = {
      id: `fld-${Date.now()}`,
      name: name.trim(),
      slug: slugify(name),
      parentId,
      color,
      icon: 'Folder',
    }
    set({ folders: [...state.folders, folder] })
    return folder
  },

  createVersion: (policyId, sourceCode, changelog) => {
    const state = get()
    const policy = state.policies.find((p) => p.id === policyId)
    if (!policy) return undefined
    const now = new Date().toISOString()
    const nextVerNum = policy.latestVersion + 1

    const newVer: WorkspacePolicyVersion = {
      id: `ver-${policyId}-${nextVerNum}-${Date.now()}`,
      policyId,
      versionNumber: nextVerNum,
      sourceCode,
      sourceLanguage: detectPolicySourceLanguage(sourceCode),
      changelog: changelog.trim() || `Version v${nextVerNum} snapshot`,
      isLatest: true,
      compilationStatus: policy.lastCompilationStatus,
      createdById: 'usr-admin-01',
      createdByName: 'Aarav Mehta',
      createdAt: now,
    }

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'VERSION_CREATE',
      policyId,
      policyName: policy.name,
      summary: `Created version v${nextVerNum}: ${newVer.changelog}`,
      createdAt: now,
    }

    set({
      policies: state.policies.map((p) =>
        p.id === policyId
          ? {
              ...p,
              sourceCode,
              sourceLanguage: detectPolicySourceLanguage(sourceCode),
              latestVersion: nextVerNum,
              updatedAt: now,
            }
          : p,
      ),
      versions: [
        newVer,
        ...state.versions.map((v) =>
          v.policyId === policyId ? { ...v, isLatest: false } : v,
        ),
      ],
      auditLogs: [audit, ...state.auditLogs],
    })

    return newVer
  },

  restoreVersion: (policyId, versionNumber) => {
    const state = get()
    const policy = state.policies.find((p) => p.id === policyId)
    const targetVer = state.versions.find(
      (v) => v.policyId === policyId && v.versionNumber === versionNumber,
    )
    if (!policy || !targetVer) return undefined

    const now = new Date().toISOString()
    const nextVerNum = policy.latestVersion + 1
    const restoredVer: WorkspacePolicyVersion = {
      id: `ver-${policyId}-${nextVerNum}-${Date.now()}`,
      policyId,
      versionNumber: nextVerNum,
      sourceCode: targetVer.sourceCode,
      sourceLanguage: targetVer.sourceLanguage ?? detectPolicySourceLanguage(targetVer.sourceCode),
      changelog: `Restored from version v${versionNumber} (${targetVer.changelog})`,
      isLatest: true,
      compilationStatus: targetVer.compilationStatus,
      createdById: 'usr-admin-01',
      createdByName: 'Aarav Mehta',
      createdAt: now,
    }

    const updatedPolicy: WorkspacePolicy = {
      ...policy,
      sourceCode: targetVer.sourceCode,
      sourceLanguage: targetVer.sourceLanguage ?? detectPolicySourceLanguage(targetVer.sourceCode),
      latestVersion: nextVerNum,
      updatedAt: now,
    }

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'VERSION_RESTORE',
      policyId,
      policyName: policy.name,
      summary: `Restored v${versionNumber} as new latest version v${nextVerNum}`,
      createdAt: now,
    }

    set({
      policies: state.policies.map((p) => (p.id === policyId ? updatedPolicy : p)),
      versions: [
        restoredVer,
        ...state.versions.map((v) =>
          v.policyId === policyId ? { ...v, isLatest: false } : v,
        ),
      ],
      auditLogs: [audit, ...state.auditLogs],
    })

    return updatedPolicy
  },

  getPolicyVersions: (policyId) => {
    return get()
      .versions.filter((v) => v.policyId === policyId)
      .sort((a, b) => b.versionNumber - a.versionNumber)
  },

  compilePolicy: (policyId, sourceOverride) => {
    const state = get()
    const policy = state.policies.find((p) => p.id === policyId)
    const sourceToCompile = sourceOverride ?? policy?.sourceCode ?? ''
    const startTime = performance.now()

    const semanticRes = analyzePolicySource(sourceToCompile)
    const irRes = generatePolicyIR(sourceToCompile)
    const durationMs = Number(Math.max(0.45, performance.now() - startTime).toFixed(2))

    const errors = semanticRes.diagnostics
      .filter((d) => d.severity === 'ERROR')
      .map((d) => ({ code: d.code, message: d.message, line: d.line, column: d.column }))
    const warnings = semanticRes.diagnostics
      .filter((d) => d.severity === 'WARNING')
      .map((d) => ({ code: d.code, message: d.message, line: d.line, column: d.column }))

    const status: 'SUCCESS' | 'FAILED' | 'WARNING' =
      errors.length > 0 ? 'FAILED' : warnings.length > 0 ? 'WARNING' : 'SUCCESS'

    const tokenCount = sourceToCompile.trim().split(/\s+/).length
    const astNodeCount = Math.max(8, irRes.tac.length + semanticRes.symbols.length * 2)
    const now = new Date().toISOString()

    const record: WorkspaceCompilationRecord = {
      id: `cmp-${Date.now()}`,
      policyId,
      policyName: policy?.name ?? 'AdHocPolicy',
      versionNumber: policy?.latestVersion ?? 1,
      status,
      compilationTimeMs: durationMs,
      tokenCount,
      astNodeCount,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
      optimizationSummary: {
        passesExecuted: irRes.optimization.passSummaries.length,
        totalTransformations: irRes.optimization.statistics.totalTransformations,
        instructionsBefore: irRes.optimization.statistics.instructionsBefore,
        instructionsAfter: irRes.optimization.statistics.instructionsAfter,
        instructionReductionPercent: irRes.optimization.statistics.instructionReductionPercent,
      },
      tacText: irRes.formattedTAC,
      optimizedTacText: irRes.optimization.formattedOptimizedTAC,
      createdAt: now,
    }

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'COMPILE',
      policyId,
      policyName: policy?.name ?? null,
      summary: `Compiled ${policy?.name ?? 'policy'} v${policy?.latestVersion ?? 1} -> ${status} (${durationMs} ms, ${errors.length} errors, ${warnings.length} warnings)`,
      createdAt: now,
    }

    set({
      compilations: [record, ...state.compilations],
      auditLogs: [audit, ...state.auditLogs],
      policies: state.policies.map((p) =>
        p.id === policyId
          ? {
              ...p,
              sourceCode: sourceToCompile,
              sourceLanguage: detectPolicySourceLanguage(sourceToCompile),
              lastCompilationStatus: status,
              status: status !== 'FAILED' && p.status === 'DRAFT' ? 'COMPILED' : p.status,
              compilationCount: p.compilationCount + 1,
              errorCount: errors.length,
              warningCount: warnings.length,
              lastCompiledAt: now,
              updatedAt: now,
            }
          : p,
      ),
    })

    return record
  },

  executePolicy: (policyId, inputs, sourceOverride) => {
    const state = get()
    const policy = state.policies.find((p) => p.id === policyId)
    const sourceToRun = sourceOverride ?? policy?.sourceCode ?? ''
    const irBundle = generatePolicyIR(sourceToRun)
    const vmRes = executePolicyVM(sourceToRun, inputs)
    const now = new Date().toISOString()

    const variablesMap: Record<string, unknown> = {}
    for (const v of vmRes.variables) {
      variablesMap[v.name] = v.value
    }

    const record: WorkspaceExecutionRecord = {
      id: `exe-${Date.now()}`,
      policyId,
      policyName: policy?.name ?? irBundle.policyName,
      versionNumber: policy?.latestVersion ?? 1,
      status: vmRes.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      decision: vmRes.decision,
      executionTimeMs: vmRes.metrics.executionTimeMs,
      instructionsExecuted: vmRes.metrics.instructionsExecuted,
      memoryUsageBytes: vmRes.memorySnapshot.totalAllocatedBytes,
      inputs,
      variables: variablesMap,
      outputs: vmRes.outputs,
      traceSummary: vmRes.trace.map((t) => ({
        step: t.step,
        ip: t.ip,
        blockId: t.blockId,
        opcode: t.opcode,
        statementText: t.statementText,
        changes: t.changes,
      })),
      errorMessage: vmRes.diagnostics.find((d) => d.severity === 'error')?.message ?? null,
      createdAt: now,
    }

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'EXECUTE',
      policyId,
      policyName: policy?.name ?? null,
      summary: `Executed ${policy?.name ?? 'policy'} on FPVM -> Decision: ${vmRes.decision} (${vmRes.metrics.executionTimeMs} ms)`,
      createdAt: now,
    }

    set({
      executions: [record, ...state.executions],
      auditLogs: [audit, ...state.auditLogs],
      policies: state.policies.map((p) =>
        p.id === policyId
          ? {
              ...p,
              lastExecutionStatus: record.status,
              lastDecision: vmRes.decision,
              executionCount: p.executionCount + 1,
              lastExecutedAt: now,
              updatedAt: now,
            }
          : p,
      ),
    })

    return record
  },

  importFplFile: (fileName, content, categoryId, folderId) => {
    const state = get()
    const sourceLanguage = detectPolicySourceLanguage(content)
    const match = content.match(/\bPOLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i)
    const policyName =
      match?.[1] ??
      (fileName.replace(/\.(fpl|c|txt)$/i, '').trim() ||
        (sourceLanguage === 'c-policy' ? 'ImportedCPolicy' : 'ImportedPolicy'))
    const created = state.createPolicy({
      name: policyName,
      description: `Imported from ${fileName}`,
      sourceCode: content,
      sourceLanguage,
      categoryId: categoryId ?? 'cat-loan',
      folderId: folderId ?? 'fld-banking',
      tags: ['Banking'],
    })

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now() + 1}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'IMPORT',
      policyId: created.id,
      policyName: created.name,
      summary: `Imported FPL file "${fileName}" as policy "${created.name}"`,
      createdAt: new Date().toISOString(),
    }

    set((s) => ({ auditLogs: [audit, ...s.auditLogs] }))
    return created
  },

  exportFplFile: (policyId) => {
    const state = get()
    const policy = state.policies.find((p) => p.id === policyId)
    if (!policy) return null
    const header = [
      `# =====================================================================`,
      `# FinPolicy Compiler — Enterprise Policy Export`,
      `# Policy: ${policy.name} (v${policy.latestVersion})`,
      `# Category: ${policy.categoryName} | Status: ${policy.status}`,
      `# Exported At: ${new Date().toISOString()}`,
      `# =====================================================================`,
      ``,
    ].join('\n')

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'EXPORT',
      policyId: policy.id,
      policyName: policy.name,
      summary: `Exported policy "${policy.name}" as ${policy.slug}.fpl`,
      createdAt: new Date().toISOString(),
    }
    set({ auditLogs: [audit, ...state.auditLogs] })

    return {
      fileName: `${policy.slug}.fpl`,
      content: `${header}${policy.sourceCode.trim()}\n`,
    }
  },

  exportWorkspaceBackup: () => {
    const state = get()
    const payload = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      product: 'FinPolicy Compiler Platform v1.0.0',
      policies: state.policies,
      versions: state.versions,
      folders: state.folders,
      categories: state.categories,
      tags: state.tags,
      auditLogs: state.auditLogs,
    }
    return JSON.stringify(payload, null, 2)
  },

  importWorkspaceBackup: (jsonBackup) => {
    const parsed = JSON.parse(jsonBackup)
    const state = get()
    const nextPolicies: WorkspacePolicy[] = Array.isArray(parsed.policies)
      ? parsed.policies
      : state.policies
    const nextVersions: WorkspacePolicyVersion[] = Array.isArray(parsed.versions)
      ? parsed.versions
      : state.versions
    const nextFolders: WorkspaceFolder[] = Array.isArray(parsed.folders)
      ? parsed.folders
      : state.folders

    const audit: WorkspaceAuditRecord = {
      id: `aud-${Date.now()}`,
      actorId: 'usr-admin-01',
      actorName: 'Aarav Mehta',
      actorRole: state.currentRole,
      action: 'RESTORE',
      policyId: null,
      policyName: 'Workspace Archive',
      summary: `Restored workspace backup (${nextPolicies.length} policies, ${nextVersions.length} versions)`,
      createdAt: new Date().toISOString(),
    }

    set({
      policies: nextPolicies,
      versions: nextVersions,
      folders: nextFolders,
      auditLogs: [audit, ...state.auditLogs],
    })

    return {
      restoredPolicies: nextPolicies.length,
      restoredVersions: nextVersions.length,
    }
  },
}))
