/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Control Flow Graph (CFG) Builder
 *
 * Constructs a complete Control Flow Graph (`ControlFlowGraph`) from partitioned
 * `BasicBlock`s:
 *   - Synthesizes `ENTRY` and `EXIT` sentinel blocks
 *   - Wires directed edges (`TRUE_BRANCH`, `FALSE_BRANCH`, `UNCONDITIONAL_JUMP`,
 *     `FALLTHROUGH`, `LOOP_BACK`, `EXIT_EDGE`)
 *   - Populates `predecessors` and `successors` on every `BasicBlock`
 *   - Computes BFS reachability from `ENTRY`
 *   - Generates a Mermaid flowchart diagram for visualization
 * ============================================================================
 */
import type { BasicBlock, ControlFlowGraph } from './ir.interface';
export declare class ControlFlowBuilder {
    /**
     * Builds a complete `ControlFlowGraph` from partitioned `BasicBlock`s.
     */
    buildCFG(policyName: string, coreBlocks: BasicBlock[]): ControlFlowGraph;
    private generateMermaidDiagram;
}
export { ControlFlowBuilder as CFGBuilder };
//# sourceMappingURL=cfg-builder.d.ts.map