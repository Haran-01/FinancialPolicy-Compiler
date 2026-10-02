import { CompilationJob } from '@prisma/client'
import prisma from '../database/prisma'
import { parsePagination } from '../utils/pagination'
import { PaginationQuery } from '../types'

export type CreateCompilationJobData = {
  userId: string
  policyId?: string
  source: string
  optimizationLevel: number
  emitAst: boolean
  emitIr: boolean
  emitTac: boolean
  emitQuadruples: boolean
  emitTriples: boolean
}

export type UpdateCompilationJobData = Partial<{
  status: string
  errorMessage: string
  startedAt: Date
  completedAt: Date
  durationMs: number
  artifactId: string
}>

export class CompilationJobRepository {
  async create(data: CreateCompilationJobData): Promise<CompilationJob> {
    return prisma.compilationJob.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    })
  }

  async findById(id: string): Promise<CompilationJob | null> {
    return prisma.compilationJob.findUnique({ where: { id } })
  }

  async update(id: string, data: UpdateCompilationJobData): Promise<CompilationJob> {
    return prisma.compilationJob.update({ where: { id }, data })
  }

  async findByUserId(
    userId: string,
    query: PaginationQuery,
  ): Promise<{ jobs: CompilationJob[]; total: number }> {
    const { skip, take } = parsePagination(query)
    const [jobs, total] = await prisma.$transaction([
      prisma.compilationJob.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.compilationJob.count({ where: { userId } }),
    ])
    return { jobs, total }
  }

  async findByPolicyId(policyId: string): Promise<CompilationJob[]> {
    return prisma.compilationJob.findMany({
      where: { policyId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findAll(query: PaginationQuery): Promise<{ jobs: CompilationJob[]; total: number }> {
    const { skip, take } = parsePagination(query)
    const [jobs, total] = await prisma.$transaction([
      prisma.compilationJob.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.compilationJob.count(),
    ])
    return { jobs, total }
  }
}

export const compilationJobRepository = new CompilationJobRepository()
