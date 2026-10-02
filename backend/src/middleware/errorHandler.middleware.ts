import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { AppError } from '../errors/AppError'
import { ValidationError } from '../errors/ValidationError'
import { ConflictError } from '../errors/ConflictError'
import { NotFoundError } from '../errors/NotFoundError'
import { DatabaseError } from '../errors/DatabaseError'
import logger from '../config/logger'
import { env } from '../config/env'

/**
 * Maps Prisma-specific error codes to domain AppErrors.
 */
function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint failed
      const fields = (err.meta?.target as string[] | undefined) ?? []
      return new ConflictError(
        `A record with the same ${fields.join(', ')} already exists.`,
        { fields, prismaCode: err.code },
      )
    }
    case 'P2025':
      // Record not found
      return new NotFoundError('Record')
    case 'P2003':
      // Foreign key constraint failed
      return new ValidationError('Related record does not exist.', undefined)
    case 'P2014':
      return new ValidationError('The change would violate a required relation.', undefined)
    default:
      return new DatabaseError(`Database operation failed (${err.code}).`, {
        prismaCode: err.code,
        meta: err.meta,
      })
  }
}

/**
 * Global Express error handler — MUST be the last middleware registered.
 *
 * Produces a consistent JSON envelope:
 * {
 *   success: false,
 *   error: { code, message, details? },
 *   meta:  { requestId, timestamp }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId ?? 'unknown'
  const timestamp = new Date().toISOString()

  let appError: AppError

  // ── Classify the error ─────────────────────────────────────────────────────
  if (err instanceof AppError) {
    appError = err
  } else if (err instanceof ZodError) {
    appError = new ValidationError('Validation failed', err)
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    appError = mapPrismaError(err)
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Invalid data sent to the database.')
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    appError = new DatabaseError('Failed to connect to the database.')
  } else {
    // Unknown / programming error
    appError = new AppError(
      env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : String(err),
      500,
      'INTERNAL_SERVER_ERROR',
      undefined,
      false,
    )
  }

  // ── Log ────────────────────────────────────────────────────────────────────
  if (appError.statusCode >= 500 || !appError.isOperational) {
    logger.error('Unhandled error', {
      requestId,
      statusCode: appError.statusCode,
      code: appError.code,
      message: appError.message,
      stack: appError.stack,
      originalError: err instanceof Error ? err.stack : String(err),
    })
  } else {
    logger.warn('Operational error', {
      requestId,
      statusCode: appError.statusCode,
      code: appError.code,
      message: appError.message,
    })
  }

  // ── Respond ────────────────────────────────────────────────────────────────
  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined && env.NODE_ENV !== 'production'
        ? { details: appError.details }
        : {}),
      // Always expose validation details even in production (no sensitive data)
      ...(appError.statusCode === 422 && appError.details !== undefined
        ? { details: appError.details }
        : {}),
    },
    meta: {
      requestId,
      timestamp,
    },
  })
}
