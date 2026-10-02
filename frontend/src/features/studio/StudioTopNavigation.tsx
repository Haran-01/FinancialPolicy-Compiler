/**
 * FinPolicy Studio — Top Navigation Bar
 * Focused compiler workspace navigation for editing, running, and inspecting FPL policies.
 */

import {
  Cpu,
  Search,
  Sun,
  Moon,
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
    settings,
    toggleTheme,
    setGlobalSearchOpen,
  } = useStudioStore()

  const isLight = settings.theme === 'light'

  return (
    <header
      data-testid="studio-top-nav"
      className={`flex h-12 shrink-0 items-center justify-between border-b px-3 text-xs select-none ${
        isLight
          ? 'border-slate-200 bg-white text-slate-800'
          : 'border-[#2D3148] bg-[#131620] text-[#F1F5F9]'
      }`}
    >
      {/* Left: Brand Logo & Project Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold tracking-tight">FinPolicy Studio</span>
            <span className="ml-1.5 rounded bg-blue-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-400">
              Compiler
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#2D3148]" />

        {/* Project Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#2D3148] bg-[#1A1D27]/80 px-2.5 py-1 text-xs">
          <FolderGit2 className="h-3.5 w-3.5 text-blue-400" />
          <select
            aria-label="Project Selector"
            value={activeWorkspaceId}
            onChange={(e) => setActiveWorkspace(e.target.value)}
            className="bg-transparent font-medium text-[#F1F5F9] focus:outline-none"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-[#1A1D27] text-white">
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
          className={`flex flex-1 items-center justify-between rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isLight
              ? 'border-slate-300 bg-slate-100 text-slate-600 hover:border-blue-500'
              : 'border-[#2D3148] bg-[#0F1117] text-[#94A3B8] hover:border-blue-500/60 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-blue-400" />
            Search policy code...
          </span>
          <kbd className="rounded border border-[#2D3148] bg-[#1A1D27] px-1.5 py-0.5 font-mono text-[10px] text-[#94A3B8]">
            Ctrl+F
          </kbd>
        </button>
      </div>

      {/* Right: Compiler Phases & Theme */}
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
              ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
              : 'border-[#2D3148] bg-[#1A1D27] text-[#94A3B8] hover:text-white'
          }`}
          title="Show compiler phases: lexer, parser, AST, semantic analysis, IR, optimizer, and VM trace"
        >
          <TerminalSquare
            className={`h-3.5 w-3.5 ${
              developerMode ? 'text-amber-400' : 'text-[#64748B]'
            }`}
          />
          <span>Compiler Phases</span>
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
              developerMode
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-[#0F1117] text-[#64748B]'
            }`}
          >
            {developerMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Theme Switch */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          data-testid="studio-theme-toggle"
          className="rounded-lg border border-[#2D3148] bg-[#1A1D27] p-1.5 text-[#CBD5E1] hover:text-white"
          title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
        >
          {isLight ? (
            <Moon className="h-3.5 w-3.5 text-slate-700" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          )}
        </button>
      </div>
    </header>
  )
}
export default StudioTopNavigation
