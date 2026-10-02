/**
 * @finpolicy/shared — Public API
 *
 * Re-exports all shared type definitions consumed across the monorepo
 * (backend, frontend, compiler).
 *
 * Import pattern:
 *   import type { User, UserRole } from '@finpolicy/shared'
 */

export type { UserRole, User, CreateUserDto, UpdateUserDto } from './types/user.types'

export type {
  PolicyStatus,
  PolicyCategory,
  Policy,
  PolicyVersion,
  CreatePolicyDto,
  UpdatePolicyDto,
  SaveVersionDto,
} from './types/policy.types'

export type {
  CompilationStatus,
  DiagnosticSeverity,
  Diagnostic,
  CompileOptions,
  CompilationJob,
  CompiledArtifact,
  CompileDto,
} from './types/compiler.types'

export type {
  ExecutionStatus,
  DecisionResult,
  ExecutionJob,
  ExecutionResult,
  ExecutionTrace,
  ExecuteDto,
} from './types/execution.types'

export type { AuditLog, CreateAuditLogDto } from './types/audit.types'

export type {
  ApiResponse,
  PaginationQuery,
  PaginatedResult,
} from './types/api.types'
