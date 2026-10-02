import { Prisma, User } from '@prisma/client'
import prisma from '../database/prisma'
import { PaginationQuery } from '../types'
import { parsePagination, parseSortOrder } from '../utils/pagination'

export type CreateUserData = {
  name: string
  email: string
  passwordHash: string
  role?: string
}

export type UpdateUserData = Partial<{
  name: string
  email: string
  passwordHash: string
  role: string
}>

/** Safe user projection — excludes passwordHash from returned objects */
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>

export class UserRepository {
  /**
   * Find a user by ID. Returns null if not found.
   * By default returns the safe projection (no passwordHash).
   */
  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({ where: { id }, select: safeUserSelect })
  }

  /**
   * Find a user by email — includes passwordHash for auth comparison.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  /**
   * Create a new user record.
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? 'VIEWER',
      },
      select: safeUserSelect,
    })
  }

  /**
   * Update a user record by ID.
   */
  async update(id: string, data: UpdateUserData): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    })
  }

  /**
   * Soft-delete is preferred. This hard-deletes as a fallback.
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }

  /**
   * Paginated user list for admin views.
   */
  async findAll(query: PaginationQuery): Promise<{ users: SafeUser[]; total: number }> {
    const { skip, take } = parsePagination(query)
    const orderBy = parseSortOrder(query.sortBy, query.sortOrder, ['name', 'email', 'createdAt'])

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({ skip, take, orderBy, select: safeUserSelect }),
      prisma.user.count(),
    ])

    return { users, total }
  }
}

export const userRepository = new UserRepository()
