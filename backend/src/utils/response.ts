import { ApiResponse, ApiMeta } from '../types'

/**
 * Wraps a data payload in a standard success response envelope.
 */
export function successResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }
}

/**
 * Wraps a paginated data array with cursor/offset metadata.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  requestId?: string,
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      requestId,
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * Wraps a creation result with 201-appropriate metadata.
 */
export function createdResponse<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  }
}
