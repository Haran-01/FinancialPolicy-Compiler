import prisma from '../database/prisma'

export interface OverviewStats {
  totalPolicies: number
  publishedPolicies: number
  draftPolicies: number
  totalCompilations: number
  successfulCompilations: number
  failedCompilations: number
  totalExecutions: number
  successfulExecutions: number
  totalUsers: number
}

export interface ExecutionVolumePoint {
  date: string
  count: number
  successCount: number
  failCount: number
}

export interface TopPolicy {
  policyId: string
  name: string
  executionCount: number
  successRate: number
}

export interface CompilationRateStats {
  total: number
  success: number
  failed: number
  pending: number
  successRate: number
  avgDurationMs: number | null
}

export class AnalyticsService {
  /**
   * High-level overview metrics for the dashboard.
   */
  async getOverview(): Promise<OverviewStats> {
    const [
      totalPolicies,
      publishedPolicies,
      draftPolicies,
      totalCompilations,
      successfulCompilations,
      failedCompilations,
      totalExecutions,
      successfulExecutions,
      totalUsers,
    ] = await Promise.all([
      prisma.policy.count(),
      prisma.policy.count({ where: { status: 'PUBLISHED' } }),
      prisma.policy.count({ where: { status: 'DRAFT' } }),
      prisma.compilationJob.count(),
      prisma.compilationJob.count({ where: { status: 'SUCCESS' } }),
      prisma.compilationJob.count({ where: { status: 'FAILED' } }),
      prisma.executionJob.count(),
      prisma.executionJob.count({ where: { status: 'SUCCESS' } }),
      prisma.user.count(),
    ])

    return {
      totalPolicies,
      publishedPolicies,
      draftPolicies,
      totalCompilations,
      successfulCompilations,
      failedCompilations,
      totalExecutions,
      successfulExecutions,
      totalUsers,
    }
  }

  /**
   * Compilation success/failure rate summary.
   */
  async getCompilationRates(): Promise<CompilationRateStats> {
    const [total, success, failed, pending, avgResult] = await Promise.all([
      prisma.compilationJob.count(),
      prisma.compilationJob.count({ where: { status: 'SUCCESS' } }),
      prisma.compilationJob.count({ where: { status: 'FAILED' } }),
      prisma.compilationJob.count({ where: { status: 'PENDING' } }),
      prisma.compilationJob.aggregate({
        _avg: { durationMs: true },
        where: { status: 'SUCCESS' },
      }),
    ])

    return {
      total,
      success,
      failed,
      pending,
      successRate: total > 0 ? Math.round((success / total) * 100 * 10) / 10 : 0,
      avgDurationMs: avgResult._avg.durationMs,
    }
  }

  /**
   * Execution volume grouped by day for the last N days.
   */
  async getExecutionVolume(days = 30): Promise<ExecutionVolumePoint[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const jobs = await prisma.executionJob.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    })

    // Aggregate by date
    const map = new Map<string, { count: number; successCount: number; failCount: number }>()

    for (const job of jobs) {
      const date = job.createdAt.toISOString().slice(0, 10)
      const existing = map.get(date) ?? { count: 0, successCount: 0, failCount: 0 }
      existing.count++
      if (job.status === 'SUCCESS') existing.successCount++
      if (job.status === 'FAILED' || job.status === 'TIMEOUT') existing.failCount++
      map.set(date, existing)
    }

    return Array.from(map.entries()).map(([date, stats]) => ({ date, ...stats }))
  }

  /**
   * Top N policies by execution count.
   */
  async getTopPolicies(limit = 10): Promise<TopPolicy[]> {
    const results = await prisma.executionJob.groupBy({
      by: ['policyId'],
      _count: { id: true },
      where: { policyId: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    })

    const policies = await Promise.all(
      results.map(async (r) => {
        const policy = await prisma.policy.findUnique({
          where: { id: r.policyId! },
          select: { id: true, name: true },
        })

        const successCount = await prisma.executionJob.count({
          where: { policyId: r.policyId!, status: 'SUCCESS' },
        })

        return {
          policyId: r.policyId!,
          name: policy?.name ?? 'Unknown',
          executionCount: r._count.id,
          successRate:
            r._count.id > 0
              ? Math.round((successCount / r._count.id) * 100 * 10) / 10
              : 0,
        }
      }),
    )

    return policies
  }
}

export const analyticsService = new AnalyticsService()
