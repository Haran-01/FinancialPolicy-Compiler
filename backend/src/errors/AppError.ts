/**
 * Base operational error class for all application-thrown errors.
 * Non-operational errors (programming bugs, etc.) are NOT AppError instances
 * and will be caught by the global error handler as unexpected 500s.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  /** Operational errors are safe to expose to clients */
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message)
    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details

    // Capture stack trace (excludes AppError constructor itself)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
