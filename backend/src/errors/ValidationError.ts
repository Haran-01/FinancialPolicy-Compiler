import { ZodError } from 'zod'
import { AppError } from './AppError'

/**
 * 422 Unprocessable Entity — request body failed Zod schema validation.
 * Accepts a raw ZodError and formats it into structured field-level details.
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', zodError?: ZodError) {
    const details = zodError
      ? zodError.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }))
      : undefined

    super(message, 422, 'VALIDATION_ERROR', details)
  }
}
