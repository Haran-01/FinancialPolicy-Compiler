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
import { IRRewriter } from '../optimizer/ir-rewriter';
import type { OptimizationResult } from '../optimizer/optimizer.interface';
import type { ISymbolTable } from '../symbol-table/symbol-table.interface';
import type {
  DecodedInstruction,
  SubroutineMetadata,
  LoadedProgramImage,
} from './runtime.interface';

export class InstructionDecoder {
  private readonly rewriter = new IRRewriter();

  /**
   * Decodes a list of `IRInstruction` objects into `DecodedInstruction` records.
   */
  public decodeAll(instructions: IRInstruction[]): DecodedInstruction[] {
    return instructions.map((inst, idx) => ({
      raw: inst,
      id: inst.id || `inst_${idx + 1}`,
      index: idx,
      opcode: inst.opcode,
      operatorSymbol: inst.operatorSymbol,
      operands: inst.operands,
      destination: inst.destination ?? inst.result ?? null,
      tacText: this.rewriter.formatInstructionTAC(inst),
      basicBlockId: inst.basicBlockId ?? null,
      containerName: inst.containerName || 'MainPolicy',
      sourceLine: inst.sourceLine ?? inst.sourceLocation?.line ?? 0,
    }));
  }
}

export class ProgramLoader {
  private readonly decoder = new InstructionDecoder();
  private readonly rewriter = new IRRewriter();

  /**
   * Loads an `OptimizationResult`, `IRProgram`, or `CompiledArtifact` into an
   * executable `LoadedProgramImage`.
   */
  public load(
    input: IRProgram | OptimizationResult | CompiledArtifact,
    symbolTable?: ISymbolTable,
  ): LoadedProgramImage {
    const irProgram = this.extractIRProgram(input);
    const decodedInstructions = this.decoder.decodeAll(irProgram.instructions);

    const constantPool = new Map<string, unknown>();
    for (const [k, v] of Object.entries(irProgram.constants ?? {})) {
      constantPool.set(k, v);
    }

    const labelToIndex = new Map<string, number>();
    const functions = new Map<string, SubroutineMetadata>();
    const policies = new Map<string, SubroutineMetadata>();
    const rules = new Map<string, SubroutineMetadata>();

    // Extract function parameter names from Symbol Table if provided
    const symFunctionParams = new Map<string, string[]>();
    if (symbolTable) {
      for (const sym of symbolTable.getAllSymbols()) {
        if (sym.kind === 'function' && sym.parameters) {
          symFunctionParams.set(
            sym.name,
            sym.parameters.map((p) => p.name),
          );
        }
      }
    }

    for (let i = 0; i < decodedInstructions.length; i++) {
      const inst = decodedInstructions[i];
      if (inst.opcode === 'LABEL' && inst.destination?.kind === 'label') {
        const labelName = inst.destination.name;
        labelToIndex.set(labelName, i);

        if (labelName.startsWith('L_FUNC_')) {
          const fnName = labelName.slice('L_FUNC_'.length);
          const paramNames =
            symFunctionParams.get(fnName) ??
            this.inferFunctionParameters(decodedInstructions, i + 1, fnName);
          functions.set(fnName, {
            name: fnName,
            kind: 'FUNCTION',
            entryInstructionIndex: i,
            labelName,
            parameterNames: paramNames,
          });
        } else if (labelName.startsWith('L_RULE_')) {
          const ruleName = labelName.slice('L_RULE_'.length);
          rules.set(ruleName, {
            name: ruleName,
            kind: 'RULE',
            entryInstructionIndex: i,
            labelName,
            parameterNames: [],
          });
        } else if (!policies.has(inst.containerName) && inst.containerName !== 'global') {
          policies.set(inst.containerName, {
            name: inst.containerName,
            kind: 'POLICY',
            entryInstructionIndex: i,
            labelName,
            parameterNames: [],
          });
        }
      }
    }

    // Determine primary entry instruction index:
    // Start at index 0 if global constant initializers exist before L1, otherwise at L1
    let entryInstructionIndex = 0;
    if (decodedInstructions.length > 0) {
      const firstNonFuncIdx = decodedInstructions.findIndex(
        (inst) =>
          inst.containerName === 'global' ||
          inst.containerName === irProgram.policyName,
      );
      if (firstNonFuncIdx >= 0) {
        entryInstructionIndex = firstNonFuncIdx;
      }
    }

    return {
      policyName: irProgram.policyName,
      instructions: decodedInstructions,
      threeAddressCode: irProgram.threeAddressCode,
      quadruples: irProgram.quadruples,
      basicBlocks: irProgram.basicBlocks,
      cfg: irProgram.cfg,
      constantPool,
      labelToIndex,
      functions,
      policies,
      rules,
      entryInstructionIndex,
      symbolTable,
    };
  }

  /**
   * Infers formal parameter names for a user function when no `ISymbolTable` is
   * explicitly passed by inspecting variables read before being written inside the function body.
   */
  private inferFunctionParameters(
    instructions: DecodedInstruction[],
    startIndex: number,
    fnName: string,
  ): string[] {
    const readBeforeWrite: string[] = [];
    const written = new Set<string>();

    for (let i = startIndex; i < instructions.length; i++) {
      const inst = instructions[i];
      if (inst.containerName !== fnName) break;

      for (const op of inst.operands) {
        if (
          op.kind === 'variable' &&
          !written.has(op.name) &&
          !readBeforeWrite.includes(op.name)
        ) {
          readBeforeWrite.push(op.name);
        }
      }

      if (inst.destination?.kind === 'variable') {
        written.add(inst.destination.name);
      }
    }

    return readBeforeWrite;
  }

  private extractIRProgram(
    input: IRProgram | OptimizationResult | CompiledArtifact,
  ): IRProgram {
    if ('optimizedProgram' in input && input.optimizedProgram) {
      return input.optimizedProgram;
    }
    if ('instructions' in input && Array.isArray(input.instructions)) {
      return input as IRProgram;
    }
    if ('ir' in input && Array.isArray(input.ir)) {
      const artifact = input as CompiledArtifact;
      const baseEmpty: IRProgram = {
        policyName: artifact.policyId || 'MainPolicy',
        instructions: [],
        threeAddressCode: [],
        quadruples: [],
        triples: [],
        indirectTriples: { pointers: [], triples: [] },
        basicBlocks: [],
        cfg: {
          name: artifact.policyId || 'MainPolicy',
          entryBlockId: 'ENTRY',
          exitBlockId: 'EXIT',
          blocks: [],
          edges: [],
          mermaidDiagram: '',
        },
        temporaries: [],
        labelsMeta: [],
        constants: {},
        labels: new Map(),
        validation: { valid: true, issues: [], errors: [], warnings: [] },
        prettyPrintedTAC: '',
        prettyPrintedQuadruples: '',
        prettyPrintedTriples: '',
        prettyPrintedIndirectTriples: '',
        prettyPrintedCFG: '',
      };
      return this.rewriter.rebuildProgram(
        baseEmpty,
        artifact.ir as IRInstruction[],
      );
    }
    throw new Error('Invalid program input passed to FPVM ProgramLoader.');
  }
}
