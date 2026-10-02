import { AppError } from './AppError'

/**
 * 403 Forbidden — authenticated but lacks required permissions.
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details?: unknown) {
    super(message, 403, 'AUTHORIZATION_ERROR', details)
  }
}
