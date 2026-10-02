import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a UUID v4 for each incoming request.
 * - Attaches to `req.requestId` for downstream use.
 * - Sets `X-Request-ID` response header so clients can correlate logs.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? uuidv4()
  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)
  next()
}
