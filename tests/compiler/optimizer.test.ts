/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — IR Optimization Engine Test Suite
 *
 * Phase 3E: Comprehensive Unit Tests for all 12 Optimization Passes:
 *   1. Constant Folding               (`ConstantFoldingPass`)
 *   2. Constant Propagation           (`ConstantPropagationPass`)
 *   3. Copy Propagation               (`CopyPropagationPass`)
 *   4. Common Subexpression Elim.     (`CommonSubexpressionEliminationPass`)
 *   5. Dead Code Elimination          (`DeadCodeEliminationPass`)
 *   6. Dead Policy Elimination        (`DeadPolicyEliminationPass`)
 *   7. Strength Reduction             (`StrengthReductionPass`)
 *   8. Algebraic Simplification       (`AlgebraicSimplificationPass`)
 *   9. Conditional Simplification     (`ConditionalSimplificationPass`)
 *  10. Jump Optimization              (`JumpOptimizationPass`)
 *  11. Basic Block Optimization       (`BasicBlockOptimizationPass`)
 *  12. Rule Reordering                (`RuleReorderingPass`)
 *  + Multi-Pass Pipeline, Metrics, Transformation History & Side-by-Side Diff
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { parseSource } from '../../compiler/src/parser';
import { analyzeSemantics } from '../../compiler/src/semantic';
import {
  generateIR,
  InstructionBuilder,
  IRFactory,
  type IRProgram,
} from '../../compiler/src/ir';
import {
  OptimizationManager,
  OptimizationPipeline,
  OptimizationContext,
  IRRewriter,
  ConstantFoldingPass,
  ConstantPropagationPass,
  CopyPropagationPass,
  CommonSubexpressionEliminationPass,
  DeadCodeEliminationPass,
  DeadPolicyEliminationPass,
  StrengthReductionPass,
  AlgebraicSimplificationPass,
  ConditionalSimplificationPass,
  JumpOptimizationPass,
  BasicBlockOptimizationPass,
  RuleReorderingPass,
  optimizeIR,
} from '../../compiler/src/optimizer';

/**
 * Helper to run Lexer -> Parser -> ASTRepository -> SemanticAnalyzer -> IRGenerator
 */
function compileToIR(source: string) {
  const parseResult = parseSource(source);
  expect(parseResult.hasErrors).toBe(false);
  expect(parseResult.repository).not.toBeNull();

  const semanticResult = analyzeSemantics(parseResult.repository!, source);
  expect(semanticResult.hasErrors).toBe(false);

  const ir = generateIR(semanticResult, semanticResult.symbolTable);
  return { ir, semanticResult };
}

/**
 * Helper to build a custom `IRProgram` from an `InstructionBuilder` for targeted pass unit tests.
 */
