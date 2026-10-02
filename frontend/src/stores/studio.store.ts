/**
 * FinPolicy Studio — IDE State Store (Zustand)
 * Manages editor tabs, compiler phase view, panels, notifications, settings, and theme.
 */

import { create } from 'zustand'

export type StudioBottomTab = 'problems' | 'output' | 'execution' | 'logs' | 'terminal'
export type StudioRightTab = 'properties' | 'results'
export type StudioExplorerSection =
  | 'files'
  | 'favorites'
  | 'pinned'
  | 'recent'
  | 'compilations'
  | 'executions'

export type StudioDeveloperTab =
  | 'pipeline'
  | 'lexer'
  | 'parser'
  | 'ast'
  | 'semantic'
  | 'symbols'
  | 'ir'
  | 'optimization'
  | 'trace'
  | 'logs'

export interface StudioWorkspaceProject {
  id: string
  name: string
  description: string
  folderFilter: string | null
  lastOpenedAt: string
}

export interface StudioEditorTab {
  policyId: string
  title: string
  isDirty: boolean
  unsavedSource?: string
}

export interface StudioNotification {
  id: string
  type:
    | 'COMPILATION_SUCCESS'
    | 'COMPILATION_FAILURE'
    | 'EXECUTION_SUCCESS'
    | 'EXECUTION_FAILURE'
    | 'POLICY_SAVED'
    | 'VERSION_CREATED'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export interface StudioSettings {
  theme: 'dark' | 'light'
  editorFont: "'JetBrains Mono', monospace" | "'Fira Code', monospace" | "'Cascadia Code', monospace" | 'monospace'
  fontSize: number
  tabSize: 2 | 4
  wordWrap: 'on' | 'off'
  minimapEnabled: boolean
  autoSave: boolean
  compilerOptimizationLevel: 0 | 1 | 2
  strictTypeChecking: boolean
}

export interface SuggestedProblemFix {
  id: string
  severity: 'error' | 'warning'
  code: string
  message: string
  line: number
  column: number
  suggestedFix: string
  replacementSnippet?: string
}

interface StudioState {
  // Workspaces & Projects
  workspaces: StudioWorkspaceProject[]
  activeWorkspaceId: string
  recentSearches: string[]

  // Multi-Tab & Split Editor
  openTabs: StudioEditorTab[]
  activePolicyId: string
  secondaryPolicyId: string | null
  splitEditorEnabled: boolean
  cursorPosition: { lineNumber: number; column: number }
  encoding: 'UTF-8'

  // Layout & Sidebars
  leftSidebarCollapsed: boolean
  activeExplorerSection: StudioExplorerSection
  rightSidebarCollapsed: boolean
  activeRightTab: StudioRightTab
  bottomPanelCollapsed: boolean
  activeBottomTab: StudioBottomTab

  // Compiler phase inspector (OFF by default)
  developerMode: boolean
  developerPanelCollapsed: boolean
  activeDeveloperTab: StudioDeveloperTab

  // Modals & Overlays
  commandPaletteOpen: boolean
  globalSearchOpen: boolean
  settingsModalOpen: boolean
  versionModalOpen: boolean

  // Notifications, Logs & Terminal
  notifications: StudioNotification[]
  compilerOutputLines: string[]
  studioLogs: string[]
  terminalLines: string[]

  // Resilience / Error Handling Simulation
  backendOnline: boolean
  sessionExpired: boolean

  // IDE Settings
  settings: StudioSettings

  // Actions
  setActiveWorkspace: (workspaceId: string) => void
  openPolicyTab: (policyId: string, title: string) => void
  closePolicyTab: (policyId: string) => void
  updateTabSource: (policyId: string, source: string, isDirty?: boolean) => void
  markTabSaved: (policyId: string) => void
  toggleSplitEditor: (secondaryPolicyId?: string) => void
  setCursorPosition: (lineNumber: number, column: number) => void

  setLeftSidebarCollapsed: (collapsed: boolean) => void
  setActiveExplorerSection: (section: StudioExplorerSection) => void
  setRightSidebarCollapsed: (collapsed: boolean) => void
  setActiveRightTab: (tab: StudioRightTab) => void
  setBottomPanelCollapsed: (collapsed: boolean) => void
  setActiveBottomTab: (tab: StudioBottomTab) => void

  toggleDeveloperMode: () => void
  setDeveloperMode: (enabled: boolean) => void
  setDeveloperPanelCollapsed: (collapsed: boolean) => void
  setActiveDeveloperTab: (tab: StudioDeveloperTab) => void

  setCommandPaletteOpen: (open: boolean) => void
  setGlobalSearchOpen: (open: boolean) => void
  setSettingsModalOpen: (open: boolean) => void
  setVersionModalOpen: (open: boolean) => void

