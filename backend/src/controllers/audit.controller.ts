import { Request, Response, NextFunction } from 'express'
import { auditService } from '../services/audit.service'
import { successResponse, paginatedResponse } from '../utils/response'
import { parsePagination } from '../utils/pagination'

export class AuditController {
  async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as Record<string, string | undefined>
      const pagination = parsePagination({ page: Number(query['page']), limit: Number(query['limit']) })

      const { logs, total } = await auditService.queryLogs({
        page: pagination.page,
        limit: pagination.limit,
        userId: query['userId'],
        policyId: query['policyId'],
        action: query['action'],
        fromDate: query['fromDate'] ? new Date(query['fromDate']) : undefined,
        toDate: query['toDate'] ? new Date(query['toDate']) : undefined,
      })

      res.status(200).json(
        paginatedResponse(logs, total, pagination.page, pagination.limit, req.requestId),
      )
    } catch (err) {
      next(err)
    }
  }

  async getLogsByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req.query as { page?: string; limit?: string })
      const logs = await auditService.getLogsByUser(
        req.params['userId']!,
        pagination.page,
        pagination.limit,
      )
      res.status(200).json(successResponse(logs, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async getLogsByPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req.query as { page?: string; limit?: string })
      const logs = await auditService.getLogsByPolicy(
        req.params['policyId']!,
        pagination.page,
        pagination.limit,
      )
      res.status(200).json(successResponse(logs, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async exportLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as Record<string, string | undefined>
      const logs = await auditService.exportLogs({
        userId: query['userId'],
        policyId: query['policyId'],
        action: query['action'],
        fromDate: query['fromDate'] ? new Date(query['fromDate']) : undefined,
        toDate: query['toDate'] ? new Date(query['toDate']) : undefined,
      })

      res.setHeader('Content-Type', 'application/json')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-export-${new Date().toISOString().slice(0, 10)}.json"`,
      )
      res.status(200).json({ success: true, data: logs, meta: { count: logs.length } })
    } catch (err) {
      next(err)
    }
  }
}

export const auditController = new AuditController()
