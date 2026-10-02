import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'
import { env } from '../config/env'

const windowMs = env.RATE_LIMIT_WINDOW_MS

/**
 * General API rate limiter — 300 requests per 15-minute window.
 * Applied globally to all routes.
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  keyGenerator: (req) => req.ip ?? 'unknown',
})

/**
 * Strict auth rate limiter — 10 requests per 15-minute window.
 * Applied only to authentication endpoints (register, login).
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
  keyGenerator: (req) => req.ip ?? 'unknown',
  skipSuccessfulRequests: false,
})