function buildCustomIRProgram(
  policyName: string,
  buildFn: (builder: InstructionBuilder) => void,
): IRProgram {
  const builder = new InstructionBuilder(policyName);
  buildFn(builder);
  const rewriter = new IRRewriter();
  const baseEmpty: IRProgram = {
    policyName,
    instructions: [],
    threeAddressCode: [],
    quadruples: [],
    triples: [],
    indirectTriples: { pointers: [], triples: [] },
    basicBlocks: [],
    cfg: {
      name: policyName,
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
  return rewriter.rebuildProgram(baseEmpty, builder.getInstructions());
}

describe('FPL Optimization Engine (Phase 3E)', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Pass 1: Constant Folding
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 1 — Constant Folding (`ConstantFoldingPass`)', () => {
    it('evaluates constant arithmetic expressions (10000 + 5000 -> 15000) at compile time', () => {
      const program = buildCustomIRProgram('ConstFoldTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const t1 = b.emitBinary(
          'ADD',
          IRFactory.constant(10000, 'int'),
          IRFactory.constant(5000, 'int'),
          'int',
        );
        b.emitAssign(IRFactory.variable('salary', 'int'), t1, 'int');
        b.emitDecision('APPROVE');
      });

      const ctx = new OptimizationContext();
      const pass = new ConstantFoldingPass(ctx);
      const optimized = pass.apply(program);

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).toContain('t1 = 15000');
      expect(pass.stats().optimizationsApplied).toBe(1);

      const transforms = ctx.getTransformations();
      expect(transforms).toHaveLength(1);
      expect(transforms[0].passName).toBe('CONSTANT_FOLDING');
      expect(transforms[0].before).toBe('t1 = 10000 + 5000');
      expect(transforms[0].after).toBe('t1 = 15000');
    });

    it('folds constant relational, boolean, and BETWEEN expressions', () => {
      const program = buildCustomIRProgram('ConstRelFoldTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const t1 = b.emitBinary(
          'GTE',
          IRFactory.constant(25, 'int'),
          IRFactory.constant(21, 'int'),
          'boolean',
        );
        const t2 = b.emitBinary(
          'AND',
          IRFactory.constant(true, 'boolean'),
          IRFactory.constant(false, 'boolean'),
          'boolean',
        );
        b.emitAssign(IRFactory.variable('eligible', 'boolean'), t1, 'boolean');
        b.emitAssign(IRFactory.variable('flag', 'boolean'), t2, 'boolean');
        b.emitDecision('APPROVE');
      });

      const pass = new ConstantFoldingPass();
      const optimized = pass.apply(program);
      const tacLines = optimized.threeAddressCode.map((t) => t.text);

      expect(tacLines).toContain('t1 = true');
      expect(tacLines).toContain('t2 = false');
      expect(pass.stats().optimizationsApplied).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 2: Constant Propagation
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 2 — Constant Propagation (`ConstantPropagationPass`)', () => {
    it('propagates x = 100 into y = x + 20 and folds to y = 120', () => {
      const program = buildCustomIRProgram('ConstPropTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitAssign(IRFactory.variable('x', 'int'), IRFactory.constant(100, 'int'), 'int');
        const t1 = b.emitBinary(
          'ADD',
          IRFactory.variable('x', 'int'),
          IRFactory.constant(20, 'int'),
          'int',
        );
        b.emitAssign(IRFactory.variable('y', 'int'), t1, 'int');
        b.emitDecision('APPROVE');
      });

      const ctx = new OptimizationContext();
      const pass = new ConstantPropagationPass(ctx);
      const optimized = pass.apply(program);

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).toContain('t1 = 120');
      expect(tacLines).toContain('y = 120');
      expect(ctx.getTransformations().length).toBeGreaterThanOrEqual(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 3: Copy Propagation
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 3 — Copy Propagation (`CopyPropagationPass`)', () => {
    it('replaces copy chains (a = salary; b = a) with (b = salary)', () => {
      const program = buildCustomIRProgram('CopyPropTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitAssign(
          IRFactory.variable('a', 'decimal'),
          IRFactory.variable('salary', 'decimal'),
          'decimal',
        );
        b.emitAssign(
          IRFactory.variable('b', 'decimal'),
          IRFactory.variable('a', 'decimal'),
          'decimal',
        );
        const t1 = b.emitBinary(
          'GTE',
          IRFactory.variable('b', 'decimal'),
          IRFactory.constant(60000, 'decimal'),
          'boolean',
        );
        b.emitIfFalse(t1, IRFactory.label('L2'));
        b.emitDecision('APPROVE');
        b.emitLabel(IRFactory.label('L2'));
        b.emitDecision('REJECT');
      });

      const ctx = new OptimizationContext();
      const pass = new CopyPropagationPass(ctx);
      const optimized = pass.apply(program);

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).toContain('b = salary');
      expect(tacLines).toContain('t1 = salary >= 60000');
      expect(pass.stats().optimizationsApplied).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 4: Common Subexpression Elimination (CSE)
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 4 — Common Subexpression Elimination (`CommonSubexpressionEliminationPass`)', () => {
    it('eliminates duplicate computations (t1 = salary + bonus; t2 = salary + bonus -> t2 = t1) including commutative operands', () => {
      const program = buildCustomIRProgram('CSETest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const t1 = b.emitBinary(
          'ADD',
          IRFactory.variable('salary', 'decimal'),
          IRFactory.variable('bonus', 'decimal'),
          'decimal',
        );
        // Commutative duplicate: bonus + salary
        const t2 = b.emitBinary(
          'ADD',
          IRFactory.variable('bonus', 'decimal'),
          IRFactory.variable('salary', 'decimal'),
          'decimal',
        );
        b.emitAssign(IRFactory.variable('total1', 'decimal'), t1, 'decimal');
        b.emitAssign(IRFactory.variable('total2', 'decimal'), t2, 'decimal');
        b.emitDecision('APPROVE');
      });

      const ctx = new OptimizationContext();
      const pass = new CommonSubexpressionEliminationPass(ctx);
      const optimized = pass.apply(program);

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).toContain('t1 = salary + bonus');
      expect(tacLines).toContain('t2 = t1');
      expect(pass.stats().optimizationsApplied).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 5: Dead Code Elimination (DCE)
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 5 — Dead Code Elimination (`DeadCodeEliminationPass`)', () => {
    it('removes overwritten assignments (x = 100; x = 200), unused temporaries, and unreachable code after APPROVE/RETURN', () => {
      const program = buildCustomIRProgram('DCETest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        // Overwritten dead store: x = 100 followed by x = 200
        b.emitAssign(IRFactory.variable('x', 'int'), IRFactory.constant(100, 'int'), 'int');
        b.emitAssign(IRFactory.variable('x', 'int'), IRFactory.constant(200, 'int'), 'int');
        // Unused temporary computation: t1 = x + 50 (never referenced)
        b.emitBinary('ADD', IRFactory.variable('x', 'int'), IRFactory.constant(50, 'int'), 'int');
        // Live output emission using x
        b.emitOutput(IRFactory.variable('finalX', 'int'), IRFactory.variable('x', 'int'), 'int');
        b.emitDecision('APPROVE');
        // Unreachable instruction after terminal APPROVE
        b.emitAssign(IRFactory.variable('deadVar', 'int'), IRFactory.constant(999, 'int'), 'int');
      });

      const ctx = new OptimizationContext();
      const pass = new DeadCodeEliminationPass(ctx);
      const optimized = pass.apply(program);

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).not.toContain('x = 100');
      expect(tacLines).toContain('x = 200');
      expect(tacLines).not.toContain('t1 = x + 50');
      expect(tacLines).not.toContain('deadVar = 999');
      expect(pass.stats().optimizationsApplied).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 6: Dead Policy Elimination
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 6 — Dead Policy & Symbol Elimination (`DeadPolicyEliminationPass`)', () => {
    it('detects unused constants, unused helper functions, and unreferenced secondary policies', () => {
      const source = `
CONST UNUSED_RATE : decimal = 9.99

FUNCTION unusedHelper(val : int) RETURNS int
  RETURN val + 1
END

POLICY PrimaryLoanPolicy
INPUT
  salary : decimal
WHEN
  salary >= 50000
THEN
  ALLOW
ELSE
  DENY
END

POLICY UnreferencedBackupPolicy
INPUT
  salary : decimal
WHEN
  salary >= 30000
THEN
  ALLOW
ELSE
  DENY
END
`;
      const { ir, semanticResult } = compileToIR(source);
      const ctx = new OptimizationContext({ symbolTable: semanticResult.symbolTable });
      const pass = new DeadPolicyEliminationPass(ctx);
      const optimized = pass.apply(ir);

      const warnings = ctx.getWarnings();
      const warningNames = warnings.map((w) => w.entityName);
      expect(warningNames).toContain('UNUSED_RATE');
      expect(warningNames).toContain('unusedHelper');
      expect(warningNames).toContain('UnreferencedBackupPolicy');

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).not.toContain('UNUSED_RATE = 9.99');
      expect(tacLines).not.toContain('L_FUNC_unusedHelper');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 7: Strength Reduction
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 7 — Strength Reduction (`StrengthReductionPass`)', () => {
    it('replaces salary * 2 with salary + salary, x ^ 2 with x * x, and x / 1 with x', () => {
      const program = buildCustomIRProgram('StrengthReductionTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const t1 = b.emitBinary(
          'MUL',
          IRFactory.variable('salary', 'decimal'),
          IRFactory.constant(2, 'int'),
          'decimal',
        );
        const t2 = b.emitBinary(
          'POW',
          IRFactory.variable('factor', 'decimal'),
          IRFactory.constant(2, 'int'),
          'decimal',
        );
        const t3 = b.emitBinary(
          'DIV',
          IRFactory.variable('amount', 'decimal'),
          IRFactory.constant(1, 'int'),
          'decimal',
        );
        b.emitOutput(IRFactory.variable('out1', 'decimal'), t1, 'decimal');
        b.emitOutput(IRFactory.variable('out2', 'decimal'), t2, 'decimal');
        b.emitOutput(IRFactory.variable('out3', 'decimal'), t3, 'decimal');
        b.emitDecision('APPROVE');
      });

      const pass = new StrengthReductionPass();
      const optimized = pass.apply(program);

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).toContain('t1 = salary + salary');
      expect(tacLines).toContain('t2 = factor * factor');
      expect(tacLines).toContain('t3 = amount');
      expect(pass.stats().optimizationsApplied).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 8: Algebraic Simplification
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 8 — Algebraic Simplification (`AlgebraicSimplificationPass`)', () => {
    it('simplifies x + 0 -> x, x * 1 -> x, x * 0 -> 0, x AND true -> x, x OR false -> x, and x == x -> true', () => {
      const program = buildCustomIRProgram('AlgebraicTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const t1 = b.emitBinary(
          'ADD',
          IRFactory.variable('x', 'int'),
          IRFactory.constant(0, 'int'),
          'int',
        );
        const t2 = b.emitBinary(
          'MUL',
          IRFactory.variable('x', 'int'),
          IRFactory.constant(1, 'int'),
          'int',
        );
        const t3 = b.emitBinary(
          'MUL',
          IRFactory.variable('x', 'int'),
          IRFactory.constant(0, 'int'),
          'int',
        );
        const t4 = b.emitBinary(
          'AND',
          IRFactory.variable('cond', 'boolean'),
          IRFactory.constant(true, 'boolean'),
          'boolean',
        );
        const t5 = b.emitBinary(
          'OR',
          IRFactory.variable('cond', 'boolean'),
          IRFactory.constant(false, 'boolean'),
          'boolean',
        );
        const t6 = b.emitBinary(
          'EQ',
          IRFactory.variable('x', 'int'),
          IRFactory.variable('x', 'int'),
          'boolean',
        );
        b.emitOutput(IRFactory.variable('r1', 'int'), t1, 'int');
        b.emitOutput(IRFactory.variable('r2', 'int'), t2, 'int');
        b.emitOutput(IRFactory.variable('r3', 'int'), t3, 'int');
        b.emitOutput(IRFactory.variable('r4', 'boolean'), t4, 'boolean');
        b.emitOutput(IRFactory.variable('r5', 'boolean'), t5, 'boolean');
        b.emitOutput(IRFactory.variable('r6', 'boolean'), t6, 'boolean');
        b.emitDecision('APPROVE');
      });

      const pass = new AlgebraicSimplificationPass();
      const optimized = pass.apply(program);

      const tacLines = optimized.threeAddressCode.map((t) => t.text);
      expect(tacLines).toContain('t1 = x');
      expect(tacLines).toContain('t2 = x');
      expect(tacLines).toContain('t3 = 0');
      expect(tacLines).toContain('t4 = cond');
      expect(tacLines).toContain('t5 = cond');
      expect(tacLines).toContain('t6 = true');
      expect(pass.stats().optimizationsApplied).toBe(6);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 9: Conditional Simplification
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 9 — Conditional Simplification (`ConditionalSimplificationPass`)', () => {
    it('simplifies IF TRUE THEN APPROVE ELSE REJECT to APPROVE and eliminates the dead ELSE branch', () => {
      const program = buildCustomIRProgram('CondSimplifyTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const t1 = b.emitAssignToTemp(IRFactory.constant(true, 'boolean'), 'boolean');
        b.emitIfFalse(t1, IRFactory.label('L2'));
        b.emitDecision('APPROVE');
        b.emitGoto(IRFactory.label('L3'));
        b.emitLabel(IRFactory.label('L2'));
        b.emitDecision('REJECT');
        b.emitLabel(IRFactory.label('L3'));
      });

      const result = optimizeIR(program);
      const tacLines = result.optimizedTAC.map((t) => t.text);

      expect(tacLines).toContain('APPROVE');
      expect(tacLines).not.toContain('REJECT');
      expect(tacLines).not.toContain('IF_FALSE t1 GOTO L2');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 10 & Pass 11: Jump Optimization & Basic Block Optimization
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 10 & Pass 11 — Jump Optimization & Basic Block Merging', () => {
    it('eliminates jump-to-next-instruction (GOTO L2; LABEL L2), threads jump chains, and merges linear blocks', () => {
      const program = buildCustomIRProgram('JumpAndBlockOptTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitAssign(IRFactory.variable('rate', 'decimal'), IRFactory.constant(5.5, 'decimal'), 'decimal');
        // Redundant jump to the immediately following label L2
        b.emitGoto(IRFactory.label('L2'));
        b.emitLabel(IRFactory.label('L2'));
        b.emitDecision('APPROVE');
      });

      const jumpPass = new JumpOptimizationPass();
      const afterJump = jumpPass.apply(program);
      expect(afterJump.threeAddressCode.map((t) => t.text)).not.toContain('GOTO L2');

      const blockPass = new BasicBlockOptimizationPass();
      const afterBlocks = blockPass.apply(afterJump);
      expect(afterBlocks.threeAddressCode.map((t) => t.text)).toEqual([
        'L1',
        'rate = 5.5',
        'APPROVE',
      ]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pass 12: Rule Reordering
  // ──────────────────────────────────────────────────────────────────────────

  describe('Pass 12 — Rule Reordering (`RuleReorderingPass`)', () => {
    it('reorders cheap comparison before expensive CALL instruction and reorders AND operands', () => {
      const program = buildCustomIRProgram('RuleReorderTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const tExpensive = b.emitCall('fetchExternalCreditScore', [], 'boolean');
        const tCheap = b.emitBinary(
          'GTE',
          IRFactory.variable('age', 'int'),
          IRFactory.constant(21, 'int'),
          'boolean',
        );
        const tCombined = b.emitBinary('AND', tExpensive, tCheap, 'boolean');
        b.emitIfFalse(tCombined, IRFactory.label('L2'));
        b.emitDecision('APPROVE');
        b.emitLabel(IRFactory.label('L2'));
        b.emitDecision('REJECT');
      });

      const pass = new RuleReorderingPass();
      const optimized = pass.apply(program);
      const tacLines = optimized.threeAddressCode.map((t) => t.text);

      const cheapIdx = tacLines.findIndex((l) => l.includes('age >= 21'));
      const expensiveIdx = tacLines.findIndex((l) => l.includes('CALL fetchExternalCreditScore'));
      expect(cheapIdx).toBeLessThan(expensiveIdx);
      expect(tacLines).toContain('t3 = t2 AND t1');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // End-to-End Multi-Pass Optimization Pipeline, Metrics & Report
  // ──────────────────────────────────────────────────────────────────────────

  describe('End-to-End Optimization Pipeline, Metrics & Side-by-Side Diff', () => {
    it('optimizes a full FPL policy end-to-end and generates accurate metrics, transformation history, and diff rows', () => {
      const source = `
CONST BASE_MIN : decimal = 50000

POLICY LoanApprovalOptimizationDemo
INPUT
  salary : decimal
  bonus : decimal
  age : int
OUTPUT
  finalIncome : decimal
  approvedRate : decimal
WHEN
  salary >= (40000 + 20000) AND age >= (18 + 3)
THEN
  LET baseBonus : decimal = 1000 + 500
  LET totalComp1 : decimal = salary + bonus
  LET totalComp2 : decimal = salary + bonus
  LET doubleSalary : decimal = salary * 2
  LET identityCheck : decimal = totalComp2 + 0
  EMIT finalIncome = identityCheck + baseBonus + (doubleSalary * 0)
  EMIT approvedRate = 8.5 * 1
  ALLOW
ELSE
  DENY
END
`;
      const { ir, semanticResult } = compileToIR(source);
      const result = optimizeIR(ir, {
        level: 2,
        symbolTable: semanticResult.symbolTable,
      });

      expect(result.optimizedProgram.validation.valid).toBe(true);
      expect(result.totalInstructionsAfter).toBeLessThan(result.totalInstructionsBefore);
      expect(result.statistics.instructionsEliminated).toBeGreaterThan(0);
      expect(result.statistics.temporariesEliminated).toBeGreaterThan(0);
      expect(result.statistics.estimatedRuntimeImprovementPercent).toBeGreaterThan(0);
      expect(result.transformationHistory.length).toBeGreaterThan(5);
      expect(result.sideBySideDiff.length).toBeGreaterThan(0);

      const optimizedTAC = result.optimizedTAC.map((t) => t.text);
      // Verify 40000 + 20000 was folded to 60000 and 18 + 3 was folded to 21
      expect(optimizedTAC).toContain('t2 = salary >= 60000');
      expect(optimizedTAC).toContain('t4 = age >= 21');
      // Verify unused constant BASE_MIN was warned and pruned
      expect(optimizedTAC).not.toContain('BASE_MIN = 50000');
      expect(result.deadEntityWarnings.some((w) => w.entityName === 'BASE_MIN')).toBe(true);
      // Verify report contains required sections
      expect(result.report.formattedReport).toContain('Instructions Before');
      expect(result.report.formattedReport).toContain('Instructions After');
      expect(result.report.formattedReport).toContain('Temporary Variables Reduced');
      expect(result.report.formattedReport).toContain('Basic Blocks Reduced');
      expect(result.report.formattedReport).toContain('Estimated Runtime Improvement');
    });

    it('supports enabling/disabling passes and Level 0 (no-op) optimization', () => {
      const { ir } = compileToIR(`
POLICY SimpleFold
INPUT
  age : int
WHEN
  age >= (10 + 11)
THEN
  ALLOW
ELSE
  DENY
END
`);

      const manager = new OptimizationManager();

      // Level 0 should perform zero optimizations
      const level0 = manager.optimize(ir, 0);
      expect(level0.passesApplied).toHaveLength(0);
      expect(level0.totalInstructionsAfter).toBe(level0.totalInstructionsBefore);

      // Disabling CONSTANT_FOLDING should preserve `10 + 11`
      const disabledFold = manager.optimize(ir, 2, {
        disabledPasses: ['CONSTANT_FOLDING'],
      });
      expect(disabledFold.optimizedTAC.map((t) => t.text)).toContain('t1 = 10 + 11');
    });
  });
});
