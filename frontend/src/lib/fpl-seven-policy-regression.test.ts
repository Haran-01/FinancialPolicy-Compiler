import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeFplSemantics } from './fpl-semantic-engine'
import { generateFplIR } from './fpl-ir-engine'
import { executeFplVM } from './fpl-vm-engine'

interface CaseDef {
  name: string
  fileName: string
  input: Record<string, number>
  expectedDecision: 'APPROVE' | 'REJECT' | 'REVIEW'
  expectedOutputs: Record<string, number>
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function readPolicy(fileName: string) {
  return readFileSync(resolve(projectRoot, fileName), 'utf8')
}

const cases: CaseDef[] = [
  {
    name: 'LoanApproval approve',
    fileName: 'LoanApproval_Approve.fpl',
    input: { age: 28, salary: 75000, creditScore: 740 },
    expectedDecision: 'APPROVE',
    expectedOutputs: { interestRate: 8.5 },
  },
  {
    name: 'ScholarshipAid approve',
    fileName: 'ScholarshipAid_Approve.fpl',
    input: { gpa: 9.1, familyIncome: 38000, communityHours: 52 },
    expectedDecision: 'APPROVE',
    expectedOutputs: { scholarshipAmount: 25000, reviewScore: 95 },
  },
  {
    name: 'ScholarshipAid review',
    fileName: 'ScholarshipAid.fpl',
    input: { gpa: 7.9, familyIncome: 38000, communityHours: 52 },
    expectedDecision: 'REVIEW',
    expectedOutputs: { scholarshipAmount: 5000, reviewScore: 60 },
  },
  {
    name: 'PayrollBonus approve',
    fileName: 'PayrollBonus_Approve.fpl',
    input: { baseSalary: 92000, performanceRating: 5, tenureYears: 4 },
    expectedDecision: 'APPROVE',
    expectedOutputs: { bonusAmount: 18000, payoutBand: 1 },
  },
  {
    name: 'WireFraud reject',
    fileName: 'WireFraud_Reject.fpl',
    input: { amount: 125000, riskScore: 82, accountAgeDays: 12 },
    expectedDecision: 'REJECT',
    expectedOutputs: { riskTier: 3, holdHours: 72 },
  },
  {
    name: 'InsuranceClaim review',
    fileName: 'InsuranceClaim_Review.fpl',
    input: { claimAmount: 18500, coverageActive: 1, deductibleMet: 0 },
    expectedDecision: 'REVIEW',
    expectedOutputs: { reimbursementRate: 50, manualReviewFlag: 1 },
  },
  {
    name: 'CorporateTaxWithholding reject',
    fileName: 'CorporateTaxWithholding_Reject.fpl',
    input: { taxableIncome: 310000, withholdingPaid: 24000, jurisdictionRisk: 4 },
    expectedDecision: 'REJECT',
    expectedOutputs: { additionalWithholding: 15000, complianceFlag: 1 },
  },
]

describe('seven policy compiler regression', () => {
  it.each(cases)('compiles and executes $name with correct phase data', (testCase) => {
    const source = readPolicy(testCase.fileName)
    const semantic = analyzeFplSemantics(source)
    const ir = generateFplIR(source)
    const execution = executeFplVM(source, testCase.input)

    expect(semantic.diagnostics).toEqual([])
    expect(semantic.symbols.length).toBeGreaterThan(0)
    expect(ir.policyName).toMatch(/^[A-Za-z_]/)
    expect(ir.tac.length).toBeGreaterThan(0)
    expect(ir.formattedTAC).toContain('IF_FALSE')
    expect(ir.optimization.passSummaries.length).toBeGreaterThan(0)

    expect(execution.status).toBe('SUCCESS')
    expect(execution.decision).toBe(testCase.expectedDecision)
    expect(execution.outputs).toEqual(testCase.expectedOutputs)
    expect(execution.trace.length).toBeGreaterThan(0)
  })
})
