/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Validator
 *
 * Validates structural and control-flow integrity of the generated IR before
 * optimization or execution:
 *   - Missing or unresolved branch target labels (`IR-V001`)
 *   - Duplicate label definitions (`IR-V002`)
 *   - Usage of undeclared/uninitialized temporary variables (`IR-V003`)
 *   - Broken CFG edges referencing non-existent Basic Blocks (`IR-V004`)
 *   - Unreachable Basic Blocks (`IR-V005`)
 * ============================================================================
 */
import type { ControlFlowGraph, IRInstruction, IRValidationResult } from './ir.interface';
export declare class IRValidator {
    /**
     * Validates the instruction stream and Control Flow Graph.
     */
    validate(instructions: IRInstruction[], cfg: ControlFlowGraph): IRValidationResult;
}
//# sourceMappingURL=ir-validator.d.ts.map