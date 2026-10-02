/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Pretty Printer
 *
 * Formats Three Address Code (TAC), Quadruples, Triples, Indirect Triples,
 * Basic Blocks, and Control Flow Graphs into clean, human-readable text tables.
 * ============================================================================
 */
import type { BasicBlock, ControlFlowGraph, IndirectTripleTable, Quadruple, ThreeAddressInstruction, Triple } from './ir.interface';
export declare class IRPrettyPrinter {
    /**
     * Formats Three Address Code (TAC) matching the specification:
     * ```
     * ----------------------------------
     * L1
     * t1 = salary >= 60000
     * t2 = age >= 21
     * t3 = t1 AND t2
     * IF_FALSE t3 GOTO L2
     * APPROVE
     * interest = 8.5
     * GOTO L3
     * L2
     * REJECT
     * L3
     * RETURN
     * ----------------------------------
     * ```
     */
    formatTAC(tac: ThreeAddressInstruction[]): string;
    /**
     * Formats the Quadruple Table `(Index, Operator, Arg1, Arg2, Result)`.
     */
    formatQuadruples(quads: Quadruple[]): string;
    /**
     * Formats the Triple Table `(Index, Operator, Arg1, Arg2)`.
     */
    formatTriples(triples: Triple[]): string;
    /**
     * Formats the Indirect Triple Table (`PointerTable` + `TriplePool`).
     */
    formatIndirectTriples(indirect: IndirectTripleTable): string;
    /**
     * Formats Basic Blocks and CFG edges into a structured summary.
     */
    formatCFG(cfg: ControlFlowGraph, basicBlocks: BasicBlock[]): string;
}
//# sourceMappingURL=ir-pretty-printer.d.ts.map