import { Router } from 'express'
import { authController } from '../../controllers/auth.controller'
import { authenticateMiddleware } from '../../middleware/authenticate.middleware'
import { validate } from '../../middleware/validate.middleware'
import { authLimiter } from '../../middleware/rateLimiter.middleware'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../../validators/auth.validators'

const router = Router()

// ─── Public routes (rate-limited) ──────────────────────────────────────────────
/**
 * POST /api/v1/auth/register
 * Create a new user account.
 */
router.post('/register', authLimiter, validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next),
)

/**
 * POST /api/v1/auth/login
 * Authenticate and receive access + refresh tokens.
 */
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
)

/**
 * POST /api/v1/auth/refresh
 * Exchange a valid refresh token for new token pair.
 */
router.post('/refresh', validate(refreshTokenSchema), (req, res, next) =>
  authController.refreshToken(req, res, next),
)

// ─── Authenticated routes ───────────────────────────────────────────────────────
/**
 * POST /api/v1/auth/logout
 * Revoke the current session.
 */
router.post('/logout', authenticateMiddleware, (req, res, next) =>
  authController.logout(req, res, next),
)

/**
 * GET /api/v1/auth/me
 * Return the authenticated user's profile.
 */
router.get('/me', authenticateMiddleware, (req, res, next) =>
  authController.getMe(req, res, next),
)

/**
 * PATCH /api/v1/auth/me
 * Update the authenticated user's profile.
 */
router.patch('/me', authenticateMiddleware, validate(updateProfileSchema), (req, res, next) =>
  authController.updateMe(req, res, next),
)

/**
 * PATCH /api/v1/auth/me/password
 * Change the authenticated user's password.
 */
router.patch(
  '/me/password',
  authenticateMiddleware,
  validate(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next),
)

/**
 * GET /api/v1/auth/sessions
 * List all active sessions for the authenticated user.
 */
router.get('/sessions', authenticateMiddleware, (req, res, next) =>
  authController.listSessions(req, res, next),
)

/**
 * DELETE /api/v1/auth/sessions/:id
 * Revoke a specific session.
 */
router.delete('/sessions/:id', authenticateMiddleware, (req, res, next) =>
  authController.revokeSession(req, res, next),
)

export { router as authRoutes }
