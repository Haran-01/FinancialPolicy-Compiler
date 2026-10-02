/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Intermediate Representation (IR) Barrel Exports
 * ============================================================================
 */
export { TemporaryVariableGenerator, TemporaryVariableManager, } from './temporary-manager';
export { LabelGenerator, LabelManager, type ConditionalLabelSet, type LoopLabelSet, } from './label-manager';
export { IRFactory, type CreateInstructionParams, } from './ir-factory';
export { InstructionBuilder, IRBuilder, } from './instruction-builder';
export { TACGenerator, QuadrupleGenerator, TripleGenerator, IndirectTripleGenerator, } from './representations';
export { BasicBlockBuilder } from './basic-block-builder';
export { ControlFlowBuilder, CFGBuilder, } from './cfg-builder';
export { IRValidator } from './ir-validator';
export { IRPrettyPrinter } from './ir-pretty-printer';
export { IRSerializer, type SerializedIRJson, type BinaryIREnvelope, } from './ir-serializer';
export { IRVisitor, IRGenerator, generateIR, } from './ir-generator';
export type { IROpcode, IROperand, IRInstruction, ThreeAddressInstruction, Quadruple, Triple, IndirectTripleEntry, IndirectTripleTable, TemporaryVariableInfo, LabelInfo, BasicBlockKind, BasicBlock, CFGEdgeKind, CFGEdge, ControlFlowGraph, IRValidationCode, IRValidationIssue, IRValidationResult, IRProgram, IRGenerationInput, IIRGenerator, } from './ir.interface';
//# sourceMappingURL=index.d.ts.map