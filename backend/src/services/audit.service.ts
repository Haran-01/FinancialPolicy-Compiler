import { AuditLog } from '@prisma/client'
import {
  auditLogRepository,
  CreateAuditLogData,
  AuditLogQueryOptions,
} from '../repositories/auditLog.repository'
import logger from '../config/logger'

export class AuditService {
  /**
   * Write an audit event. Called by other services.
   */
  async log(data: CreateAuditLogData): Promise<AuditLog> {
    const entry = await auditLogRepository.create(data)
    logger.debug('Audit event recorded', { action: data.action, userId: data.userId })
    return entry
  }

  /**
   * Paginated query of audit logs with optional filters.
   */
  async queryLogs(
    options: AuditLogQueryOptions,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return auditLogRepository.findAll(options)
  }

  /**
   * Get all audit logs for a specific user.
   */
  async getLogsByUser(userId: string, page?: number, limit?: number): Promise<AuditLog[]> {
    return auditLogRepository.findByUser(userId, page, limit)
  }

  /**
   * Get all audit logs related to a specific policy.
   */
  async getLogsByPolicy(policyId: string, page?: number, limit?: number): Promise<AuditLog[]> {
    return auditLogRepository.findByPolicy(policyId, page, limit)
  }

  /**
   * Export audit logs as a JSON array (suitable for compliance downloads).
   * Caller is responsible for streaming/writing the response.
   */
  async exportLogs(options: AuditLogQueryOptions): Promise<AuditLog[]> {
    // Override limit to max for export
    const { logs } = await auditLogRepository.findAll({ ...options, limit: 10000 })
    return logs
  }
}

export const auditService = new AuditService()
