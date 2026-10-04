/**
 * FinPolicy Studio — Modals & Overlays
 * Includes focused project search for policies and FPL source.
 */

import { useState } from 'react'
import {
  Search,
  X,
  Clock,
  FileCode2,
} from 'lucide-react'
import { useStudioStore } from '@/stores/studio.store'
import { usePolicyWorkspaceStore } from '@/stores/policy-workspace.store'

interface StudioModalsProps {
  onSave?: () => void
  onCompile?: () => void
  onExecute?: () => void
  onFormat?: () => void
}

export function StudioModals(_: StudioModalsProps) {
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    recentSearches,
    addRecentSearch,
    openPolicyTab,
  } = useStudioStore()

  const { policies } = usePolicyWorkspaceStore()

  const [searchQuery, setSearchQuery] = useState('')

  const searchMatches = policies.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.sourceCode.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  return (
    <>
      {/* Policy/source search modal */}
      {globalSearchOpen && (
        <div
          data-testid="studio-global-search-modal"
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#111827]/35 pt-20 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[#D8DEE9] bg-white">
            <div className="flex items-center gap-2 border-b border-[#D8DEE9] px-4 py-3">
              <Search className="h-4 w-4 text-[#2563EB]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    addRecentSearch(searchQuery)
                  }
                }}
                placeholder="Search policies, source code, symbols, and tags..."
                className="flex-1 bg-transparent text-xs text-[#111827] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setGlobalSearchOpen(false)}
                className="text-[#64748B] hover:text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 text-xs">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <Clock className="h-3 w-3" /> Recent Searches:
                {recentSearches.map((rs) => (
                  <button
                    key={rs}
                    onClick={() => setSearchQuery(rs)}
                    className="rounded bg-[#F6F8FB] px-2 py-0.5 text-[#64748B] hover:text-[#111827]"
                  >
                    {rs}
                  </button>
                ))}
              </div>

              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {searchMatches.map((pol) => (
                  <button
                    key={pol.id}
                    onClick={() => {
                      if (searchQuery.trim()) addRecentSearch(searchQuery)
                      openPolicyTab(pol.id, pol.name)
                      setGlobalSearchOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-[#D8DEE9] bg-[#FBFCFE] px-3 py-2 text-left hover:border-[#2563EB]"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-[#2563EB]" />
                      <div>
                        <div className="font-mono font-semibold text-[#111827]">
                          {pol.name}.fpl
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {pol.description}
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] text-[#64748B]">
                      {pol.categoryName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default StudioModals
