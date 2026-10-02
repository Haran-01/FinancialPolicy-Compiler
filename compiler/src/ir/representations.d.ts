/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Classical IR Representations
 *
 * Implements the 4 classical compiler IR generators from the unified
 * `IRInstruction[]` stream:
 *   1. `TACGenerator`           — Three Address Code (`t1 = salary >= 60000`)
 *   2. `QuadrupleGenerator`     — 4-tuple `(op, arg1, arg2, result)`
 *   3. `TripleGenerator`        — Indexed 3-tuple `(index, op, arg1, arg2)`
 *                                 where temporaries are replaced by `(i)`
 *   4. `IndirectTripleGenerator`— Pointer table `P0 -> (0)` decoupling
 *                                 execution order from Triple storage
 * ============================================================================
 */
import type { IndirectTripleTable, IRInstruction, Quadruple, ThreeAddressInstruction, Triple } from './ir.interface';
export declare class TACGenerator {
    /**
     * Transforms a list of `IRInstruction` objects into canonical
     * `ThreeAddressInstruction` records.
     */
    generate(instructions: IRInstruction[]): ThreeAddressInstruction[];
}
export declare class QuadrupleGenerator {
    /**
     * Converts `IRInstruction[]` into a table of `Quadruple` records:
     * `(index, op, arg1, arg2, result)`
     */
    generate(instructions: IRInstruction[]): Quadruple[];
}
export declare class TripleGenerator {
    /**
     * Converts `IRInstruction[]` into an indexed `Triple[]` table where
     * temporary variable names (`t1`, `t2`, ...) are replaced by their defining
     * triple index reference (`(0)`, `(1)`, ...).
     */
    generate(instructions: IRInstruction[]): Triple[];
}
export declare class IndirectTripleGenerator {
    private readonly tripleGenerator;
    constructor(tripleGenerator?: TripleGenerator);
    /**
     * Generates an `IndirectTripleTable` consisting of:
     * - `pointers`: Execution order slots (`P0 -> (0)`, `P1 -> (1)`, ...)
     * - `triples`: The underlying indexed `Triple[]` records
     */
    generate(instructions: IRInstruction[]): IndirectTripleTable;
}
//# sourceMappingURL=representations.d.ts.map