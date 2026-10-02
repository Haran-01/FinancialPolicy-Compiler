import { Router } from 'express'
import { compilerController } from '../../controllers/compiler.controller'
import { validate } from '../../middleware/validate.middleware'
import { compileSchema, runSchema } from '../../validators/compiler.validators'

const router = Router()

/**
 * POST /api/v1/compiler/compile
 * Compile source code immediately.
 */
router.post('/compile', validate(compileSchema), (req, res, next) =>
  compilerController.compile(req, res, next),
)

/**
 * POST /api/v1/compiler/run
 * Compile and execute source code immediately.
 */
router.post('/run', validate(runSchema), (req, res, next) =>
  compilerController.run(req, res, next),
)

export { router as compilerRoutes }
