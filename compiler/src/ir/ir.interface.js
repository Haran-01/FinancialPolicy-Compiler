"use strict";
/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Intermediate Representation (IR) Contracts
 *
 * Phase 3D: Defines the complete, machine-independent, strongly-typed IR
 * data structures for:
 *   1. Reusable IR Instructions (`IRInstruction`, `IROpcode`, `IROperand`)
 *   2. Three Address Code (`ThreeAddressInstruction`)
 *   3. Quadruples (`Quadruple`: Operator, Argument1, Argument2, Result)
 *   4. Triples (`Triple`: Index, Operator, Argument1, Argument2)
 *   5. Indirect Triples (`IndirectTriple`: PointerIndex -> TripleIndex)
 *   6. Basic Blocks (`BasicBlock`: Leader identification & instruction slices)
 *   7. Control Flow Graph (`ControlFlowGraph`, `CFGNode`, `CFGEdge`)
 *   8. IR Validation (`IRValidationIssue`, `IRValidationResult`)
 *   9. Temporary Variable & Label Metadata (`TemporaryVariableInfo`, `LabelInfo`)
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=ir.interface.js.map