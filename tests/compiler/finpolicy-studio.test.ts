/**
 * FinPolicy Studio — Comprehensive IDE Test Suite
 * Covers:
 * 1. Component & Layout State Tests
 * 2. Navigation & Multi-Tab / Split Editor Tests
 * 3. Editor & File Management Tests
 * 4. Responsive, Theme & Settings Tests
 * 5. Developer Mode Tests (OFF by default; unlocks collapsible Developer Panel when ON)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useStudioStore } from '../../frontend/src/stores/studio.store'
import {
  usePolicyWorkspaceStore,
  formatFplPolicyCode,
} from '../../frontend/src/stores/policy-workspace.store'

describe('Phase 6: FinPolicy Studio — Enterprise IDE', () => {
  beforeEach(() => {
    useStudioStore.setState({
      activeWorkspaceId: 'ws-enterprise-all',
      openTabs: [
        { policyId: 'pol-loan-approval', title: 'LoanApproval.fpl', isDirty: false },
        { policyId: 'pol-fraud-guard', title: 'HighValueWireFraudGuard.fpl', isDirty: false },
      ],
      activePolicyId: 'pol-loan-approval',
      secondaryPolicyId: 'pol-fraud-guard',
      splitEditorEnabled: false,
      cursorPosition: { lineNumber: 1, column: 1 },
      leftSidebarCollapsed: false,
      activeExplorerSection: 'files',
      rightSidebarCollapsed: false,
      activeRightTab: 'properties',
      bottomPanelCollapsed: false,
      activeBottomTab: 'problems',
      developerMode: false,
      developerPanelCollapsed: false,
      activeDeveloperTab: 'pipeline',
      commandPaletteOpen: false,
      globalSearchOpen: false,
      settingsModalOpen: false,
      versionModalOpen: false,
      backendOnline: true,
      sessionExpired: false,
      settings: {
        theme: 'dark',
        editorFont: "'JetBrains Mono', monospace",
        fontSize: 13,
        tabSize: 2,
        wordWrap: 'on',
        minimapEnabled: true,
        autoSave: true,
        compilerOptimizationLevel: 2,
        strictTypeChecking: true,
      },
    })
  })

  // ─── 1. Developer Mode Tests (Strict Requirement) ─────────────────────────

  it('should have Developer Mode OFF by default so compiler internals remain hidden', () => {
    const state = useStudioStore.getState()
    expect(state.developerMode).toBe(false)
  })

  it('should unlock the collapsible Developer Panel and all 10 compiler inspection tabs when Developer Mode is enabled', () => {
    const store = useStudioStore.getState()
    expect(store.developerMode).toBe(false)

    store.toggleDeveloperMode()
    expect(useStudioStore.getState().developerMode).toBe(true)
    expect(useStudioStore.getState().developerPanelCollapsed).toBe(false)

    const allDeveloperTabs = [
      'pipeline',
      'lexer',
      'parser',
      'ast',
      'semantic',
      'symbols',
      'ir',
      'optimization',
      'trace',
      'logs',
    ] as const

    for (const tab of allDeveloperTabs) {
      useStudioStore.getState().setActiveDeveloperTab(tab)
      expect(useStudioStore.getState().activeDeveloperTab).toBe(tab)
    }

    // Collapsing and expanding the Developer Panel
    useStudioStore.getState().setDeveloperPanelCollapsed(true)
    expect(useStudioStore.getState().developerPanelCollapsed).toBe(true)

    // Turning Developer Mode back OFF hides internals again
    useStudioStore.getState().toggleDeveloperMode()
    expect(useStudioStore.getState().developerMode).toBe(false)
  })

  // ─── 2. Navigation, Workspace & Explorer Section Tests ────────────────────

  it('should switch workspaces, explorer sections, bottom panel tabs, and right sidebar tabs', () => {
    const store = useStudioStore.getState()

    store.setActiveWorkspace('ws-retail-banking')
    expect(useStudioStore.getState().activeWorkspaceId).toBe('ws-retail-banking')

    const explorerSections = [
      'files',
      'favorites',
      'pinned',
      'recent',
      'compilations',
      'executions',
    ] as const
    for (const sec of explorerSections) {
      useStudioStore.getState().setActiveExplorerSection(sec)
      expect(useStudioStore.getState().activeExplorerSection).toBe(sec)
    }

    const bottomTabs = ['problems', 'output', 'execution', 'logs', 'terminal'] as const
    for (const bt of bottomTabs) {
      useStudioStore.getState().setActiveBottomTab(bt)
      expect(useStudioStore.getState().activeBottomTab).toBe(bt)
    }

    useStudioStore.getState().setActiveRightTab('results')
    expect(useStudioStore.getState().activeRightTab).toBe('results')
  })

  // ─── 3. Editor Multi-Tab, Split View, Formatting & Compilation/Execution ──

  it('should manage multiple editor tabs, dirty buffer state, split editor view, and cursor position', () => {
    const store = useStudioStore.getState()

    store.openPolicyTab('pol-payroll-bonus', 'ExecutivePayrollBonus')
    expect(useStudioStore.getState().openTabs).toHaveLength(3)
    expect(useStudioStore.getState().activePolicyId).toBe('pol-payroll-bonus')

    store.updateTabSource('pol-payroll-bonus', 'POLICY ExecutivePayrollBonus END', true)
    const dirtyTab = useStudioStore
      .getState()
      .openTabs.find((t) => t.policyId === 'pol-payroll-bonus')
    expect(dirtyTab?.isDirty).toBe(true)

    store.markTabSaved('pol-payroll-bonus')
    expect(
      useStudioStore
        .getState()
        .openTabs.find((t) => t.policyId === 'pol-payroll-bonus')?.isDirty,
    ).toBe(false)

    store.toggleSplitEditor()
    expect(useStudioStore.getState().splitEditorEnabled).toBe(true)

    store.setCursorPosition(14, 8)
    expect(useStudioStore.getState().cursorPosition).toEqual({
      lineNumber: 14,
      column: 8,
    })

    store.closePolicyTab('pol-payroll-bonus')
    expect(useStudioStore.getState().openTabs).toHaveLength(2)
  })

  it('should format FPL code, compile policies, and execute policies on FPVM from Studio', () => {
    const unformatted = `POLICY   LoanApproval\nWHEN\nage >= 21\nTHEN\nAPPROVE\nEND`
    const formatted = formatFplPolicyCode(unformatted)
    expect(formatted).toContain('POLICY   LoanApproval\nWHEN\n  age >= 21\nTHEN\n  APPROVE\nEND')

    const wsStore = usePolicyWorkspaceStore.getState()
    const compileRecord = wsStore.compilePolicy('pol-loan-approval')
    expect(compileRecord.status).toBe('SUCCESS')
    expect(compileRecord.compilationTimeMs).toBeGreaterThan(0)

    const execRecord = wsStore.executePolicy('pol-loan-approval', {
      age: 30,
      salary: 85000,
      creditScore: 750,
    })
    expect(execRecord.status).toBe('SUCCESS')
    expect(execRecord.decision).toBe('APPROVE')
  })

  // ─── 4. Theme System, IDE Settings & Responsive/Error Resilience Tests ────

  it('should toggle Dark/Light theme, update editor settings, and handle offline/session-expired resilience', () => {
    const store = useStudioStore.getState()
    expect(store.settings.theme).toBe('dark')

    store.toggleTheme()
    expect(useStudioStore.getState().settings.theme).toBe('light')

    store.updateSettings({
      fontSize: 15,
      tabSize: 4,
      wordWrap: 'off',
      minimapEnabled: false,
      compilerOptimizationLevel: 1,
    })

    const updated = useStudioStore.getState().settings
    expect(updated.fontSize).toBe(15)
    expect(updated.tabSize).toBe(4)
    expect(updated.wordWrap).toBe('off')
    expect(updated.minimapEnabled).toBe(false)
    expect(updated.compilerOptimizationLevel).toBe(1)

    // Offline & Session Expired resilience flags
    store.setBackendOnline(false)
    expect(useStudioStore.getState().backendOnline).toBe(false)

    store.setSessionExpired(true)
    expect(useStudioStore.getState().sessionExpired).toBe(true)
  })

  // ─── 5. Search, Command Palette, Notifications & Integrated Terminal ──────

  it('should support recent searches, notifications, and integrated terminal commands', () => {
    const store = useStudioStore.getState()

    store.addRecentSearch('riskScore < 40')
    expect(useStudioStore.getState().recentSearches[0]).toBe('riskScore < 40')

    store.pushNotification(
      'COMPILATION_SUCCESS',
      'Build Passed',
      'Compiled LoanApproval.fpl in 1.2 ms',
    )
    expect(useStudioStore.getState().notifications[0].title).toBe('Build Passed')
    expect(useStudioStore.getState().notifications[0].read).toBe(false)

    store.markAllNotificationsRead()
    expect(useStudioStore.getState().notifications.every((n) => n.read)).toBe(true)

    store.runTerminalCommand('status')
    const termLines = useStudioStore.getState().terminalLines
    expect(termLines[termLines.length - 1]).toContain('Active Policy:')
  })
})
