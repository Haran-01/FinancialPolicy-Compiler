import morgan from 'morgan'
import { RequestHandler } from 'express'
import logger from '../config/logger'

/**
 * Morgan HTTP request logger that writes to Winston's `http` level.
 * Skips health-check pings to keep logs clean.
 */
const morganStream = {
  write: (message: string): void => {
    // Strip trailing newline that Morgan appends
    logger.http(message.trimEnd())
  },
}

export const httpLoggerMiddleware: RequestHandler = morgan(
  ':method :url :status :res[content-length] - :response-time ms [:remote-addr] requestId=:req[x-request-id]',
  {
    stream: morganStream,
    skip: (req) => req.url === '/health',
  },
)
