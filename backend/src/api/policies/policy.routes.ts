import { Router } from 'express'
import { policyController } from '../../controllers/policy.controller'
import { authenticateMiddleware } from '../../middleware/authenticate.middleware'
import { authorize } from '../../middleware/authorize.middleware'
import { validate } from '../../middleware/validate.middleware'
import {
  createPolicySchema,
  updatePolicySchema,
  savePolicyVersionSchema,
} from '../../validators/policy.validators'

const router = Router()

// All policy routes require authentication
router.use(authenticateMiddleware)

// ─── Collection routes ──────────────────────────────────────────────────────────
/**
 * GET /api/v1/policies
 * List policies (filtered by role).
 */
router.get('/', (req, res, next) => policyController.list(req, res, next))

/**
 * POST /api/v1/policies
 * Create a new policy draft. (ADMIN, POLICY_MANAGER only)
 */
router.post(
  '/',
  authorize('ADMIN', 'POLICY_MANAGER'),
  validate(createPolicySchema),
  (req, res, next) => policyController.create(req, res, next),
)

// ─── Item routes ────────────────────────────────────────────────────────────────
/**
 * GET /api/v1/policies/:id
 */
router.get('/:id', (req, res, next) => policyController.getOne(req, res, next))

/**
 * PATCH /api/v1/policies/:id
 */
router.patch(
  '/:id',
  authorize('ADMIN', 'POLICY_MANAGER'),
  validate(updatePolicySchema),
  (req, res, next) => policyController.update(req, res, next),
)

/**
 * POST /api/v1/policies/:id/publish
 */
router.post(
  '/:id/publish',
  authorize('ADMIN', 'POLICY_MANAGER'),
  (req, res, next) => policyController.publish(req, res, next),
)

/**
 * POST /api/v1/policies/:id/deprecate
 */
router.post(
  '/:id/deprecate',
  authorize('ADMIN', 'POLICY_MANAGER'),
  (req, res, next) => policyController.deprecate(req, res, next),
)

/**
 * POST /api/v1/policies/:id/archive
 */
router.post(
  '/:id/archive',
  authorize('ADMIN', 'POLICY_MANAGER'),
  (req, res, next) => policyController.archive(req, res, next),
)

// ─── Version routes ─────────────────────────────────────────────────────────────
/**
 * GET /api/v1/policies/:id/versions
 */
router.get('/:id/versions', (req, res, next) => policyController.listVersions(req, res, next))

/**
 * GET /api/v1/policies/:id/versions/:versionId
 */
router.get('/:id/versions/:versionId', (req, res, next) =>
  policyController.getVersion(req, res, next),
)

/**
 * POST /api/v1/policies/:id/versions
 */
router.post(
  '/:id/versions',
  authorize('ADMIN', 'POLICY_MANAGER'),
  validate(savePolicyVersionSchema),
  (req, res, next) => policyController.saveVersion(req, res, next),
)

export { router as policyRoutes }
