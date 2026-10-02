import { z } from 'zod'
import { POLICY_CATEGORIES, POLICY_STATUSES } from '../config/constants'

export const createPolicySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(POLICY_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${POLICY_CATEGORIES.join(', ')}` }),
  }),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
})

export const updatePolicySchema = z
  .object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().max(1000).optional(),
    category: z.enum(POLICY_CATEGORIES).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.category !== undefined ||
      data.tags !== undefined,
    { message: 'At least one field must be provided for update' },
  )

export const savePolicyVersionSchema = z.object({
  source: z.string().min(1, 'Policy source code is required'),
  changelog: z.string().min(1, 'Changelog entry is required').max(500),
})

export const policyQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.nativeEnum(POLICY_STATUSES).optional(),
  category: z.enum(POLICY_CATEGORIES).optional(),
  search: z.string().max(200).optional(),
})

export type CreatePolicyInput = z.infer<typeof createPolicySchema>
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>
export type SavePolicyVersionInput = z.infer<typeof savePolicyVersionSchema>
export type PolicyQueryInput = z.infer<typeof policyQuerySchema>
