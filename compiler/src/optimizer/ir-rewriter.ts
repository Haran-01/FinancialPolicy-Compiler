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

import { BasicBlockBuilder } from '../ir/basic-block-builder';
import { ControlFlowBuilder } from '../ir/cfg-builder';
import type {
  IRInstruction,
  IROperand,
  IRProgram,
  LabelInfo,
  TemporaryVariableInfo,
} from '../ir/ir.interface';
import { IRPrettyPrinter } from '../ir/ir-pretty-printer';
import { IRValidator } from '../ir/ir-validator';
import {
  IndirectTripleGenerator,
  QuadrupleGenerator,
  TACGenerator,
  TripleGenerator,
} from '../ir/representations';

export class IRRewriter {
  private readonly tacGenerator = new TACGenerator();
  private readonly quadGenerator = new QuadrupleGenerator();
  private readonly tripleGenerator = new TripleGenerator();
  private readonly indirectTripleGenerator = new IndirectTripleGenerator(this.tripleGenerator);
  private readonly blockBuilder = new BasicBlockBuilder();
  private readonly cfgBuilder = new ControlFlowBuilder();
  private readonly validator = new IRValidator();
  private readonly printer = new IRPrettyPrinter();

  /**
   * Deep-clones an `IROperand` so optimization passes never mutate the original `IRProgram`.
   */
  public cloneOperand(op: IROperand): IROperand {
    return { ...op };
  }

  /**
   * Deep-clones an `IRInstruction`.
   */
  public cloneInstruction(inst: IRInstruction): IRInstruction {
    const dest = inst.destination ? this.cloneOperand(inst.destination) : null;
    return {
      ...inst,
      operands: inst.operands.map((op) => this.cloneOperand(op)),
      destination: dest,
      result: dest,
      sourceLocation: inst.sourceLocation
        ? { ...inst.sourceLocation }
        : undefined,
    };
  }

  /**
   * Deep-clones an entire instruction array.
   */
  public cloneInstructions(instructions: IRInstruction[]): IRInstruction[] {
    return instructions.map((inst) => this.cloneInstruction(inst));
  }

  /**
   * Formats a single `IRInstruction` into its canonical TAC line string
   * (e.g., `t1 = salary + bonus` or `IF_FALSE t3 GOTO L2`).
   */
  public formatInstructionTAC(inst: IRInstruction): string {
    const tacList = this.tacGenerator.generate([inst]);
    return tacList[0]?.text ?? `${inst.opcode}`;
  }

  /**
   *Rewrites `inst` into a direct assignment `dest = operand` (used by Constant Folding,
   * Algebraic Simplification, Strength Reduction, and CSE).
   */
  public rewriteAsAssignment(
    inst: IRInstruction,
    sourceOperand: IROperand,
    comment?: string,
  ): IRInstruction {
    const cloned = this.cloneInstruction(inst);
    cloned.opcode = 'ASSIGN';
    cloned.operatorSymbol = '=';
    cloned.operands = [this.cloneOperand(sourceOperand)];
    if (sourceOperand.kind !== 'label' && sourceOperand.kind !== 'function' && sourceOperand.kind !== 'policy') {
      if (sourceOperand.dataType && sourceOperand.dataType !== 'unknown') {
        cloned.resultType = sourceOperand.dataType;
      }
    }
    if (comment) {
      cloned.comment = comment;
    }
    return cloned;
  }

  /**
   * Re-indexes instructions sequentially (`0 .. N-1`) and rebuilds a complete,
   * self-consistent, validated `IRProgram` with fresh Basic Blocks, CFG,
   * TAC, Quadruples, Triples, Indirect Triples, and Pretty-Printed tables.
   */
  public rebuildProgram(
    baseProgram: IRProgram,
    newInstructions: IRInstruction[],
  ): IRProgram {
    // 1. Clone and re-index instructions sequentially
    const instructions = newInstructions.map((inst, idx) => {
      const copy = this.cloneInstruction(inst);
      copy.index = idx;
      return copy;
    });

    // 2. Partition into Basic Blocks and stamp `basicBlockId`
    const basicBlocks = this.blockBuilder.buildBasicBlocks(instructions);

    // 3. Build Control Flow Graph (CFG)
    const cfg = this.cfgBuilder.buildCFG(baseProgram.policyName, basicBlocks);

    // 4. Generate TAC, Quadruples, Triples, Indirect Triples
    const threeAddressCode = this.tacGenerator.generate(instructions);
    const quadruples = this.quadGenerator.generate(instructions);
    const triples = this.tripleGenerator.generate(instructions);
    const indirectTriples = this.indirectTripleGenerator.generate(instructions);

    // 5. Recompute active TemporaryVariableInfo and LabelInfo tables
    const temporaries = this.extractTemporariesMetadata(instructions, baseProgram.temporaries);
    const { labelsMeta, labelIndexMap } = this.extractLabelsMetadata(
      instructions,
      baseProgram.labelsMeta,
    );

    // 6. Validate rebuilt IR & CFG
    const validation = this.validator.validate(instructions, cfg);

    // 7. Format Pretty-Printed views
    const prettyPrintedTAC = this.printer.formatTAC(threeAddressCode);
    const prettyPrintedQuadruples = this.printer.formatQuadruples(quadruples);
    const prettyPrintedTriples = this.printer.formatTriples(triples);
    const prettyPrintedIndirectTriples = this.printer.formatIndirectTriples(indirectTriples);
    const prettyPrintedCFG = this.printer.formatCFG(cfg, basicBlocks);

    return {
      policyName: baseProgram.policyName,
      instructions,
      threeAddressCode,
      quadruples,
      triples,
      indirectTriples,
      basicBlocks,
      cfg,
      temporaries,
      labelsMeta,
      constants: { ...baseProgram.constants },
      labels: labelIndexMap,
      validation,
      prettyPrintedTAC,
      prettyPrintedQuadruples,
      prettyPrintedTriples,
      prettyPrintedIndirectTriples,
      prettyPrintedCFG,
    };
  }

