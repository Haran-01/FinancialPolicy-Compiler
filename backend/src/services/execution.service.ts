import { ExecutionJob } from '@prisma/client'
import {
  executionJobRepository,
  CreateExecutionJobData,
} from '../repositories/executionJob.repository'
import { auditLogRepository } from '../repositories/auditLog.repository'
import { NotFoundError } from '../errors'
import { AUDIT_ACTIONS } from '../config/constants'
import { PaginationQuery } from '../types'
import logger from '../config/logger'

export interface ExecuteDto {
  artifactId: string
  inputData: Record<string, unknown>
  timeoutMs?: number
  recordTrace?: boolean
  policyId?: string
}

export class ExecutionService {
  /**
   * Create an execution job with PENDING status.
   * Phase 4 will wire the actual VM/interpreter here.
   */
  async execute(dto: ExecuteDto, userId: string): Promise<ExecutionJob> {
    const jobData: CreateExecutionJobData = {
      userId,
      artifactId: dto.artifactId,
      policyId: dto.policyId,
      inputData: dto.inputData,
      timeoutMs: dto.timeoutMs ?? 5000,
      recordTrace: dto.recordTrace ?? false,
    }

    const job = await executionJobRepository.create(jobData)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.EXECUTION_STARTED,
      userId,
      executionJobId: job.id,
      policyId: dto.policyId,
      metadata: {
        artifactId: dto.artifactId,
        timeoutMs: dto.timeoutMs,
        recordTrace: dto.recordTrace,
      },
    })

    logger.info('Execution job created', {
      jobId: job.id,
      userId,
      artifactId: dto.artifactId,
      status: job.status,
    })

    // TODO Phase 4: Dispatch to VM worker
    // await executionQueue.add('execute', { jobId: job.id, ...dto })

    return job
  }

  /**
   * Retrieve a single execution job by ID.
   */
  async getJob(jobId: string, userId?: string): Promise<ExecutionJob> {
    const job = await executionJobRepository.findById(jobId)
    if (!job) throw new NotFoundError('Execution job')

    if (userId && job.userId !== userId) {
      throw new NotFoundError('Execution job')
    }

    return job
  }

  /**
   * List execution jobs for a user.
   */
  async getJobs(
    query: PaginationQuery,
    userId: string,
  ): Promise<{ jobs: ExecutionJob[]; total: number }> {
    return executionJobRepository.findByUserId(userId, query)
  }

  /**
   * List all execution jobs (admin only).
   */
  async getAllJobs(query: PaginationQuery): Promise<{ jobs: ExecutionJob[]; total: number }> {
    return executionJobRepository.findAll(query)
  }

  /**
   * Get execution jobs associated with a specific policy.
   */
  async getJobsByPolicy(policyId: string): Promise<ExecutionJob[]> {
    return executionJobRepository.findByPolicyId(policyId)
  }
}

export const executionService = new ExecutionService()
