import { Request, Response, NextFunction } from 'express'
import { compilerService } from '../services/compiler.service'
import { successResponse } from '../utils/response'

export class CompilerController {
  async compile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = compilerService.compile(req.body)
      res.status(200).json(successResponse(result, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = compilerService.run(req.body)
      res.status(200).json(successResponse(result, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }
}

export const compilerController = new CompilerController()
