import { Prisma, Policy, PolicyVersion } from '@prisma/client'
import prisma from '../database/prisma'
import { parsePagination, parseSortOrder } from '../utils/pagination'

export interface PolicyQueryOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: string
  category?: string
  search?: string
  ownerId?: string
}

export type CreatePolicyData = {
  name: string
  description?: string
  category: string
  tags?: string[]
  ownerId: string
}

export type UpdatePolicyData = Partial<{
  name: string
  description: string
  category: string
  tags: string[]
}>

export type CreatePolicyVersionData = {
  policyId: string
  source: string
  changelog: string
  versionNumber: number
  authorId: string
}

export class PolicyRepository {
  async findAll(query: PolicyQueryOptions): Promise<{ policies: Policy[]; total: number }> {
    const { skip, take } = parsePagination(query)
    const orderBy = parseSortOrder(query.sortBy, query.sortOrder, [
      'name',
      'createdAt',
      'updatedAt',
      'category',
    ])

    const where: Prisma.PolicyWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
      ...(query.ownerId && { ownerId: query.ownerId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    }

    const [policies, total] = await prisma.$transaction([
      prisma.policy.findMany({ skip, take, orderBy, where }),
      prisma.policy.count({ where }),
    ])

    return { policies, total }
  }

  async findById(id: string): Promise<Policy | null> {
    return prisma.policy.findUnique({ where: { id } })
  }

  async create(data: CreatePolicyData): Promise<Policy> {
    return prisma.policy.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags ?? [],
        ownerId: data.ownerId,
        status: 'DRAFT',
      },
    })
  }

  async update(id: string, data: UpdatePolicyData): Promise<Policy> {
    return prisma.policy.update({ where: { id }, data })
  }

  async archive(id: string): Promise<Policy> {
    return prisma.policy.update({ where: { id }, data: { status: 'ARCHIVED' } })
  }

  async publish(id: string): Promise<Policy> {
    return prisma.policy.update({ where: { id }, data: { status: 'PUBLISHED' } })
  }

  async deprecate(id: string): Promise<Policy> {
    return prisma.policy.update({ where: { id }, data: { status: 'DEPRECATED' } })
  }

  async findVersions(policyId: string): Promise<PolicyVersion[]> {
    return prisma.policyVersion.findMany({
      where: { policyId },
      orderBy: { versionNumber: 'desc' },
    })
  }

  async findVersion(policyId: string, versionId: string): Promise<PolicyVersion | null> {
    return prisma.policyVersion.findFirst({ where: { id: versionId, policyId } })
  }

  async createVersion(data: CreatePolicyVersionData): Promise<PolicyVersion> {
    return prisma.policyVersion.create({ data })
  }

  async getLatestVersion(policyId: string): Promise<PolicyVersion | null> {
    return prisma.policyVersion.findFirst({
      where: { policyId },
      orderBy: { versionNumber: 'desc' },
    })
  }
}

export const policyRepository = new PolicyRepository()
