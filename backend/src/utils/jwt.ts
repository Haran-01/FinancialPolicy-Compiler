import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { JwtPayload } from '../types'
import { AuthenticationError } from '../errors'

/**
 * Generates a short-lived access token (default 15m).
 */
export function generateAccessToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as jwt.SignOptions)
}

/**
 * Generates a long-lived refresh token (default 7d).
 */
export function generateRefreshToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as jwt.SignOptions)
}

/**
 * Verifies an access token. Throws AuthenticationError on failure.
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Access token has expired. Please refresh your session.')
    }
    throw new AuthenticationError('Invalid access token.')
  }
}

/**
 * Verifies a refresh token. Throws AuthenticationError on failure.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token has expired. Please log in again.')
    }
    throw new AuthenticationError('Invalid refresh token.')
  }
}
