import winston from 'winston'
import path from 'path'
import fs from 'fs'
import { env } from './env'

// Ensure log directory exists
const logDir = env.LOG_DIR
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const { combine, timestamp, errors, json, colorize, printf, splat, metadata } = winston.format

/** Pretty format for development console output */
const consoleFormat = printf(({ level, message, timestamp: ts, requestId, ...meta }) => {
  const rid = requestId ? ` [${requestId}]` : ''
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
  return `${ts} ${level}${rid}: ${message}${metaStr}`
})

/** Base format applied to every transport */
const baseFormat = combine(
  errors({ stack: true }),
  splat(),
  metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
)

/** Transports list */
const transports: winston.transport[] = [
  // Combined log — all levels
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    level: 'debug',
    format: combine(baseFormat, json()),
    maxsize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 7,
    tailable: true,
  }),
  // Error log — errors only
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: combine(baseFormat, json()),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 14,
    tailable: true,
  }),
  // API / HTTP access log
  new winston.transports.File({
    filename: path.join(logDir, 'api.log'),
    level: 'http',
    format: combine(baseFormat, json()),
    maxsize: 20 * 1024 * 1024,
    maxFiles: 7,
    tailable: true,
  }),
  // Compiler-specific log
  new winston.transports.File({
    filename: path.join(logDir, 'compiler.log'),
    level: 'debug',
    format: combine(baseFormat, json()),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 7,
    tailable: true,
  }),
]

// Colorized console transport for non-production
if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: env.LOG_LEVEL,
      format: combine(baseFormat, colorize({ all: true }), consoleFormat),
    }),
  )
} else {
  transports.push(
    new winston.transports.Console({
      level: 'warn',
      format: combine(baseFormat, json()),
    }),
  )
}

/** Main application logger */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'finpolicy-api' },
  transports,
  exitOnError: false,
})

/**
 * Create a child logger with a fixed requestId context.
 * Use this inside request handlers for correlated log lines.
 */
export function createRequestLogger(requestId: string): winston.Logger {
  return logger.child({ requestId })
}

/**
 * Dedicated compiler logger — writes to compiler.log
 */
export const compilerLogger = logger.child({ module: 'compiler' })

export default logger
