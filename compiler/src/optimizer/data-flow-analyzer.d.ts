/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Data Flow Analyzer
 *
 * Provides data-flow and liveness analysis over `IRInstruction[]` and
 * `BasicBlock[]`:
 *   1. Use-Def & Reference Counting (`computeUseCounts`) for temporary
 *      variables and user variables
 *   2. Dead Overwritten Store Detection (`findOverwrittenStores`) within a
 *      Basic Block (`x = 100; x = 200` where the first `x` is never read)
 *   3. Unused Temporary Detection (`findUnusedTemporaries`)
 *   4. Loop Back-Edge Target Detection (`findLoopHeaderLabels`) so constant
 *      and copy propagation never unsafely propagate across loop-carried variables
 * ============================================================================
 */
import type { IRInstruction } from '../ir/ir.interface';
export interface UseDefSummary {
    /** Number of times each variable or temporary name appears as a source operand */
    useCounts: Map<string, number>;
    /** Instruction IDs that define each variable or temporary name */
    definitions: Map<string, string[]>;
    /** Instruction IDs that read each variable or temporary name */
    uses: Map<string, string[]>;
}
export declare class DataFlowAnalyzer {
    /**
     * Computes global use-def statistics across the entire instruction stream.
     */
    analyzeUseDef(instructions: IRInstruction[]): UseDefSummary;
    /**
     * Identifies instructions within the same Basic Block that assign to a variable
     * or temporary (`x = 100`) and are immediately or subsequently overwritten (`x = 200`)
     * before `x` is ever read, without any intervening branch, label, or call.
     */
    findOverwrittenStoreIndices(instructions: IRInstruction[]): Set<number>;
    /**
     * Detects variables that are modified inside loops (labels that have back-edges jumping
     * backward to them). Propagating pre-loop constants into loop induction variables would
     * be unsound, so we identify all variables mutated between a backward-target label and its jump.
     */
    findLoopMutatedVariables(instructions: IRInstruction[]): Set<string>;
}
//# sourceMappingURL=data-flow-analyzer.d.ts.map