import { useMemo } from 'react';
import {
  ArrowDown,
  CheckCircle2,
  XCircle,
  Code2,
  GitBranch,
  Layers,
  Sparkles,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Hash,
  Box,
} from 'lucide-react';
import type {
  ExplorerPolicyInfo,
  ExplorerSymbolInfo,
  LiveSemanticAnalysisResult,
} from '@/lib/fpl-semantic-engine';
import { cn } from '@/lib/utils';

export type SelectedSemanticEntity =
  | { kind: 'symbol'; id: string }
  | { kind: 'policy'; name: string };

interface SemanticExplorerPanelProps {
  analysis: LiveSemanticAnalysisResult;
  selectedEntity: SelectedSemanticEntity | null;
  onSelectEntity: (entity: SelectedSemanticEntity) => void;
  onJumpToLine?: (line: number, column?: number) => void;
}

export default function SemanticExplorerPanel({
  analysis,
  selectedEntity,
  onSelectEntity,
  onJumpToLine,
}: SemanticExplorerPanelProps) {
  const { symbols, policies } = analysis;

  // Resolve currently inspected symbol or policy (defaulting to `salary` or first symbol/policy)
  const activeSelection = useMemo<{
    symbol: ExplorerSymbolInfo | null;
    policy: ExplorerPolicyInfo | null;
  }>(() => {
    if (selectedEntity?.kind === 'symbol') {
      const found = symbols.find((s) => s.id === selectedEntity.id) ?? null;
      if (found) return { symbol: found, policy: null };
    }
    if (selectedEntity?.kind === 'policy') {
      const found = policies.find((p) => p.name === selectedEntity.name) ?? null;
      if (found) return { symbol: null, policy: found };
    }

    // Default to `salary` if present, otherwise first symbol or policy
    const defaultSalary = symbols.find(
      (s) => s.name.toLowerCase() === 'salary' && s.declaredIn === 'LoanApproval',
    ) ?? symbols[0] ?? null;

    if (defaultSalary) {
      return { symbol: defaultSalary, policy: null };
    }
    if (policies[0]) {
      return { symbol: null, policy: policies[0] };
    }
    return { symbol: null, policy: null };
  }, [selectedEntity, symbols, policies]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0F1117] text-slate-200">
      {/* Top Interactive Selector Header */}
      <div className="border-b border-[#2D3148] bg-[#151823] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Semantic Explorer
            </span>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              Live AST + Symbol Table
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any identifier or policy in the editor or below to inspect
          </span>
        </div>

        {/* Quick-Select Chips for Policies & Symbols */}
        <div className="mt-3 flex flex-col gap-2">
          {/* Policies Row */}
          {policies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <GitBranch className="h-3 w-3 text-indigo-400" />
                Policies:
              </span>
              {policies.map((pol) => {
                const isSelected = activeSelection.policy?.name === pol.name;
                return (
                  <button
                    key={pol.name}
                    type="button"
                    onClick={() => {
                      onSelectEntity({ kind: 'policy', name: pol.name });
                      onJumpToLine?.(pol.declarationLine, 1);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-sm'
                        : 'border-[#2D3148] bg-[#1A1D27] text-slate-300 hover:border-slate-600 hover:bg-[#222634]',
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    {pol.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Symbols Row */}
          {symbols.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Code2 className="h-3 w-3 text-emerald-400" />
                Symbols:
              </span>
              {symbols.map((sym) => {
                const isSelected = activeSelection.symbol?.id === sym.id;
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => {
                      onSelectEntity({ kind: 'symbol', id: sym.id });
                      onJumpToLine?.(sym.declarationLine, sym.declarationColumn);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20 text-blue-200 shadow-sm'
                        : 'border-[#2D3148] bg-[#1A1D27] text-slate-300 hover:border-slate-600 hover:bg-[#222634]',
                    )}
                  >
                    <span>{sym.name}</span>
                    <span className="rounded bg-[#0F1117]/70 px-1 py-0.2 text-[10px] text-slate-400">
                      {sym.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Inspector Body */}
      <div className="flex-1 p-5">
        {activeSelection.symbol && (
          <SymbolInspectorCard
            symbol={activeSelection.symbol}
            onSelectPolicy={(policyName) => {
              const pol = policies.find((p) => p.name === policyName);
              if (pol) {
                onSelectEntity({ kind: 'policy', name: pol.name });
                onJumpToLine?.(pol.declarationLine, 1);
              }
            }}
            onJumpToLine={onJumpToLine}
          />
        )}

        {activeSelection.policy && (
          <PolicyInspectorCard
            policy={activeSelection.policy}
            allPolicies={policies}
            allSymbols={symbols}
            onSelectEntity={onSelectEntity}
            onJumpToLine={onJumpToLine}
          />
        )}

        {!activeSelection.symbol && !activeSelection.policy && (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[#2D3148] text-center text-slate-400">
            <Layers className="mb-2 h-6 w-6 text-slate-500" />
            <p className="text-xs">No symbols or policies found in the current workspace.</p>
          </div>
        )}

        {/* Complete Symbol Table Overview Below Inspector */}
        {symbols.length > 0 && (
          <div className="mt-6 rounded-lg border border-[#2D3148] bg-[#151823] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2D3148] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Box className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Symbol Table ({symbols.length} symbols)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Click any row to inspect</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#2D3148] bg-[#0F1117]/60 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Declared In</th>
                    <th className="px-3 py-2">Scope</th>
                    <th className="px-3 py-2">Refs</th>
                    <th className="px-3 py-2">Initialized</th>
                    <th className="px-3 py-2">Used At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3148]/60 font-mono">
                  {symbols.map((sym) => {
                    const isSelected = activeSelection.symbol?.id === sym.id;
                    return (
                      <tr
                        key={sym.id}
                        onClick={() => {
                          onSelectEntity({ kind: 'symbol', id: sym.id });
                          onJumpToLine?.(sym.declarationLine, sym.declarationColumn);
                        }}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-blue-500/15 text-blue-200'
                            : 'hover:bg-[#1A1D27] text-slate-300',
                        )}
                      >
                        <td className="px-3 py-2 font-semibold text-blue-400">{sym.name}</td>
                        <td className="px-3 py-2 text-emerald-400">{sym.type}</td>
                        <td className="px-3 py-2 text-indigo-300">{sym.declaredIn}</td>
                        <td className="px-3 py-2 text-slate-300">{sym.scope}</td>
                        <td className="px-3 py-2">{sym.references}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-sans font-medium',
                              sym.initialized === 'Yes'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-400',
                            )}
                          >
                            {sym.initialized}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {sym.usedAt.length > 0
                            ? sym.usedAt.map((l) => `L${l}`).join(', ')
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Symbol Inspector View (e.g. clicking on `salary`)
// ─────────────────────────────────────────────────────────────────────────────

function SymbolInspectorCard({
  symbol,
  onSelectPolicy,
  onJumpToLine,
}: {
  symbol: ExplorerSymbolInfo;
  onSelectPolicy: (policyName: string) => void;
  onJumpToLine?: (line: number, column?: number) => void;
}) {
  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#151823] p-5 shadow-lg">
      {/* Selected Symbol Banner */}
      <div className="flex items-center justify-between border-b border-[#2D3148] pb-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">
            Symbol Semantic Inspector
          </span>
          <div className="mt-1 flex items-center gap-3">
            <h3 className="font-mono text-2xl font-bold text-white">{symbol.name}</h3>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400">
              {symbol.type}
            </span>
            <span className="rounded-md border border-[#2D3148] bg-[#1A1D27] px-2 py-0.5 text-[11px] text-slate-400">
              Declared at Line {symbol.declarationLine}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onJumpToLine?.(symbol.declarationLine, symbol.declarationColumn)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#2D3148] bg-[#1A1D27] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-blue-500/50 hover:text-blue-300"
        >
          <FileCode className="h-3.5 w-3.5 text-blue-400" />
          Go to Declaration
        </button>
      </div>

      {/* Structured Key-Value Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Name */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Name
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-white">
            {symbol.name}
          </div>
        </div>

        {/* Type */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Type
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
            {symbol.type}
          </div>
        </div>

        {/* Declared In */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Declared In
          </div>
          <button
            type="button"
            onClick={() => onSelectPolicy(symbol.declaredIn)}
            className="mt-1 inline-flex items-center gap-1 font-mono text-sm font-bold text-indigo-400 hover:underline"
          >
            {symbol.declaredIn}
          </button>
        </div>

        {/* Scope */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Scope
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-blue-300">
            {symbol.scope}
          </div>
        </div>

        {/* References */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            References
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-amber-400">
            {symbol.references}
          </div>
        </div>

        {/* Current Type */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Current Type
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
            {symbol.currentType}
          </div>
        </div>

        {/* Initialized */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Initialized
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {symbol.initialized}
          </div>
        </div>

        {/* Mutability */}
        <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Mutability
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-slate-300">
            {symbol.mutability}
          </div>
        </div>
      </div>

      {/* Used At Section */}
      <div className="mt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Used At
          </span>
          <span className="text-[11px] text-slate-400">
            Click any line to highlight in editor
          </span>
        </div>

        {symbol.usedAt.length === 0 ? (
          <div className="rounded-lg border border-[#2D3148] bg-[#0F1117] px-4 py-3 text-xs text-slate-400">
            No runtime references recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {symbol.usedAt.map((lineNum) => {
              const site = symbol.usageSites.find((u) => u.line === lineNum);
              return (
                <button
                  key={lineNum}
                  type="button"
                  onClick={() => onJumpToLine?.(lineNum, site?.column ?? 1)}
                  className="flex w-full items-center justify-between rounded-lg border border-[#2D3148] bg-[#0F1117] px-4 py-2.5 text-left transition-all hover:border-blue-500/60 hover:bg-[#1A1D27]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2.5 py-1 font-mono text-xs font-semibold text-blue-400">
                      <Hash className="h-3 w-3" />
                      Line {lineNum}
                    </span>
                    {site && (
                      <code className="font-mono text-xs text-slate-300">
                        {site.snippet}
                      </code>
                    )}
                  </div>
                  {site && (
                    <span className="rounded border border-[#2D3148] bg-[#151823] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      {site.role}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy Dependency Flow View (e.g. clicking on `LoanApproval`)
// ─────────────────────────────────────────────────────────────────────────────

function PolicyInspectorCard({
  policy,
  allPolicies,
  allSymbols,
  onSelectEntity,
  onJumpToLine,
}: {
  policy: ExplorerPolicyInfo;
  allPolicies: ExplorerPolicyInfo[];
  allSymbols: ExplorerSymbolInfo[];
  onSelectEntity: (entity: SelectedSemanticEntity) => void;
  onJumpToLine?: (line: number, column?: number) => void;
}) {
  const policySymbols = allSymbols.filter((s) => s.declaredIn === policy.name);

  return (
    <div className="rounded-xl border border-[#2D3148] bg-[#151823] p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#2D3148] pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
          Policy Dependency & Semantic Flow
        </span>
        <span className="text-xs text-slate-400">Line {policy.declarationLine}</span>
      </div>

      {/* Vertical Flow Pipeline matching requested specification */}
      <div className="mt-5 flex flex-col items-center">
        {/* Step 1: Policy Root Node */}
        <div className="w-full max-w-md rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-5 py-4 text-center shadow-md">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
            {policy.kind}
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-white">
            {policy.name}
          </div>
          {policySymbols.length > 0 && (
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              {policySymbols.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectEntity({ kind: 'symbol', id: s.id });
                    onJumpToLine?.(s.declarationLine, s.declarationColumn);
                  }}
                  className="rounded border border-indigo-400/30 bg-[#0F1117]/80 px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:border-blue-400 hover:text-blue-300"
                >
                  {s.name}: <span className="text-emerald-400">{s.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Arrow Down */}
        <div className="my-2 flex flex-col items-center text-slate-500">
          <ArrowDown className="h-5 w-5 text-blue-400" />
        </div>

        {/* Step 2: Depends On */}
        <div className="w-full max-w-md rounded-xl border border-[#2D3148] bg-[#0F1117] p-4">
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Depends On
          </div>

          {policy.dependsOn.length === 0 ? (
            <div className="mt-2 text-center font-mono text-xs text-slate-500">
              None (Leaf Policy)
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {policy.dependsOn.map((depName) => {
                const targetPol = allPolicies.find((p) => p.name === depName);
                return (
                  <button
                    key={depName}
                    type="button"
                    onClick={() => {
                      if (targetPol) {
                        onSelectEntity({ kind: 'policy', name: targetPol.name });
                        onJumpToLine?.(targetPol.declarationLine, 1);
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-[#2D3148] bg-[#151823] px-4 py-2.5 font-mono text-sm font-semibold text-blue-300 transition-all hover:border-blue-500/50 hover:bg-[#1A1D27]"
                  >
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
                      {depName}
                    </span>
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 font-sans text-[10px] font-medium',
                        targetPol
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400',
                      )}
                    >
                      {targetPol ? `Line ${targetPol.declarationLine}` : 'Undefined'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Arrow Down */}
        <div className="my-2 flex flex-col items-center text-slate-500">
          <ArrowDown className="h-5 w-5 text-blue-400" />
        </div>

        {/* Step 3: Circular Dependency Check */}
        <div
          className={cn(
            'w-full max-w-md rounded-xl border px-4 py-3 text-center',
            policy.hasCircularDependencies
              ? 'border-red-500/40 bg-red-500/10 text-red-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
          )}
        >
          <div className="flex items-center justify-center gap-2 font-medium text-sm">
            {policy.hasCircularDependencies ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span>
                  Circular Dependency: {policy.circularPath?.join(' → ')}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>No Circular Dependencies</span>
              </>
            )}
          </div>
        </div>

        {/* Arrow Down */}
        <div className="my-2 flex flex-col items-center text-slate-500">
          <ArrowDown className="h-5 w-5 text-blue-400" />
        </div>

        {/* Step 4: Compilation Status */}
        <div className="w-full max-w-md rounded-xl border border-[#2D3148] bg-[#0F1117] p-4 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Compilation Status
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            {policy.compilationStatus === 'Valid' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1 text-sm font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Valid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-1 text-sm font-bold text-red-400">
                <XCircle className="h-4 w-4" />
                Invalid ({policy.diagnosticsCount} issue
                {policy.diagnosticsCount === 1 ? '' : 's'})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
