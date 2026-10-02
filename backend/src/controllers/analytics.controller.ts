import { Request, Response, NextFunction } from 'express'
import { analyticsService } from '../services/analytics.service'
import { successResponse } from '../utils/response'

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await analyticsService.getOverview()
      res.status(200).json(successResponse(stats, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async getCompilationRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rates = await analyticsService.getCompilationRates()
      res.status(200).json(successResponse(rates, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async getExecutionVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = req.query['days'] ? Number(req.query['days']) : 30
      const volume = await analyticsService.getExecutionVolume(days)
      res.status(200).json(successResponse(volume, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async getTopPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query['limit'] ? Number(req.query['limit']) : 10
      const policies = await analyticsService.getTopPolicies(limit)
      res.status(200).json(successResponse(policies, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }
}

export const analyticsController = new AnalyticsController()
