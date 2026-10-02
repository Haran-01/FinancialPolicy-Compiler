/**
 * FinPolicy Compiler — QA Test Data, Shared Fixtures, Generators & Mock Services
 * Provides Sample Policies, Invalid Policies, Edge Cases, Golden Regression Baselines,
 * and Stress Test Generators (Large Policies, Deeply Nested Conditions,
 * Thousands of Variables, Thousands of Functions).
 */

export interface GoldenRegressionFixture {
  id: string
  name: string
  description: string
  bugReference: string
  sourceCode: string
  inputs: Record<string, number | string | boolean>
  expectedDecision: 'APPROVE' | 'REJECT' | 'REVIEW' | 'NONE'
  expectedOutputs: Record<string, unknown>
  expectedMinTokens: number
}

// ─── 1. Valid Sample Policies ───────────────────────────────────────────────

export const SAMPLE_POLICIES = {
  retailLoanApproval: `POLICY LoanApproval
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
END`,

  corporateWireGuard: `POLICY CorporateWireGuard
INPUT
  wireAmount: decimal
  velocityScore: int
  kycVerified: boolean
OUTPUT
  riskTier: int
WHEN
  wireAmount <= 250000 AND velocityScore < 35 AND kycVerified == true
THEN
  APPROVE
  SET riskTier = 1
ELSE
  REJECT
  SET riskTier = 3
END`,

  multiFunctionTaxPolicy: `IMPORT "core/tax_rates.fpl" AS TaxRates

CONST MAX_DEDUCTION : decimal = 25000.0

FUNCTION computeTaxableIncome(gross: decimal, deduction: decimal) RETURNS decimal
  RETURN gross - deduction
END

POLICY AnnualTaxAssessment
INPUT
  grossIncome: decimal
  deductions: decimal
OUTPUT
  effectiveRate: decimal
WHEN
  grossIncome >= 100000
THEN
  APPROVE
  SET effectiveRate = 22.5
ELSE
  APPROVE
  SET effectiveRate = 12.0
END`,

  constantFoldingCandidate: `POLICY ConstantOptimizationPolicy
INPUT
  salary: decimal
OUTPUT
  bonus: decimal
  taxFactor: decimal
WHEN
  salary >= 10000 + 50000
THEN
  APPROVE
  SET bonus = (2000 + 3000) * 2
  SET taxFactor = 100 * 1 + 0
ELSE
  REJECT
  SET bonus = 0
  SET taxFactor = 0
END`,
} as const

// ─── 2. Invalid Policies (Lexical, Syntax & Semantic Error Fixtures) ────────

export const INVALID_POLICIES = {
  lexicalInvalidChars: `POLICY BadLexPolicy
INPUT
  salary: decimal
WHEN
  salary >= 50000 @#$
THEN
  APPROVE
END`,

  unterminatedString: `POLICY UnterminatedStr
INPUT
  region: string
WHEN
  region == "NORTH_AMERICA
THEN
  APPROVE
END`,

  syntaxMissingThen: `POLICY MissingThenClause
INPUT
  age: int
WHEN
  age >= 21
  APPROVE
END`,

  semanticUndefinedVariable: `POLICY UndefinedVarPolicy
INPUT
  age: int
WHEN
  age >= 21 AND undeclaredSalary >= 60000
THEN
  APPROVE
ELSE
  REJECT
END`,

  semanticTypeMismatch: `POLICY TypeMismatchPolicy
INPUT
  age: int
  name: string
WHEN
  age >= "twenty-one"
THEN
  APPROVE
ELSE
  REJECT
END`,

  semanticDuplicateDeclaration: `POLICY DuplicateVarPolicy
INPUT
  salary: decimal
  salary: int
WHEN
  salary >= 50000
THEN
  APPROVE
END`,

  duplicatePolicies: `POLICY LoanCheck
WHEN
  true
THEN
  APPROVE
END

POLICY LoanCheck
WHEN
  false
THEN
  REJECT
END`,
} as const

// ─── 3. Edge Case Policies ──────────────────────────────────────────────────

export const EDGE_CASE_POLICIES = {
  unicodeCommentsAndStrings: `// FinPolicy Unicode Test: ₹ € £ ¥ — 金融政策コンパイラ
POLICY UnicodeCurrencyPolicy
INPUT
  currencyCode: string
  amount: decimal
WHEN
  amount >= 0.0
THEN
  APPROVE
ELSE
  REJECT
END`,

  zeroAndNegativeBoundary: `POLICY BoundaryValuesPolicy
INPUT
  balance: decimal
  overdraftLimit: decimal
OUTPUT
  netPosition: decimal
WHEN
  balance >= 0.0
THEN
  APPROVE
  SET netPosition = balance
ELSE
  REJECT
  SET netPosition = 0.0
END`,
} as const

