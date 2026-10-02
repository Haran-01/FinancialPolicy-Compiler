/**
 * Policy domain types shared across backend, frontend, and compiler.
 */

/** Lifecycle states of a policy. */
export type PolicyStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'ARCHIVED'

/** Financial domain categories a policy can belong to. */
export type PolicyCategory =
  | 'LOAN'
  | 'TAX'
  | 'PAYROLL'
  | 'INSURANCE'
  | 'CASHBACK'
  | 'INVESTMENT'
  | 'FRAUD'
  | 'BANKING'
  | 'OTHER'

/** Fully-hydrated policy record returned from the API. */
export interface Policy {
  id: string
  name: string
  description: string | null
  category: PolicyCategory
  status: PolicyStatus
  tags: string[]
  authorId: string
  organizationId: string | null
  currentVersionId: string | null
  createdAt: Date
  updatedAt: Date
}

/** A single versioned snapshot of a policy's FPL source. */
export interface PolicyVersion {
  id: string
  policyId: string
  versionNumber: number
  source: string
  changelog: string
  compiledAt: Date | null
  artifactId: string | null
  createdAt: Date
}

/** Payload for creating a new policy (POST /api/policies). */
export interface CreatePolicyDto {
  name: string
  description?: string
  category: PolicyCategory
  tags?: string[]
}

/** Payload for updating an existing policy (PATCH /api/policies/:id). */
export interface UpdatePolicyDto {
  name?: string
  description?: string
  category?: PolicyCategory
  tags?: string[]
}

/** Payload for saving a new version (POST /api/policies/:id/versions). */
export interface SaveVersionDto {
  source: string
  changelog: string
}
