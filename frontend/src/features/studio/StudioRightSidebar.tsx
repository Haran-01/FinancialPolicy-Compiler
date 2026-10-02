/**
 * FinPolicy Studio — Right Sidebar
 * Tabs: policy details and latest run result.
 */

import {
  Sliders,
  CheckCircle2,
  XCircle,
  Play,
  Folder,
} from 'lucide-react'
import { useStudioStore } from '@/stores/studio.store'
import {
  usePolicyWorkspaceStore,
  WorkspacePolicy,
  WorkspaceExecutionRecord,
} from '@/stores/policy-workspace.store'

interface StudioRightSidebarProps {
  policy: WorkspacePolicy | undefined
  lastExecution: WorkspaceExecutionRecord | null
}

export function StudioRightSidebar({
  policy,
  lastExecution,
}: StudioRightSidebarProps) {
  const { activeRightTab, setActiveRightTab, settings } = useStudioStore()
  const { categories, folders, updatePolicy } = usePolicyWorkspaceStore()

  const isLight = settings.theme === 'light'

  return (
    <aside
      data-testid="studio-right-sidebar"
      className={`flex h-full flex-col border-l text-xs select-none ${
        isLight
          ? 'border-slate-200 bg-slate-50 text-slate-800'
          : 'border-[#2D3148] bg-[#141722] text-[#CBD5E1]'
      }`}
    >
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 border-b border-[#2D3148] bg-[#0F1117]/60 p-1">
        <button
          onClick={() => setActiveRightTab('properties')}
          data-testid="right-tab-properties"
          className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-colors ${
            activeRightTab === 'properties'
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-[#64748B] hover:text-white'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Policy</span>
        </button>

        <button
          onClick={() => setActiveRightTab('results')}
          data-testid="right-tab-results"
          className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-colors ${
            activeRightTab === 'results'
              ? 'bg-emerald-600/20 text-emerald-400'
              : 'text-[#64748B] hover:text-white'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Run Result</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {!policy ? (
          <div className="py-10 text-center text-[#64748B]">
            No active policy selected. Choose a policy from the file list.
          </div>
        ) : activeRightTab === 'properties' ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#94A3B8]">
                Policy Name
              </label>
              <input
                type="text"
                value={policy.name}
                onChange={(e) =>
                  updatePolicy(policy.id, { name: e.target.value })
                }
                className="w-full rounded-lg border border-[#2D3148] bg-[#0F1117] px-2.5 py-1.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#94A3B8]">
                Description
              </label>
              <textarea
                rows={3}
                value={policy.description}
                onChange={(e) =>
                  updatePolicy(policy.id, { description: e.target.value })
                }
                className="w-full rounded-lg border border-[#2D3148] bg-[#0F1117] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#94A3B8]">
                Category
              </label>
              <select
                value={policy.categoryId}
                onChange={(e) =>
                  updatePolicy(policy.id, { categoryId: e.target.value })
                }
                className="w-full rounded-lg border border-[#2D3148] bg-[#0F1117] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#94A3B8]">
                <Folder className="h-3 w-3 text-blue-400" /> Folder
              </label>
              <select
                value={policy.folderId ?? ''}
                onChange={(e) =>
                  updatePolicy(policy.id, {
                    folderId: e.target.value || null,
                  })
                }
                className="w-full rounded-lg border border-[#2D3148] bg-[#0F1117] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Project Root</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* EXECUTION RESULTS PANEL */
          <div data-testid="execution-results-panel" className="space-y-3.5">
            {lastExecution ? (
              <>
                <div className="rounded-xl border border-[#2D3148] bg-[#0F1117] p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#64748B]">
                    Policy Name
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-white">
                    {lastExecution.policyName}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#2D3148] pt-3">
                    <span className="text-[#94A3B8]">Decision</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                        lastExecution.decision === 'APPROVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {lastExecution.decision === 'APPROVE' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {lastExecution.decision}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[#94A3B8]">Execution Time</span>
                    <span className="font-mono font-semibold text-white">
                      {lastExecution.executionTimeMs} ms
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[#94A3B8]">Status</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {lastExecution.status}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2D3148] bg-[#0F1117] p-3.5">
                  <div className="mb-2 text-[11px] font-semibold text-[#94A3B8]">
                    Output Values
                  </div>
                  {Object.keys(lastExecution.outputs).length === 0 ? (
                    <p className="text-[11px] text-[#64748B]">
                      No explicit output fields returned.
                    </p>
                  ) : (
                    <div className="space-y-1.5 font-mono text-xs">
                      {Object.entries(lastExecution.outputs).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between rounded bg-[#1A1D27] px-2.5 py-1.5"
                        >
                          <span className="text-blue-400">{k}</span>
                          <span className="font-bold text-amber-300">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-[#2D3148] bg-[#0F1117]/60 p-6 text-center text-[#64748B]">
                Run the current policy to view its decision, outputs, time, and status.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
export default StudioRightSidebar
