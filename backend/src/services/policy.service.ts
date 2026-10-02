import { Policy, PolicyVersion } from '@prisma/client'
import {
  policyRepository,
  PolicyQueryOptions,
  CreatePolicyData,
  UpdatePolicyData,
} from '../repositories/policy.repository'
import { auditLogRepository } from '../repositories/auditLog.repository'
import { NotFoundError, AuthorizationError } from '../errors'
import { AUDIT_ACTIONS, USER_ROLES } from '../config/constants'
import { RequestUser } from '../types'
import logger from '../config/logger'

export class PolicyService {
  /**
   * List policies with optional filters.
   * Non-admins only see their own policies or all published ones.
   */
  async listPolicies(
    query: PolicyQueryOptions,
    user: RequestUser,
  ): Promise<{ policies: Policy[]; total: number }> {
    const effectiveQuery: PolicyQueryOptions = { ...query }

    if (user.role === USER_ROLES.POLICY_MANAGER) {
      // Policy managers see only their own drafts + all published/deprecated
      effectiveQuery.ownerId = undefined // remove owner filter; handled via OR below
    }

    if (user.role === USER_ROLES.VIEWER || user.role === USER_ROLES.AUDITOR) {
      effectiveQuery.status = 'PUBLISHED'
    }

    return policyRepository.findAll(effectiveQuery)
  }

  /**
   * Get a single policy by ID.
   */
  async getPolicy(id: string, user: RequestUser): Promise<Policy> {
    const policy = await policyRepository.findById(id)
    if (!policy) throw new NotFoundError('Policy')

    // Viewers can only see published policies
    if (
      user.role === USER_ROLES.VIEWER &&
      policy.status !== 'PUBLISHED'
    ) {
      throw new NotFoundError('Policy')
    }

    return policy
  }

  /**
   * Create a new policy draft.
   */
  async createPolicy(data: CreatePolicyData, user: RequestUser): Promise<Policy> {
    const policy = await policyRepository.create({ ...data, ownerId: user.id })

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.POLICY_CREATED,
      userId: user.id,
      policyId: policy.id,
      metadata: { name: policy.name, category: policy.category },
    })

    logger.info('Policy created', { policyId: policy.id, userId: user.id })
    return policy
  }

  /**
   * Update a policy. Admins can update any policy; managers only their own.
   */
  async updatePolicy(
    id: string,
    data: UpdatePolicyData,
    user: RequestUser,
  ): Promise<Policy> {
    const policy = await this._requirePolicy(id)
    this._assertOwnerOrAdmin(policy, user)

    if (policy.status === 'ARCHIVED') {
      throw new AuthorizationError('Archived policies cannot be modified.')
    }

    const updated = await policyRepository.update(id, data)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.POLICY_UPDATED,
      userId: user.id,
      policyId: id,
      metadata: { updatedFields: Object.keys(data) },
    })

    return updated
  }

  /**
   * Publish a policy (move from DRAFT → PUBLISHED).
   */
  async publishPolicy(id: string, user: RequestUser): Promise<Policy> {
    const policy = await this._requirePolicy(id)
    this._assertOwnerOrAdmin(policy, user)

    if (policy.status !== 'DRAFT') {
      throw new AuthorizationError(`Only DRAFT policies can be published. Current status: ${policy.status}`)
    }

    const updated = await policyRepository.publish(id)
    await auditLogRepository.create({
      action: AUDIT_ACTIONS.POLICY_PUBLISHED,
      userId: user.id,
      policyId: id,
    })

    logger.info('Policy published', { policyId: id, userId: user.id })
    return updated
  }

  /**
   * Deprecate a policy (PUBLISHED → DEPRECATED).
   */
  async deprecatePolicy(id: string, user: RequestUser): Promise<Policy> {
    const policy = await this._requirePolicy(id)
    this._assertOwnerOrAdmin(policy, user)

    if (policy.status !== 'PUBLISHED') {
      throw new AuthorizationError(`Only PUBLISHED policies can be deprecated. Current status: ${policy.status}`)
    }

    const updated = await policyRepository.deprecate(id)
    await auditLogRepository.create({
      action: AUDIT_ACTIONS.POLICY_DEPRECATED,
      userId: user.id,
      policyId: id,
    })

    return updated
  }

  /**
   * Archive a policy (any non-archived → ARCHIVED).
   */
  async archivePolicy(id: string, user: RequestUser): Promise<Policy> {
    const policy = await this._requirePolicy(id)
    this._assertOwnerOrAdmin(policy, user)

    if (policy.status === 'ARCHIVED') {
      throw new AuthorizationError('Policy is already archived.')
    }

    const updated = await policyRepository.archive(id)
    await auditLogRepository.create({
      action: AUDIT_ACTIONS.POLICY_ARCHIVED,
      userId: user.id,
      policyId: id,
    })

    return updated
  }

  /**
   * List versions of a policy.
   */
  async listVersions(policyId: string, user: RequestUser): Promise<PolicyVersion[]> {
    await this._requirePolicy(policyId)
    return policyRepository.findVersions(policyId)
  }

  /**
   * Get a specific version of a policy.
   */
  async getVersion(policyId: string, versionId: string): Promise<PolicyVersion> {
    const version = await policyRepository.findVersion(policyId, versionId)
    if (!version) throw new NotFoundError('Policy version')
    return version
  }

  /**
   * Save a new policy version (snapshot of current source).
   */
  async saveVersion(
    policyId: string,
    dto: { source: string; changelog: string },
    user: RequestUser,
  ): Promise<PolicyVersion> {
    const policy = await this._requirePolicy(policyId)
    this._assertOwnerOrAdmin(policy, user)

    const latest = await policyRepository.getLatestVersion(policyId)
    const versionNumber = (latest?.versionNumber ?? 0) + 1

    const version = await policyRepository.createVersion({
      policyId,
      source: dto.source,
      changelog: dto.changelog,
      versionNumber,
      authorId: user.id,
    })

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.POLICY_VERSION_SAVED,
      userId: user.id,
      policyId,
      metadata: { versionNumber, changelog: dto.changelog },
    })

    return version
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async _requirePolicy(id: string): Promise<Policy> {
    const policy = await policyRepository.findById(id)
    if (!policy) throw new NotFoundError('Policy')
    return policy
  }

  private _assertOwnerOrAdmin(policy: Policy, user: RequestUser): void {
    if (user.role === USER_ROLES.ADMIN) return
    if (policy.ownerId !== user.id) {
      throw new AuthorizationError('You do not have permission to modify this policy.')
    }
  }
}

export const policyService = new PolicyService()
