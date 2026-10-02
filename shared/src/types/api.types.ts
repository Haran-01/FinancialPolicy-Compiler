/**
 * Generic API envelope and pagination types used by all endpoints.
 */

/**
 * Standard JSON envelope wrapping every API response.
 *
 * @template T - The shape of the `data` payload.
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request succeeded */
  success: boolean
  /** Present on 2xx responses */
  data?: T
  /** Present on error responses */
  error?: {
    code: string
    message: string
    details?: unknown
  }
  /** Response metadata (pagination, tracing, etc.) */
  meta?: {
    page?: number
    limit?: number
    total?: number
    requestId?: string
    timestamp?: string
  }
}

/** Query string parameters accepted by paginated list endpoints. */
export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Wrapper returned by paginated list endpoints.
 *
 * @template T - The shape of each item in the list.
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
