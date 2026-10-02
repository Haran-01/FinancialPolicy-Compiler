import { AppError } from './AppError'

/**
 * 409 Conflict — resource already exists or state conflict.
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, 409, 'CONFLICT_ERROR', details)
  }
}
