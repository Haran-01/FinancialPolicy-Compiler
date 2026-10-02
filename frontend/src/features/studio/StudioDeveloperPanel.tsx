/**
 * FinPolicy Studio - Compiler Phases Panel
 * Visualizes each compiler phase without changing compile or execution behavior.
 */

import { useMemo } from 'react'
import {
  TerminalSquare,
  ChevronDown,
  ChevronUp,
  Layers,
  Code2,
  GitBranch,
  Database,
  Sparkles,
  Cpu,
  CheckCircle2,
  ListTree,
  Table2,
  FileText,
} from 'lucide-react'
import { useStudioStore, StudioDeveloperTab } from '@/stores/studio.store'
import type { WorkspaceExecutionRecord } from '@/stores/policy-workspace.store'
import { generateFplIR } from '@/lib/fpl-ir-engine'
import { analyzeFplSemantics } from '@/lib/fpl-semantic-engine'

interface StudioDeveloperPanelProps {
  sourceCode: string
  runtimeInputsJson: string
  lastExecution?: WorkspaceExecutionRecord | null
}

type SourceSection = 'input' | 'output' | 'when' | 'then' | 'else' | 'none'

interface ParsedSourceSummary {
  policyName: string
  inputs: string[]
  outputs: string[]
  conditions: string[]
  thenActions: string[]
  elseActions: string[]
}

