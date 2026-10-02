import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'
import logger from '../config/logger'
import { verifySupabaseConnection } from './supabase'

/** Global Prisma client singleton to prevent connection pool exhaustion in dev hot-reload */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

/**
 * Creates and configures a PrismaClient instance connected to Supabase PostgreSQL.
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
    errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  })

  if (env.NODE_ENV === 'development') {
    // @ts-expect-error: Prisma event typing is loose when no models are defined yet
    client.$on('query', (e: { query: string; params: string; duration: number }) => {
      logger.debug('Prisma query (Supabase)', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      })
    })
  }

  // @ts-expect-error: Prisma event typing is loose when no models are defined yet
  client.$on('warn', (e: { message: string }) => {
    logger.warn('Prisma warning', { message: e.message })
  })

  // @ts-expect-error: Prisma event typing is loose when no models are defined yet
  client.$on('error', (e: { message: string }) => {
    logger.error('Prisma error', { message: e.message })
  })

  return client
}

export const prisma: PrismaClient =
  env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (global.__prisma ?? (global.__prisma = createPrismaClient()))

/**
 * Database Connection Utility
 * Verifies both Prisma PostgreSQL connectivity and Supabase Cloud API reachability.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
    logger.info('✅ Connected to Supabase PostgreSQL via Prisma')
    await verifySupabaseConnection()
  } catch (error) {
    logger.error('❌ Failed to connect to Supabase PostgreSQL', { error })
    throw error
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
  logger.info('Disconnected from Supabase PostgreSQL')
}

export default prisma
