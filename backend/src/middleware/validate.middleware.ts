import { Request, Response, NextFunction, RequestHandler } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../errors'

/**
 * Zod validation middleware factory.
 * Validates `req.body` against the provided schema.
 * On failure, forwards a `ValidationError` with field-level details.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller)
 */
export function validate<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const err = result.error as ZodError
      next(new ValidationError('Request body validation failed', err))
      return
    }

    // Replace req.body with the parsed (and potentially transformed) value
    req.body = result.data
    next()
  }
}

/**
 * Validates req.query instead of req.body.
 */
export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      const err = result.error as ZodError
      next(new ValidationError('Query parameter validation failed', err))
      return
    }

    req.query = result.data as typeof req.query
    next()
  }
}
