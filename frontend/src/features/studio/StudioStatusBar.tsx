/**
 * FinPolicy Studio — Bottom Status Bar
 * Displays Compiler Status, Current Policy, Cursor Position, Encoding,
 * Compile Time, and Execution Time.
 */

import {
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Clock,
  TerminalSquare,
} from 'lucide-react'
import { useStudioStore } from '@/stores/studio.store'

interface StudioStatusBarProps {
  policyName: string
  compileStatus: 'READY' | 'SUCCESS' | 'FAILED' | 'WARNING'
  compileTimeMs: number | null
  executionTimeMs: number | null
}

export function StudioStatusBar({
  policyName,
  compileStatus,
  compileTimeMs,
  executionTimeMs,
}: StudioStatusBarProps) {
  const {
    cursorPosition,
    encoding,
    developerMode,
    backendOnline,
  } = useStudioStore()

  return (
    <footer
      data-testid="studio-status-bar"
      className="flex h-7 shrink-0 items-center justify-between border-t border-[#2D3148] bg-[#0F121C] px-3 font-mono text-[11px] text-[#94A3B8] select-none"
    >
      {/* Left: Compiler Status & Current Policy */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          {compileStatus === 'FAILED' ? (
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          )}
          <span className="text-white">
            Compiler: {compileStatus}
          </span>
        </span>

        <span className="flex items-center gap-1.5 text-blue-400">
          <FileCode2 className="h-3.5 w-3.5" />
          <span>{policyName || 'No Policy'}</span>
        </span>

        {!backendOnline && (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
            Offline Local Mode
          </span>
        )}
      </div>

      {/* Right: Compile Time, Execution Time, Cursor Position, Encoding, Dev Mode */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-blue-400" />
          <span>
            Compile: {compileTimeMs !== null ? `${compileTimeMs} ms` : '—'}
          </span>
        </span>

        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-emerald-400" />
          <span>
            Exec: {executionTimeMs !== null ? `${executionTimeMs} ms` : '—'}
          </span>
        </span>

        <span data-testid="status-cursor-pos">
          Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
        </span>

        <span>{encoding}</span>

        {developerMode && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400">
            <TerminalSquare className="h-3 w-3" /> DEV MODE
          </span>
        )}
      </div>
    </footer>
  )
}
export default StudioStatusBar
