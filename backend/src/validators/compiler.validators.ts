import { z } from 'zod'

export const compileSchema = z.object({
  source: z.string().min(1, 'Source code is required'),
  policyId: z.string().uuid('policyId must be a valid UUID').optional(),
  optimizationLevel: z.number().int().min(0).max(2).default(2),
  emitAst: z.boolean().default(false),
  emitIr: z.boolean().default(false),
  emitTac: z.boolean().default(false),
  emitQuadruples: z.boolean().default(false),
  emitTriples: z.boolean().default(false),
})

export type CompileInput = z.infer<typeof compileSchema>

export const runSchema = compileSchema.extend({
  inputData: z.record(z.unknown()).default({}),
  timeoutMs: z.number().int().positive().optional(),
  recordTrace: z.boolean().default(true),
})

export type RunInput = z.infer<typeof runSchema>
