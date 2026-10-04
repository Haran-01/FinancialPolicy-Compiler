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
      className="flex h-7 shrink-0 items-center justify-between border-t border-[#D8DEE9] bg-white px-3 font-mono text-[11px] text-[#64748B] select-none"
    >
      {/* Left: Compiler Status & Current Policy */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          {compileStatus === 'FAILED' ? (
            <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
          )}
          <span className="text-[#111827]">
            Compiler: {compileStatus}
          </span>
        </span>

        <span className="flex items-center gap-1.5 text-[#2563EB]">
          <FileCode2 className="h-3.5 w-3.5" />
          <span>{policyName || 'No Policy'}</span>
        </span>

        {!backendOnline && (
          <span className="rounded bg-[#D97706]/10 px-1.5 py-0.2 text-[10px] font-semibold text-[#D97706]">
            Offline Local Mode
          </span>
        )}
      </div>

      {/* Right: Compile Time, Execution Time, Cursor Position, Encoding, Dev Mode */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-[#2563EB]" />
          <span>
            Compile: {compileTimeMs !== null ? `${compileTimeMs} ms` : '—'}
          </span>
        </span>

        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-[#059669]" />
          <span>
            Exec: {executionTimeMs !== null ? `${executionTimeMs} ms` : '—'}
          </span>
        </span>

        <span data-testid="status-cursor-pos">
          Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
        </span>

        <span>{encoding}</span>

        {developerMode && (
          <span className="inline-flex items-center gap-1 rounded bg-[#0F766E]/10 px-1.5 py-0.2 text-[10px] font-bold text-[#0F766E]">
            <TerminalSquare className="h-3 w-3" /> DEV MODE
          </span>
        )}
      </div>
    </footer>
  )
}
export default StudioStatusBar
