/**
 * FinPolicy Studio — Top Navigation Bar
 * Focused compiler workspace navigation for editing, running, and inspecting FPL policies.
 */

import {
  Cpu,
  Search,
  TerminalSquare,
  FolderGit2,
} from 'lucide-react'
import { useStudioStore } from '@/stores/studio.store'

export function StudioTopNavigation() {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    developerMode,
    toggleDeveloperMode,
    setGlobalSearchOpen,
  } = useStudioStore()

  return (
    <header
      data-testid="studio-top-nav"
      className="flex h-12 shrink-0 items-center justify-between border-b border-[#D8DEE9] bg-white px-3 text-xs text-[#111827] select-none"
    >
      {/* Left: Brand Logo & Project Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold tracking-tight">FinPolicy Studio</span>
            <span className="ml-1.5 rounded bg-[#2563EB]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#2563EB]">
              Compiler
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#D8DEE9]" />

        {/* Project Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#D8DEE9] bg-[#F6F8FB] px-2.5 py-1 text-xs">
          <FolderGit2 className="h-3.5 w-3.5 text-[#2563EB]" />
          <select
            aria-label="Project Selector"
            value={activeWorkspaceId}
            onChange={(e) => setActiveWorkspace(e.target.value)}
            className="bg-transparent font-medium text-[#111827] focus:outline-none"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-white text-[#111827]">
                {ws.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Center: Quick Search */}
      <div className="hidden max-w-sm flex-1 items-center gap-2 px-4 md:flex">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          data-testid="studio-search-trigger"
          className="flex flex-1 items-center justify-between rounded-lg border border-[#D8DEE9] bg-[#F6F8FB] px-3 py-1.5 text-xs text-[#64748B] transition-colors hover:border-[#2563EB]"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#2563EB]" />
            Search policy code...
          </span>
          <kbd className="rounded border border-[#D8DEE9] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#64748B]">
            Ctrl+F
          </kbd>
        </button>
      </div>

      {/* Right: Compiler Phases */}
      <div className="flex items-center gap-2">
        {/* Compiler phase inspector toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={developerMode}
          data-testid="compiler-phases-toggle"
          onClick={toggleDeveloperMode}
          className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
            developerMode
              ? 'border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E]'
              : 'border-[#D8DEE9] bg-white text-[#64748B] hover:border-[#0F766E] hover:text-[#0F766E]'
          }`}
          title="Show compiler phases: lexer, parser, AST, semantic analysis, IR, optimizer, and VM trace"
        >
          <TerminalSquare
            className={`h-3.5 w-3.5 ${
              developerMode ? 'text-[#0F766E]' : 'text-[#64748B]'
            }`}
          />
          <span>Compiler Phases</span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
              developerMode
                ? 'bg-[#0F766E] text-white font-bold'
                : 'bg-[#F6F8FB] text-[#64748B]'
            }`}
          >
            {developerMode ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </header>
  )
}
export default StudioTopNavigation
