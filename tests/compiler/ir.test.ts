/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Intermediate Representation (IR) Test Suite
 * Phase 3D: Comprehensive Unit Tests for IRGenerator, TACGenerator,
 *           QuadrupleGenerator, TripleGenerator, IndirectTripleGenerator,
 *           BasicBlockBuilder, ControlFlowBuilder, IRValidator & IRSerializer
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { parseSource } from '../../compiler/src/parser';
import { analyzeSemantics } from '../../compiler/src/semantic';
import {
  generateIR,
  IRSerializer,
  IRValidator,
  InstructionBuilder,
  IRFactory,
  BasicBlockBuilder,
  ControlFlowBuilder,
} from '../../compiler/src/ir';

/**
 * Helper to run Lexer -> Parser -> ASTRepository -> SemanticAnalyzer -> IRGenerator
 */
function compileToIR(source: string) {
  const parseResult = parseSource(source);
  expect(parseResult.hasErrors).toBe(false);
  expect(parseResult.repository).not.toBeNull();

  const semanticResult = analyzeSemantics(parseResult.repository!, source);
  expect(semanticResult.hasErrors).toBe(false);

  return generateIR(semanticResult, semanticResult.symbolTable);
}

describe('FPL Intermediate Representation (IR) Generation Engine', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Canonical Policy Lowering & Pretty Printed TAC
  // ──────────────────────────────────────────────────────────────────────────

  describe('Canonical Policy TAC & Pretty Printing', () => {
    it('generates the exact canonical TAC, labels (L1, L2, L3), and temporaries (t1, t2, t3) for LoanApproval', () => {
      const source = `
POLICY LoanApproval
INPUT
  salary : decimal
  age : int
OUTPUT
  interest : decimal
WHEN
  salary >= 60000 AND age >= 21
THEN
  ALLOW
  EMIT interest = 8.5
ELSE
  DENY
END
`;
      const ir = compileToIR(source);

      expect(ir.validation.valid).toBe(true);
      expect(ir.temporaries).toHaveLength(3);
      expect(ir.temporaries.map((t) => t.name)).toEqual(['t1', 't2', 't3']);

      const tacLines = ir.threeAddressCode.map((t) => t.text);
      expect(tacLines).toEqual([
        'L1',
        't1 = salary >= 60000',
        't2 = age >= 21',
        't3 = t1 AND t2',
        'IF_FALSE t3 GOTO L2',
        'APPROVE',
        'interest = 8.5',
        'GOTO L3',
        'L2',
        'REJECT',
        'L3',
        'RETURN',
      ]);

      expect(ir.prettyPrintedTAC).toBe(
        [
          '----------------------------------',
          'L1',
          't1 = salary >= 60000',
          't2 = age >= 21',
          't3 = t1 AND t2',
          'IF_FALSE t3 GOTO L2',
          'APPROVE',
          'interest = 8.5',
          'GOTO L3',
          'L2',
          'REJECT',
          'L3',
          'RETURN',
          '----------------------------------',
        ].join('\n'),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Assignments & Arithmetic Expressions
  // ──────────────────────────────────────────────────────────────────────────

  describe('Assignments & Arithmetic Expressions', () => {
    it('lowers salary = bonus + allowance into t1 = bonus + allowance; salary = t1', () => {
      const source = `
POLICY PayrollCalc
INPUT
  bonus : decimal
  allowance : decimal
WHEN
  true
THEN
  VAR salary : decimal = 0.0
  SET salary = bonus + allowance
  ALLOW
END
`;
      const ir = compileToIR(source);
      const tacLines = ir.threeAddressCode.map((t) => t.text);

      expect(tacLines).toContain('t1 = bonus + allowance');
      expect(tacLines).toContain('salary = t1');
    });

    it('lowers complex multi-operator arithmetic (+, -, *, /, %) with unique temporaries', () => {
      const source = `
POLICY TaxFormula
INPUT
  gross : decimal
  deduction : decimal
  rate : decimal
WHEN
  gross > 0
THEN
  LET taxable : decimal = (gross - deduction) * rate / 100.0
  LOG taxable
  ALLOW
END
`;
      const ir = compileToIR(source);
      expect(ir.validation.valid).toBe(true);

      const tacLines = ir.threeAddressCode.map((t) => t.text);
      expect(tacLines).toContain('t2 = gross - deduction');
      expect(tacLines).toContain('t3 = t2 * rate');
      expect(tacLines).toContain('t4 = t3 / 100');
      expect(tacLines).toContain('taxable = t4');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Quadruples, Triples & Indirect Triples
  // ──────────────────────────────────────────────────────────────────────────

  describe('Quadruples, Triples & Indirect Triples', () => {
    it('generates valid Quadruples, indexed Triples, and Indirect Triple pointer tables', () => {
      const source = `
POLICY SimpleCheck
INPUT
  salary : decimal
  age : int
WHEN
  salary >= 60000 AND age >= 21
THEN
  ALLOW
ELSE
  DENY
END
`;
      const ir = compileToIR(source);

      // Verify Quadruples: (op, arg1, arg2, result)
      const gteSalaryQuad = ir.quadruples.find((q) => q.result === 't1');
      expect(gteSalaryQuad).toBeDefined();
      expect(gteSalaryQuad?.op).toBe('>=');
      expect(gteSalaryQuad?.arg1).toBe('salary');
      expect(gteSalaryQuad?.arg2).toBe('60000');

      const andQuad = ir.quadruples.find((q) => q.result === 't3');
      expect(andQuad?.op).toBe('AND');
      expect(andQuad?.arg1).toBe('t1');
      expect(andQuad?.arg2).toBe('t2');

      // Verify Triples replace t1 and t2 with (index) references
      const andTriple = ir.triples[andQuad!.index];
      expect(andTriple?.op).toBe('AND');
      expect(andTriple?.arg1).toBe(`(${gteSalaryQuad!.index})`);

      // Verify Indirect Triples pointer table
      expect(ir.indirectTriples.pointers).toHaveLength(ir.triples.length);
      expect(ir.indirectTriples.pointers[0]?.pointerLabel).toBe('P0');
      expect(ir.indirectTriples.pointers[0]?.tripleIndex).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Nested IF / ELSEIF / ELSE & Loops
  // ──────────────────────────────────────────────────────────────────────────

  describe('Nested Control Flow & Loops', () => {
    it('generates structured labels and branch instructions for nested IF / ELSEIF / ELSE and FOR loops', () => {
      const source = `
POLICY TieredUnderwriting
INPUT
  score : int
  income : decimal
WHEN
  score >= 600
THEN
  VAR multiplier : decimal = 1.0
  IF score >= 800 THEN
    SET multiplier = 5.0
  ELSEIF score >= 700 THEN
    SET multiplier = 3.5
  ELSE
    SET multiplier = 2.0
  END

  FOR year FROM 1 TO 3 DO
    SET multiplier = multiplier + 0.5
  END
  ALLOW
ELSE
  DENY
END
`;
      const ir = compileToIR(source);
      expect(ir.validation.valid).toBe(true);
      expect(ir.basicBlocks.length).toBeGreaterThanOrEqual(6);

      // Ensure loop back-edge exists in CFG
      const hasBackEdge = ir.cfg.edges.some((e) => e.kind === 'LOOP_BACK');
      expect(hasBackEdge).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Function Calls & Policy Calls
  // ──────────────────────────────────────────────────────────────────────────

  describe('Function Calls & Policy Calls', () => {
    it('emits PARAM, CALL, and POLICY_CALL instructions for functions and sub-policies', () => {
      const source = `
FUNCTION CalcRatio(debt: decimal, income: decimal) RETURNS decimal
  RETURN debt / income
END

POLICY SubPolicyKYC
WHEN true THEN ALLOW
END

POLICY MainUnderwriting
INPUT
  debt : decimal
  income : decimal
WHEN
  income > 0
THEN
  CALL SubPolicyKYC
  LET ratio : decimal = CalcRatio(debt, income)
  LOG ratio
  ALLOW
END
`;
      const ir = compileToIR(source);
      expect(ir.validation.valid).toBe(true);

      const opcodes = ir.instructions.map((i) => i.opcode);
      expect(opcodes).toContain('POLICY_CALL');
      expect(opcodes).toContain('PARAM');
      expect(opcodes).toContain('CALL');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Basic Blocks, Control Flow Graph (CFG), Validator & Serializer
  // ──────────────────────────────────────────────────────────────────────────

  describe('CFG Builder, IR Validator & Serializer', () => {
    it('identifies leaders, constructs ENTRY/EXIT CFG edges, and serializes to JSON and Binary envelope', () => {
      const source = `
POLICY LoanApproval
INPUT
  age : int
  salary : decimal
WHEN
  age >= 21 AND salary >= 60000
THEN
  ALLOW
ELSE
  DENY
END
`;
      const ir = compileToIR(source);

      // Basic Blocks: B1 (Condition), B2 (Then / APPROVE + GOTO L3), B3 (L2 / REJECT), B4 (L3 / RETURN)
      expect(ir.basicBlocks).toHaveLength(4);
      expect(ir.basicBlocks.map((b) => b.id)).toEqual(['B1', 'B2', 'B3', 'B4']);

      // CFG has ENTRY + 4 core blocks + EXIT = 6 blocks
      expect(ir.cfg.blocks).toHaveLength(6);
      expect(ir.cfg.entryBlockId).toBe('ENTRY');
      expect(ir.cfg.exitBlockId).toBe('EXIT');
      expect(ir.cfg.mermaidDiagram).toContain('flowchart TD');

      // Serializer round-trip
      const serializer = new IRSerializer();
      const jsonStr = serializer.toJSON(ir);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.policyName).toBe('LoanApproval');
      expect(parsed.threeAddressCode).toHaveLength(ir.threeAddressCode.length);

      const binaryEnv = serializer.toBinaryEnvelope(ir);
      expect(binaryEnv.magic).toBe('FPC_IR_BIN_V1');
      expect(binaryEnv.byteLength).toBeGreaterThan(0);
    });

    it('detects missing labels (IR-V001) and uninitialized temporaries (IR-V003) in IRValidator', () => {
      const builder = new InstructionBuilder();
      const undeclaredTemp = IRFactory.createTemporaryOperand('t99', 99, 'boolean');
      const missingLabel = IRFactory.createLabelOperand('L404');

      builder.emitIfFalse(undeclaredTemp, missingLabel);

      const insts = builder.getInstructions();
      const blocks = new BasicBlockBuilder().buildBasicBlocks(insts);
      const cfg = new ControlFlowBuilder().buildCFG('BrokenPolicy', blocks);
      const validation = new IRValidator().validate(insts, cfg);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.code === 'IR-V001')).toBe(true);
      expect(validation.errors.some((e) => e.code === 'IR-V003')).toBe(true);
    });
  });
});
