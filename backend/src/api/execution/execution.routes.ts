import { Router } from 'express'
import { executionController } from '../../controllers/execution.controller'
import { authenticateMiddleware } from '../../middleware/authenticate.middleware'
import { authorize } from '../../middleware/authorize.middleware'
import { validate } from '../../middleware/validate.middleware'
import { executeSchema } from '../../validators/execution.validators'

const router = Router()

// All execution routes require authentication
router.use(authenticateMiddleware)

/**
 * POST /api/v1/execution/run
 * Submit an artifact for execution. Returns a PENDING job.
 */
router.post('/run', validate(executeSchema), (req, res, next) =>
  executionController.execute(req, res, next),
)

/**
 * GET /api/v1/execution/jobs
 * List the authenticated user's execution jobs.
 */
router.get('/jobs', (req, res, next) => executionController.listJobs(req, res, next))

/**
 * GET /api/v1/execution/jobs/all
 * List all execution jobs (admin only).
 */
router.get('/jobs/all', authorize('ADMIN'), (req, res, next) =>
  executionController.listAllJobs(req, res, next),
)

/**
 * GET /api/v1/execution/jobs/:id
 * Get a specific execution job.
 */
router.get('/jobs/:id', (req, res, next) => executionController.getJob(req, res, next))

export { router as executionRoutes }
