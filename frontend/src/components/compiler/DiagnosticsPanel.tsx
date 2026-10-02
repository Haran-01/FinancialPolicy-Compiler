import { AlertTriangle, CheckCircle2, Info, Terminal } from 'lucide-react';
import type { Diagnostic } from '@/types';
import { cn } from '@/lib/utils';

interface DiagnosticsPanelProps {
  diagnostics: Diagnostic[];
  onSelectLine?: (line: number, column: number) => void;
}

export default function DiagnosticsPanel({
  diagnostics,
  onSelectLine,
}: DiagnosticsPanelProps) {
  if (!diagnostics || diagnostics.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
        <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500/80" />
        <p className="text-sm font-medium text-slate-200">No diagnostics reported</p>
        <p className="mt-1 text-xs text-slate-500">
          Run the compiler to validate lexical, syntax, and semantic rules.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#2D3148] overflow-y-auto">
      {diagnostics.map((diag, idx) => {
        const isError = diag.severity === 'ERROR';
        const isWarning = diag.severity === 'WARNING';

        return (
          <button
            key={`${diag.code}-${idx}`}
            type="button"
            onClick={() => onSelectLine?.(diag.line, diag.column)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#222536]"
          >
            <div className="mt-0.5 shrink-0">
              {isError ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : isWarning ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <Info className="h-4 w-4 text-blue-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold',
                    isError
                      ? 'bg-red-500/15 text-red-400'
                      : isWarning
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-blue-500/15 text-blue-400',
                  )}
                >
                  {diag.code}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  Ln {diag.line}, Col {diag.column}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-200">{diag.message}</p>
              {diag.source && (
                <div className="mt-1.5 flex items-center gap-1.5 rounded bg-[#0F1117] px-2.5 py-1 font-mono text-xs text-slate-300">
                  <Terminal className="h-3 w-3 shrink-0 text-slate-500" />
                  <span className="truncate">{diag.source}</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
