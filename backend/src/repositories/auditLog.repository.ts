import { AuditLog, Prisma } from '@prisma/client'
import prisma from '../database/prisma'
import { parsePagination } from '../utils/pagination'

export type CreateAuditLogData = {
  action: string
  userId?: string
  policyId?: string
  compilationJobId?: string
  executionJobId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface AuditLogQueryOptions {
  page?: number
  limit?: number
  userId?: string
  policyId?: string
  action?: string
  fromDate?: Date
  toDate?: Date
}

export class AuditLogRepository {
  /**
   * Create an audit log entry. Audit logs are immutable — never deleted.
   */
  async create(data: CreateAuditLogData): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        policyId: data.policyId,
        compilationJobId: data.compilationJobId,
        executionJobId: data.executionJobId,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  }

  async findAll(
    query: AuditLogQueryOptions,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const { skip, take } = parsePagination(query)

    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId && { userId: query.userId }),
      ...(query.policyId && { policyId: query.policyId }),
      ...(query.action && { action: query.action }),
      ...(query.fromDate || query.toDate
        ? {
            createdAt: {
              ...(query.fromDate && { gte: query.fromDate }),
              ...(query.toDate && { lte: query.toDate }),
            },
          }
        : {}),
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    return { logs, total }
  }

  async findByUser(userId: string, page = 1, limit = 20): Promise<AuditLog[]> {
    const { skip, take } = parsePagination({ page, limit })
    return prisma.auditLog.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByPolicy(policyId: string, page = 1, limit = 20): Promise<AuditLog[]> {
    const { skip, take } = parsePagination({ page, limit })
    return prisma.auditLog.findMany({
      where: { policyId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const auditLogRepository = new AuditLogRepository()
