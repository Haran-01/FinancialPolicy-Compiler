import express, { type Request, type Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import { env } from './config/env'
import { requestIdMiddleware } from './middleware/requestId.middleware'
import { httpLoggerMiddleware } from './middleware/httpLogger.middleware'
import { generalLimiter } from './middleware/rateLimiter.middleware'
import { errorHandlerMiddleware } from './middleware/errorHandler.middleware'
import { apiRouter } from './api'
import { NotFoundError } from './errors'

const app = express()

// ─── 1. Security & Performance Middleware ─────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  }),
)
app.use(compression())

// ─── 2. Body Parsing & Request Context ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(requestIdMiddleware)
app.use(httpLoggerMiddleware)

// ─── 3. Global Rate Limiting ──────────────────────────────────────────────────
app.use(generalLimiter)

// ─── 4. Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'finpolicy-backend',
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  })
})

// ─── 5. API Routes (/api/v1) ──────────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, apiRouter)

// ─── 6. 404 Handler ───────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`))
})

// ─── 7. Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandlerMiddleware)

export { app }
export default app
