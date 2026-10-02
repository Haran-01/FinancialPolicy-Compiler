/**
 * ============================================================================
 * FinPolicy Compiler (FPC) — Semantic Analysis & Symbol Table Test Suite
 * Phase 3C: Comprehensive Unit Tests for SemanticAnalyzer, SymbolTable,
 *           ScopeManager, TypeChecker, DependencyAnalyzer, and Metadata
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { tokenize } from '../../compiler/src/lexer';
import { parseSource } from '../../compiler/src/parser';
import {
  SemanticAnalyzer,
  analyzeSemantics,
  SemanticErrorCodes,
  TypeResolver,
  TypeChecker,
  SemanticMetadataDecorator,
} from '../../compiler/src/semantic';

/**
 * Helper to run Lexer -> Parser -> ASTRepository -> SemanticAnalyzer
 */
function compileToSemantics(source: string) {
  const parseResult = parseSource(source);
  expect(parseResult.hasErrors).toBe(false);
  expect(parseResult.repository).not.toBeNull();
  return analyzeSemantics(parseResult.repository!, source);
}

describe('FPL Semantic Analysis & Symbol Table Engine', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Valid Programs & Domain Type Checking
  // ──────────────────────────────────────────────────────────────────────────

  describe('Valid FPL Programs', () => {
    it('validates the canonical LoanApproval policy with zero errors', () => {
      const source = `
POLICY LoanApproval
INPUT
  AGE : int
  SALARY : decimal
WHEN
  AGE >= 21
  AND SALARY >= 60000
THEN
  ALLOW "Loan Approved"
ELSE
  DENY "Eligibility criteria not met"
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(false);
      expect(result.errors).toHaveLength(0);

      // Verify Symbol Table contents
      const policySymbol = result.symbolTable.resolve('LoanApproval');
      expect(policySymbol).not.toBeNull();
      expect(policySymbol?.kind).toBe('policy');

      // Check Symbol Table Viewer rows
      const ageRow = result.symbolTableRows.find((r) => r.name === 'AGE');
      expect(ageRow).toBeDefined();
      expect(ageRow?.kind).toBe('parameter');
      expect(ageRow?.type).toBe('int');
      expect(ageRow?.scope).toContain('Policy:LoanApproval');
    });

    it('validates constants, custom functions, built-in functions, and domain entities', () => {
      const source = `
CONST MAX_DTI : percentage = 43%
CONST MIN_SCORE : int = 680

FUNCTION CalculateDTI(debt: currency, income: currency) RETURNS decimal
  IF income == 0 THEN
    RETURN 100.0
  END
  RETURN (debt / income) * 100
END

POLICY MortgageUnderwriting
  INPUT
    applicant : customer
    loanRequest : loan
  OUTPUT
    monthlyEmi : decimal
    dtiRatio : decimal
  WHEN
    applicant.credit_score >= MIN_SCORE
    AND applicant.age >= 21
  THEN
    LET calculatedEmi : decimal = EMI(loanRequest.principal, loanRequest.interest_rate, loanRequest.tenure_months)
    VAR currentDti : decimal = CalculateDTI(applicant.existing_debt, applicant.annual_income)
    EMIT monthlyEmi = calculatedEmi
    EMIT dtiRatio = currentDti

    IF currentDti <= 43.0 THEN
      ALLOW "Approved with prime rate"
    ELSE
      REVIEW "High DTI requires manual underwriter review"
    END
  ELSE
    DENY "Credit score or age below threshold"
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(false);
      expect(result.errors).toHaveLength(0);

      // Verify constant folding metadata on CONST declarations
      const maxDtiSymbol = result.symbolTable.resolve('MAX_DTI');
      expect(maxDtiSymbol?.constantValue).toBe(0.43);

      const minScoreSymbol = result.symbolTable.resolve('MIN_SCORE');
      expect(minScoreSymbol?.constantValue).toBe(680);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Duplicate Symbol Detection (FPL-T005)
  // ──────────────────────────────────────────────────────────────────────────

  describe('Duplicate Declarations (FPL-T005)', () => {
    it('reports FPL-T005 when two variables share the same name in the same scope', () => {
      const source = `
POLICY DuplicateVarTest
  INPUT
    age : int
  WHEN
    age >= 18
  THEN
    LET limit : decimal = 5000.0
    LET limit : decimal = 10000.0
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.some((e) => e.code === SemanticErrorCodes.DUPLICATE_SYMBOL)).toBe(true);
    });

    it('reports FPL-T005 when two policies have the same name', () => {
      const source = `
POLICY CreditCheck
  WHEN true THEN ALLOW
END

POLICY CreditCheck
  WHEN false THEN DENY
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.some((e) => e.code === SemanticErrorCodes.DUPLICATE_SYMBOL)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Undefined References (FPL-T002, FPL-T003, FPL-T004)
  // ──────────────────────────────────────────────────────────────────────────

  describe('Undefined Symbol Resolution', () => {
    it('reports FPL-T002 for undeclared variable references', () => {
      const source = `
POLICY UndefinedVarPolicy
  INPUT
    age : int
  WHEN
    age >= 18 AND creditScore >= 700
  THEN
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      const err = result.errors.find((e) => e.code === SemanticErrorCodes.UNDEFINED_VARIABLE);
      expect(err).toBeDefined();
      expect(err?.message).toContain('creditScore');
    });

    it('reports FPL-T003 for undeclared function calls', () => {
      const source = `
POLICY UndefinedFuncPolicy
  INPUT
    amount : decimal
  WHEN
    ComputeRiskScore(amount) < 50
  THEN
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      const err = result.errors.find((e) => e.code === SemanticErrorCodes.UNDEFINED_FUNCTION);
      expect(err).toBeDefined();
      expect(err?.message).toContain('ComputeRiskScore');
    });

    it('reports FPL-T004 for undeclared policy invocations via APPLY', () => {
      const source = `
POLICY MainPolicy
  INPUT
    age : int
  WHEN
    age >= 18
  THEN
    APPLY NonExistentSubPolicy
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      const err = result.errors.find((e) => e.code === SemanticErrorCodes.UNDEFINED_POLICY);
      expect(err).toBeDefined();
      expect(err?.message).toContain('NonExistentSubPolicy');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Type Mismatches & Expression Validation (FPL-T001, FPL-T007)
  // ──────────────────────────────────────────────────────────────────────────

  describe('Type Checking & Expression Validation', () => {
    it('reports FPL-T001 when assigning a string to a decimal variable', () => {
      const source = `
POLICY TypeMismatchPolicy
  INPUT
    age : int
  WHEN
    age >= 18
  THEN
    VAR salary : decimal = 50000.0
    SET salary = "hello"
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      const err = result.errors.find((e) => e.code === SemanticErrorCodes.TYPE_MISMATCH);
      expect(err).toBeDefined();
      expect(err?.message).toContain('salary');
    });

    it('reports FPL-T001 when initializing a boolean variable with an integer', () => {
      const source = `
POLICY BoolInitMismatch
  WHEN
    true
  THEN
    LET approved : boolean = 100
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.some((e) => e.code === SemanticErrorCodes.TYPE_MISMATCH)).toBe(true);
    });

    it('reports FPL-T007 when IF or WHEN condition is not boolean', () => {
      const source = `
POLICY NonBooleanCondition
  INPUT
    salary : decimal
  WHEN
    salary
  THEN
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      const err = result.errors.find((e) => e.code === SemanticErrorCodes.NON_BOOLEAN_CONDITION);
      expect(err).toBeDefined();
    });

    it('reports FPL-T006 when attempting to mutate an immutable LET or INPUT symbol', () => {
      const source = `
POLICY ImmutabilityTest
  INPUT
    age : int
  WHEN
    age >= 18
  THEN
    LET taxRate : decimal = 0.25
    SET taxRate = 0.30
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.some((e) => e.code === SemanticErrorCodes.IMMUTABLE_ASSIGNMENT)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Nested Scopes & Lexical Visibility
  // ──────────────────────────────────────────────────────────────────────────

  describe('Nested Scopes & Block Visibility', () => {
    it('prevents inner block variables from leaking into outer scopes', () => {
      const source = `
POLICY ScopeIsolationPolicy
  INPUT
    score : int
  WHEN
    score >= 600
  THEN
    IF score >= 750 THEN
      LET primeBonus : decimal = 1000.0
      LOG primeBonus
    END
    LOG primeBonus
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      const err = result.errors.find((e) => e.code === SemanticErrorCodes.UNDEFINED_VARIABLE);
      expect(err).toBeDefined();
      expect(err?.message).toContain('primeBonus');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Dependency Graph: Circular Policies & Recursive Functions
  // ──────────────────────────────────────────────────────────────────────────

  describe('Dependency Analyzer (FPL-T011 & FPL-T012)', () => {
    it('detects circular policy dependencies (PolicyA -> PolicyB -> PolicyA)', () => {
      const source = `
POLICY PolicyA
  WHEN true THEN
    APPLY PolicyB
    ALLOW
END

POLICY PolicyB
  WHEN true THEN
    APPLY PolicyA
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.some((e) => e.code === SemanticErrorCodes.CIRCULAR_POLICY_CALL)).toBe(true);
      expect(result.dependencyGraph.circularPolicyPaths.length).toBeGreaterThan(0);
    });

    it('detects direct or mutual recursion in user-defined functions (FPL-T011)', () => {
      const source = `
FUNCTION RecursiveCalc(n: int) RETURNS int
  IF n <= 1 THEN
    RETURN 1
  END
  RETURN RecursiveCalc(n - 1)
END

POLICY TestPolicy
  WHEN RecursiveCalc(5) > 0 THEN ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.some((e) => e.code === SemanticErrorCodes.RECURSIVE_FUNCTION)).toBe(true);
      expect(result.dependencyGraph.recursiveFunctionPaths.length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ASTRepository Metadata Decoration & Hover Inspection
  // ──────────────────────────────────────────────────────────────────────────

  describe('ASTRepository Semantic Metadata & Hover API', () => {
    it('decorates AST nodes in ASTRepository with resolved types, scopes, and constant values', () => {
      const source = `
CONST BASE_BONUS : decimal = 250.0 + 250.0

POLICY BonusCheck
  INPUT
    salary : decimal
  WHEN
    salary >= 50000
  THEN
    LET total : decimal = salary + BASE_BONUS
    LOG total
    ALLOW
END
`;
      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(false);

      const decorator = new SemanticMetadataDecorator(result.repository);
      const allMeta = decorator.getAllMetadata();
      expect(allMeta.size).toBeGreaterThan(0);

      // Verify formatted Symbol Table Viewer output
      expect(result.formattedSymbolTable).toContain('BASE_BONUS');
      expect(result.formattedSymbolTable).toContain('BonusCheck');
      expect(result.formattedSymbolTable).toContain('salary');
      expect(result.formattedSymbolTable).toContain('total');
    });

    it('tracks exact usage line numbers (Used At: Line 12, Line 16, Line 24) and policy dependencies for the Semantic Explorer', () => {
      const source = `POLICY LoanApproval
INPUT
  age : int
  salary : decimal
  creditScore : int
OUTPUT
  eligibleLimit : decimal
  taxDeduction : decimal
WHEN
  age >= 21
  AND creditScore >= 680
  AND salary >= 60000.00
THEN
  CALL CreditScorePolicy
  CALL KYCPolicy
  LET maxLoan : decimal = salary * 5.0
  CALL IncomeVerificationPolicy
  EMIT eligibleLimit = maxLoan
  IF age >= 30 THEN
    LOG "Prime applicant tier verified"
  END
  ALLOW "Loan Approved"
ELSE
  EMIT taxDeduction = salary * 0.10 + salary * 0.05
  DENY "Eligibility criteria not met"
END

POLICY CreditScorePolicy
WHEN true THEN ALLOW
END

POLICY KYCPolicy
WHEN true THEN ALLOW
END

POLICY IncomeVerificationPolicy
WHEN true THEN ALLOW
END`;

      const result = compileToSemantics(source);
      expect(result.hasErrors).toBe(false);

      const salaryRow = result.symbolTableRows.find(
        (r) => r.name === 'salary' && r.declaredIn === 'LoanApproval',
      );
      expect(salaryRow).toBeDefined();
      expect(salaryRow?.currentType).toBe('Decimal');
      expect(salaryRow?.declaredIn).toBe('LoanApproval');
      expect(salaryRow?.references).toBe(4);
      expect(salaryRow?.initialized).toBe('Yes');
      expect(salaryRow?.usedAt).toEqual([12, 16, 24]);

      const loanApprovalDeps = result.dependencyGraph.edges
        .filter((e) => e.from === 'LoanApproval')
        .map((e) => e.to);
      expect(loanApprovalDeps).toEqual([
        'CreditScorePolicy',
        'KYCPolicy',
        'IncomeVerificationPolicy',
      ]);
      expect(result.dependencyGraph.circularPolicyPaths).toHaveLength(0);
    });
  });
});
