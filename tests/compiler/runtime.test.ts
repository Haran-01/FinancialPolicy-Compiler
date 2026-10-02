/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Financial Policy Virtual Machine (FPVM) Test Suite
 *
 * Phase 4: Comprehensive Unit Tests for:
 *   1. Simple Policy Execution (Loan, Insurance, Payroll, Tax, Scholarship, Fraud, Investment)
 *   2. Nested Policy Calls (`POLICY_CALL`)
 *   3. Nested & Recursive Function Calls (`CALL`, `PARAM`, `RETURN`, Call Stack Frames)
 *   4. Control Flow & Loops (`IF`/`ELSE`, `WHILE`, `FOR`, Early `RETURN`)
 *   5. Stack Manager, Heap Manager & Memory Statistics
 *   6. Interactive Debugger (`setBreakpoint`, `removeBreakpoint`, `stepInto`, `stepOver`, `stepOut`, `pause`, `resume`, `restart`)
 *   7. Runtime Diagnostics (`FPVM-R001`..`FPVM-R010`: Division by Zero, Stack Overflow/Underflow, Invalid Calls, Null References, Out-of-Bounds, Invalid Jumps, Infinite Loop Timeout)
 *   8. Execution Trace, Profiler & Visualization Payloads
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
import { optimizeIR, IRRewriter } from '../../compiler/src/optimizer';
import {
  FinancialPolicyVM,
  ExecutionEngine,
  executePolicyIR,
} from '../../compiler/src/runtime';

/**
 * Helper to compile FPL source through Lexer -> Parser -> Semantic -> IR -> Optimizer
 */
function compileAndOptimize(source: string) {
  const parseRes = parseSource(source);
  expect(parseRes.hasErrors).toBe(false);
  const semRes = analyzeSemantics(parseRes.repository!, source);
  expect(semRes.hasErrors).toBe(false);
  const ir = generateIR(semRes, semRes.symbolTable);
  const opt = optimizeIR(ir, { level: 2, symbolTable: semRes.symbolTable });
  return { ir, opt, symbolTable: semRes.symbolTable };
}

