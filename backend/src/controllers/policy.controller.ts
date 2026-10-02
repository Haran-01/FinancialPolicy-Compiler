import { Request, Response, NextFunction } from 'express'
import { policyService } from '../services/policy.service'
import { successResponse, createdResponse, paginatedResponse } from '../utils/response'
import { parsePagination } from '../utils/pagination'

export class PolicyController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, ...filters } = req.query as Record<string, string | undefined>
      const pagination = parsePagination({ page: Number(page), limit: Number(limit) })
      const { policies, total } = await policyService.listPolicies(
        { ...filters, page: pagination.page, limit: pagination.limit },
        req.user!,
      )
      res.status(200).json(
        paginatedResponse(policies, total, pagination.page, pagination.limit, req.requestId),
      )
    } catch (err) {
      next(err)
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await policyService.getPolicy(req.params['id']!, req.user!)
      res.status(200).json(successResponse(policy, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await policyService.createPolicy({ ...req.body, ownerId: req.user!.id }, req.user!)
      res.status(201).json(createdResponse(policy, req.requestId))
    } catch (err) {
      next(err)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await policyService.updatePolicy(req.params['id']!, req.body, req.user!)
      res.status(200).json(successResponse(policy, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await policyService.publishPolicy(req.params['id']!, req.user!)
      res.status(200).json(successResponse(policy, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async deprecate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await policyService.deprecatePolicy(req.params['id']!, req.user!)
      res.status(200).json(successResponse(policy, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await policyService.archivePolicy(req.params['id']!, req.user!)
      res.status(200).json(successResponse(policy, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async listVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const versions = await policyService.listVersions(req.params['id']!, req.user!)
      res.status(200).json(successResponse(versions, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async getVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await policyService.getVersion(req.params['id']!, req.params['versionId']!)
      res.status(200).json(successResponse(version, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async saveVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await policyService.saveVersion(req.params['id']!, req.body, req.user!)
      res.status(201).json(createdResponse(version, req.requestId))
    } catch (err) {
      next(err)
    }
  }
}

export const policyController = new PolicyController()
