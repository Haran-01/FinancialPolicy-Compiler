import { create } from 'zustand';
import { FPL_SAMPLE_POLICY } from '@/lib/constants';
import type { CompilationJob } from '@/types';

import type { SelectedSemanticEntity } from '@/components/compiler/SemanticExplorerPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompilerOutputTab =
  | 'semantic'
  | 'diagnostics'
  | 'ast'
  | 'ir'
  | 'tac'
  | 'quadruples'
  | 'triples';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface CompilerStore {
  source: string;
  activeTab: CompilerOutputTab;
  compilationResult: CompilationJob | null;
  selectedSemanticEntity: SelectedSemanticEntity | null;
  isCompiling: boolean;
  currentJobId: string | null;
  pollingActive: boolean;

  // Actions
  setSource: (source: string) => void;
  setResult: (result: CompilationJob) => void;
  setActiveTab: (tab: CompilerOutputTab) => void;
  setSelectedSemanticEntity: (entity: SelectedSemanticEntity | null) => void;
  setIsCompiling: (compiling: boolean) => void;
  setCurrentJobId: (id: string | null) => void;
  setPollingActive: (active: boolean) => void;
  reset: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  source: FPL_SAMPLE_POLICY,
  activeTab: 'semantic' as CompilerOutputTab,
  compilationResult: null,
  selectedSemanticEntity: null as SelectedSemanticEntity | null,
  isCompiling: false,
  currentJobId: null,
  pollingActive: false,
};

// ─── Compiler Store ───────────────────────────────────────────────────────────

export const useCompilerStore = create<CompilerStore>()((set) => ({
  ...initialState,

  setSource: (source: string) => set({ source }),

  setResult: (compilationResult: CompilationJob) =>
    set({
      compilationResult,
      isCompiling: false,
      pollingActive: false,
      activeTab: compilationResult.diagnostics.some((d) => d.severity === 'ERROR')
        ? 'diagnostics'
        : 'semantic',
    }),

  setActiveTab: (activeTab: CompilerOutputTab) => set({ activeTab }),

  setSelectedSemanticEntity: (selectedSemanticEntity: SelectedSemanticEntity | null) =>
    set({ selectedSemanticEntity }),

  setIsCompiling: (isCompiling: boolean) => set({ isCompiling }),

  setCurrentJobId: (currentJobId: string | null) => set({ currentJobId }),

  setPollingActive: (pollingActive: boolean) => set({ pollingActive }),

  reset: () => set({ ...initialState, source: initialState.source }),
}));
