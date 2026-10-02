import { Request, Response, NextFunction } from 'express'
import { executionService } from '../services/execution.service'
import { successResponse, createdResponse, paginatedResponse } from '../utils/response'
import { parsePagination } from '../utils/pagination'

export class ExecutionController {
  async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await executionService.execute(req.body, req.user!.id)
      res.status(202).json(createdResponse(job, req.requestId))
    } catch (err) {
      next(err)
    }
  }

  async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await executionService.getJob(req.params['id']!, req.user!.id)
      res.status(200).json(successResponse(job, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req.query as { page?: string; limit?: string })
      const { jobs, total } = await executionService.getJobs(pagination, req.user!.id)
      res.status(200).json(
        paginatedResponse(jobs, total, pagination.page, pagination.limit, req.requestId),
      )
    } catch (err) {
      next(err)
    }
  }

  async listAllJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req.query as { page?: string; limit?: string })
      const { jobs, total } = await executionService.getAllJobs(pagination)
      res.status(200).json(
        paginatedResponse(jobs, total, pagination.page, pagination.limit, req.requestId),
      )
    } catch (err) {
      next(err)
    }
  }
}

export const executionController = new ExecutionController()
