import { describe, expect, it } from 'vitest'
import {
  analyzePolicySource,
  detectPolicySourceLanguage,
  executePolicyVM,
  generatePolicyIR,
  translateCPolicyToFpl,
} from './c-policy-engine'

const C_LOAN_POLICY = `// @policy CLoanApproval
int age;
float salary;
int creditScore;
float interestRate;

if (age >= 21 && salary >= 60000 && creditScore >= 700) {
  approve();
  interestRate = 8.5;
} else {
  reject();
  interestRate = 14.0;
}`

describe('C Policy Mode compiler frontend', () => {
  it('detects and translates supported C policy code into canonical FPL', () => {
    const translated = translateCPolicyToFpl(C_LOAN_POLICY)

    expect(detectPolicySourceLanguage(C_LOAN_POLICY)).toBe('c-policy')
    expect(translated.diagnostics).toEqual([])
    expect(translated.policyName).toBe('CLoanApproval')
    expect(translated.fplSource).toContain('POLICY CLoanApproval')
    expect(translated.fplSource).toContain('age >= 21 AND salary >= 60000 AND creditScore >= 700')
    expect(translated.fplSource).toContain('SET interestRate = 8.5')
  })

  it('reuses semantic, IR, optimizer, and FPVM stages for C policy code', () => {
    const semantic = analyzePolicySource(C_LOAN_POLICY)
    const ir = generatePolicyIR(C_LOAN_POLICY)
    const execution = executePolicyVM(C_LOAN_POLICY, {
      age: 28,
      salary: 75000,
      creditScore: 740,
    })

    expect(semantic.diagnostics).toEqual([])
    expect(ir.tac.length).toBeGreaterThan(0)
    expect(ir.formattedTAC).toContain('IF_FALSE')
    expect(ir.optimization.passSummaries.length).toBeGreaterThan(0)
    expect(execution.status).toBe('SUCCESS')
    expect(execution.decision).toBe('APPROVE')
    expect(execution.outputs).toEqual({ interestRate: 8.5 })
  })

  it('runs the else branch through the same VM', () => {
    const execution = executePolicyVM(C_LOAN_POLICY, {
      age: 19,
      salary: 42000,
      creditScore: 610,
    })

    expect(execution.status).toBe('SUCCESS')
    expect(execution.decision).toBe('REJECT')
    expect(execution.outputs).toEqual({ interestRate: 14 })
  })
})
