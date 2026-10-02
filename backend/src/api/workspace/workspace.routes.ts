/**
 * Enterprise Policy Management & Workspace REST API Routes
 * Phase 5: Exposes Policy CRUD, Version Control, Compiler Integration, FPVM Execution,
 * Nested Folders, Categories, Tags, Import/Export (.fpl), Search/Filter, Audit Logs, and Dashboard.
 */

import { Router, Request, Response, NextFunction } from 'express'
import {
  policyManagementService,
  UserRole,
  PolicyStatus,
  CompilationStatus,
  ExecutionStatus,
} from '../../services/policy-management.service'
import { successResponse } from '../../utils/response'

const router = Router()

function getActor(req: Request) {
  return {
    id: req.user?.id ?? (req.headers['x-actor-id'] as string) ?? 'usr-admin-01',
    name: (req.headers['x-actor-name'] as string) ?? req.user?.email ?? 'Enterprise Admin',
    role: ((req.user?.role ?? (req.headers['x-actor-role'] as string) ?? 'ADMIN') as UserRole),
    ipAddress: req.ip ?? '127.0.0.1',
    userAgent: req.headers['user-agent'] ?? 'FinPolicy-Client/1.0',
  }
}

// ─── Dashboard & Analytics ──────────────────────────────────────────────────

router.get('/dashboard', (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = policyManagementService.getDashboardOverview(getActor(req))
    res.json(successResponse(overview))
  } catch (err) {
    next(err)
  }
})

// ─── Policies Search, Filter & CRUD ─────────────────────────────────────────

router.get('/policies', (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = policyManagementService.searchPolicies(
      {
        search: req.query.search as string | undefined,
        status: req.query.status as PolicyStatus | 'ALL' | undefined,
        categoryId: req.query.categoryId as string | undefined,
        categorySlug: req.query.categorySlug as string | undefined,
        tag: req.query.tag as string | undefined,
        authorId: req.query.authorId as string | undefined,
        folderId: req.query.folderId as string | undefined,
        compilationStatus: req.query.compilationStatus as CompilationStatus | 'ALL' | undefined,
        executionStatus: req.query.executionStatus as ExecutionStatus | 'ALL' | undefined,
        hasErrors: req.query.hasErrors === 'true' ? true : req.query.hasErrors === 'false' ? false : undefined,
        hasWarnings: req.query.hasWarnings === 'true' ? true : req.query.hasWarnings === 'false' ? false : undefined,
        isFavorite: req.query.isFavorite === 'true' ? true : undefined,
        isPinned: req.query.isPinned === 'true' ? true : undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
      },
      getActor(req),
    )
    res.json(successResponse(results))
  } catch (err) {
    next(err)
  }
})

router.post('/policies', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.createPolicy(req.body, getActor(req))
    res.status(201).json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.get('/policies/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.openPolicy(req.params.id, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.patch('/policies/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.updatePolicy(req.params.id, req.body, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/rename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.renamePolicy(req.params.id, req.body.name, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/duplicate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.duplicatePolicy(req.params.id, getActor(req))
    res.status(201).json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.delete('/policies/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = policyManagementService.deletePolicy(
      req.params.id,
      getActor(req),
      req.query.hard === 'true',
    )
    res.json(successResponse(result))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/publish', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.publishPolicy(req.params.id, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/archive', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.archivePolicy(req.params.id, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/restore', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.restorePolicy(req.params.id, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/favorite', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.toggleFavoritePolicy(req.params.id, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/pin', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.togglePinPolicy(req.params.id, getActor(req))
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/format', (req: Request, res: Response, next: NextFunction) => {
  try {
    const formatted = policyManagementService.formatPolicySource(req.body.sourceCode ?? '')
    res.json(successResponse({ formatted }))
  } catch (err) {
    next(err)
  }
})

// ─── Version Control ────────────────────────────────────────────────────────

router.get('/policies/:id/versions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const versions = policyManagementService.getVersionHistory(req.params.id, getActor(req))
    res.json(successResponse(versions))
  } catch (err) {
    next(err)
  }
})

router.get('/policies/:id/versions/latest', (req: Request, res: Response, next: NextFunction) => {
  try {
    const latest = policyManagementService.getLatestVersion(req.params.id, getActor(req))
    res.json(successResponse(latest))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/versions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = policyManagementService.createVersion(
      req.params.id,
      req.body.sourceCode,
      req.body.changelog ?? 'Manual version snapshot',
      getActor(req),
    )
    res.status(201).json(successResponse(version))
  } catch (err) {
    next(err)
  }
})

router.post(
  '/policies/:id/versions/:versionNumber/restore',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const policy = policyManagementService.restoreVersion(
        req.params.id,
        Number(req.params.versionNumber),
        getActor(req),
      )
      res.json(successResponse(policy))
    } catch (err) {
      next(err)
    }
  },
)

