import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'
import { successResponse, createdResponse } from '../utils/response'

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body)
      res.status(201).json(createdResponse(result, req.requestId))
    } catch (err) {
      next(err)
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body)
      res.status(200).json(successResponse(result, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string }
      const tokens = await authService.refreshToken(refreshToken)
      res.status(200).json(successResponse(tokens, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string }
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
      res.status(200).json(successResponse({ message: 'Logged out successfully' }, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.id)
      res.status(200).json(successResponse(user, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body)
      res.status(200).json(successResponse(user, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(req.user!.id, req.body)
      res.status(200).json(successResponse({ message: 'Password changed successfully' }, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await authService.listSessions(req.user!.id)
      res.status(200).json(successResponse(sessions, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.revokeSession(req.user!.id, req.params['id']!)
      res.status(200).json(successResponse({ message: 'Session revoked' }, { requestId: req.requestId }))
    } catch (err) {
      next(err)
    }
  }
}

export const authController = new AuthController()
