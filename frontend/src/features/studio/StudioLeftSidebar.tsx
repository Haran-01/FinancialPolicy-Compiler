/**
 * FinPolicy Studio — Left Sidebar
 * Focused project explorer for creating, importing, opening, and organizing FPL files.
 */

import React, { useState, useRef } from 'react'
import {
  Folder,
  FolderOpen,
  FileCode2,
  Plus,
  Upload,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronDown,
  FolderPlus,
} from 'lucide-react'
import { useStudioStore } from '@/stores/studio.store'
import { usePolicyWorkspaceStore, WorkspacePolicy } from '@/stores/policy-workspace.store'
import { toast } from 'sonner'

export function StudioLeftSidebar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const {
    activePolicyId,
    openPolicyTab,
    closePolicyTab,
    settings,
    pushNotification,
  } = useStudioStore()

  const {
    policies,
    folders,
    createPolicy,
    renamePolicy,
    deletePolicy,
    movePolicyToFolder,
    createFolder,
    importFplFile,
  } = usePolicyWorkspaceStore()

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'fld-banking': true,
    'fld-risk': true,
    'fld-payroll-tax': true,
    'fld-education': true,
  })
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newFolderInput, setNewFolderInput] = useState('')
  const [showFolderInput, setShowFolderInput] = useState(false)

  const activePolicies = policies.filter((p) => !p.isArchived)
  const isLight = settings.theme === 'light'

  const handleOpenPolicy = (pol: WorkspacePolicy) => {
    openPolicyTab(pol.id, pol.name)
  }

  const handleCreateNewPolicy = () => {
    const created = createPolicy({
      name: `Policy_${activePolicies.length + 1}`,
      description: 'Created in FinPolicy Studio IDE',
      folderId: 'fld-banking',
    })
    openPolicyTab(created.id, created.name)
    pushNotification(
      'POLICY_SAVED',
      'New Policy Created',
      `Created ${created.name}.fpl in Project Explorer.`,
    )
    toast.success(`Created ${created.name}.fpl`)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result ?? '')
      const imported = importFplFile(file.name, content)
      openPolicyTab(imported.id, imported.name)
      toast.success(`Imported ${imported.name}.fpl`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <aside
      data-testid="studio-left-sidebar"
      className={`flex h-full flex-col border-r text-xs select-none ${
        isLight
          ? 'border-slate-200 bg-slate-50 text-slate-800'
          : 'border-[#2D3148] bg-[#141722] text-[#CBD5E1]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".fpl,.txt"
        onChange={handleImport}
        className="hidden"
      />

      {/* Quick File Actions Toolbar */}
      <div className="flex items-center justify-between border-b border-[#2D3148] px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          Policy Files
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateNewPolicy}
            title="New Policy"
            data-testid="studio-new-policy-btn"
            className="rounded p-1 text-[#94A3B8] hover:bg-[#222536] hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowFolderInput((v) => !v)}
            title="New Folder"
            className="rounded p-1 text-[#94A3B8] hover:bg-[#222536] hover:text-white"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import .fpl File"
            className="rounded p-1 text-[#94A3B8] hover:bg-[#222536] hover:text-white"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showFolderInput && (
        <div className="flex items-center gap-1.5 border-b border-[#2D3148] px-3 py-2">
          <input
            type="text"
            value={newFolderInput}
            onChange={(e) => setNewFolderInput(e.target.value)}
            placeholder="New folder name..."
            className="flex-1 rounded border border-[#2D3148] bg-[#0F1117] px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => {
              if (newFolderInput.trim()) {
                createFolder(newFolderInput.trim(), null)
                setNewFolderInput('')
                setShowFolderInput(false)
                toast.success('Folder created')
              }
            }}
            className="rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white"
          >
            Add
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1.5">
            {folders.map((folder) => {
              const isOpen = expandedFolders[folder.id] ?? true
              const folderPolicies = activePolicies.filter(
                (p) => p.folderId === folder.id,
              )

              return (
                <div key={folder.id}>
                  <button
                    onClick={() =>
                      setExpandedFolders((prev) => ({
                        ...prev,
                        [folder.id]: !isOpen,
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs font-medium text-[#CBD5E1] hover:bg-[#222536]"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
                      )}
                      {isOpen ? (
                        <FolderOpen
                          className="h-3.5 w-3.5"
                          style={{ color: folder.color }}
                        />
                      ) : (
                        <Folder
                          className="h-3.5 w-3.5"
                          style={{ color: folder.color }}
                        />
                      )}
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {folderPolicies.length}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[#2D3148]/60 pl-2">
                      {folderPolicies.map((pol) => {
                        const isSelected = pol.id === activePolicyId
                        return (
                          <div
                            key={pol.id}
                            className={`group flex items-center justify-between rounded-md px-2 py-1 transition-colors ${
                              isSelected
                                ? 'bg-blue-600/20 font-semibold text-blue-400'
                                : 'text-[#94A3B8] hover:bg-[#222536] hover:text-white'
                            }`}
                          >
                            {renamingId === pol.id ? (
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && renameValue.trim()) {
                                    renamePolicy(pol.id, renameValue.trim())
                                    setRenamingId(null)
                                    toast.success('Policy renamed')
                                  }
                                  if (e.key === 'Escape') setRenamingId(null)
                                }}
                                onBlur={() => setRenamingId(null)}
                                className="w-full rounded border border-blue-500 bg-[#0F1117] px-1.5 py-0.5 font-mono text-xs text-white"
                                autoFocus
                              />
                            ) : (
                              <button
                                onClick={() => handleOpenPolicy(pol)}
                                className="flex flex-1 items-center gap-1.5 truncate text-left"
                              >
                                <FileCode2 className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                <span className="truncate font-mono">
                                  {pol.name}.fpl
                                </span>
                              </button>
                            )}

                            {/* Inline File Actions */}
                            <div className="hidden items-center gap-0.5 group-hover:flex">
                              <button
                                onClick={() => {
                                  setRenamingId(pol.id)
                                  setRenameValue(pol.name)
                                }}
                                title="Rename"
                                className="rounded p-0.5 text-[#94A3B8] hover:text-white"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  const nextFolder =
                                    folders.find((f) => f.id !== pol.folderId) ??
                                    folders[0]
                                  movePolicyToFolder(pol.id, nextFolder.id)
                                  toast.success(
                                    `Moved ${pol.name}.fpl to ${nextFolder.name}`,
                                  )
                                }}
                                title="Move to Next Folder"
                                className="rounded p-0.5 text-[#94A3B8] hover:text-amber-400"
                              >
                                <Folder className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  closePolicyTab(pol.id)
                                  deletePolicy(pol.id, false)
                                  toast.success(`Deleted ${pol.name}.fpl`)
                                }}
                                title="Delete"
                                className="rounded p-0.5 text-[#94A3B8] hover:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      </div>
    </aside>
  )
}
export default StudioLeftSidebar
