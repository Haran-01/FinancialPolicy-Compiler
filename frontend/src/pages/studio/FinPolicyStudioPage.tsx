/**
 * FinPolicy Studio — FPL Compiler IDE Page
 * Complete desktop-style IDE for Financial Policy Language (FPL).
 * Compiler internals remain hidden unless Compiler Phases is enabled.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { WifiOff, ShieldAlert, FileWarning, Plus } from 'lucide-react'
import { registerFplLanguage } from '@/lib/fpl-language'
import { analyzeFplSemantics } from '@/lib/fpl-semantic-engine'
import {
  useStudioStore,
  SuggestedProblemFix,
} from '@/stores/studio.store'
import {
  usePolicyWorkspaceStore,
  formatFplPolicyCode,
  WorkspaceCompilationRecord,
  WorkspaceExecutionRecord,
} from '@/stores/policy-workspace.store'
import StudioTopNavigation from '@/features/studio/StudioTopNavigation'
import StudioLeftSidebar from '@/features/studio/StudioLeftSidebar'
import StudioEditorToolbar from '@/features/studio/StudioEditorToolbar'
import StudioBottomPanel from '@/features/studio/StudioBottomPanel'
import StudioRightSidebar from '@/features/studio/StudioRightSidebar'
import StudioDeveloperPanel from '@/features/studio/StudioDeveloperPanel'
import StudioStatusBar from '@/features/studio/StudioStatusBar'
import StudioModals from '@/features/studio/StudioModals'
import { compilerService, type CompileResponse, type RunResponse } from '@/services/compiler.service'
import { toast } from 'sonner'

function tacFromBackend(result: CompileResponse): string {
  return (
    result.ir?.prettyPrintedTAC ||
    result.ir?.threeAddressCode?.map((line) => line.text ?? '').join('\n') ||
    ''
  )
}

function optimizedTacFromBackend(result: CompileResponse): string {
  return (
    result.optimization?.optimizedProgram?.prettyPrintedTAC ||
    result.optimization?.optimizedProgram?.threeAddressCode
      ?.map((line) => line.text ?? '')
      .join('\n') ||
    tacFromBackend(result)
  )
}

export function FinPolicyStudioPage() {
  const monaco = useMonaco()
  const primaryEditorRef = useRef<any>(null)

  const {
    openTabs,
    activePolicyId,
    secondaryPolicyId,
    splitEditorEnabled,
    settings,
    developerMode,
    backendOnline,
    sessionExpired,
    setSessionExpired,
    setCursorPosition,
    updateTabSource,
    markTabSaved,
    openPolicyTab,
    pushNotification,
    appendCompilerOutput,
    appendStudioLog,
    setActiveBottomTab,
    setActiveRightTab,
    setGlobalSearchOpen,
  } = useStudioStore()

  const {
    policies,
    createPolicy,
    updatePolicy,
    compilePolicy,
    executePolicy,
  } = usePolicyWorkspaceStore()

  const activePolicy = policies.find((p) => p.id === activePolicyId)
  const secondaryPolicy = policies.find((p) => p.id === secondaryPolicyId)
  const activeTab = openTabs.find((t) => t.policyId === activePolicyId)

  const currentSource =
    activeTab?.unsavedSource ?? activePolicy?.sourceCode ?? ''

  const [lastCompile, setLastCompile] =
    useState<WorkspaceCompilationRecord | null>(null)
  const [lastExecution, setLastExecution] =
    useState<WorkspaceExecutionRecord | null>(null)
  const [runtimeInputsJson, setRuntimeInputsJson] = useState(
    JSON.stringify(
      {
        age: 28,
        salary: 75000,
        creditScore: 740,
        amount: 25000,
        riskScore: 15,
        accountAgeDays: 180,
      },
      null,
      2,
    ),
  )
  const isLight = settings.theme === 'light'

  useEffect(() => {
    if (monaco) {
      registerFplLanguage(monaco)
      monaco.editor.setTheme(isLight ? 'fpl-light' : 'fpl-dark')
    }
  }, [monaco, isLight])

  useEffect(() => {
    setLastExecution(null)
  }, [activePolicyId, currentSource, runtimeInputsJson])

  // Compute Problems Panel diagnostics & suggested fixes
  const problems: SuggestedProblemFix[] = useMemo(() => {
    if (!currentSource.trim()) return []
    const sem = analyzeFplSemantics(currentSource)
    return sem.diagnostics.map((d, idx) => ({
      id: `prob-${idx}-${d.code}`,
      severity: d.severity === 'ERROR' ? 'error' : 'warning',
      code: d.code,
      message: d.message,
      line: d.line,
      column: d.column,
      suggestedFix:
        d.suggestion ||
        (d.message.toLowerCase().includes('undeclared')
          ? 'Declare this identifier in the INPUT or OUTPUT block before referencing it.'
          : 'Verify FPL syntax and type annotations on this line.'),
    }))
  }, [currentSource])

  // Auto-save debounce when enabled in settings
  useEffect(() => {
    if (!settings.autoSave || !activePolicy || !activeTab?.isDirty) return
    const timer = setTimeout(() => {
      updatePolicy(activePolicy.id, {
        sourceCode: currentSource,
        createNewVersion: false,
      })
      markTabSaved(activePolicy.id)
      appendStudioLog(`[AUTO-SAVE] Saved ${activePolicy.name}.fpl`)
    }, 1500)
    return () => clearTimeout(timer)
  }, [currentSource, settings.autoSave, activePolicy, activeTab?.isDirty])

  const handleSave = useCallback(() => {
    if (!activePolicy) return
    updatePolicy(activePolicy.id, {
      sourceCode: currentSource,
      createNewVersion: false,
    })
    markTabSaved(activePolicy.id)
    pushNotification(
      'POLICY_SAVED',
      'Policy Saved',
      `${activePolicy.name}.fpl saved successfully.`,
    )
    appendStudioLog(`[SAVE] Saved ${activePolicy.name}.fpl`)
    toast.success(`Saved ${activePolicy.name}.fpl`)
  }, [activePolicy, currentSource, updatePolicy, markTabSaved, pushNotification, appendStudioLog])

  const handleCompile = useCallback(async () => {
    if (!activePolicy) return
    let res = compilePolicy(activePolicy.id, currentSource)
    try {
      const backend = await compilerService.compile({
        policyId: activePolicy.id,
        source: currentSource,
        optimizationLevel: settings.compilerOptimizationLevel,
        emitAst: developerMode,
        emitIr: true,
        emitTac: true,
        emitQuadruples: developerMode,
        emitTriples: developerMode,
      })
      const errors = backend.diagnostics
        .filter((d) => d.severity === 'ERROR')
        .map((d) => ({ code: d.code, message: d.message, line: d.line, column: d.column }))
      const warnings = backend.diagnostics
        .filter((d) => d.severity === 'WARNING')
        .map((d) => ({ code: d.code, message: d.message, line: d.line, column: d.column }))
      res = {
        ...res,
        status: backend.success ? (warnings.length > 0 ? 'WARNING' : 'SUCCESS') : 'FAILED',
        compilationTimeMs: Number(backend.totalDurationMs.toFixed(2)),
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
        tacText: tacFromBackend(backend),
        optimizedTacText: optimizedTacFromBackend(backend),
      }
      appendCompilerOutput('[backend] Compiled with FinPolicy compiler API')
    } catch {
      appendCompilerOutput('[local] Backend unavailable; used local compiler fallback')
    }
    setLastCompile(res)
    appendCompilerOutput(
      `[${new Date().toLocaleTimeString()}] Building ${activePolicy.name}.fpl... ${res.status} (${res.compilationTimeMs} ms, ${res.errorCount} errors, ${res.warningCount} warnings)`,
    )
    appendStudioLog(
      `[COMPILE] ${activePolicy.name}.fpl -> ${res.status} in ${res.compilationTimeMs} ms`,
    )

    if (res.status === 'FAILED') {
      setActiveBottomTab('problems')
      pushNotification(
        'COMPILATION_FAILURE',
        'Compilation Failed',
        `${activePolicy.name}.fpl failed with ${res.errorCount} error(s).`,
      )
      toast.error(`Compilation failed (${res.errorCount} errors)`)
    } else {
      setActiveBottomTab('output')
      pushNotification(
        'COMPILATION_SUCCESS',
        'Compilation Succeeded',
        `${activePolicy.name}.fpl compiled in ${res.compilationTimeMs} ms.`,
      )
      toast.success(`Compiled ${activePolicy.name}.fpl (${res.compilationTimeMs} ms)`)
    }
  }, [
    activePolicy,
    currentSource,
    settings.compilerOptimizationLevel,
    developerMode,
    compilePolicy,
    appendCompilerOutput,
    appendStudioLog,
    setActiveBottomTab,
    pushNotification,
  ])

  const handleExecute = useCallback(async () => {
    if (!activePolicy) return
    let parsedInputs: Record<string, number | string | boolean> = {
      age: 28,
      salary: 75000,
      creditScore: 740,
    }
    try {
      parsedInputs = JSON.parse(runtimeInputsJson)
    } catch {
      pushNotification(
        'EXECUTION_FAILURE',
        'Invalid Runtime Input JSON',
        'Falling back to default runtime input values.',
      )
    }

    let res: WorkspaceExecutionRecord | null = null
    try {
      const backend: RunResponse = await compilerService.run({
        policyId: activePolicy.id,
        source: currentSource,
        inputData: parsedInputs,
        optimizationLevel: settings.compilerOptimizationLevel,
        emitAst: false,
        emitIr: true,
        emitTac: true,
        emitQuadruples: false,
        emitTriples: false,
        recordTrace: true,
      })
      if (backend.execution) {
        const backendDecision =
          backend.execution.decision === 'APPROVE' ||
          backend.execution.decision === 'REJECT' ||
          backend.execution.decision === 'REVIEW'
            ? backend.execution.decision
            : backend.execution.normalizedDecision === 'ALLOW'
              ? 'APPROVE'
              : backend.execution.normalizedDecision === 'DENY'
                ? 'REJECT'
                : 'REVIEW'
        const hasRuntimeErrors = backend.execution.diagnostics.some(
          (d) => d.severity === 'ERROR',
        )
        res = {
          id: `exe-${Date.now()}`,
          policyId: activePolicy.id,
          policyName: activePolicy.name,
          versionNumber: activePolicy.latestVersion,
          status: backend.execution.status === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
          decision: backendDecision,
          executionTimeMs: Number(backend.execution.executionTimeMs.toFixed(2)),
          instructionsExecuted: backend.execution.instructionsExecuted,
          memoryUsageBytes: backend.execution.memory.currentBytes,
          inputs: parsedInputs,
          variables: {
            ...backend.execution.variables.inputs,
            ...backend.execution.variables.locals,
            ...backend.execution.variables.outputs,
          },
          outputs: backend.execution.variables.outputs,
          traceSummary: backend.execution.trace.map((t) => ({
            step: t.step,
            ip: t.instructionIndex,
            blockId: t.basicBlockId ?? '',
            opcode: t.opcode,
            statementText: t.tacText,
            changes: JSON.stringify(t.variableChanges),
          })),
          errorMessage:
            backend.execution.diagnostics.find((d) => d.severity === 'ERROR')?.message ?? null,
          createdAt: new Date().toISOString(),
        }
        if (hasRuntimeErrors) {
          res.status = 'FAILED'
        }
        appendCompilerOutput('[backend] Executed with FinPolicy compiler API')
      }
    } catch {
      res = executePolicy(activePolicy.id, parsedInputs, currentSource)
      appendCompilerOutput('[local] Backend unavailable; used local VM fallback')
    }
    if (!res) {
      res = executePolicy(activePolicy.id, parsedInputs, currentSource)
      appendCompilerOutput('[local] Backend returned no execution result; used local VM fallback')
    }
    setLastExecution(res)
    setActiveBottomTab('execution')
    setActiveRightTab('results')
    appendStudioLog(
      `[EXECUTE] ${activePolicy.name}.fpl -> Decision: ${res.decision} (${res.executionTimeMs} ms)`,
    )

    if (res.status === 'FAILED') {
      pushNotification(
        'EXECUTION_FAILURE',
        'Execution Failed',
        res.errorMessage || 'Runtime execution encountered an error.',
      )
      toast.error('Execution failed')
    } else {
      pushNotification(
        'EXECUTION_SUCCESS',
        `Execution Decision: ${res.decision}`,
        `${activePolicy.name}.fpl completed in ${res.executionTimeMs} ms.`,
      )
      toast.success(`Decision: ${res.decision} (${res.executionTimeMs} ms)`)
    }
  }, [
    activePolicy,
    runtimeInputsJson,
    currentSource,
    settings.compilerOptimizationLevel,
    executePolicy,
    appendCompilerOutput,
    setActiveBottomTab,
    setActiveRightTab,
    appendStudioLog,
    pushNotification,
  ])

  const handleFormat = useCallback(() => {
    if (!activePolicy) return
    const formatted = formatFplPolicyCode(currentSource)
    updateTabSource(activePolicy.id, formatted, true)
    toast.success('Formatted FPL policy')
  }, [activePolicy, currentSource, updateTabSource])

  const handleNavigateToLine = (line: number, column: number) => {
    setCursorPosition(line, column)
    if (primaryEditorRef.current) {
      primaryEditorRef.current.revealLineInCenter(line)
      primaryEditorRef.current.setPosition({ lineNumber: line, column })
      primaryEditorRef.current.focus()
    }
  }

  // Global editor shortcuts: Ctrl+S, Ctrl+Shift+B, F5, Ctrl+F.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'b'
      ) {
        e.preventDefault()
        handleCompile()
      } else if (e.key === 'F5') {
        e.preventDefault()
        handleExecute()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setGlobalSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave, handleCompile, handleExecute, setGlobalSearchOpen])

  return (
    <div
      data-testid="finpolicy-studio-ide"
      className={`flex h-screen w-screen flex-col overflow-hidden ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#0D0F18] text-[#F1F5F9]'
      }`}
    >
      {/* Top Navigation */}
      <StudioTopNavigation />

      {/* Graceful Error Resilience Banners (Backend Offline / Session Expired) */}
      {!backendOnline && (
        <div
          data-testid="studio-offline-banner"
          className="flex items-center justify-between bg-amber-500/20 px-4 py-1 text-xs text-amber-300 border-b border-amber-500/30"
        >
          <span className="flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5" />
            Backend API offline. Studio is using the local compiler and FPVM fallback.
          </span>
        </div>
      )}

      {sessionExpired && (
        <div
          data-testid="studio-session-expired-banner"
          className="flex items-center justify-between bg-red-500/20 px-4 py-1 text-xs text-red-300 border-b border-red-500/30"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            This session expired. Unsaved policy buffers are preserved locally.
          </span>
          <button
            onClick={() => setSessionExpired(false)}
            className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white"
          >
            Re-authenticate Session
          </button>
        </div>
      )}

      {/* Main compiler IDE area */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar: Project Explorer */}
          <Panel defaultSize={20} minSize={15} maxSize={32}>
            <StudioLeftSidebar />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#2D3148] hover:bg-blue-500 transition-colors" />

          {/* Center: Editor Toolbar + Monaco Editor (with Split View) + Bottom Panel + Collapsible Developer Panel */}
          <Panel defaultSize={58} minSize={35}>
            <div className="flex h-full flex-col overflow-hidden">
              <StudioEditorToolbar
                folderName={
                  activePolicy?.categoryName ?? 'Retail Banking'
                }
                policyVersion={activePolicy?.latestVersion ?? 1}
                onSave={handleSave}
                onCompile={handleCompile}
                onExecute={handleExecute}
                onFormat={handleFormat}
                onUndo={() =>
                  primaryEditorRef.current?.trigger('toolbar', 'undo', null)
                }
                onRedo={() =>
                  primaryEditorRef.current?.trigger('toolbar', 'redo', null)
                }
                onGoToLine={() => {
                  primaryEditorRef.current?.focus()
                  primaryEditorRef.current?.trigger(
                    'toolbar',
                    'editor.action.gotoLine',
                    null,
                  )
                }}
                onFindReplace={() => {
                  primaryEditorRef.current?.focus()
                  primaryEditorRef.current?.trigger(
                    'toolbar',
                    'editor.action.startFindReplaceAction',
                    null,
                  )
                }}
              />

              <div className="flex-1 overflow-hidden">
                <PanelGroup direction="vertical">
                  {/* Main Monaco Editor Area */}
                  <Panel defaultSize={64} minSize={28}>
                    {!activePolicy ? (
                      /* Missing Policy Empty Fallback */
                      <div
                        data-testid="studio-missing-policy"
                        className="flex h-full flex-col items-center justify-center gap-3 bg-[#0D0F18] p-6 text-center"
                      >
                        <FileWarning className="h-10 w-10 text-[#64748B]" />
                        <div className="text-sm font-semibold text-white">
                          No Active Policy Open
                        </div>
                        <p className="max-w-sm text-xs text-[#64748B]">
                          Select a policy from the Project Explorer on the left or create a new Financial Policy (.fpl) file.
                        </p>
                        <button
                          onClick={() => {
                            const created = createPolicy({
                              name: 'NewStudioPolicy',
                            })
                            openPolicyTab(created.id, created.name)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                        >
                          <Plus className="h-4 w-4" /> Create New Policy
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`grid h-full ${
                          splitEditorEnabled ? 'grid-cols-2 divide-x divide-[#2D3148]' : 'grid-cols-1'
                        }`}
                      >
                        {/* Primary Monaco Editor */}
                        <div className="h-full overflow-hidden">
                          <Editor
                            height="100%"
                            language="fpl"
                            theme={isLight ? 'fpl-light' : 'fpl-dark'}
                            beforeMount={registerFplLanguage}
                            value={currentSource}
                            onMount={(editor, monacoInstance) => {
                              primaryEditorRef.current = editor
                              monacoInstance.editor.setTheme(isLight ? 'fpl-light' : 'fpl-dark')
                              editor.layout()
                              editor.onDidChangeCursorPosition((e) => {
                                setCursorPosition(
                                  e.position.lineNumber,
                                  e.position.column,
                                )
                              })
                            }}
                            onChange={(val) =>
                              updateTabSource(activePolicy.id, val || '', true)
                            }
                            options={{
                              fontSize: settings.fontSize,
                              fontFamily: settings.editorFont,
                              tabSize: settings.tabSize,
                              wordWrap: settings.wordWrap,
                              minimap: { enabled: settings.minimapEnabled },
                              lineNumbers: 'on',
                              renderLineHighlight: 'all',
                              matchBrackets: 'always',
                              bracketPairColorization: { enabled: true },
                              stickyScroll: { enabled: true },
                              autoIndent: 'full',
                              multiCursorModifier: 'alt',
                              multiCursorMergeOverlapping: true,
                              folding: true,
                              showFoldingControls: 'always',
                              contextmenu: true,
                              automaticLayout: true,
                              scrollBeyondLastLine: false,
                              padding: { top: 12 },
                            }}
                          />
                        </div>

                        {/* Secondary Split Editor */}
                        {splitEditorEnabled && (
                          <div
                            data-testid="studio-secondary-split-editor"
                            className="h-full overflow-hidden"
                          >
                            <div className="border-b border-[#2D3148] bg-[#141722] px-3 py-1 font-mono text-[11px] text-[#94A3B8]">
                              Split View: {secondaryPolicy?.name ?? activePolicy.name}.fpl
                            </div>
                            <Editor
                              height="calc(100% - 26px)"
                              language="fpl"
                              theme={isLight ? 'fpl-light' : 'fpl-dark'}
                              beforeMount={registerFplLanguage}
                              value={
                                secondaryPolicy?.sourceCode ?? currentSource
                              }
                              onMount={(editor, monacoInstance) => {
                                monacoInstance.editor.setTheme(isLight ? 'fpl-light' : 'fpl-dark')
                                editor.layout()
                              }}
                              options={{
                                fontSize: settings.fontSize,
                                fontFamily: settings.editorFont,
                                minimap: { enabled: false },
                                lineNumbers: 'on',
                                readOnly: false,
                                automaticLayout: true,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Panel>

                  <PanelResizeHandle className="h-1 bg-[#2D3148] hover:bg-blue-500 transition-colors" />

                  {/* Bottom Panel: Problems, Compiler Output, Execution Console, Logs, Terminal */}
                  <Panel defaultSize={36} minSize={16}>
                    <StudioBottomPanel
                      problems={problems}
                      lastCompile={lastCompile}
                      lastExecution={lastExecution}
                      runtimeInputsJson={runtimeInputsJson}
                      onRuntimeInputsChange={setRuntimeInputsJson}
                      onNavigateToLine={handleNavigateToLine}
                      onExecuteNow={handleExecute}
                      onCompileNow={handleCompile}
                    />
                  </Panel>
                </PanelGroup>
              </div>

              {/* Compiler phase panel */}
              <StudioDeveloperPanel
                sourceCode={currentSource}
                runtimeInputsJson={runtimeInputsJson}
                lastExecution={lastExecution}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#2D3148] hover:bg-blue-500 transition-colors" />

          {/* Right Sidebar: Properties & Execution Results */}
          <Panel defaultSize={22} minSize={16} maxSize={34}>
            <StudioRightSidebar
              policy={activePolicy}
              lastExecution={lastExecution}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* Bottom Status Bar */}
      <StudioStatusBar
        policyName={activePolicy ? `${activePolicy.name}.fpl` : 'None'}
        compileStatus={
          lastCompile
            ? lastCompile.status
            : problems.some((p) => p.severity === 'error')
              ? 'FAILED'
              : 'READY'
        }
        compileTimeMs={lastCompile?.compilationTimeMs ?? null}
        executionTimeMs={lastExecution?.executionTimeMs ?? null}
      />

      {/* Policy/source search modal */}
      <StudioModals
        onSave={handleSave}
        onCompile={handleCompile}
        onExecute={handleExecute}
        onFormat={handleFormat}
      />
    </div>
  )
}
export default FinPolicyStudioPage
