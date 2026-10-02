import { Router } from 'express'
import { analyticsController } from '../../controllers/analytics.controller'
import { authenticateMiddleware } from '../../middleware/authenticate.middleware'
import { authorize } from '../../middleware/authorize.middleware'

const router = Router()

// All analytics routes require authentication + ADMIN or AUDITOR role
router.use(authenticateMiddleware)
router.use(authorize('ADMIN', 'AUDITOR'))

/**
 * GET /api/v1/analytics/overview
 * High-level dashboard metrics.
 */
router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next))

/**
 * GET /api/v1/analytics/compilation-rates
 * Compilation success/failure rate summary.
 */
router.get('/compilation-rates', (req, res, next) =>
  analyticsController.getCompilationRates(req, res, next),
)

/**
 * GET /api/v1/analytics/execution-volume?days=30
 * Daily execution volume for the last N days.
 */
router.get('/execution-volume', (req, res, next) =>
  analyticsController.getExecutionVolume(req, res, next),
)

/**
 * GET /api/v1/analytics/top-policies?limit=10
 * Top N policies by execution count.
 */
router.get('/top-policies', (req, res, next) =>
  analyticsController.getTopPolicies(req, res, next),
)

export { router as analyticsRoutes }
