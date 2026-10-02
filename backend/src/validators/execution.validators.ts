import { z } from 'zod'
import { env } from '../config/env'

export const executeSchema = z.object({
  artifactId: z.string().uuid('artifactId must be a valid UUID'),
  inputData: z.record(z.unknown()).default({}),
  timeoutMs: z
    .number()
    .int()
    .positive()
    .max(env.MAX_EXECUTION_TIMEOUT_MS)
    .optional()
    .default(env.MAX_EXECUTION_TIMEOUT_MS),
  recordTrace: z.boolean().default(false),
})

export type ExecuteInput = z.infer<typeof executeSchema>
