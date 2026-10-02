import { describe, expect, it } from 'vitest'
import { executeFplVM } from './fpl-vm-engine'

const SCHOLARSHIP_AID = `POLICY ScholarshipAid
INPUT
  gpa: decimal
  familyIncome: decimal
  communityHours: int
OUTPUT
  scholarshipAmount: decimal
  reviewScore: int
WHEN
  gpa >= 8.5 AND familyIncome <= 45000 AND communityHours >= 40
THEN
  APPROVE
  SET scholarshipAmount = 25000
  SET reviewScore = 95
ELSE
  REVIEW
  SET scholarshipAmount = 5000
  SET reviewScore = 60
END`

describe('frontend FPVM', () => {
  it('executes multi-condition scholarship policies and returns outputs', () => {
    const result = executeFplVM(SCHOLARSHIP_AID, {
      gpa: 9.1,
      familyIncome: 38000,
      communityHours: 52,
    })

    expect(result.status).toBe('SUCCESS')
    expect(result.decision).toBe('APPROVE')
    expect(result.outputs).toEqual({
      scholarshipAmount: 25000,
      reviewScore: 95,
    })
  })
})