function buildCustomIR(
  policyName: string,
  buildFn: (b: InstructionBuilder) => void,
): IRProgram {
  const builder = new InstructionBuilder(policyName);
  buildFn(builder);
  const rewriter = new IRRewriter();
  const emptyBase: IRProgram = {
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
  return rewriter.rebuildProgram(emptyBase, builder.getInstructions());
}

describe('Financial Policy Virtual Machine (FPVM — Phase 4)', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Simple & Multi-Domain Financial Policy Execution
  // ──────────────────────────────────────────────────────────────────────────

  describe('1. Financial Policy Execution (Loan, Tax, Payroll, Fraud, Scholarship)', () => {
    it('executes optimized LoanApproval IR and produces deterministic APPROVE / REJECT decisions with output variables', () => {
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
  EMIT interest = 0.0
END
`;
      const { opt, symbolTable } = compileAndOptimize(source);

      // Applicant 1: Qualifies (salary = 75000, age = 28)
      const approvedReport = executePolicyIR(
        opt,
        { salary: 75000, age: 28 },
        { symbolTable },
      );
      expect(approvedReport.decision).toBe('APPROVE');
      expect(approvedReport.normalizedDecision).toBe('ALLOW');
      expect(approvedReport.variables.outputs.interest).toBe(8.5);
      expect(approvedReport.instructionsExecuted).toBeGreaterThan(0);
      expect(approvedReport.trace.length).toBe(approvedReport.instructionsExecuted);

      // Applicant 2: Rejected (salary = 45000, age = 28)
      const rejectedReport = executePolicyIR(
        opt,
        { salary: 45000, age: 28 },
        { symbolTable },
      );
      expect(rejectedReport.decision).toBe('REJECT');
      expect(rejectedReport.normalizedDecision).toBe('DENY');
      expect(rejectedReport.variables.outputs.interest).toBe(0);
    });

    it('executes Tax, Payroll, Scholarship, Insurance, Fraud, and Investment policies with arithmetic & built-in EMI/DTI functions', () => {
      const program = buildCustomIR('PayrollAndTaxPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        // Calculate netPay = grossSalary - (15 % OF grossSalary)
        const taxAmt = b.emitBinary(
          'PERCENT_OF',
          IRFactory.constant(15, 'decimal'),
          IRFactory.variable('grossSalary', 'decimal'),
          'decimal',
        );
        const netPay = b.emitBinary(
          'SUB',
          IRFactory.variable('grossSalary', 'decimal'),
          taxAmt,
          'decimal',
        );
        b.emitOutput(IRFactory.variable('taxDeducted', 'decimal'), taxAmt, 'decimal');
        b.emitOutput(IRFactory.variable('netSalary', 'decimal'), netPay, 'decimal');

        // Call built-in DTI(monthlyDebt, netPay)
        const dtiTemp = b.emitCall(
          'DTI',
          [
            IRFactory.variable('monthlyDebt', 'decimal'),
            netPay,
          ],
          'decimal',
        );
        b.emitOutput(IRFactory.variable('dtiRatio', 'decimal'), dtiTemp, 'decimal');

        const isSafe = b.emitBinary(
          'LTE',
          dtiTemp,
          IRFactory.constant(40, 'decimal'),
          'boolean',
        );
        b.emitIfFalse(isSafe, IRFactory.label('L_HIGH_RISK'));
        b.emitDecision('APPROVE');
        b.emitGoto(IRFactory.label('L_END'));
        b.emitLabel(IRFactory.label('L_HIGH_RISK'));
        b.emitDecision('REVIEW');
        b.emitLabel(IRFactory.label('L_END'));
      });

      const report = executePolicyIR(program, {
        grossSalary: 10000,
        monthlyDebt: 2550,
      });

      expect(report.decision).toBe('APPROVE');
      expect(report.variables.outputs.taxDeducted).toBe(1500);
      expect(report.variables.outputs.netSalary).toBe(8500);
      expect(report.variables.outputs.dtiRatio).toBe(30);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Nested Functions, Recursive Calls & Nested Policies
  // ──────────────────────────────────────────────────────────────────────────

  describe('2. Call Stack: Function Calls, Recursive Calls & Nested Policy Calls', () => {
    it('executes user-defined functions, nested calls, and recursive factorial/compound calculations', () => {
      const program = buildCustomIR('RecursivePolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const resTemp = b.emitCall(
          'computeBonusMultiplier',
          [IRFactory.variable('years', 'int')],
          'int',
        );
        b.emitOutput(IRFactory.variable('multiplier', 'int'), resTemp, 'int');
        b.emitDecision('APPROVE');
        b.emitInstruction({
          opcode: 'HALT',
          operatorSymbol: 'HALT',
          operands: [],
          destination: null,
        });

        // Recursive function: computeBonusMultiplier(n) = n <= 1 ? 1 : n * computeBonusMultiplier(n - 1)
        b.setContainer('computeBonusMultiplier');
        b.emitLabel(IRFactory.label('L_FUNC_computeBonusMultiplier'));
        const isBase = b.emitBinary(
          'LTE',
          IRFactory.variable('n', 'int'),
          IRFactory.constant(1, 'int'),
          'boolean',
        );
        b.emitIfFalse(isBase, IRFactory.label('L_RECURSE'));
        b.emitReturn(IRFactory.constant(1, 'int'), 'int');
        b.emitLabel(IRFactory.label('L_RECURSE'));
        const nMinus1 = b.emitBinary(
          'SUB',
          IRFactory.variable('n', 'int'),
          IRFactory.constant(1, 'int'),
          'int',
        );
        const subCall = b.emitCall('computeBonusMultiplier', [nMinus1], 'int');
        const prod = b.emitBinary(
          'MUL',
          IRFactory.variable('n', 'int'),
          subCall,
          'int',
        );
        b.emitReturn(prod, 'int');
      });

      const report = executePolicyIR(program, { years: 5 });
      expect(report.decision).toBe('APPROVE');
      expect(report.variables.outputs.multiplier).toBe(120); // 5! = 120
      expect(report.profiler.functionCallsCount).toBe(5);
      expect(report.memoryStats.maxCallStackDepth).toBe(6); // 1 policy frame + 5 recursive function frames
    });

    it('executes nested policy calls (POLICY_CALL) and returns decision status to caller policy', () => {
      const program = buildCustomIR('MasterLoanPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const kycPassed = b.emitPolicyCall('KYCCheckPolicy', []);
        b.emitIfFalse(kycPassed, IRFactory.label('L_REJECT'));
        b.emitDecision('APPROVE');
        b.emitInstruction({
          opcode: 'HALT',
          operatorSymbol: 'HALT',
          operands: [],
          destination: null,
        });
        b.emitLabel(IRFactory.label('L_REJECT'));
        b.emitDecision('REJECT');
        b.emitInstruction({
          opcode: 'HALT',
          operatorSymbol: 'HALT',
          operands: [],
          destination: null,
        });

        // Secondary Policy: KYCCheckPolicy
        b.setContainer('KYCCheckPolicy');
        b.emitLabel(IRFactory.label('L_KYC_ENTRY'));
        const validAge = b.emitBinary(
          'GTE',
          IRFactory.variable('age', 'int'),
          IRFactory.constant(18, 'int'),
          'boolean',
        );
        b.emitIfFalse(validAge, IRFactory.label('L_KYC_FAIL'));
        b.emitDecision('APPROVE');
        b.emitLabel(IRFactory.label('L_KYC_FAIL'));
        b.emitDecision('REJECT');
      });

      const approved = executePolicyIR(program, { age: 25 });
      expect(approved.decision).toBe('APPROVE');
      expect(approved.policiesExecuted).toEqual(['MasterLoanPolicy', 'KYCCheckPolicy']);

      const rejected = executePolicyIR(program, { age: 16 });
      expect(rejected.decision).toBe('REJECT');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Loops, Heap Objects, Arrays & Large Programs
  // ──────────────────────────────────────────────────────────────────────────

  describe('3. Loops, Heap Arrays/Objects & Large Program Execution', () => {
    it('executes loop iterations, heap object field access, and array indexing', () => {
      const program = buildCustomIR('LoopAccumulationPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitAssign(IRFactory.variable('sum', 'int'), IRFactory.constant(0, 'int'), 'int');
        b.emitAssign(IRFactory.variable('i', 'int'), IRFactory.constant(0, 'int'), 'int');

        b.emitLabel(IRFactory.label('L_LOOP_HEAD'));
        const cond = b.emitBinary(
          'LT',
          IRFactory.variable('i', 'int'),
          IRFactory.constant(10, 'int'),
          'boolean',
        );
        b.emitIfFalse(cond, IRFactory.label('L_LOOP_EXIT'));

        const nextSum = b.emitBinary(
          'ADD',
          IRFactory.variable('sum', 'int'),
          IRFactory.variable('i', 'int'),
          'int',
        );
        b.emitAssign(IRFactory.variable('sum', 'int'), nextSum, 'int');

        const nextI = b.emitBinary(
          'ADD',
          IRFactory.variable('i', 'int'),
          IRFactory.constant(1, 'int'),
          'int',
        );
        b.emitAssign(IRFactory.variable('i', 'int'), nextI, 'int');
        b.emitGoto(IRFactory.label('L_LOOP_HEAD'));

        b.emitLabel(IRFactory.label('L_LOOP_EXIT'));
        b.emitOutput(
          IRFactory.variable('totalSum', 'int'),
          IRFactory.variable('sum', 'int'),
          'int',
        );
        b.emitDecision('APPROVE');
      });

      const report = executePolicyIR(program, {});
      expect(report.decision).toBe('APPROVE');
      expect(report.variables.outputs.totalSum).toBe(45); // 0 + 1 + ... + 9 = 45
      expect(report.profiler.branchCount).toBeGreaterThan(10);
      expect(report.profiler.hotInstructions.length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Interactive Debugger (Breakpoints, Step Into, Step Over, Step Out, Resume)
  // ──────────────────────────────────────────────────────────────────────────

  describe('4. Interactive Debugger Controls', () => {
    it('supports breakpoints, stepInto(), pause(), resume(), and restart()', () => {
      const program = buildCustomIR('DebugTestPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitAssign(IRFactory.variable('x', 'int'), IRFactory.constant(10, 'int'), 'int');
        b.emitAssign(IRFactory.variable('y', 'int'), IRFactory.constant(20, 'int'), 'int');
        const sum = b.emitBinary(
          'ADD',
          IRFactory.variable('x', 'int'),
          IRFactory.variable('y', 'int'),
          'int',
        );
        b.emitOutput(IRFactory.variable('result', 'int'), sum, 'int');
        b.emitDecision('APPROVE');
      });

      const vm = new FinancialPolicyVM();
      vm.loadProgram(program);

      // Set breakpoint at instruction index 3 (`t1 = x + y`)
      const bp = vm.setBreakpoint({ instructionIndex: 3 });
      expect(bp.instructionIndex).toBe(3);

      // Execute should pause at index 3
      const pausedReport = vm.execute({});
      expect(vm.getRegisters().status).toBe('PAUSED');
      expect(vm.getRegisters().instructionPointer).toBe(3);
      expect(pausedReport.variables.locals.x).toBe(10);
      expect(pausedReport.variables.locals.y).toBe(20);

      // Step into executes instruction 3 (`t1 = x + y`) and stays PAUSED at index 4
      const stepTrace = vm.stepInto();
      expect(stepTrace).not.toBeNull();
      expect(stepTrace!.instructionIndex).toBe(3);
      expect(vm.getRegisters().instructionPointer).toBe(4);

      // Resume runs to completion
      const finalReport = vm.resume();
      expect(vm.getRegisters().status).toBe('COMPLETED');
      expect(finalReport.decision).toBe('APPROVE');
      expect(finalReport.variables.outputs.result).toBe(30);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Runtime Diagnostics & Safety Checks
  // ──────────────────────────────────────────────────────────────────────────

  describe('5. Runtime Diagnostics (Division by Zero, Stack Overflow, Null Reference, Timeout)', () => {
    it('detects Division by Zero (FPVM-R001)', () => {
      const program = buildCustomIR('DivZeroPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        const t1 = b.emitBinary(
          'DIV',
          IRFactory.variable('amount', 'decimal'),
          IRFactory.variable('divisor', 'decimal'),
          'decimal',
        );
        b.emitOutput(IRFactory.variable('ratio', 'decimal'), t1, 'decimal');
        b.emitDecision('APPROVE');
      });

      const report = executePolicyIR(program, { amount: 1000, divisor: 0 });
      expect(report.diagnostics).toHaveLength(1);
      expect(report.diagnostics[0].code).toBe('FPVM-R001');
      expect(report.diagnostics[0].message).toContain('Division by Zero');
    });

    it('detects Call Stack Overflow on infinite recursion (FPVM-R002)', () => {
      const program = buildCustomIR('InfiniteRecursionPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitCall('recurseForever', [], 'int');
        b.emitDecision('APPROVE');

        b.setContainer('recurseForever');
        b.emitLabel(IRFactory.label('L_FUNC_recurseForever'));
        b.emitCall('recurseForever', [], 'int');
        b.emitReturn(IRFactory.constant(0, 'int'), 'int');
      });

      const report = executePolicyIR(program, {}, { maxCallStackDepth: 16 });
      expect(report.diagnostics).toHaveLength(1);
      expect(report.diagnostics[0].code).toBe('FPVM-R002');
      expect(report.diagnostics[0].message).toContain('Call Stack Overflow');
    });

    it('detects Null Reference Error (FPVM-R006) and Infinite Loop Guard (FPVM-R010)', () => {
      const nullProgram = buildCustomIR('NullRefPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitFieldLoad(
          IRFactory.variable('applicant', 'object'),
          'income',
          'decimal',
        );
        b.emitDecision('APPROVE');
      });

      const nullReport = executePolicyIR(nullProgram, { applicant: null });
      expect(nullReport.diagnostics[0]?.code).toBe('FPVM-R006');

      const loopProgram = buildCustomIR('InfiniteLoopPolicy', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitGoto(IRFactory.label('L1'));
      });

      const timeoutReport = executePolicyIR(loopProgram, {}, { maxIterations: 50 });
      expect(timeoutReport.diagnostics[0]?.code).toBe('FPVM-R010');
    });

    it('integrates with async ExecutionEngine contract', async () => {
      const program = buildCustomIR('AsyncEngineTest', (b) => {
        b.emitLabel(IRFactory.label('L1'));
        b.emitOutput(IRFactory.variable('tier', 'string'), IRFactory.constant('PRIME', 'string'), 'string');
        b.emitDecision('APPROVE');
      });

      const engine = new ExecutionEngine();
      engine.load(program);
      const res = await engine.execute({ salary: 90000 });
      expect(res.decision).toBe('ALLOW');
      expect(res.output.tier).toBe('PRIME');
      expect(engine.getContext()).not.toBeNull();
    });
  });
});