function summarizeSource(sourceCode: string): ParsedSourceSummary {
  const summary: ParsedSourceSummary = {
    policyName: sourceCode.match(/\bPOLICY\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1] ?? 'UnknownPolicy',
    inputs: [],
    outputs: [],
    conditions: [],
    thenActions: [],
    elseActions: [],
  }

  let section: SourceSection = 'none'
  for (const rawLine of sourceCode.split(/\r?\n/)) {
    const line = rawLine.replace(/\/\/.*$/, '').replace(/#.*$/, '').trim()
    if (!line || /^POLICY\b/i.test(line) || /^END\b/i.test(line)) continue

    if (/^INPUT\b/i.test(line)) {
      section = 'input'
      continue
    }
    if (/^OUTPUT\b/i.test(line)) {
      section = 'output'
      continue
    }
    if (/^WHEN\b/i.test(line)) {
      section = 'when'
      const inline = line.replace(/^WHEN\s*/i, '').trim()
      if (inline) summary.conditions.push(inline)
      continue
    }
    if (/^THEN\b/i.test(line)) {
      section = 'then'
      continue
    }
    if (/^ELSE\b/i.test(line)) {
      section = 'else'
      continue
    }

    if (section === 'input') summary.inputs.push(line)
    if (section === 'output') summary.outputs.push(line)
    if (section === 'when') summary.conditions.push(line.replace(/^(AND|OR)\s+/i, ''))
    if (section === 'then') summary.thenActions.push(line)
    if (section === 'else') summary.elseActions.push(line)
  }

  return summary
}

function decisionClass(decision?: string) {
  if (decision === 'APPROVE') return 'text-emerald-400'
  if (decision === 'REVIEW') return 'text-amber-300'
  return 'text-red-400'
}

export function StudioDeveloperPanel({
  sourceCode,
  lastExecution,
}: StudioDeveloperPanelProps) {
  const {
    developerMode,
    developerPanelCollapsed,
    setDeveloperPanelCollapsed,
    activeDeveloperTab,
    setActiveDeveloperTab,
    compilerOutputLines,
  } = useStudioStore()

  const telemetry = useMemo(() => {
    const semantic = analyzeFplSemantics(sourceCode)
    const ir = generateFplIR(sourceCode)
    const sourceSummary = summarizeSource(sourceCode)

    const tokenMatches = sourceCode.match(
      /\b(POLICY|INPUT|OUTPUT|WHEN|THEN|ELSE|END|APPROVE|REJECT|REVIEW|SET|AND|OR)\b|\b(int|decimal|string|boolean)\b|\d+(?:\.\d+)?|>=|<=|==|!=|[():,=<>+\-*/]|\b[A-Za-z_][A-Za-z0-9_]*\b/gi,
    ) ?? []

    const rawTokens = tokenMatches.map((val, idx) => ({
      index: idx,
      lexeme: val,
      category: /^(POLICY|INPUT|OUTPUT|WHEN|THEN|ELSE|END|APPROVE|REJECT|REVIEW|SET|AND|OR)$/i.test(val)
        ? 'KEYWORD'
        : /^(int|decimal|string|boolean)$/i.test(val)
          ? 'TYPE'
          : /^\d+(\.\d+)?$/.test(val)
            ? 'NUMBER'
            : /^(>=|<=|==|!=|[():,=<>+\-*/])$/.test(val)
              ? 'SYMBOL'
              : 'IDENTIFIER',
    }))

    return { semantic, ir, rawTokens, sourceSummary }
  }, [sourceCode])

  const controlFlowBlocks = telemetry.ir.basicBlocks ?? []
  const appliedOptimizations = telemetry.ir.optimization.transformations ?? []
  const appliedPasses = telemetry.ir.optimization.passSummaries.filter(
    (pass) => pass.appliedCount > 0,
  )

  const devTabs: Array<{ id: StudioDeveloperTab; label: string }> = [
    { id: 'pipeline', label: 'Overview' },
    { id: 'lexer', label: '1 Lexer' },
    { id: 'parser', label: '2 Parser' },
    { id: 'ast', label: '3 AST' },
    { id: 'semantic', label: '4 Semantic' },
    { id: 'symbols', label: '5 Symbols' },
    { id: 'ir', label: '6 IR / TAC' },
    { id: 'optimization', label: '7 Optimizer' },
    { id: 'trace', label: '8 FPVM' },
    { id: 'logs', label: 'Logs' },
  ]

  const phaseExplainers: Record<StudioDeveloperTab, { title: string; goal: string; input: string; output: string }> = {
    pipeline: {
      title: 'Compiler Pipeline',
      goal: 'Shows the complete journey from FPL source code to an executable policy decision.',
      input: 'The active .fpl policy and the JSON runtime input.',
      output: 'A compiled policy, optional optimized instructions, and a VM decision.',
    },
    lexer: {
      title: 'Lexer',
      goal: 'Splits raw FPL text into small tokens the compiler can read.',
      input: 'Characters from the editor.',
      output: 'Keywords, identifiers, types, numbers, and symbols.',
    },
    parser: {
      title: 'Parser',
      goal: 'Checks whether tokens follow the grammar of a valid financial policy.',
      input: 'Token stream from the lexer.',
      output: 'Recognized policy sections: input, output, condition, then branch, else branch.',
    },
    ast: {
      title: 'Abstract Syntax Tree',
      goal: 'Represents the policy as a tree so later phases can understand its structure.',
      input: 'Parsed policy sections.',
      output: 'A tree of policy, declarations, condition, and actions.',
    },
    semantic: {
      title: 'Semantic Analysis',
      goal: 'Checks meaning: declarations, types, assignments, and scope.',
      input: 'AST and symbol declarations.',
      output: 'Diagnostics plus validated symbols.',
    },
    symbols: {
      title: 'Symbol Table',
      goal: 'Records every meaningful name used by the policy.',
      input: 'Input/output declarations and assignments.',
      output: 'Name, kind, type, scope, and declaration line.',
    },
    ir: {
      title: 'IR / Three Address Code',
      goal: 'Lowers policy logic into simple instructions that are easy for a VM to run.',
      input: 'Validated AST.',
      output: 'Temporary variables, branches, labels, and assignments.',
    },
    optimization: {
      title: 'Optimizer',
      goal: 'Simplifies generated instructions without changing the policy decision.',
      input: 'IR / TAC instructions.',
      output: 'Optimized TAC and a list of actual changes.',
    },
    trace: {
      title: 'FPVM Execution',
      goal: 'Shows how the virtual machine executed the compiled policy step by step.',
      input: 'Compiled instructions plus JSON input.',
      output: 'Variable changes, output fields, and final decision.',
    },
    logs: {
      title: 'Compiler Logs',
      goal: 'Records compile/run messages from the studio.',
      input: 'Compiler and execution events.',
      output: 'Chronological status messages.',
    },
  }

  const currentExplainer = phaseExplainers[activeDeveloperTab]

  if (!developerMode) {
    return null
  }

  return (
    <section
      data-testid="studio-developer-panel"
      className="border-t-2 border-amber-500/50 bg-[#0D1017] text-xs text-[#CBD5E1]"
    >
      <div className="flex items-center justify-between border-b border-[#2D3148] bg-amber-500/10 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950">
            <TerminalSquare className="h-3 w-3" />
            COMPILER PHASES
          </span>

          <div className="flex items-center gap-1">
            {devTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDeveloperTab(tab.id)}
                data-testid={`dev-tab-${tab.id}`}
                className={`whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeDeveloperTab === tab.id
                    ? 'bg-amber-500/25 font-semibold text-amber-300'
                    : 'text-[#94A3B8] hover:bg-[#1A1D27] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setDeveloperPanelCollapsed(!developerPanelCollapsed)}
          data-testid="developer-panel-collapse-btn"
          className="ml-2 rounded p-1 text-amber-300 hover:bg-amber-500/20"
          title={
            developerPanelCollapsed
              ? 'Expand Compiler Phases'
              : 'Collapse Compiler Phases'
          }
        >
          {developerPanelCollapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {!developerPanelCollapsed && (
        <div className="max-h-80 overflow-y-auto p-3 font-mono text-[11px]">
          <div className="mb-3 grid gap-2 rounded-lg border border-[#2D3148] bg-[#101420] p-3 text-[11px] md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-300">
                <FileText className="h-3.5 w-3.5" />
                {currentExplainer.title}
              </div>
              <p className="font-sans text-[12px] leading-5 text-[#CBD5E1]">
                {currentExplainer.goal}
              </p>
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">
                Input
              </div>
              <p className="font-sans text-[12px] leading-5 text-[#94A3B8]">
                {currentExplainer.input}
              </p>
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wide text-[#64748B]">
                Output
              </div>
              <p className="font-sans text-[12px] leading-5 text-[#94A3B8]">
                {currentExplainer.output}
              </p>
            </div>
          </div>

          {activeDeveloperTab === 'pipeline' && (
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {[
                { stage: '1 Lexer', detail: `${telemetry.rawTokens.length} tokens`, hint: 'Source text -> tokens', icon: Code2 },
                { stage: '2 Parser', detail: telemetry.sourceSummary.policyName, hint: 'Tokens -> policy sections', icon: Layers },
                { stage: '3 AST', detail: `${telemetry.sourceSummary.inputs.length + telemetry.sourceSummary.outputs.length} declarations`, hint: 'Sections -> tree', icon: ListTree },
                { stage: '4 Semantic', detail: `${telemetry.semantic.diagnostics.length} diagnostics`, hint: 'Meaning and type checks', icon: Database },
                { stage: '5 Symbols', detail: `${telemetry.semantic.symbols.length} symbols`, hint: 'Names and types', icon: Table2 },
                { stage: '6 IR / TAC', detail: `${telemetry.ir.tac.length} instructions`, hint: 'Tree -> VM-like code', icon: GitBranch },
                { stage: '7 Optimizer', detail: `${appliedOptimizations.length} changes`, hint: 'Same result, simpler code', icon: Sparkles },
                {
                  stage: '8 FPVM',
                  detail: lastExecution ? `Decision: ${lastExecution.decision}` : 'Run policy to see result',
                  hint: 'Instructions -> decision',
                  icon: Cpu,
                },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.stage}
                    className="rounded-lg border border-amber-500/25 bg-[#141824] p-2.5"
                  >
                    <div className="flex items-center justify-between text-amber-400">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Icon className="h-3.5 w-3.5" />
                        {s.stage}
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="mt-1 text-white">{s.detail}</div>
                    <div className="mt-0.5 font-sans text-[11px] text-[#94A3B8]">
                      {s.hint}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeDeveloperTab === 'lexer' && (
            <div className="flex flex-wrap gap-1.5">
              {telemetry.rawTokens.map((tok) => (
                <span
                  key={tok.index}
                  className="rounded border border-[#2D3148] bg-[#141824] px-2 py-1"
                >
                  <span className="text-amber-400">{tok.category}:</span>{' '}
                  <span className="text-white">{tok.lexeme}</span>
                </span>
              ))}
            </div>
          )}

          {activeDeveloperTab === 'parser' && (
            <div className="grid gap-2 md:grid-cols-5">
              {[
                ['Policy', telemetry.sourceSummary.policyName],
                ['INPUT block', `${telemetry.sourceSummary.inputs.length} declarations`],
                ['OUTPUT block', `${telemetry.sourceSummary.outputs.length} declarations`],
                ['WHEN condition', `${telemetry.sourceSummary.conditions.length} expression lines`],
                ['Branches', `THEN ${telemetry.sourceSummary.thenActions.length}, ELSE ${telemetry.sourceSummary.elseActions.length}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-[#64748B]">
                    {label}
                  </div>
                  <div className="mt-1 text-white">{value}</div>
                </div>
              ))}
            </div>
          )}

          {activeDeveloperTab === 'ast' && (
            <pre className="whitespace-pre-wrap rounded-lg border border-[#2D3148] bg-[#141824] p-3 text-emerald-300">
{`Program
- PolicyDeclaration: ${telemetry.sourceSummary.policyName}
  +- InputBlock
${telemetry.sourceSummary.inputs.map((line) => `  |  - ${line}`).join('\n') || '  |  - none'}
  +- OutputBlock
${telemetry.sourceSummary.outputs.map((line) => `  |  - ${line}`).join('\n') || '  |  - none'}
  +- WhenCondition
${telemetry.sourceSummary.conditions.map((line) => `  |  - ${line}`).join('\n') || '  |  - none'}
  +- ThenActions
${telemetry.sourceSummary.thenActions.map((line) => `  |  - ${line}`).join('\n') || '  |  - none'}
  +- ElseActions
${telemetry.sourceSummary.elseActions.map((line) => `     - ${line}`).join('\n') || '     - none'}`}
            </pre>
          )}

          {activeDeveloperTab === 'semantic' && (
            <div className="grid gap-2 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-3">
                <div className="mb-2 font-bold text-amber-300">Checks performed</div>
                {[
                  'Every used name is declared',
                  'INPUT and OUTPUT types are known',
                  'SET targets exist before assignment',
                  'Expression types match target variables',
                  'Duplicate symbols are rejected',
                ].map((check) => (
                  <div key={check} className="flex items-center gap-2 py-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-3">
                <div className="mb-2 font-bold text-amber-300">
                  Diagnostics ({telemetry.semantic.diagnostics.length})
                </div>
                {telemetry.semantic.diagnostics.length === 0 ? (
                  <div className="text-emerald-400">
                    All declarations, types, assignments, and scopes validated cleanly.
                  </div>
                ) : (
                  telemetry.semantic.diagnostics.map((d, i) => (
                    <div key={i} className="py-0.5 text-red-400">
                      [{d.code}] Line {d.line}: {d.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeDeveloperTab === 'symbols' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2D3148] text-amber-400">
                  <th className="pb-1">Symbol</th>
                  <th className="pb-1">Kind</th>
                  <th className="pb-1">Type</th>
                  <th className="pb-1">Scope</th>
                  <th className="pb-1">Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3148]/40">
                {telemetry.semantic.symbols.map((sym, idx) => (
                  <tr key={`${sym.name}-${idx}`}>
                    <td className="py-1 font-semibold text-white">{sym.name}</td>
                    <td className="py-1 text-blue-400">{sym.kind}</td>
                    <td className="py-1 text-emerald-400">{sym.type}</td>
                    <td className="py-1 text-[#94A3B8]">{sym.scope}</td>
                    <td className="py-1 text-[#64748B]">Ln {sym.declarationLine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeDeveloperTab === 'ir' && (
            <div className="space-y-2">
              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded border border-[#2D3148] bg-[#141824] p-2">
                  Temporaries: {telemetry.ir.temporaries.length}
                </div>
                <div className="rounded border border-[#2D3148] bg-[#141824] p-2">
                  Basic blocks: {controlFlowBlocks.length}
                </div>
                <div className="rounded border border-[#2D3148] bg-[#141824] p-2">
                  Instructions: {telemetry.ir.tac.length}
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-[#2D3148] bg-[#101420] p-3 text-cyan-300">
                {telemetry.ir.formattedTAC}
              </pre>
            </div>
          )}

          {activeDeveloperTab === 'optimization' && (
            <div className="space-y-2">
              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                  <div className="text-[#64748B]">Before</div>
                  <div className="text-lg font-bold text-white">
                    {telemetry.ir.optimization.statistics.instructionsBefore}
                  </div>
                </div>
                <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                  <div className="text-[#64748B]">After</div>
                  <div className="text-lg font-bold text-emerald-300">
                    {telemetry.ir.optimization.statistics.instructionsAfter}
                  </div>
                </div>
                <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                  <div className="text-[#64748B]">Actual changes</div>
                  <div className="text-lg font-bold text-amber-300">
                    {appliedOptimizations.length}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-3">
                <div className="mb-2 font-bold text-amber-300">Applied passes</div>
                {appliedPasses.length === 0 ? (
                  <div className="text-[#94A3B8]">
                    No optimization pass changed this policy. The original TAC is already simple.
                  </div>
                ) : (
                  <div className="grid gap-1.5 md:grid-cols-2">
                    {appliedPasses.map((pass) => (
                      <div key={pass.passName} className="rounded border border-[#2D3148] bg-[#101420] p-2">
                        <div className="text-white">{pass.passTitle}</div>
                        <div className="font-sans text-[11px] text-[#94A3B8]">
                          {pass.appliedCount} change(s): {pass.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <pre className="whitespace-pre-wrap rounded-lg border border-[#2D3148] bg-[#101420] p-3 text-emerald-300">
                {telemetry.ir.optimization.formattedOptimizedTAC}
              </pre>
            </div>
          )}

          {activeDeveloperTab === 'trace' && (
            <div className="space-y-2">
              {lastExecution ? (
                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                    <div className="text-[#64748B]">Decision</div>
                    <div className={`font-bold ${decisionClass(lastExecution.decision)}`}>
                      {lastExecution.decision}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                    <div className="text-[#64748B]">Instructions</div>
                    <div className="font-bold text-white">{lastExecution.instructionsExecuted}</div>
                  </div>
                  <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                    <div className="text-[#64748B]">Time</div>
                    <div className="font-bold text-white">{lastExecution.executionTimeMs} ms</div>
                  </div>
                  <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-2.5">
                    <div className="text-[#64748B]">Outputs</div>
                    <div className="font-bold text-white">{Object.keys(lastExecution.outputs).length}</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#2D3148] bg-[#141824] p-3 text-[#94A3B8]">
                  Run the policy to inspect the FPVM execution trace.
                </div>
              )}

              {lastExecution?.traceSummary.length ? (
                <div className="space-y-1">
                  {lastExecution.traceSummary.map((step) => (
                    <div
                      key={step.step}
                      className="grid gap-2 rounded border border-[#2D3148] bg-[#101420] p-2 md:grid-cols-[5rem_1fr_1fr]"
                    >
                      <span className="text-amber-300">Step {step.step}</span>
                      <span className="text-white">{step.statementText}</span>
                      <span className="text-[#94A3B8]">{step.changes}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {activeDeveloperTab === 'logs' && (
            <div className="space-y-1">
              {compilerOutputLines.map((line, i) => (
                <div key={`${line}-${i}`} className="text-[#94A3B8]">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default StudioDeveloperPanel
