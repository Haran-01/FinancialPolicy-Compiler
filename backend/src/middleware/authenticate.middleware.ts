import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AuthenticationError } from '../errors'
import logger from '../config/logger'

/**
 * Verifies the JWT access token from the `Authorization: Bearer <token>` header.
 * On success, attaches the decoded `RequestUser` to `req.user`.
 * On failure, throws `AuthenticationError` which is caught by the global error handler.
 */
export async function authenticateMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided. Please include a Bearer token.')
    }

    const token = authHeader.slice(7)
    if (!token) {
      throw new AuthenticationError('Malformed Authorization header.')
    }

    const payload = verifyAccessToken(token)

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    }

    logger.debug('Token verified', {
      requestId: req.requestId,
      userId: payload.userId,
      role: payload.role,
    })

    next()
  } catch (err) {
    if (err instanceof AuthenticationError) {
      next(err)
    } else {
      // JWT library throws JsonWebTokenError, TokenExpiredError, etc.
      next(new AuthenticationError('Invalid or expired token.'))
    }
  }
}
