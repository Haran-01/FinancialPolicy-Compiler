/**
 * FinPolicy Studio — Editor Tabs, Breadcrumbs & Action Toolbar
 * Provides Multiple Tabs, Breadcrumb Navigation, Split Editor Toggle, Minimap Toggle,
 * Word Wrap Toggle, Go To Line, Find & Replace, Undo, Redo, Save (Ctrl+S),
 * Compile (Ctrl+Shift+B), Execute (F5), and Format.
 */

import {
  Save,
  Cpu,
  Play,
  Wand2,
  Undo2,
  Redo2,
  X,
  FileCode2,
  Map,
  WrapText,
  SearchCode,
  Hash,
  ChevronRight,
  Folder,
} from 'lucide-react'
import { useStudioStore } from '@/stores/studio.store'

interface StudioEditorToolbarProps {
  folderName?: string
  policyVersion?: number
  onSave: () => void
  onCompile: () => void
  onExecute: () => void
  onFormat: () => void
  onUndo: () => void
  onRedo: () => void
  onGoToLine?: () => void
  onFindReplace?: () => void
}

export function StudioEditorToolbar({
  folderName = 'Retail Banking',
  policyVersion = 1,
  onSave,
  onCompile,
  onExecute,
  onFormat,
  onUndo,
  onRedo,
  onGoToLine,
  onFindReplace,
}: StudioEditorToolbarProps) {
  const {
    workspaces,
    activeWorkspaceId,
    openTabs,
    activePolicyId,
    openPolicyTab,
    closePolicyTab,
    settings,
    updateSettings,
  } = useStudioStore()

  const isLight = settings.theme === 'light'
  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0]
  const activeTab = openTabs.find((t) => t.policyId === activePolicyId)

  return (
    <div
      data-testid="studio-editor-toolbar"
      role="toolbar"
      aria-label="FinPolicy Studio Editor Toolbar"
      className={`flex flex-col border-b select-none ${
        isLight
          ? 'border-slate-200 bg-slate-100 text-slate-800'
          : 'border-[#2D3148] bg-[#141722] text-[#CBD5E1]'
      }`}
    >
      {/* Top Row: Open Policy File Tabs & Editor View Controls */}
      <div className="flex items-center justify-between border-b border-[#2D3148]/70 px-2">
        <div
          role="tablist"
          aria-label="Open Policy Files"
          className="flex flex-1 items-center gap-1 overflow-x-auto py-1"
        >
          {openTabs.map((tab) => {
            const isActive = tab.policyId === activePolicyId
            return (
              <div
                key={tab.policyId}
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                onClick={() => openPolicyTab(tab.policyId, tab.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    openPolicyTab(tab.policyId, tab.title)
                  }
                }}
                className={`group flex cursor-pointer items-center gap-2 rounded-t-md border-b-2 px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-[#1A1D27] font-semibold text-white'
                    : 'border-transparent text-[#94A3B8] hover:bg-[#1A1D27]/50 hover:text-white'
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono">{tab.title}</span>
                {tab.isDirty && (
                  <span
                    title="Unsaved changes"
                    aria-label="Unsaved changes"
                    className="h-2 w-2 rounded-full bg-amber-400"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closePolicyTab(tab.policyId)
                  }}
                  aria-label={`Close ${tab.title}`}
                  className="rounded p-0.5 text-[#64748B] hover:bg-[#2D3148] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Minimap & Word Wrap Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              updateSettings({ minimapEnabled: !settings.minimapEnabled })
            }
            aria-label="Toggle Minimap"
            title="Toggle Minimap"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
              settings.minimapEnabled
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-[#94A3B8] hover:bg-[#222536] hover:text-white'
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Minimap</span>
          </button>

          <button
            onClick={() =>
              updateSettings({
                wordWrap: settings.wordWrap === 'on' ? 'off' : 'on',
              })
            }
            aria-label="Toggle Word Wrap"
            title="Toggle Word Wrap"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
              settings.wordWrap === 'on'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-[#94A3B8] hover:bg-[#222536] hover:text-white'
            }`}
          >
            <WrapText className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Wrap</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <nav
        aria-label="Breadcrumb"
        data-testid="studio-breadcrumbs"
        className="flex items-center justify-between border-b border-[#2D3148]/50 bg-[#0F121C] px-3 py-1 text-[11px] text-[#94A3B8]"
      >
        <div className="flex items-center gap-1.5">
          <span>{activeWorkspace.name}</span>
          <ChevronRight className="h-3 w-3 text-[#475569]" />
          <span className="flex items-center gap-1">
            <Folder className="h-3 w-3 text-blue-400" />
            {folderName}
          </span>
          <ChevronRight className="h-3 w-3 text-[#475569]" />
          <span className="font-mono font-semibold text-[#F1F5F9]">
            {activeTab?.title ?? 'No Active File'}
          </span>
          <ChevronRight className="h-3 w-3 text-[#475569]" />
          <span className="rounded bg-blue-500/15 px-1.5 py-0.2 font-mono text-[10px] text-blue-400">
            v{policyVersion}.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onGoToLine && (
            <button
              onClick={onGoToLine}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[#94A3B8] hover:bg-[#222536] hover:text-white"
              title="Go To Line (Ctrl+G)"
            >
              <Hash className="h-3 w-3 text-cyan-400" />
              Go to Line
            </button>
          )}
          {onFindReplace && (
            <button
              onClick={onFindReplace}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[#94A3B8] hover:bg-[#222536] hover:text-white"
              title="Find & Replace (Ctrl+H)"
            >
              <SearchCode className="h-3 w-3 text-purple-400" />
              Find & Replace
            </button>
          )}
        </div>
      </nav>

      {/* Third Row: Primary IDE Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onSave}
            data-testid="studio-save-btn"
            aria-label="Save Policy"
            title="Save Policy (Ctrl+S)"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 font-semibold text-white hover:bg-blue-500"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={onCompile}
            data-testid="studio-compile-btn"
            aria-label="Compile Policy"
            title="Compile Policy (Ctrl+Shift+B)"
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 font-semibold text-blue-300 hover:bg-blue-500/25"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Compile</span>
          </button>

          <button
            onClick={onExecute}
            data-testid="studio-execute-btn"
            aria-label="Execute Policy"
            title="Execute Policy (F5)"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-300 hover:bg-emerald-500/25"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Execute</span>
          </button>

          <div className="mx-1 h-4 w-px bg-[#2D3148]" />

          <button
            onClick={onUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            className="rounded-md border border-[#2D3148] bg-[#0F1117] p-1 text-[#94A3B8] hover:text-white"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
            className="rounded-md border border-[#2D3148] bg-[#0F1117] p-1 text-[#94A3B8] hover:text-white"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onFormat}
            data-testid="studio-format-btn"
            aria-label="Format Policy"
            title="Format Policy Code"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#2D3148] bg-[#0F1117] px-2.5 py-1 text-[#CBD5E1] hover:bg-[#222536]"
          >
            <Wand2 className="h-3.5 w-3.5 text-purple-400" />
            <span>Format</span>
          </button>
        </div>

        <div className="text-[11px] text-[#64748B]">
          Financial policy language to compiler pipeline
        </div>
      </div>
    </div>
  )
}
export default StudioEditorToolbar
