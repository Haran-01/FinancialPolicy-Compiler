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

import type {
  ControlFlowGraph,
  IRInstruction,
  IRValidationIssue,
  IRValidationResult,
} from './ir.interface';

export class IRValidator {
  /**
   * Validates the instruction stream and Control Flow Graph.
   */
  public validate(
    instructions: IRInstruction[],
    cfg: ControlFlowGraph,
  ): IRValidationResult {
    const issues: IRValidationIssue[] = [];

    // 1. Collect all defined labels and detect duplicates (IR-V002)
    const definedLabels = new Map<string, string>();
    for (const inst of instructions) {
      if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
        const labelName = inst.destination.name;
        if (definedLabels.has(labelName)) {
          issues.push({
            code: 'IR-V002',
            severity: 'ERROR',
            message: `Duplicate label '${labelName}' defined at instruction ${inst.id} (previously defined at ${definedLabels.get(labelName)})`,
            instructionId: inst.id,
            basicBlockId: inst.basicBlockId ?? undefined,
          });
        } else {
          definedLabels.set(labelName, inst.id);
        }
      }
    }

    // 2. Validate branch targets exist (IR-V001) & temporary variables are defined before use (IR-V003)
    const definedTemporaries = new Set<string>();

    for (const inst of instructions) {
      // Check temporary operands are already defined
      for (const op of inst.operands) {
        if (op.kind === 'temporary' && !definedTemporaries.has(op.name)) {
          issues.push({
            code: 'IR-V003',
            severity: 'ERROR',
            message: `Temporary variable '${op.name}' is read in instruction ${inst.id} before being defined`,
            instructionId: inst.id,
            basicBlockId: inst.basicBlockId ?? undefined,
          });
        }
      }

      // Record temporary definition if destination is a temporary
      if (inst.destination?.kind === 'temporary') {
        definedTemporaries.add(inst.destination.name);
      }

      // Check jump target labels
      if (
        inst.opcode === 'GOTO' ||
        inst.opcode === 'JUMP' ||
        inst.opcode === 'IF_FALSE' ||
        inst.opcode === 'IF_TRUE' ||
        inst.opcode === 'JUMP_IF' ||
        inst.opcode === 'JUMP_IF_NOT'
      ) {
        const targetLabel =
          inst.destination?.kind === 'label' ? inst.destination.name : null;

        if (!targetLabel || !definedLabels.has(targetLabel)) {
          issues.push({
            code: 'IR-V001',
            severity: 'ERROR',
            message: `Jump instruction ${inst.id} (${inst.opcode}) references missing label '${targetLabel ?? '<null>'}'`,
            instructionId: inst.id,
            basicBlockId: inst.basicBlockId ?? undefined,
          });
        }
      }
    }

    // 3. Validate CFG blocks and edges (IR-V004 & IR-V005)
    const blockIds = new Set(cfg.blocks.map((b) => b.id));

    for (const edge of cfg.edges) {
      if (!blockIds.has(edge.from) || !blockIds.has(edge.to)) {
        issues.push({
          code: 'IR-V004',
          severity: 'ERROR',
          message: `Broken CFG edge '${edge.id}': '${edge.from} -> ${edge.to}' references a non-existent Basic Block`,
        });
      }
    }

    for (const block of cfg.blocks) {
      if (!block.isReachable && block.id !== 'EXIT') {
        issues.push({
          code: 'IR-V005',
          severity: 'WARNING',
          message: `Basic Block '${block.label}' is unreachable from ENTRY`,
          basicBlockId: block.id,
        });
      }
    }

    const errors = issues.filter((i) => i.severity === 'ERROR');
    const warnings = issues.filter((i) => i.severity === 'WARNING');

    return {
      valid: errors.length === 0,
      issues,
      errors,
      warnings,
    };
  }
}
