import { Session } from '@prisma/client'
import { userRepository, SafeUser } from '../repositories/user.repository'
import { sessionRepository } from '../repositories/session.repository'
import { auditLogRepository } from '../repositories/auditLog.repository'
import { hashPassword, comparePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { AuthenticationError, ConflictError, NotFoundError } from '../errors'
import { AUDIT_ACTIONS } from '../config/constants'
import { addDays } from 'date-fns'
import logger from '../config/logger'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResult extends AuthTokens {
  user: SafeUser
}

export class AuthService {
  /**
   * Register a new user. Hashes password, creates user + session, emits audit log.
   */
  async register(dto: {
    name: string
    email: string
    password: string
    role?: string
  }): Promise<AuthResult> {
    // Check for existing email
    const existing = await userRepository.findByEmail(dto.email)
    if (existing) {
      throw new ConflictError(`An account with email '${dto.email}' already exists.`)
    }

    const passwordHash = await hashPassword(dto.password)

    const user = await userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    })

    const tokens = await this._createSession(user)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.USER_REGISTERED,
      userId: user.id,
      metadata: { email: user.email, role: user.role },
    })

    logger.info('User registered', { userId: user.id, email: user.email })
    return { user, ...tokens }
  }

  /**
   * Authenticate user with email + password. Creates new session on success.
   */
  async login(dto: { email: string; password: string }): Promise<AuthResult> {
    const userRecord = await userRepository.findByEmail(dto.email)
    if (!userRecord) {
      // Use constant-time-ish response to prevent user enumeration
      throw new AuthenticationError('Invalid email or password.')
    }

    const passwordMatch = await comparePassword(dto.password, userRecord.passwordHash)
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid email or password.')
    }

    // Build safe user projection
    const user: SafeUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    }

    const tokens = await this._createSession(user)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.USER_LOGIN,
      userId: user.id,
      metadata: { email: user.email },
    })

    logger.info('User logged in', { userId: user.id, email: user.email })
    return { user, ...tokens }
  }

  /**
   * Rotate tokens using a valid refresh token.
   */
  async refreshToken(token: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(token)

    const session = await sessionRepository.findByToken(token)
    if (!session) {
      throw new AuthenticationError('Session not found or has been revoked. Please log in again.')
    }

    const user = await userRepository.findById(payload.userId)
    if (!user) {
      throw new AuthenticationError('User account no longer exists.')
    }

    // Revoke old session (token rotation)
    await sessionRepository.deleteByToken(token)

    const tokens = await this._createSession(user)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.TOKEN_REFRESHED,
      userId: user.id,
    })

    return tokens
  }

  /**
   * Revoke the given refresh token session.
   */
  async logout(refreshToken: string): Promise<void> {
    const session = await sessionRepository.findByToken(refreshToken)
    if (!session) {
      // Idempotent — already logged out
      return
    }
    await sessionRepository.deleteByToken(refreshToken)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      userId: session.userId,
    })

    logger.info('User logged out', { userId: session.userId })
  }

  /**
   * Return the authenticated user's profile.
   */
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId)
    if (!user) throw new NotFoundError('User')
    return user
  }

  /**
   * Update name and/or email. Enforces email uniqueness.
   */
  async updateProfile(
    userId: string,
    dto: { name?: string; email?: string },
  ): Promise<SafeUser> {
    if (dto.email) {
      const existing = await userRepository.findByEmail(dto.email)
      if (existing && existing.id !== userId) {
        throw new ConflictError(`Email '${dto.email}' is already taken.`)
      }
    }

    const user = await userRepository.update(userId, dto)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
      userId,
      metadata: { updatedFields: Object.keys(dto) },
    })

    return user
  }

  /**
   * Change password after verifying the current password.
   */
  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const userRecord = await userRepository.findByEmail(
      (await userRepository.findById(userId))!.email,
    )
    if (!userRecord) throw new NotFoundError('User')

    const match = await comparePassword(dto.currentPassword, userRecord.passwordHash)
    if (!match) {
      throw new AuthenticationError('Current password is incorrect.')
    }

    const newHash = await hashPassword(dto.newPassword)
    await userRepository.update(userId, { passwordHash: newHash })

    // Revoke all sessions to force re-login after password change
    await sessionRepository.deleteAllByUser(userId)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.USER_PASSWORD_CHANGED,
      userId,
    })

    logger.info('User changed password', { userId })
  }

  /**
   * List all active sessions for a user.
   */
  async listSessions(userId: string): Promise<Session[]> {
    return sessionRepository.findActiveByUser(userId)
  }

  /**
   * Revoke a specific session by ID (must belong to the user).
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await sessionRepository.findById(sessionId)
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Session')
    }
    await sessionRepository.deleteById(sessionId)

    await auditLogRepository.create({
      action: AUDIT_ACTIONS.USER_SESSION_REVOKED,
      userId,
      metadata: { sessionId },
    })
  }

  /** Private: creates a session + returns tokens */
  private async _createSession(user: SafeUser): Promise<AuthTokens> {
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as string,
    }

    const accessToken = generateAccessToken(tokenPayload as Parameters<typeof generateAccessToken>[0])
    const refreshToken = generateRefreshToken(tokenPayload as Parameters<typeof generateRefreshToken>[0])

    await sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: addDays(new Date(), 7),
    })

    return { accessToken, refreshToken }
  }
}

export const authService = new AuthService()
