import { AppError } from './AppError'

/**
 * 401 Unauthorized — missing or invalid credentials / token.
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details?: unknown) {
    super(message, 401, 'AUTHENTICATION_ERROR', details)
  }
}
