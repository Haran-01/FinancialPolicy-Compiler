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
  const { activeRightTab, setActiveRightTab } = useStudioStore()
  const { categories, folders, updatePolicy } = usePolicyWorkspaceStore()

  return (
    <aside
      data-testid="studio-right-sidebar"
      className="flex h-full flex-col border-l border-[#D8DEE9] bg-white text-xs text-[#111827] select-none"
    >
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 border-b border-[#D8DEE9] bg-[#F6F8FB] p-1">
        <button
          onClick={() => setActiveRightTab('properties')}
          data-testid="right-tab-properties"
          className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-colors ${
            activeRightTab === 'properties'
              ? 'bg-white text-[#2563EB]'
              : 'text-[#64748B] hover:text-[#111827]'
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
              ? 'bg-white text-[#059669]'
              : 'text-[#64748B] hover:text-[#111827]'
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
              <label className="mb-1 block text-[11px] font-semibold text-[#64748B]">
                Policy Name
              </label>
              <input
                type="text"
                value={policy.name}
                onChange={(e) =>
                  updatePolicy(policy.id, { name: e.target.value })
                }
                className="w-full rounded-lg border border-[#D8DEE9] bg-[#FBFCFE] px-2.5 py-1.5 font-mono text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#64748B]">
                Description
              </label>
              <textarea
                rows={3}
                value={policy.description}
                onChange={(e) =>
                  updatePolicy(policy.id, { description: e.target.value })
                }
                className="w-full rounded-lg border border-[#D8DEE9] bg-[#FBFCFE] px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#64748B]">
                Category
              </label>
              <select
                value={policy.categoryId}
                onChange={(e) =>
                  updatePolicy(policy.id, { categoryId: e.target.value })
                }
                className="w-full rounded-lg border border-[#D8DEE9] bg-[#FBFCFE] px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#64748B]">
                <Folder className="h-3 w-3 text-[#2563EB]" /> Folder
              </label>
              <select
                value={policy.folderId ?? ''}
                onChange={(e) =>
                  updatePolicy(policy.id, {
                    folderId: e.target.value || null,
                  })
                }
                className="w-full rounded-lg border border-[#D8DEE9] bg-[#FBFCFE] px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2563EB] focus:outline-none"
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
                <div className="rounded-xl border border-[#D8DEE9] bg-[#FBFCFE] p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#64748B]">
                    Policy Name
                  </div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-[#111827]">
                    {lastExecution.policyName}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#D8DEE9] pt-3">
                    <span className="text-[#64748B]">Decision</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                        lastExecution.decision === 'APPROVE'
                          ? 'bg-[#059669]/10 text-[#059669]'
                          : 'bg-[#DC2626]/10 text-[#DC2626]'
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
                    <span className="text-[#64748B]">Execution Time</span>
                    <span className="font-mono font-semibold text-[#111827]">
                      {lastExecution.executionTimeMs} ms
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[#64748B]">Status</span>
                    <span className="font-mono font-semibold text-[#059669]">
                      {lastExecution.status}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#D8DEE9] bg-[#FBFCFE] p-3.5">
                  <div className="mb-2 text-[11px] font-semibold text-[#64748B]">
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
                          className="flex items-center justify-between rounded bg-white px-2.5 py-1.5"
                        >
                          <span className="text-[#2563EB]">{k}</span>
                          <span className="font-bold text-[#D97706]">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-[#D8DEE9] bg-[#FBFCFE] p-6 text-center text-[#64748B]">
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
