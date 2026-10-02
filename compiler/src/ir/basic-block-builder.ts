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

import { IRFactory } from './ir-factory';
import type {
  BasicBlock,
  BasicBlockKind,
  IROpcode,
  IRInstruction,
} from './ir.interface';
import { TACGenerator } from './representations';

const BRANCH_OR_TERMINATOR_OPCODES = new Set<IROpcode>([
  'GOTO',
  'JUMP',
  'IF_FALSE',
  'IF_TRUE',
  'JUMP_IF',
  'JUMP_IF_NOT',
  'RETURN',
  'THROW',
  'HALT',
]);

export class BasicBlockBuilder {
  private readonly tacGenerator = new TACGenerator();

  /**
   * Identifies leaders in `instructions`, partitions them into `BasicBlock`s
   * (`B1`, `B2`, `B3`, ...), and stamps `basicBlockId` onto every instruction.
   */
  public buildBasicBlocks(instructions: IRInstruction[]): BasicBlock[] {
    if (instructions.length === 0) {
      return [];
    }

    // Collect all target label names referenced by jumps
    const jumpTargetLabels = new Set<string>();
    for (const inst of instructions) {
      if (
        (inst.opcode === 'GOTO' ||
          inst.opcode === 'JUMP' ||
          inst.opcode === 'IF_FALSE' ||
          inst.opcode === 'IF_TRUE' ||
          inst.opcode === 'JUMP_IF' ||
          inst.opcode === 'JUMP_IF_NOT') &&
        inst.destination?.kind === 'label'
      ) {
        jumpTargetLabels.add(inst.destination.name);
      }
    }

    // Step 1: Identify Leader indices and reasons
    const leaderReasons = new Map<number, BasicBlock['leaderReason']>();
    leaderReasons.set(0, 'FIRST_INSTRUCTION');

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i]!;

      // Rule 2: Any LABEL instruction (or jump target) starts a Basic Block
      if (inst.opcode === 'LABEL') {
        if (!leaderReasons.has(i)) {
          leaderReasons.set(i, 'JUMP_TARGET_LABEL');
        }
      }

      // Rule 3: Instruction immediately following a branch or terminator is a Leader
      if (BRANCH_OR_TERMINATOR_OPCODES.has(inst.opcode) && i + 1 < instructions.length) {
        if (!leaderReasons.has(i + 1)) {
          leaderReasons.set(i + 1, 'FOLLOWS_BRANCH_OR_TERMINATOR');
        }
      }
    }

    const sortedLeaderIndices = [...leaderReasons.keys()].sort((a, b) => a - b);
    const blocks: BasicBlock[] = [];

    // Step 2: Slice instructions into Basic Blocks B1..Bn
    for (let bIdx = 0; bIdx < sortedLeaderIndices.length; bIdx++) {
      const startIndex = sortedLeaderIndices[bIdx]!;
      const endIndex =
        bIdx + 1 < sortedLeaderIndices.length
          ? sortedLeaderIndices[bIdx + 1]! - 1
          : instructions.length - 1;

      const slice = instructions.slice(startIndex, endIndex + 1);
      const blockId = `B${bIdx + 1}`;
      const leaderInst = slice[0] ?? null;
      const lastInst = slice[slice.length - 1] ?? null;

      // Stamp basicBlockId onto each instruction in this block
      for (const inst of slice) {
        inst.basicBlockId = blockId;
      }

      // Determine block kind & descriptive label
      let kind: BasicBlockKind = 'NORMAL';
      if (
        lastInst &&
        (lastInst.opcode === 'IF_FALSE' ||
          lastInst.opcode === 'IF_TRUE' ||
          lastInst.opcode === 'JUMP_IF' ||
          lastInst.opcode === 'JUMP_IF_NOT')
      ) {
        kind = 'CONDITIONAL';
      } else if (
        slice.some(
          (s) =>
            s.opcode === 'APPROVE' ||
            s.opcode === 'REJECT' ||
            s.opcode === 'ALLOW' ||
            s.opcode === 'DENY' ||
            s.opcode === 'REVIEW',
        )
      ) {
        kind = 'DECISION';
      }

      const leadingLabelName =
        leaderInst?.opcode === 'LABEL' && leaderInst.destination?.kind === 'label'
          ? leaderInst.destination.name
          : null;

      const blockTitle = leadingLabelName
        ? `${blockId} (${leadingLabelName})`
        : blockId;

      const block = IRFactory.createBasicBlock({
        id: blockId,
        label: blockTitle,
        kind,
        containerName: leaderInst?.containerName ?? 'Global',
        leaderInstructionId: leaderInst?.id ?? null,
        leaderReason: leaderReasons.get(startIndex) ?? 'FIRST_INSTRUCTION',
        startIndex,
        endIndex,
        instructions: slice,
      });

      block.tacLines = this.tacGenerator.generate(slice).map((t) => t.text);
      blocks.push(block);
    }

    return blocks;
  }
}
