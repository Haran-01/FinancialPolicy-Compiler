import { Session } from '@prisma/client'
import prisma from '../database/prisma'

export type CreateSessionData = {
  userId: string
  refreshToken: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

export class SessionRepository {
  async create(data: CreateSessionData): Promise<Session> {
    return prisma.session.create({ data })
  }

  async findByToken(refreshToken: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: {
        refreshToken,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    })
  }

  async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { id } })
  }

  async deleteByToken(refreshToken: string): Promise<void> {
    await prisma.session.updateMany({
      where: { refreshToken },
      data: { revokedAt: new Date() },
    })
  }

  async deleteById(id: string): Promise<void> {
    await prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  }

  async deleteAllByUser(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async findActiveByUser(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const sessionRepository = new SessionRepository()
