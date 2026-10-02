/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Basic Block Builder
 *
 * Implements the standard dragon-book Leader Identification & Basic Block
 * partitioning algorithm:
 *   Rule 1: The very first IR instruction (index 0) is a Leader.
 *   Rule 2: Any instruction that is the target of a conditional or
 *           unconditional jump (`LABEL` instruction) is a Leader.
 *   Rule 3: Any instruction that immediately follows a conditional or
 *           unconditional jump (`IF_FALSE`, `IF_TRUE`, `GOTO`) or a terminal
 *           control-flow instruction (`RETURN`, `THROW`, `HALT`)
 *           is a Leader.
 *
 * For each leader, its Basic Block consists of the leader and all subsequent
 * instructions up to (but not including) the next leader or the end of the
 * instruction stream.
 * ============================================================================
 */
import type { BasicBlock, IRInstruction } from './ir.interface';
export declare class BasicBlockBuilder {
    private readonly tacGenerator;
    /**
     * Identifies leaders in `instructions`, partitions them into `BasicBlock`s
     * (`B1`, `B2`, `B3`, ...), and stamps `basicBlockId` onto every instruction.
     */
    buildBasicBlocks(instructions: IRInstruction[]): BasicBlock[];
}
//# sourceMappingURL=basic-block-builder.d.ts.map