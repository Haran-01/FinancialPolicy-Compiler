import { ExecutionJob } from '@prisma/client'
import prisma from '../database/prisma'
import { parsePagination } from '../utils/pagination'
import { PaginationQuery } from '../types'

export type CreateExecutionJobData = {
  userId: string
  artifactId: string
  policyId?: string
  inputData: Record<string, unknown>
  timeoutMs: number
  recordTrace: boolean
}

export type UpdateExecutionJobData = Partial<{
  status: string
  errorMessage: string
  startedAt: Date
  completedAt: Date
  durationMs: number
  result: Record<string, unknown>
  decision: string
  traceLog: string
}>

export class ExecutionJobRepository {
  async create(data: CreateExecutionJobData): Promise<ExecutionJob> {
    return prisma.executionJob.create({
      data: {
        ...data,
        inputData: data.inputData as object,
        status: 'PENDING',
      },
    })
  }

  async findById(id: string): Promise<ExecutionJob | null> {
    return prisma.executionJob.findUnique({ where: { id } })
  }

  async update(id: string, data: UpdateExecutionJobData): Promise<ExecutionJob> {
    return prisma.executionJob.update({
      where: { id },
      data: {
        ...data,
        ...(data.result && { result: data.result as object }),
      },
    })
  }

  async findByUserId(
    userId: string,
    query: PaginationQuery,
  ): Promise<{ jobs: ExecutionJob[]; total: number }> {
    const { skip, take } = parsePagination(query)
    const [jobs, total] = await prisma.$transaction([
      prisma.executionJob.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.executionJob.count({ where: { userId } }),
    ])
    return { jobs, total }
  }

  async findByPolicyId(policyId: string): Promise<ExecutionJob[]> {
    return prisma.executionJob.findMany({
      where: { policyId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findAll(query: PaginationQuery): Promise<{ jobs: ExecutionJob[]; total: number }> {
    const { skip, take } = parsePagination(query)
    const [jobs, total] = await prisma.$transaction([
      prisma.executionJob.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.executionJob.count(),
    ])
    return { jobs, total }
  }
}

export const executionJobRepository = new ExecutionJobRepository()
