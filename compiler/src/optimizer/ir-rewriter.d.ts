/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Rewriter & Program Rebuilder
 *
 * Provides safe, immutable IR transformation utilities:
 *   1. Deep cloning of `IRInstruction` and `IROperand` objects
 *   2. Formatting individual `IRInstruction` instances into canonical TAC strings
 *      for `TransformationRecord` tracking (`before` / `after`)
 *   3. Re-indexing instruction streams (`index: 0..N-1`)
 *   4. Rebuilding a complete, validated `IRProgram` (Basic Blocks, CFG, TAC,
 *      Quadruples, Triples, Indirect Triples, Temporary/Label tables, and
 *      Pretty-Printed views) after any optimization pass mutates instructions.
 * ============================================================================
 */
import type { IRInstruction, IROperand, IRProgram } from '../ir/ir.interface';
export declare class IRRewriter {
    private readonly tacGenerator;
    private readonly quadGenerator;
    private readonly tripleGenerator;
    private readonly indirectTripleGenerator;
    private readonly blockBuilder;
    private readonly cfgBuilder;
    private readonly validator;
    private readonly printer;
    /**
     * Deep-clones an `IROperand` so optimization passes never mutate the original `IRProgram`.
     */
    cloneOperand(op: IROperand): IROperand;
    /**
     * Deep-clones an `IRInstruction`.
     */
    cloneInstruction(inst: IRInstruction): IRInstruction;
    /**
     * Deep-clones an entire instruction array.
     */
    cloneInstructions(instructions: IRInstruction[]): IRInstruction[];
    /**
     * Formats a single `IRInstruction` into its canonical TAC line string
     * (e.g., `t1 = salary + bonus` or `IF_FALSE t3 GOTO L2`).
     */
    formatInstructionTAC(inst: IRInstruction): string;
    /**
     *Rewrites `inst` into a direct assignment `dest = operand` (used by Constant Folding,
     * Algebraic Simplification, Strength Reduction, and CSE).
     */
    rewriteAsAssignment(inst: IRInstruction, sourceOperand: IROperand, comment?: string): IRInstruction;
    /**
     * Re-indexes instructions sequentially (`0 .. N-1`) and rebuilds a complete,
     * self-consistent, validated `IRProgram` with fresh Basic Blocks, CFG,
     * TAC, Quadruples, Triples, Indirect Triples, and Pretty-Printed tables.
     */
    rebuildProgram(baseProgram: IRProgram, newInstructions: IRInstruction[]): IRProgram;
    /**
     * Recomputes the active `TemporaryVariableInfo[]` list from the current instruction stream.
     */
    private extractTemporariesMetadata;
    /**
     * Recomputes `LabelInfo[]` and the `label -> instructionIndex` map.
     */
    private extractLabelsMetadata;
}
//# sourceMappingURL=ir-rewriter.d.ts.map