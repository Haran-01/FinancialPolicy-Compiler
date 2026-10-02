import { Request, Response, NextFunction, RequestHandler } from 'express'
import { UserRole } from '../config/constants'
import { AuthorizationError, AuthenticationError } from '../errors'

/**
 * Role-based authorization middleware factory.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('ADMIN'), controller)
 *   router.get('/manage', authenticate, authorize('ADMIN', 'POLICY_MANAGER'), controller)
 *
 * @param roles - One or more allowed roles. If empty, any authenticated user is permitted.
 */
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('User not authenticated.'))
      return
    }

    if (roles.length === 0) {
      // No role restriction — any authenticated user passes
      next()
      return
    }

    if (!roles.includes(req.user.role as UserRole)) {
      next(
        new AuthorizationError(
          `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}.`,
        ),
      )
      return
    }

    next()
  }
}