router.get('/policies/:id/versions/compare', (req: Request, res: Response, next: NextFunction) => {
  try {
    const leftVersion = Number(req.query.left ?? 1)
    const rightVersion = Number(req.query.right ?? 2)
    const diff = policyManagementService.compareVersions(
      req.params.id,
      leftVersion,
      rightVersion,
      getActor(req),
    )
    res.json(successResponse(diff))
  } catch (err) {
    next(err)
  }
})

// ─── Compiler & FPVM Execution Integration ──────────────────────────────────

router.post('/policies/:id/compile', (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = policyManagementService.compilePolicy(
      req.params.id,
      getActor(req),
      req.body.sourceOverride,
    )
    res.json(successResponse(record))
  } catch (err) {
    next(err)
  }
})

router.get('/compilations', (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = policyManagementService.getCompilationHistory(
      req.query.policyId as string | undefined,
      getActor(req),
    )
    res.json(successResponse(history))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/execute', (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = policyManagementService.executePolicy(
      req.params.id,
      req.body.inputs ?? {},
      getActor(req),
      req.body.sourceOverride,
    )
    res.json(successResponse(record))
  } catch (err) {
    next(err)
  }
})

router.get('/executions', (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = policyManagementService.getExecutionHistory(
      req.query.policyId as string | undefined,
      getActor(req),
    )
    res.json(successResponse(history))
  } catch (err) {
    next(err)
  }
})

// ─── Import & Export (.fpl) ─────────────────────────────────────────────────

router.post('/policies/import', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.importFplPolicy(
      req.body.fileName ?? 'ImportedPolicy.fpl',
      req.body.content ?? '',
      getActor(req),
      {
        categoryId: req.body.categoryId,
        folderId: req.body.folderId,
        tags: req.body.tags,
      },
    )
    res.status(201).json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.get('/policies/:id/export', (req: Request, res: Response, next: NextFunction) => {
  try {
    const exported = policyManagementService.exportFplPolicy(req.params.id, getActor(req))
    res.json(successResponse(exported))
  } catch (err) {
    next(err)
  }
})

// ─── Workspace Folders, Categories, Tags & Audit Logs ───────────────────────

router.get('/folders', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(successResponse(policyManagementService.listFolders(getActor(req))))
  } catch (err) {
    next(err)
  }
})

router.post('/folders', (req: Request, res: Response, next: NextFunction) => {
  try {
    const folder = policyManagementService.createFolder(
      req.body.name,
      req.body.parentId ?? null,
      getActor(req),
      req.body.color,
    )
    res.status(201).json(successResponse(folder))
  } catch (err) {
    next(err)
  }
})

router.post('/policies/:id/move', (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = policyManagementService.movePolicyToFolder(
      req.params.id,
      req.body.folderId ?? null,
      getActor(req),
    )
    res.json(successResponse(policy))
  } catch (err) {
    next(err)
  }
})

router.get('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(successResponse(policyManagementService.listCategories(getActor(req))))
  } catch (err) {
    next(err)
  }
})

router.get('/tags', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(successResponse(policyManagementService.listTags(getActor(req))))
  } catch (err) {
    next(err)
  }
})

router.get('/audit', (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = policyManagementService.getAuditLogs(getActor(req), {
      action: req.query.action as any,
      policyId: req.query.policyId as string | undefined,
      actorId: req.query.actorId as string | undefined,
    })
    res.json(successResponse(logs))
  } catch (err) {
    next(err)
  }
})

export { router as workspaceRoutes }
