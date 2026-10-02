/**
 * FinPolicy Studio — Bottom Panel
 * Tabs: Compile diagnostics, compiler output, run result, logs, and terminal.
 */

import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Terminal,
  Play,
  FileText,
  ScrollText,
  ChevronDown,
  ChevronUp,
  Wrench,
  CheckCircle2,
} from 'lucide-react'
import {
  useStudioStore,
  StudioBottomTab,
  SuggestedProblemFix,
} from '@/stores/studio.store'
import {
  WorkspaceCompilationRecord,
  WorkspaceExecutionRecord,
} from '@/stores/policy-workspace.store'

interface StudioBottomPanelProps {
  problems: SuggestedProblemFix[]
  lastCompile: WorkspaceCompilationRecord | null
  lastExecution: WorkspaceExecutionRecord | null
  runtimeInputsJson: string
  onRuntimeInputsChange: (json: string) => void
  onNavigateToLine: (line: number, column: number) => void
  onExecuteNow: () => void
  onCompileNow: () => void
}

export function StudioBottomPanel({
  problems,
  lastExecution,
  runtimeInputsJson,
  onRuntimeInputsChange,
  onNavigateToLine,
  onExecuteNow,
  onCompileNow,
}: StudioBottomPanelProps) {
  const {
    activeBottomTab,
    setActiveBottomTab,
    bottomPanelCollapsed,
    setBottomPanelCollapsed,
    compilerOutputLines,
    studioLogs,
    terminalLines,
    runTerminalCommand,
    settings,
  } = useStudioStore()

  const [terminalInput, setTerminalInput] = useState('')
  const isLight = settings.theme === 'light'

  const errorCount = problems.filter((p) => p.severity === 'error').length
  const warningCount = problems.filter((p) => p.severity === 'warning').length

  const tabs: Array<{
    id: StudioBottomTab
    label: string
    icon: React.ElementType
    badge?: number
  }> = [
    {
      id: 'problems',
      label: 'Diagnostics',
      icon: AlertCircle,
      badge: problems.length,
    },
    { id: 'output', label: 'Compiler Trace', icon: FileText },
    { id: 'execution', label: 'Run Result', icon: Play },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
  ]

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = terminalInput.trim()
    if (!cmd) return
    if (cmd.toLowerCase() === 'compile') {
      onCompileNow()
    } else if (cmd.toLowerCase() === 'run') {
      onExecuteNow()
    }
    runTerminalCommand(cmd)
    setTerminalInput('')
  }

  return (
    <section
      data-testid="studio-bottom-panel"
      className={`flex h-full flex-col border-t text-xs ${
        isLight
          ? 'border-slate-200 bg-white text-slate-800'
          : 'border-[#2D3148] bg-[#11141E] text-[#CBD5E1]'
      }`}
    >
      {/* Tab Header Bar */}
      <div className="flex items-center justify-between border-b border-[#2D3148] bg-[#161926] px-3 py-1">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeBottomTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveBottomTab(tab.id)}
                data-testid={`bottom-tab-${tab.id}`}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-600/20 font-semibold text-blue-400'
                    : 'text-[#94A3B8] hover:bg-[#222536] hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      errorCount > 0
                        ? 'bg-red-500/20 text-red-400'
                        : warningCount > 0
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-[#222536] text-[#94A3B8]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
          className="rounded p-1 text-[#94A3B8] hover:bg-[#222536] hover:text-white"
          title={bottomPanelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {bottomPanelCollapsed ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Panel Body */}
      {!bottomPanelCollapsed && (
        <div className="flex-1 overflow-y-auto p-3">
          {/* 1. PROBLEMS PANEL */}
          {activeBottomTab === 'problems' && (
            <div data-testid="problems-panel-content" className="space-y-2">
              {problems.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    No compiler diagnostics. The policy is ready to run.
                  </span>
                </div>
              ) : (
                problems.map((prob) => (
                  <div
                    key={prob.id}
                    onClick={() => onNavigateToLine(prob.line, prob.column)}
                    className="flex cursor-pointer flex-col justify-between gap-2 rounded-lg border border-[#2D3148] bg-[#1A1D27] px-3 py-2 transition-colors hover:border-blue-500/50 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-2.5">
                      {prob.severity === 'error' ? (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#F1F5F9]">
                            [{prob.code}] {prob.message}
                          </span>
                          <span className="rounded bg-[#0F1117] px-1.5 py-0.5 font-mono text-[10px] text-blue-400">
                            Ln {prob.line}, Col {prob.column}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
                          <Wrench className="h-3 w-3" />
                          <span>Hint: {prob.suggestedFix}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#64748B]">
                      Click to navigate →
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. COMPILER OUTPUT */}
          {activeBottomTab === 'output' && (
            <div
              data-testid="compiler-output-content"
              className="space-y-1 rounded-lg border border-[#2D3148] bg-[#0B0D14] p-3 font-mono text-[11px]"
            >
              {compilerOutputLines.map((line, i) => (
                <div key={i} className="text-[#CBD5E1]">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* 3. EXECUTION CONSOLE */}
          {activeBottomTab === 'execution' && (
            <div
              data-testid="execution-console-content"
              className="grid grid-cols-1 gap-3 lg:grid-cols-12"
            >
              <div className="lg:col-span-5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#94A3B8]">
                    Input Data (JSON)
                  </span>
                  <button
                    onClick={onExecuteNow}
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-500"
                  >
                    <Play className="h-3 w-3" /> Run FPVM
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={runtimeInputsJson}
                  onChange={(e) => onRuntimeInputsChange(e.target.value)}
                  className="w-full rounded-lg border border-[#2D3148] bg-[#0B0D14] p-2.5 font-mono text-[11px] text-[#F1F5F9] focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="lg:col-span-7">
                {lastExecution ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-2.5">
                        <span className="text-[10px] text-[#64748B]">Decision</span>
                        <p
                          className={`mt-0.5 font-mono text-sm font-bold ${
                            lastExecution.decision === 'APPROVE'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {lastExecution.decision}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-2.5">
                        <span className="text-[10px] text-[#64748B]">
                          Execution Time
                        </span>
                        <p className="mt-0.5 font-mono font-bold text-[#F1F5F9]">
                          {lastExecution.executionTimeMs} ms
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-2.5">
                        <span className="text-[10px] text-[#64748B]">Memory Usage</span>
                        <p className="mt-0.5 font-mono font-bold text-cyan-400">
                          {lastExecution.memoryUsageBytes} Bytes
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-2.5">
                        <span className="text-[10px] text-[#64748B]">
                          Run Status
                        </span>
                        <p className="mt-0.5 font-mono font-bold text-emerald-400">
                          {lastExecution.status}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-2.5 font-mono text-[11px]">
                      <span className="text-[#94A3B8]">Inputs, variables, and outputs: </span>
                      <span className="text-amber-300">
                        {JSON.stringify(lastExecution.variables)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-[#2D3148] bg-[#1A1D27]/50 p-4 text-[#64748B]">
                    Press Run to execute the policy on the FPVM and inspect the decision, outputs, and trace.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. LOGS */}
          {activeBottomTab === 'logs' && (
            <div className="space-y-1 rounded-lg border border-[#2D3148] bg-[#0B0D14] p-3 font-mono text-[11px]">
              {studioLogs.map((log, idx) => (
                <div key={idx} className="text-[#94A3B8]">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* 5. TERMINAL */}
          {activeBottomTab === 'terminal' && (
            <div className="flex h-full flex-col rounded-lg border border-[#2D3148] bg-[#0B0D14] p-3 font-mono text-[11px]">
              <div className="flex-1 space-y-1 overflow-y-auto">
                {terminalLines.map((line, idx) => (
                  <div key={idx} className="text-emerald-400">
                    {line}
                  </div>
                ))}
              </div>
              <form onSubmit={handleTerminalSubmit} className="mt-2 flex items-center gap-2 border-t border-[#2D3148] pt-2">
                <span className="text-blue-400">fpl-studio$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Enter command (compile, run, status, clear)..."
                  className="flex-1 bg-transparent text-white focus:outline-none"
                />
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
export default StudioBottomPanel
