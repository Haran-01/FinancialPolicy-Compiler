import { describe, expect, it } from 'vitest';
import {
  collectCompilationDiagnostics,
  compileAndRunPolicy,
} from '../../compiler/src/pipeline/index.ts';

const loanApprovalSource = `POLICY LoanApproval
INPUT
  age: int
  salary: decimal
  creditScore: int
OUTPUT
  interestRate: decimal
WHEN
  age >= 21 AND salary >= 60000 AND creditScore >= 700
THEN
  APPROVE
  SET interestRate = 8.5
ELSE
  REJECT
  SET interestRate = 14.0
END`;

describe('Compiler Pipeline', () => {
  it('compiles, optimizes, and executes FPL with branch-local SET outputs', () => {
    const approved = compileAndRunPolicy(loanApprovalSource, {
      age: 32,
      salary: 95000,
      creditScore: 780,
    });

    expect(approved.compilation.success).toBe(true);
    expect(collectCompilationDiagnostics(approved.compilation)).toEqual([]);
    expect(approved.execution?.decision).toBe('APPROVE');
    expect(approved.execution?.normalizedDecision).toBe('ALLOW');
    expect(approved.execution?.variables.outputs.interestRate).toBe(8.5);

    const rejected = compileAndRunPolicy(loanApprovalSource, {
      age: 25,
      salary: 42000,
      creditScore: 710,
    });

    expect(rejected.compilation.success).toBe(true);
    expect(collectCompilationDiagnostics(rejected.compilation)).toEqual([]);
    expect(rejected.execution?.decision).toBe('REJECT');
    expect(rejected.execution?.normalizedDecision).toBe('DENY');
    expect(rejected.execution?.variables.outputs.interestRate).toBe(14);
  });
});
