import Editor from '@monaco-editor/react';
import DiagnosticsPanel from './DiagnosticsPanel';
import IRExplorerPanel from './IRExplorerPanel';
import SemanticExplorerPanel, {
  type SelectedSemanticEntity,
} from './SemanticExplorerPanel';
import type { LiveIRGenerationResult } from '@/lib/fpl-ir-engine';
import type { LiveSemanticAnalysisResult } from '@/lib/fpl-semantic-engine';
import type { CompilationJob } from '@/types';
import type { CompilerOutputTab } from '@/stores/compiler.store';
import { cn } from '@/lib/utils';

interface CompilerOutputTabsProps {
  activeTab: CompilerOutputTab;
  onTabChange: (tab: CompilerOutputTab) => void;
  result: CompilationJob | null;
  liveAnalysis: LiveSemanticAnalysisResult;
  liveIR: LiveIRGenerationResult;
  selectedEntity: SelectedSemanticEntity | null;
  onSelectEntity: (entity: SelectedSemanticEntity) => void;
  onJumpToLine?: (line: number, column?: number) => void;
}

const TABS: { id: CompilerOutputTab; label: string }[] = [
  { id: 'semantic', label: 'Semantic Explorer' },
  { id: 'ir', label: 'IR & CFG Explorer' },
  { id: 'tac', label: '3-Address Code' },
  { id: 'quadruples', label: 'Quadruples' },
  { id: 'triples', label: 'Triples' },
  { id: 'ast', label: 'AST' },
  { id: 'diagnostics', label: 'Diagnostics' },
];

export default function CompilerOutputTabs({
  activeTab,
  onTabChange,
  result,
  liveAnalysis,
  liveIR,
  selectedEntity,
  onSelectEntity,
  onJumpToLine,
}: CompilerOutputTabsProps) {
  const diagnostics =
    result?.diagnostics && result.diagnostics.length > 0
      ? result.diagnostics
      : liveAnalysis.diagnostics;
  const artifact = result?.artifact;

  return (
    <div className="flex h-full flex-col bg-[#1A1D27]">
      {/* Tab Bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#2D3148] bg-[#0F1117] px-3 pt-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative rounded-t-md px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-[#1A1D27] text-blue-400 border-t border-x border-[#2D3148]'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {tab.label}
              {tab.id === 'semantic' && (
                <span className="ml-1.5 rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[10px] text-blue-400">
                  {liveAnalysis.symbols.length + liveAnalysis.policies.length}
                </span>
              )}
              {tab.id === 'ir' && (
                <span className="ml-1.5 rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300">
                  {liveIR.instructions.length}
                </span>
              )}
              {tab.id === 'diagnostics' && diagnostics.length > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] text-red-400">
                  {diagnostics.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'semantic' ? (
          <SemanticExplorerPanel
            analysis={liveAnalysis}
            selectedEntity={selectedEntity}
            onSelectEntity={onSelectEntity}
            onJumpToLine={onJumpToLine}
          />
        ) : activeTab === 'ir' ? (
          <IRExplorerPanel
            key="ir-cfg"
            irResult={liveIR}
            initialSubView="tac"
            onJumpToLine={(l) => onJumpToLine?.(l, 1)}
          />
        ) : activeTab === 'quadruples' ? (
          <IRExplorerPanel
            key="ir-quads"
            irResult={liveIR}
            initialSubView="quadruples"
            onJumpToLine={(l) => onJumpToLine?.(l, 1)}
          />
        ) : activeTab === 'triples' ? (
          <IRExplorerPanel
            key="ir-triples"
            irResult={liveIR}
            initialSubView="triples"
            onJumpToLine={(l) => onJumpToLine?.(l, 1)}
          />
        ) : activeTab === 'tac' ? (
          <Editor
            height="100%"
            defaultLanguage="plaintext"
            value={artifact?.tac || liveIR.prettyTAC}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        ) : activeTab === 'diagnostics' ? (
          <DiagnosticsPanel diagnostics={diagnostics} />
        ) : (
          <Editor
            height="100%"
            defaultLanguage="json"
            value={JSON.stringify(
              artifact?.ast ?? liveAnalysis.astSummary,
              null,
              2,
            )}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        )}
      </div>
    </div>
  );
}