// ─── 4. Golden Regression Test Baselines ────────────────────────────────────

export const GOLDEN_REGRESSION_FIXTURES: GoldenRegressionFixture[] = [
  {
    id: 'REG-001',
    name: 'Prime Loan Approval Regression',
    description: 'Verifies prime loan applicants receive APPROVE and 8.5% interest rate',
    bugReference: 'FPC-BUG-101: Decimal assignment in THEN block',
    sourceCode: SAMPLE_POLICIES.retailLoanApproval,
    inputs: { age: 32, salary: 95000, creditScore: 780 },
    expectedDecision: 'APPROVE',
    expectedOutputs: { interestRate: 8.5 },
    expectedMinTokens: 25,
  },
  {
    id: 'REG-002',
    name: 'Subprime Loan Rejection Regression',
    description: 'Verifies under-threshold salary triggers ELSE branch and REJECT decision',
    bugReference: 'FPC-BUG-104: Short-circuit boolean AND evaluation',
    sourceCode: SAMPLE_POLICIES.retailLoanApproval,
    inputs: { age: 25, salary: 42000, creditScore: 710 },
    expectedDecision: 'REJECT',
    expectedOutputs: { interestRate: 14 },
    expectedMinTokens: 25,
  },
  {
    id: 'REG-003',
    name: 'Constant Folding & Algebraic Identity Preservation',
    description: 'Ensures constant folding (10000 + 50000 -> 60000) preserves runtime semantics',
    bugReference: 'FPC-BUG-209: Optimizer constant folding on relational operands',
    sourceCode: SAMPLE_POLICIES.constantFoldingCandidate,
    inputs: { salary: 65000 },
    expectedDecision: 'APPROVE',
    expectedOutputs: { bonus: 10000, taxFactor: 100 },
    expectedMinTokens: 20,
  },
]

// ─── 5. Stress Test Source Generators ───────────────────────────────────────

/**
 * Generates a policy with `count` input variables and arithmetic assignments.
 */
export function generateManyVariablesPolicy(variableCount: number): string {
  const inputs: string[] = []
  const conditions: string[] = []

  for (let i = 1; i <= variableCount; i++) {
    inputs.push(`  var_${i}: int`)
    if (i <= Math.min(variableCount, 25)) {
      conditions.push(`var_${i} >= 0`)
    }
  }

  return `POLICY StressVariablesPolicy_${variableCount}
INPUT
${inputs.join('\n')}
OUTPUT
  resultScore: int
WHEN
  ${conditions.join(' AND ')}
THEN
  APPROVE
  SET resultScore = 100
ELSE
  REJECT
  SET resultScore = 0
END`
}

/**
 * Generates a program with `functionCount` helper functions and a main policy.
 */
export function generateManyFunctionsProgram(functionCount: number): string {
  const funcs: string[] = []
  for (let i = 1; i <= functionCount; i++) {
    funcs.push(`FUNCTION calcMetric_${i}(x: int) RETURNS int
  RETURN x + ${i}
END`)
  }

  return `${funcs.join('\n\n')}

POLICY StressFunctionsPolicy
INPUT
  baseVal: int
WHEN
  baseVal >= 10
THEN
  APPROVE
ELSE
  REJECT
END`
}

/**
 * Generates a policy with deeply nested parenthesized boolean conditions of depth `depth`.
 */
export function generateDeeplyNestedConditionPolicy(depth: number): string {
  let expr = 'age >= 21'
  for (let i = 1; i <= depth; i++) {
    expr = `(${expr} AND salary >= ${1000 + i})`
  }

  return `POLICY DeepNestedPolicy_${depth}
INPUT
  age: int
  salary: decimal
WHEN
  ${expr}
THEN
  APPROVE
ELSE
  REJECT
END`
}

/**
 * Generates a multi-policy large source file with `policyCount` policies.
 */
export function generateLargeMultiPolicySource(policyCount: number): string {
  const blocks: string[] = []
  for (let i = 1; i <= policyCount; i++) {
    blocks.push(`POLICY EnterpriseRule_${i}
INPUT
  score_${i}: int
  limit_${i}: decimal
OUTPUT
  tier_${i}: int
WHEN
  score_${i} >= 600 AND limit_${i} >= 10000
THEN
  APPROVE
  SET tier_${i} = 1
ELSE
  REJECT
  SET tier_${i} = 2
END`)
  }
  return blocks.join('\n\n')
}
