import { Router } from 'express'
import { auditController } from '../../controllers/audit.controller'
import { authenticateMiddleware } from '../../middleware/authenticate.middleware'
import { authorize } from '../../middleware/authorize.middleware'

const router = Router()

// All audit routes require authentication + ADMIN or AUDITOR role
router.use(authenticateMiddleware)
router.use(authorize('ADMIN', 'AUDITOR'))

/**
 * GET /api/v1/audit/logs
 * Paginated list of audit logs with optional filters:
 * ?userId=&policyId=&action=&fromDate=&toDate=&page=&limit=
 */
router.get('/logs', (req, res, next) => auditController.listLogs(req, res, next))

/**
 * GET /api/v1/audit/logs/export
 * Download all filtered audit logs as a JSON file.
 */
router.get('/logs/export', (req, res, next) => auditController.exportLogs(req, res, next))

/**
 * GET /api/v1/audit/logs/user/:userId
 * All audit logs for a specific user.
 */
router.get('/logs/user/:userId', (req, res, next) =>
  auditController.getLogsByUser(req, res, next),
)

/**
 * GET /api/v1/audit/logs/policy/:policyId
 * All audit logs for a specific policy.
 */
router.get('/logs/policy/:policyId', (req, res, next) =>
  auditController.getLogsByPolicy(req, res, next),
)

export { router as auditRoutes }
