import { UserRole } from '../config/constants'

// ─── JWT ────────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

// ─── Request User ───────────────────────────────────────────────────────────────
export interface RequestUser {
  id: string
  email: string
  role: UserRole
}

// ─── API Response Envelope ──────────────────────────────────────────────────────
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiMeta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  requestId?: string
  timestamp?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ApiMeta
}

// ─── Pagination ─────────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult {
  skip: number
  take: number
  page: number
  limit: number
}

// ─── DTOs ───────────────────────────────────────────────────────────────────────

// Auth
export interface RegisterDto {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface LoginDto {
  email: string
  password: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfileDto {
  name?: string
  email?: string
}

// Policy
export interface CreatePolicyDto {
  name: string
  description?: string
  category: string
  tags?: string[]
}

export interface UpdatePolicyDto {
  name?: string
  description?: string
  category?: string
  tags?: string[]
}

export interface SavePolicyVersionDto {
  source: string
  changelog: string
}

export interface PolicyQueryDto extends PaginationQuery {
  status?: string
  category?: string
  search?: string
}

// Compiler
export interface CompileDto {
  source: string
  policyId?: string
  optimizationLevel: number
  emitAst: boolean
  emitIr: boolean
  emitTac: boolean
  emitQuadruples: boolean
  emitTriples: boolean
}

// Execution
export interface ExecuteDto {
  artifactId: string
  inputData: Record<string, unknown>
  timeoutMs?: number
  recordTrace?: boolean
}

// ─── Augment Express ────────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser
      requestId?: string
    }
  }
}

export {}