  addRecentSearch: (query: string) => void
  pushNotification: (
    type: StudioNotification['type'],
    title: string,
    message: string,
  ) => void
  markAllNotificationsRead: () => void
  appendCompilerOutput: (line: string) => void
  appendStudioLog: (line: string) => void
  runTerminalCommand: (cmd: string) => void

  updateSettings: (partial: Partial<StudioSettings>) => void
  toggleTheme: () => void
  setBackendOnline: (online: boolean) => void
  setSessionExpired: (expired: boolean) => void
}

const INITIAL_WORKSPACES: StudioWorkspaceProject[] = [
  {
    id: 'ws-fpl-project',
    name: 'FPL Compiler Project',
    description: 'Sample banking, insurance, payroll, tax, and compliance policies',
    folderFilter: null,
    lastOpenedAt: '2026-10-02T11:00:00.000Z',
  },
  {
    id: 'ws-retail-banking',
    name: 'Retail & Mortgage Underwriting',
    description: 'Consumer credit, personal loans, and mortgage underwriting policies',
    folderFilter: 'fld-banking',
    lastOpenedAt: '2026-10-02T09:30:00.000Z',
  },
  {
    id: 'ws-risk-compliance',
    name: 'AML & Fraud Detection Suite',
    description: 'High-velocity wire monitoring and anti-money-laundering policies',
    folderFilter: 'fld-risk',
    lastOpenedAt: '2026-10-01T18:15:00.000Z',
  },
  {
    id: 'ws-payroll-tax',
    name: 'Global Payroll & Statutory Tax',
    description: 'Compensation, executive bonuses, and withholding rules',
    folderFilter: 'fld-payroll-tax',
    lastOpenedAt: '2026-10-01T14:00:00.000Z',
  },
]

export const useStudioStore = create<StudioState>((set, get) => ({
  workspaces: INITIAL_WORKSPACES,
  activeWorkspaceId: 'ws-fpl-project',
  recentSearches: ['LoanApproval', 'creditScore >= 700', 'HighValueWireFraudGuard', 'interestRate'],

  openTabs: [
    { policyId: 'pol-loan-approval', title: 'LoanApproval.fpl', isDirty: false },
    { policyId: 'pol-fraud-guard', title: 'HighValueWireFraudGuard.fpl', isDirty: false },
  ],
  activePolicyId: 'pol-loan-approval',
  secondaryPolicyId: 'pol-fraud-guard',
  splitEditorEnabled: false,
  cursorPosition: { lineNumber: 1, column: 1 },
  encoding: 'UTF-8',

  leftSidebarCollapsed: false,
  activeExplorerSection: 'files',
  rightSidebarCollapsed: false,
  activeRightTab: 'properties',
  bottomPanelCollapsed: false,
  activeBottomTab: 'problems',

  // Compiler phase inspector is OFF by default
  developerMode: false,
  developerPanelCollapsed: false,
  activeDeveloperTab: 'pipeline',

  commandPaletteOpen: false,
  globalSearchOpen: false,
  settingsModalOpen: false,
  versionModalOpen: false,

  notifications: [
    {
      id: 'notif-1',
      type: 'COMPILATION_SUCCESS',
      title: 'Compilation Succeeded',
      message: 'LoanApproval.fpl compiled cleanly in 1.42 ms (0 errors, 0 warnings).',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 'notif-2',
      type: 'EXECUTION_SUCCESS',
      title: 'Policy Execution Completed',
      message: 'LoanApproval.fpl returned APPROVE (interestRate = 8.5%) in 0.38 ms.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ],

  compilerOutputLines: [
    '[FinPolicy Studio] Project initialized (UTF-8).',
    '[Compiler] Ready — Lexer → Parser → Semantic → IR → Optimizer → FPVM.',
  ],
  studioLogs: [
    `${new Date().toISOString()} [INFO] FinPolicy Studio IDE initialized`,
    `${new Date().toISOString()} [INFO] Loaded FPL compiler project`,
  ],
  terminalLines: [
    'FinPolicy Studio Integrated Terminal v1.0.0',
    'Type "help", "compile", "run", "status", or "clear".',
  ],

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

  setActiveWorkspace: (workspaceId) =>
    set((state) => ({
      activeWorkspaceId: workspaceId,
      studioLogs: [
        `${new Date().toISOString()} [WORKSPACE] Switched to workspace ${workspaceId}`,
        ...state.studioLogs,
      ],
    })),

  openPolicyTab: (policyId, title) =>
    set((state) => {
      const normalizedTitle = title.endsWith('.fpl') ? title : `${title}.fpl`
      const exists = state.openTabs.some((t) => t.policyId === policyId)
      return {
        openTabs: exists
          ? state.openTabs
          : [...state.openTabs, { policyId, title: normalizedTitle, isDirty: false }],
        activePolicyId: policyId,
      }
    }),

  closePolicyTab: (policyId) =>
    set((state) => {
      const remaining = state.openTabs.filter((t) => t.policyId !== policyId)
      if (remaining.length === 0) {
        return { openTabs: [], activePolicyId: '' }
      }
      const nextActive =
        state.activePolicyId === policyId
          ? remaining[remaining.length - 1].policyId
          : state.activePolicyId
      return {
        openTabs: remaining,
        activePolicyId: nextActive,
      }
    }),

  updateTabSource: (policyId, source, isDirty = true) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.policyId === policyId ? { ...t, unsavedSource: source, isDirty } : t,
      ),
    })),

  markTabSaved: (policyId) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.policyId === policyId ? { ...t, isDirty: false } : t,
      ),
    })),

  toggleSplitEditor: (secondaryPolicyId) =>
    set((state) => ({
      splitEditorEnabled: !state.splitEditorEnabled,
      secondaryPolicyId:
        secondaryPolicyId ??
        state.secondaryPolicyId ??
        state.openTabs.find((t) => t.policyId !== state.activePolicyId)?.policyId ??
        state.activePolicyId,
    })),

  setCursorPosition: (lineNumber, column) =>
    set({ cursorPosition: { lineNumber, column } }),

  setLeftSidebarCollapsed: (collapsed) => set({ leftSidebarCollapsed: collapsed }),
  setActiveExplorerSection: (section) =>
    set({ activeExplorerSection: section, leftSidebarCollapsed: false }),
  setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab, rightSidebarCollapsed: false }),
  setBottomPanelCollapsed: (collapsed) => set({ bottomPanelCollapsed: collapsed }),
  setActiveBottomTab: (tab) => set({ activeBottomTab: tab, bottomPanelCollapsed: false }),

  toggleDeveloperMode: () =>
    set((state) => {
      const next = !state.developerMode
      return {
        developerMode: next,
        developerPanelCollapsed: false,
        studioLogs: [
          `${new Date().toISOString()} [PHASES] Compiler phase view ${next ? 'ENABLED' : 'DISABLED'}`,
          ...state.studioLogs,
        ],
      }
    }),

  setDeveloperMode: (enabled) => set({ developerMode: enabled }),
  setDeveloperPanelCollapsed: (collapsed) => set({ developerPanelCollapsed: collapsed }),
  setActiveDeveloperTab: (tab) =>
    set({ activeDeveloperTab: tab, developerPanelCollapsed: false }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  setVersionModalOpen: (open) => set({ versionModalOpen: open }),

  addRecentSearch: (query) =>
    set((state) => {
      const trimmed = query.trim()
      if (!trimmed) return state
      return {
        recentSearches: [
          trimmed,
          ...state.recentSearches.filter((q) => q !== trimmed),
        ].slice(0, 8),
      }
    }),

  pushNotification: (type, title, message) =>
    set((state) => ({
      notifications: [
        {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type,
          title,
          message,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 25),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  appendCompilerOutput: (line) =>
    set((state) => ({
      compilerOutputLines: [...state.compilerOutputLines, line],
    })),

  appendStudioLog: (line) =>
    set((state) => ({
      studioLogs: [`${new Date().toISOString()} ${line}`, ...state.studioLogs],
    })),

  runTerminalCommand: (cmd) => {
    const trimmed = cmd.trim()
    const state = get()
    if (!trimmed) return
    if (trimmed.toLowerCase() === 'clear') {
      set({ terminalLines: [] })
      return
    }
    let reply = `Executed command: ${trimmed}`
    if (trimmed.toLowerCase() === 'help') {
      reply =
        'Available commands: compile (Ctrl+Shift+B) | run (F5) | status | version | clear'
    } else if (trimmed.toLowerCase() === 'status') {
      reply = `Active Policy: ${state.activePolicyId || 'None'} | Compiler Phases: ${state.developerMode ? 'ON' : 'OFF'} | Backend: ${state.backendOnline ? 'ONLINE' : 'OFFLINE'}`
    } else if (trimmed.toLowerCase() === 'version') {
      reply = 'FinPolicy Studio — Financial Policy Language compiler'
    }
    set({
      terminalLines: [...state.terminalLines, `$ ${trimmed}`, reply],
    })
  },

  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  toggleTheme: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        theme: state.settings.theme === 'dark' ? 'light' : 'dark',
      },
    })),

  setBackendOnline: (online) => set({ backendOnline: online }),
  setSessionExpired: (expired) => set({ sessionExpired: expired }),
}))