  /**
   * Recomputes the active `TemporaryVariableInfo[]` list from the current instruction stream.
   */
  private extractTemporariesMetadata(
    instructions: IRInstruction[],
    previousTemps: TemporaryVariableInfo[],
  ): TemporaryVariableInfo[] {
    const prevMap = new Map<string, TemporaryVariableInfo>();
    for (const t of previousTemps) {
      prevMap.set(t.name, t);
    }

    const activeMap = new Map<string, TemporaryVariableInfo>();

    const ensureTemp = (name: string, id: number, inst: IRInstruction): TemporaryVariableInfo => {
      let entry = activeMap.get(name);
      if (!entry) {
        const prev = prevMap.get(name);
        entry = {
          name,
          id: prev?.id ?? id,
          dataType: inst.resultType ?? prev?.dataType ?? 'unknown',
          expressionSummary: prev?.expressionSummary ?? this.formatInstructionTAC(inst),
          definedAtInstructionId: inst.id,
          usedAtInstructionIds: [],
          basicBlockId: inst.basicBlockId,
          sourceLine: inst.sourceLine ?? prev?.sourceLine,
        };
        activeMap.set(name, entry);
      }
      return entry;
    };

    for (const inst of instructions) {
      if (inst.destination?.kind === 'temporary') {
        const entry = ensureTemp(inst.destination.name, inst.destination.id, inst);
        entry.definedAtInstructionId = inst.id;
        entry.basicBlockId = inst.basicBlockId;
        entry.expressionSummary = this.formatInstructionTAC(inst);
      }

      for (const op of inst.operands) {
        if (op.kind === 'temporary') {
          const entry = ensureTemp(op.name, op.id, inst);
          if (!entry.usedAtInstructionIds.includes(inst.id)) {
            entry.usedAtInstructionIds.push(inst.id);
          }
        }
      }
    }

    return Array.from(activeMap.values()).sort((a, b) => a.id - b.id);
  }

  /**
   * Recomputes `LabelInfo[]` and the `label -> instructionIndex` map.
   */
  private extractLabelsMetadata(
    instructions: IRInstruction[],
    previousLabels: LabelInfo[],
  ): { labelsMeta: LabelInfo[]; labelIndexMap: Map<string, number> } {
    const prevMap = new Map<string, LabelInfo>();
    for (const l of previousLabels) {
      prevMap.set(l.name, l);
    }

    const activeLabels = new Map<string, LabelInfo>();
    const labelIndexMap = new Map<string, number>();

    const ensureLabel = (name: string): LabelInfo => {
      let info = activeLabels.get(name);
      if (!info) {
        const prev = prevMap.get(name);
        const numericId = Number(name.replace(/^L/i, '')) || activeLabels.size + 1;
        info = {
          name,
          id: prev?.id ?? numericId,
          role: prev?.role ?? 'BRANCH_TARGET',
          instructionIndex: -1,
          basicBlockId: null,
          referencedByInstructionIds: [],
        };
        activeLabels.set(name, info);
      }
      return info;
    };

    for (const inst of instructions) {
      if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
        const info = ensureLabel(inst.destination.name);
        info.instructionIndex = inst.index;
        info.basicBlockId = inst.basicBlockId;
        labelIndexMap.set(inst.destination.name, inst.index);
      } else if (
        (inst.opcode === 'GOTO' ||
          inst.opcode === 'JUMP' ||
          inst.opcode === 'IF_FALSE' ||
          inst.opcode === 'IF_TRUE' ||
          inst.opcode === 'JUMP_IF' ||
          inst.opcode === 'JUMP_IF_NOT') &&
        inst.destination?.kind === 'label'
      ) {
        const info = ensureLabel(inst.destination.name);
        if (!info.referencedByInstructionIds.includes(inst.id)) {
          info.referencedByInstructionIds.push(inst.id);
        }
      }
    }

    return {
      labelsMeta: Array.from(activeLabels.values()).sort((a, b) => a.id - b.id),
      labelIndexMap,
    };
  }
}
