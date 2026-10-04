import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { usePolicyWorkspaceStore } from '@/stores/policy-workspace.store'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function readRootFile(fileName: string) {
  return readFileSync(resolve(projectRoot, fileName), 'utf8')
}

describe('frontend import path for new manual FPL and C policies', () => {
  it('imports, compiles, and executes a new .fpl policy without errors', () => {
    const store = usePolicyWorkspaceStore.getState()
    const source = readRootFile('ManualFrontendFplTest.fpl')
    const policy = store.importFplFile('ManualFrontendFplTest.fpl', source)

    const compile = usePolicyWorkspaceStore.getState().compilePolicy(policy.id, source)
    const execution = usePolicyWorkspaceStore.getState().executePolicy(
      policy.id,
      {
        yearsOperating: 4,
        annualRevenue: 320000,
        employeeCount: 12,
      },
      source,
    )

    expect(compile.status).toBe('SUCCESS')
    expect(compile.errorCount).toBe(0)
    expect(execution.status).toBe('SUCCESS')
    expect(execution.decision).toBe('APPROVE')
    expect(execution.outputs).toEqual({ grantAmount: 75000, reviewBand: 1 })
  })

  it('imports, compiles, and executes a new .c policy without errors', () => {
    const store = usePolicyWorkspaceStore.getState()
    const source = readRootFile('ManualFrontendCPolicyTest.c')
    const policy = store.importFplFile('ManualFrontendCPolicyTest.c', source)

    const compile = usePolicyWorkspaceStore.getState().compilePolicy(policy.id, source)
    const execution = usePolicyWorkspaceStore.getState().executePolicy(
      policy.id,
      {
        contractValue: 200000,
        riskScore: 30,
        yearsKnown: 3,
      },
      source,
    )

    expect(policy.sourceLanguage).toBe('c-policy')
    expect(compile.status).toBe('SUCCESS')
    expect(compile.errorCount).toBe(0)
    expect(execution.status).toBe('SUCCESS')
    expect(execution.decision).toBe('APPROVE')
    expect(execution.outputs).toEqual({ approvalLimit: 250000, reviewFlag: 0 })
  })
})
