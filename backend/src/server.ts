import { app } from './app'
import { env } from './config/env'
import { logger } from './config/logger'

const server = app.listen(env.PORT, () => {
  logger.info(`FinPolicy Compiler API running on port ${env.PORT} [${env.NODE_ENV}]`)
  logger.info(`Health check: http://localhost:${env.PORT}/health`)
  logger.info(`API Base URL: http://localhost:${env.PORT}/api/${env.API_VERSION}`)
})

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`)
  server.close(() => {
    logger.info('HTTP server closed.')
    process.exit(0)
  })

  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason })
})
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error })
  process.exit(1)
})
