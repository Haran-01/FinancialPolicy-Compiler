import { Router } from 'express'
import { compilerRoutes } from './compiler/compiler.routes'

const router = Router()

/**
 * Mount all API route groups under /api/v1
 *
 * Full prefix structure:
 *   /api/v1/auth        — Authentication & user profile
 *   /api/v1/policies    — Policy management
 *   /api/v1/compiler    — Compilation jobs
 *   /api/v1/execution   — Execution jobs
 *   /api/v1/analytics   — Dashboard analytics
 *   /api/v1/audit       — Immutable audit logs
 *   /api/v1/workspace   — Enterprise Policy Management & Workspace Engine
 *   /api/v1/health      — Enterprise Application Health, Compiler & Runtime Readiness
 */
router.use('/compiler', compilerRoutes)

export { router as apiRouter }
