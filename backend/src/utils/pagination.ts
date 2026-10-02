import { PAGINATION } from '../config/constants'
import { PaginationQuery, PaginationResult } from '../types'

/**
 * Normalises raw query params into validated skip/take values for Prisma.
 *
 * @param query - Raw pagination input (may come directly from req.query)
 * @returns PaginationResult with skip, take, page, limit
 */
export function parsePagination(query: PaginationQuery): PaginationResult {
  const page = Math.max(1, Number(query.page) || PAGINATION.DEFAULT_PAGE)
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(query.limit) || PAGINATION.DEFAULT_LIMIT),
  )
  const skip = (page - 1) * limit

  return { skip, take: limit, page, limit }
}

/**
 * Builds a Prisma `orderBy` clause from sortBy / sortOrder query params.
 *
 * @param sortBy    - Field name to sort by (default: 'createdAt')
 * @param sortOrder - 'asc' | 'desc' (default: 'desc')
 * @param allowedFields - Whitelist of sortable fields
 */
export function parseSortOrder(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  allowedFields: string[] = ['createdAt', 'updatedAt', 'name'],
): Record<string, 'asc' | 'desc'> {
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : 'createdAt'
  const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc'
  return { [field]: order }
}
