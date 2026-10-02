/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — FPVM Program Loader & Instruction Decoder
 *
 * Accepts an `OptimizationResult`, `IRProgram`, or `CompiledArtifact` and:
 *   1. Decodes every `IRInstruction` into a fast `DecodedInstruction` record.
 *   2. Builds `O(1)` jump tables (`labelToIndex: Map<string, number>`).
 *   3. Identifies entry instruction indices for the primary Policy (`L1`),
 *      secondary Policies (`POLICY_CALL` targets), Functions (`L_FUNC_<name>`),
 *      and Rules (`L_RULE_<name>`), extracting formal parameter names from the
 *      `ISymbolTable` when available.
 *   4. Populates the initial `ConstantPool`.
 * ============================================================================
 */
import type { CompiledArtifact } from '@finpolicy/shared';
import type { IRInstruction, IRProgram } from '../ir/ir.interface';
import type { OptimizationResult } from '../optimizer/optimizer.interface';
import type { ISymbolTable } from '../symbol-table/symbol-table.interface';
import type { DecodedInstruction, LoadedProgramImage } from './runtime.interface';
export declare class InstructionDecoder {
    private readonly rewriter;
    /**
     * Decodes a list of `IRInstruction` objects into `DecodedInstruction` records.
     */
    decodeAll(instructions: IRInstruction[]): DecodedInstruction[];
}
export declare class ProgramLoader {
    private readonly decoder;
    private readonly rewriter;
    /**
     * Loads an `OptimizationResult`, `IRProgram`, or `CompiledArtifact` into an
     * executable `LoadedProgramImage`.
     */
    load(input: IRProgram | OptimizationResult | CompiledArtifact, symbolTable?: ISymbolTable): LoadedProgramImage;
    /**
     * Infers formal parameter names for a user function when no `ISymbolTable` is
     * explicitly passed by inspecting variables read before being written inside the function body.
     */
    private inferFunctionParameters;
    private extractIRProgram;
}
//# sourceMappingURL=program-loader.d.ts.map