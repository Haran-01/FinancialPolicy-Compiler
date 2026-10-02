import { AppError } from './AppError'

/**
 * 500 Database Error — unexpected Prisma / database-level failure.
 * isOperational = false so callers know this is unexpected.
 */
export class DatabaseError extends AppError {
  constructor(message = 'A database error occurred', details?: unknown) {
    super(message, 500, 'DATABASE_ERROR', details, false)
  }
}
