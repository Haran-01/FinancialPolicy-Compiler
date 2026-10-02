/**
 * FinPolicy Compiler — QA Modules 8 & 9: Platform API & FinPolicy Studio UI Validation
 * Validates Policy CRUD, Compilation APIs, Execution APIs, Version APIs,
 * Authentication/Authorization (RBAC), and FinPolicy Studio IDE workflows.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  PolicyManagementService,
  ActorContext,
} from '../../../backend/src/services/policy-management.service'
import { useStudioStore } from '../../../frontend/src/stores/studio.store'
import { usePolicyWorkspaceStore } from '../../../frontend/src/stores/policy-workspace.store'

describe('QA Suite — Modules 8 & 9: API & FinPolicy Studio UI Validation', () => {
  let apiService: PolicyManagementService

  const adminActor: ActorContext = {
    id: 'usr-admin-01',
    name: 'Aarav Mehta',
    role: 'ADMIN',
  }

  const viewerActor: ActorContext = {
    id: 'usr-viewer-09',
    name: 'ReadOnly User',
    role: 'VIEWER',
  }

  beforeEach(() => {
    apiService = new PolicyManagementService()
    useStudioStore.setState({
      developerMode: false,
      activeWorkspaceId: 'ws-enterprise-all',
    })
  })

  // ─── MODULE 8: API TESTS ──────────────────────────────────────────────────

  describe('Module 8: Backend API Validation', () => {
    it('validates Policy CRUD, Version APIs, Compilation APIs, and Execution APIs', () => {
      const created = apiService.createPolicy(
        {
          name: 'QAAutomatedUnderwriting',
          description: 'QA validation policy',
          categoryId: 'cat-loan',
        },
        adminActor,
      )
      expect(created.name).toBe('QAAutomatedUnderwriting')

      const v2 = apiService.createVersion(
        created.id,
        created.sourceCode,
        'QA Version 2 snapshot',
        adminActor,
      )
      expect(v2.versionNumber).toBe(2)

      const compiled = apiService.compilePolicy(created.id, adminActor)
      expect(compiled.status).toBe('SUCCESS')

      const executed = apiService.executePolicy(
        created.id,
        { age: 30, salary: 70000 },
        adminActor,
      )
      expect(executed.status).toBe('SUCCESS')
      expect(executed.decision).toBe('APPROVE')
    })

    it('enforces Authentication and Role-Based Authorization (RBAC)', () => {
      expect(() =>
        apiService.createPolicy({ name: 'ForbiddenPolicy' }, viewerActor),
      ).toThrow(/does not have permission/)

      expect(() =>
        apiService.deletePolicy('pol-loan-approval', viewerActor),
      ).toThrow(/does not have permission/)
    })
  })

  // ─── MODULE 9: UI & FINPOLICY STUDIO TESTS ────────────────────────────────

  describe('Module 9: FinPolicy Studio UI & Workflow Validation', () => {
    it('verifies Editor, Navigation, Policy Creation, Compilation, Execution, Developer Mode, and Settings', () => {
      const studio = useStudioStore.getState()
      const workspace = usePolicyWorkspaceStore.getState()

      // Developer Mode must be OFF by default
      expect(studio.developerMode).toBe(false)

      // Create policy from UI store
      const newPol = workspace.createPolicy({
        name: 'UIStudioCreatedPolicy',
        description: 'Created during QA UI test',
      })
      studio.openPolicyTab(newPol.id, newPol.name)
      expect(useStudioStore.getState().activePolicyId).toBe(newPol.id)

      // Compile & Execute from UI store
      const cmp = workspace.compilePolicy(newPol.id)
      expect(cmp.status).toBe('SUCCESS')

      const exe = workspace.executePolicy(newPol.id, { age: 25, salary: 65000 })
      expect(exe.decision).toBe('APPROVE')

      // Unlock Developer Mode & verify settings update
      studio.toggleDeveloperMode()
      expect(useStudioStore.getState().developerMode).toBe(true)

      studio.updateSettings({ fontSize: 16, tabSize: 4 })
      expect(useStudioStore.getState().settings.fontSize).toBe(16)
      expect(useStudioStore.getState().settings.tabSize).toBe(4)
    })
  })
})
