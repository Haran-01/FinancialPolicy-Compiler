import { useState } from 'react';
import {
  Cpu,
  GitMerge,
  Table2,
  Layers,
  Variable,
  CheckCircle2,
  ArrowRight,
  Hash,
  Zap,
} from 'lucide-react';
import type {
  FrontendIRInstruction,
  LiveIRGenerationResult,
} from '@/lib/fpl-ir-engine';
import { cn } from '@/lib/utils';

type IRSubView = 'tac' | 'optimizer' | 'cfg' | 'quadruples' | 'triples' | 'temporaries';

interface IRExplorerPanelProps {
  irResult: LiveIRGenerationResult;
  initialSubView?: IRSubView;
  onJumpToLine?: (line: number) => void;
}

export default function IRExplorerPanel({
  irResult,
  initialSubView = 'tac',
  onJumpToLine,
}: IRExplorerPanelProps) {
  const [subView, setSubView] = useState<IRSubView>(initialSubView);
  const [selectedInst, setSelectedInst] = useState<FrontendIRInstruction | null>(
    irResult.instructions[0] ?? null,
  );

  const activeInst =
    selectedInst && irResult.instructions.some((i) => i.id === selectedInst.id)
      ? selectedInst
      : (irResult.instructions[0] ?? null);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0F1117] text-slate-200">
      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3148] bg-[#151823] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubView('tac')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              subView === 'tac'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1A1D27] text-slate-300 hover:bg-[#222634]',
            )}
          >
            <Cpu className="h-3.5 w-3.5" />
            TAC & Instruction Inspector ({irResult.instructions.length})
          </button>

          <button
            type="button"
            onClick={() => setSubView('optimizer')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              subView === 'optimizer'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1A1D27] text-emerald-300 hover:bg-[#222634]',
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Optimizer & IR Diff ({irResult.optimization.transformations.length})
          </button>

          <button
            type="button"
            onClick={() => setSubView('cfg')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              subView === 'cfg'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1A1D27] text-slate-300 hover:bg-[#222634]',
            )}
          >
            <GitMerge className="h-3.5 w-3.5" />
            CFG & Basic Blocks ({irResult.basicBlocks.length})
          </button>

          <button
            type="button"
            onClick={() => setSubView('quadruples')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              subView === 'quadruples'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1A1D27] text-slate-300 hover:bg-[#222634]',
            )}
          >
            <Table2 className="h-3.5 w-3.5" />
            Quadruples
          </button>

          <button
            type="button"
            onClick={() => setSubView('triples')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              subView === 'triples'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1A1D27] text-slate-300 hover:bg-[#222634]',
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Triples & Indirect Triples
          </button>

          <button
            type="button"
            onClick={() => setSubView('temporaries')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              subView === 'temporaries'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1A1D27] text-slate-300 hover:bg-[#222634]',
            )}
          >
            <Variable className="h-3.5 w-3.5" />
            Temporaries ({irResult.temporaries.length})
          </button>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          IR Validated
        </span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 1. TAC & Instruction Inspector */}
        {subView === 'tac' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: TAC Stream */}
            <div className="lg:col-span-7 rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
              <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
                Three Address Code (Click any instruction to inspect)
              </div>
              <div className="divide-y divide-[#2D3148]/50 font-mono text-xs">
                {irResult.instructions.map((inst) => {
                  const isSelected = activeInst?.id === inst.id;
                  const isLabel = inst.opcode === 'LABEL';
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => {
                        setSelectedInst(inst);
                        if (inst.sourceLine > 0) onJumpToLine?.(inst.sourceLine);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2 text-left transition-colors',
                        isSelected
                          ? 'bg-blue-500/20 text-white'
                          : 'hover:bg-[#1A1D27] text-slate-300',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-12 text-[10px] text-slate-500">
                          {inst.id}
                        </span>
                        <span className="rounded bg-[#0F1117] px-1.5 py-0.5 text-[10px] text-indigo-400">
                          {inst.basicBlockId}
                        </span>
                        <span
                          className={cn(
                            isLabel
                              ? 'font-bold text-amber-400'
                              : 'pl-3 text-slate-200',
                          )}
                        >
                          {inst.tacText}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        L{inst.sourceLine}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Instruction Inspector Card */}
            <div className="lg:col-span-5">
              {activeInst && (
                <div className="rounded-xl border border-[#2D3148] bg-[#151823] p-4">
                  <div className="border-b border-[#2D3148] pb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                      Instruction Inspector
                    </span>
                    <div className="mt-1 font-mono text-lg font-bold text-white">
                      {activeInst.tacText}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-2.5">
                      <div className="text-[10px] uppercase text-slate-400">
                        Instruction ID
                      </div>
                      <div className="mt-1 font-mono font-bold text-white">
                        {activeInst.id} (#{activeInst.index})
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-2.5">
                      <div className="text-[10px] uppercase text-slate-400">
                        Opcode
                      </div>
                      <div className="mt-1 font-mono font-bold text-emerald-400">
                        {activeInst.opcode} ({activeInst.op})
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-2.5">
                      <div className="text-[10px] uppercase text-slate-400">
                        Operand 1
                      </div>
                      <div className="mt-1 font-mono font-semibold text-blue-300">
                        {activeInst.arg1 ?? '—'}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-2.5">
                      <div className="text-[10px] uppercase text-slate-400">
                        Operand 2
                      </div>
                      <div className="mt-1 font-mono font-semibold text-blue-300">
                        {activeInst.arg2 ?? '—'}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-2.5">
                      <div className="text-[10px] uppercase text-slate-400">
                        Destination
                      </div>
                      <div className="mt-1 font-mono font-bold text-amber-400">
                        {activeInst.result ?? '—'}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-2.5">
                      <div className="text-[10px] uppercase text-slate-400">
                        Basic Block & Line
                      </div>
                      <div className="mt-1 font-mono font-semibold text-indigo-300">
                        {activeInst.basicBlockId} · Line {activeInst.sourceLine}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Control Flow Graph (CFG) & Basic Block Explorer */}
        {subView === 'cfg' && (
          <div className="space-y-4">
            {irResult.basicBlocks.map((blk) => (
              <div
                key={blk.id}
                className="rounded-xl border border-[#2D3148] bg-[#151823] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3148] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md bg-indigo-500/20 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300">
                      {blk.label}
                    </span>
                    <span className="rounded border border-[#2D3148] bg-[#0F1117] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      Kind: {blk.kind}
                    </span>
                    <span className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
                      Leader: {blk.leaderReason}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">
                      Preds:{' '}
                      <strong className="text-slate-200">
                        {blk.predecessors.length ? blk.predecessors.join(', ') : 'ENTRY'}
                      </strong>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-slate-400">
                      Succs:{' '}
                      <strong className="text-emerald-400">
                        {blk.successors.length ? blk.successors.join(', ') : 'EXIT'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1 rounded-lg bg-[#0F1117] p-3 font-mono text-xs">
                  {blk.tacLines.map((line, idx) => (
                    <div key={idx} className="text-slate-200">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Quadruple Table */}
        {subView === 'quadruples' && (
          <div className="rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
            <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
              Quadruple Representation — (Operator, Argument 1, Argument 2, Result)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2D3148] bg-[#0F1117] text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Operator</th>
                    <th className="px-4 py-2.5">Argument 1</th>
                    <th className="px-4 py-2.5">Argument 2</th>
                    <th className="px-4 py-2.5">Result</th>
                    <th className="px-4 py-2.5">Block</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3148]/60">
                  {irResult.quadruples.map((q) => (
                    <tr
                      key={q.index}
                      onClick={() => q.sourceLine > 0 && onJumpToLine?.(q.sourceLine)}
                      className="cursor-pointer hover:bg-[#1A1D27]"
                    >
                      <td className="px-4 py-2 text-slate-500">({q.index})</td>
                      <td className="px-4 py-2 font-bold text-blue-400">{q.op}</td>
                      <td className="px-4 py-2 text-slate-200">{q.arg1 ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-200">{q.arg2 ?? '—'}</td>
                      <td className="px-4 py-2 font-semibold text-amber-400">
                        {q.result ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-indigo-300">{q.basicBlockId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Triples & Indirect Triples */}
        {subView === 'triples' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Direct Triples */}
            <div className="rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
              <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
                Triples Table — (Index, Operator, Argument 1, Argument 2)
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2D3148] bg-[#0F1117] text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Index</th>
                    <th className="px-3 py-2">Operator</th>
                    <th className="px-3 py-2">Arg 1</th>
                    <th className="px-3 py-2">Arg 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3148]/60">
                  {irResult.triples.map((t) => (
                    <tr key={t.index} className="hover:bg-[#1A1D27]">
                      <td className="px-3 py-2 text-amber-400">({t.index})</td>
                      <td className="px-3 py-2 font-bold text-blue-400">{t.op}</td>
                      <td className="px-3 py-2 text-slate-200">{t.arg1 ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-200">{t.arg2 ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Indirect Triples */}
            <div className="rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
              <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
                Indirect Triples — Pointer Table → Triple Index
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2D3148] bg-[#0F1117] text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Pointer</th>
                    <th className="px-3 py-2">Triple Ref</th>
                    <th className="px-3 py-2">Target Instruction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3148]/60">
                  {irResult.indirectTriples.map((it) => (
                    <tr key={it.pointerIndex} className="hover:bg-[#1A1D27]">
                      <td className="px-3 py-2 font-bold text-indigo-400">
                        {it.pointerLabel}
                      </td>
                      <td className="px-3 py-2 text-amber-400">
                        → ({it.tripleIndex})
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {it.op} {it.arg1 ?? ''} {it.arg2 ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Temporary Variable Viewer */}
        {subView === 'temporaries' && (
          <div className="rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
            <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
              Temporary Variable Allocation Table (t1 .. t{irResult.temporaries.length})
            </div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#2D3148] bg-[#0F1117] text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Temporary</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Sub-Expression</th>
                  <th className="px-4 py-2.5">Defined At</th>
                  <th className="px-4 py-2.5">Consumed By</th>
                  <th className="px-4 py-2.5">Basic Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3148]/60">
                {irResult.temporaries.map((tmp) => (
                  <tr
                    key={tmp.name}
                    onClick={() => tmp.sourceLine > 0 && onJumpToLine?.(tmp.sourceLine)}
                    className="cursor-pointer hover:bg-[#1A1D27]"
                  >
                    <td className="px-4 py-2 font-bold text-amber-400">
                      {tmp.name}
                    </td>
                    <td className="px-4 py-2 text-emerald-400">{tmp.dataType}</td>
                    <td className="px-4 py-2 text-slate-200">{tmp.expression}</td>
                    <td className="px-4 py-2 text-blue-300">{tmp.definedAt}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {tmp.usedAt.length ? tmp.usedAt.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-2 text-indigo-300">
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {tmp.basicBlockId} (L{tmp.sourceLine})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Optimization Explorer, Side-by-Side IR Diff, Pass Viewer & Transformation History */}
        {subView === 'optimizer' && (
          <div className="space-y-4">
            {/* Performance Metrics Dashboard */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-xl border border-[#2D3148] bg-[#151823] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Instructions Before
                </div>
                <div className="mt-1 text-xl font-bold text-slate-100">
                  {irResult.optimization.metrics.instructionsBefore}
                </div>
              </div>
              <div className="rounded-xl border border-[#2D3148] bg-[#151823] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Instructions After
                </div>
                <div className="mt-1 text-xl font-bold text-emerald-400">
                  {irResult.optimization.metrics.instructionsAfter}
                </div>
              </div>
              <div className="rounded-xl border border-[#2D3148] bg-[#151823] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Temporaries Reduced
                </div>
                <div className="mt-1 text-xl font-bold text-amber-400">
                  {irResult.optimization.metrics.temporariesReduced}
                </div>
              </div>
              <div className="rounded-xl border border-[#2D3148] bg-[#151823] p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Basic Blocks Reduced
                </div>
                <div className="mt-1 text-xl font-bold text-indigo-400">
                  {irResult.optimization.metrics.basicBlocksReduced}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="text-[11px] uppercase tracking-wider text-emerald-300">
                  Est. Runtime Gain
                </div>
                <div className="mt-1 text-xl font-bold text-emerald-400">
                  {irResult.optimization.metrics.estimatedRuntimeImprovementPercent}%
                </div>
              </div>
            </div>

            {/* Side-by-Side IR Difference Viewer */}
            <div className="rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
              <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
                Side-by-Side IR Difference Viewer — Before vs. After Optimization
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-[#2D3148] bg-[#0F1117] text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Before Optimization (TAC)</th>
                    <th className="px-3 py-2">After Optimization (TAC)</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Pass / Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3148]/60">
                  {irResult.optimization.sideBySideDiff.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={cn(
                        'hover:bg-[#1A1D27]',
                        row.status === 'MODIFIED' && 'bg-amber-500/5',
                        row.status === 'REMOVED' && 'bg-rose-500/5',
                      )}
                    >
                      <td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>
                      <td className="px-3 py-2 text-slate-300">{row.beforeTAC}</td>
                      <td
                        className={cn(
                          'px-3 py-2 font-semibold',
                          row.status === 'MODIFIED' && 'text-emerald-400',
                          row.status === 'REMOVED' && 'text-rose-400 line-through',
                          row.status === 'UNCHANGED' && 'text-slate-200',
                        )}
                      >
                        {row.afterTAC}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                            row.status === 'MODIFIED' && 'bg-amber-500/20 text-amber-300',
                            row.status === 'REMOVED' && 'bg-rose-500/20 text-rose-300',
                            row.status === 'UNCHANGED' && 'bg-slate-800 text-slate-400',
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-400">
                        {row.passName ? (
                          <span className="text-indigo-300">
                            [{row.passName}] {row.reason}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pass Viewer & Transformation History */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
                <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
                  12-Pass Optimization Pipeline Status
                </div>
                <div className="divide-y divide-[#2D3148]/60">
                  {irResult.optimization.passSummaries.map((p) => (
                    <div
                      key={p.passName}
                      className="flex items-center justify-between px-4 py-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{p.passTitle}</div>
                        <div className="text-[11px] text-slate-400">{p.description}</div>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          p.appliedCount > 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400',
                        )}
                      >
                        {p.appliedCount} applied
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#2D3148] bg-[#151823] overflow-hidden">
                <div className="border-b border-[#2D3148] px-4 py-2.5 text-xs font-semibold text-slate-200">
                  Transformation History ({irResult.optimization.transformations.length})
                </div>
                <div className="divide-y divide-[#2D3148]/60 max-h-[420px] overflow-y-auto">
                  {irResult.optimization.transformations.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400">
                      IR is already in minimal canonical form — no redundant computations found.
                    </div>
                  ) : (
                    irResult.optimization.transformations.map((tr) => (
                      <div key={tr.step} className="p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-400">
                            #{tr.step} {tr.passTitle}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {tr.instructionId} ({tr.basicBlockId})
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-rose-300">
                          − {tr.before}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-300">
                          + {tr.after}
                        </div>
                        <div className="text-[11px] text-slate-400">{tr.reason}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
