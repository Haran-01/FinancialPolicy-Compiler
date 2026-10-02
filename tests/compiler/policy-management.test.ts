/**
 * Enterprise Policy Management System — Comprehensive Unit & Integration Test Suite
 * Phase 5: Tests Policy CRUD, Rename, Duplicate, Archive/Restore, Favorite/Pin,
 * Version Control & Side-by-Side Comparison, Compiler Pipeline Integration,
 * FPVM Execution Integration, Search & Multi-Facet Filters, Import/Export (.fpl),
 * Nested Folders, Audit Logging, and Role-Based Access Control (RBAC).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  PolicyManagementService,
  ActorContext,
} from '../../backend/src/services/policy-management.service'

describe('Phase 5: Enterprise Policy Management System', () => {
  let service: PolicyManagementService

  const adminActor: ActorContext = {
    id: 'usr-admin-01',
    name: 'Aarav Mehta',
    role: 'ADMIN',
    ipAddress: '127.0.0.1',
  }

  const managerActor: ActorContext = {
    id: 'usr-pm-02',
    name: 'Priya Nair',
    role: 'POLICY_MANAGER',
    ipAddress: '127.0.0.1',
  }

  const auditorActor: ActorContext = {
    id: 'usr-aud-03',
    name: 'Rohan Kapoor',
    role: 'AUDITOR',
    ipAddress: '127.0.0.1',
  }

  const viewerActor: ActorContext = {
    id: 'usr-vw-04',
    name: 'Sneha Rao',
    role: 'VIEWER',
    ipAddress: '127.0.0.1',
  }

  beforeEach(() => {
    service = new PolicyManagementService()
  })

  // ─── 1. Policy Creation, Editing, Rename, Duplicate & Deletion ────────────

  it('should create a new policy with initial version v1 and audit log', () => {
    const created = service.createPolicy(
      {
        name: 'CorporateCreditLine',
        description: 'Corporate credit limit evaluation',
        categoryId: 'cat-loan',
        folderId: 'fld-banking',
        tags: ['Banking'],
        sourceCode: `POLICY CorporateCreditLine
INPUT
  revenue: decimal
  yearsInBusiness: int
WHEN
  revenue >= 500000 AND yearsInBusiness >= 3
THEN
  APPROVE
ELSE
  REJECT
END`,
      },
      adminActor,
    )

    expect(created.id).toBeDefined()
    expect(created.name).toBe('CorporateCreditLine')
    expect(created.latestVersion).toBe(1)
    expect(created.status).toBe('DRAFT')

    const versions = service.getVersionHistory(created.id, adminActor)
    expect(versions).toHaveLength(1)
    expect(versions[0].versionNumber).toBe(1)
    expect(versions[0].isLatest).toBe(true)
  })

  it('should edit an existing policy and automatically create version v2 when source changes', () => {
    const updated = service.updatePolicy(
      'pol-payroll-bonus',
      {
        description: 'Updated executive bonus threshold to tenure >= 3',
        sourceCode: `POLICY ExecutivePayrollBonus
INPUT
  baseSalary: decimal
  performanceRating: int
  tenureYears: int
OUTPUT
  bonusAmount: decimal
WHEN
  performanceRating >= 4 AND tenureYears >= 3
THEN
  APPROVE
  SET bonusAmount = 20000
ELSE
  REJECT
  SET bonusAmount = 0
END`,
        versionNotes: 'Increased tenure requirement to 3 years and bonus to 20000',
      },
      managerActor,
    )

    expect(updated.latestVersion).toBe(2)
    const latest = service.getLatestVersion('pol-payroll-bonus', managerActor)
    expect(latest.versionNumber).toBe(2)
    expect(latest.changelog).toContain('Increased tenure requirement')
  })

  it('should rename, duplicate, favorite, pin, archive, restore, and delete policies', () => {
    const renamed = service.renamePolicy(
      'pol-scholarship-grant',
      'NationalMeritScholarship',
      managerActor,
    )
    expect(renamed.name).toBe('NationalMeritScholarship')

    const duplicated = service.duplicatePolicy('pol-scholarship-grant', managerActor)
    expect(duplicated.name).toBe('NationalMeritScholarship_Copy')
    expect(duplicated.latestVersion).toBe(1)

    const fav = service.toggleFavoritePolicy(duplicated.id, managerActor)
    expect(fav.isFavorite).toBe(true)

    const pinned = service.togglePinPolicy(duplicated.id, managerActor)
    expect(pinned.isPinned).toBe(true)

    const archived = service.archivePolicy(duplicated.id, managerActor)
    expect(archived.status).toBe('ARCHIVED')
    expect(archived.isArchived).toBe(true)

    const restored = service.restorePolicy(duplicated.id, managerActor)
    expect(restored.isArchived).toBe(false)

    const delRes = service.deletePolicy(duplicated.id, adminActor, true)
    expect(delRes.deleted).toBe(true)
  })

  // ─── 2. Policy Compilation Integration (Compiler Pipeline) ────────────────

  it('should compile a valid FPL policy through Lexer -> Parser -> Semantic -> IR -> Optimizer', () => {
    const compileRecord = service.compilePolicy('pol-loan-approval', adminActor)

    expect(compileRecord.status).toBe('SUCCESS')
    expect(compileRecord.errorCount).toBe(0)
    expect(compileRecord.tokenCount).toBeGreaterThan(10)
    expect(compileRecord.astNodeCount).toBeGreaterThan(0)
    expect(compileRecord.compilationTimeMs).toBeGreaterThan(0)
    expect(compileRecord.optimizationSummary.passesExecuted).toBeGreaterThan(0)
    expect(compileRecord.tacPreview).toContain('POLICY')

    const history = service.getCompilationHistory('pol-loan-approval', adminActor)
    expect(history.length).toBeGreaterThanOrEqual(1)
    expect(history[0].id).toBe(compileRecord.id)
  })

  it('should capture compilation errors when compiling invalid FPL syntax', () => {
    const badPolicy = service.createPolicy(
      {
        name: 'BrokenPolicy',
        sourceCode: `POLICY BrokenPolicy WHEN salary >= THEN END`,
      },
      adminActor,
    )

    const compileRecord = service.compilePolicy(badPolicy.id, adminActor)
    expect(compileRecord.status).toBe('FAILED')
    expect(compileRecord.errorCount).toBeGreaterThan(0)
    expect(compileRecord.errors[0].message).toBeDefined()
  })

  // ─── 3. Policy Execution Integration (Financial Policy Virtual Machine) ───

  it('should execute a compiled FPL policy on the Financial Policy Virtual Machine (FPVM)', () => {
    const execApprove = service.executePolicy(
      'pol-loan-approval',
      {
        age: 30,
        salary: 85000,
        creditScore: 760,
      },
      adminActor,
    )

    expect(execApprove.status).toBe('SUCCESS')
    expect(execApprove.decision).toBe('APPROVE')
    expect(execApprove.executionTimeMs).toBeGreaterThanOrEqual(0)
    expect(execApprove.memoryUsageBytes).toBeGreaterThan(0)
    expect(execApprove.outputs.interestRate).toBe(8.5)
    expect(execApprove.traceSummary.length).toBeGreaterThan(0)

    const execReject = service.executePolicy(
      'pol-loan-approval',
      {
        age: 19,
        salary: 40000,
        creditScore: 620,
      },
      adminActor,
    )

    expect(execReject.status).toBe('SUCCESS')
    expect(execReject.decision).toBe('REJECT')
    expect(execReject.outputs.interestRate).toBe(14)
  })

  // ─── 4. Version Control & Side-by-Side Comparison ─────────────────────────

  it('should create versions, compare versions side-by-side, and restore a previous version', () => {
    const diff = service.compareVersions('pol-loan-approval', 1, 2, adminActor)

    expect(diff.policyId).toBe('pol-loan-approval')
    expect(diff.leftVersion.versionNumber).toBe(1)
    expect(diff.rightVersion.versionNumber).toBe(2)
    expect(diff.linesModified + diff.linesAdded).toBeGreaterThan(0)
    expect(diff.diffLines.length).toBeGreaterThan(5)

    const restoredPolicy = service.restoreVersion('pol-loan-approval', 1, adminActor)
    expect(restoredPolicy.latestVersion).toBe(3)
    expect(restoredPolicy.sourceCode).toContain('salary >= 50000')
  })

  // ─── 5. Policy Search & Multi-Facet Filter Engine ─────────────────────────

  it('should search and filter policies by name, tag, category, status, and compilation status', () => {
    const byName = service.searchPolicies({ search: 'Fraud' }, viewerActor)
    expect(byName).toHaveLength(1)
    expect(byName[0].name).toBe('HighValueWireFraudGuard')

    const byTag = service.searchPolicies({ tag: 'Healthcare' }, viewerActor)
    expect(byTag).toHaveLength(1)
    expect(byTag[0].name).toBe('HealthInsuranceClaimAutoApprove')

    const byCategory = service.searchPolicies({ categorySlug: 'LOAN' }, viewerActor)
    expect(byCategory.some((p) => p.name === 'LoanApproval')).toBe(true)

    const publishedOnly = service.searchPolicies({ status: 'PUBLISHED' }, viewerActor)
    expect(publishedOnly.every((p) => p.status === 'PUBLISHED')).toBe(true)

    const favoritesOnly = service.searchPolicies({ isFavorite: true }, viewerActor)
    expect(favoritesOnly.every((p) => p.isFavorite)).toBe(true)
  })

  // ─── 6. Import & Export (.fpl) and Folders ────────────────────────────────

  it('should import and export .fpl files and manage nested folders', () => {
    const subFolder = service.createFolder('Commercial Loans', 'fld-banking', adminActor)
    expect(subFolder.parentId).toBe('fld-banking')

    const fplContent = `POLICY CommercialBridgeLoan
INPUT
  collateralValue: decimal
WHEN
  collateralValue >= 1000000
THEN
  APPROVE
ELSE
  REJECT
END`

    const imported = service.importFplPolicy(
      'CommercialBridgeLoan.fpl',
      fplContent,
      adminActor,
      {
        categoryId: 'cat-loan',
        folderId: subFolder.id,
        tags: ['Banking'],
      },
    )

    expect(imported.name).toBe('CommercialBridgeLoan')
    expect(imported.folderId).toBe(subFolder.id)

    const exported = service.exportFplPolicy(imported.id, adminActor)
    expect(exported.fileName).toContain('.fpl')
    expect(exported.content).toContain('POLICY CommercialBridgeLoan')
  })

  // ─── 7. Role-Based Access Control (RBAC) & Audit Logging ──────────────────

  it('should enforce RBAC permissions across ADMIN, POLICY_MANAGER, AUDITOR, and VIEWER', () => {
    // VIEWER cannot create, edit, compile, or execute policies
    expect(() =>
      service.createPolicy({ name: 'UnauthorizedPolicy' }, viewerActor),
    ).toThrow(/Role 'VIEWER' does not have permission/)

    expect(() =>
      service.compilePolicy('pol-loan-approval', viewerActor),
    ).toThrow(/Role 'VIEWER' does not have permission/)

    // POLICY_MANAGER cannot hard-delete or view audit logs
    expect(() =>
      service.deletePolicy('pol-loan-approval', managerActor),
    ).toThrow(/Role 'POLICY_MANAGER' does not have permission/)

    expect(() => service.getAuditLogs(managerActor)).toThrow(
      /Role 'POLICY_MANAGER' does not have permission/,
    )

    // AUDITOR can view audit logs and policies, but cannot create policies
    const logs = service.getAuditLogs(auditorActor)
    expect(logs.length).toBeGreaterThan(0)

    expect(() =>
      service.createPolicy({ name: 'AuditorPolicy' }, auditorActor),
    ).toThrow(/Role 'AUDITOR' does not have permission/)
  })
})
