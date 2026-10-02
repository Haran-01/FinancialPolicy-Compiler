/**
 * User domain types shared across backend, frontend, and compiler.
 */

/** Roles available in the FinPolicy platform. */
export type UserRole = 'ADMIN' | 'POLICY_MANAGER' | 'AUDITOR' | 'VIEWER'

/** Fully-hydrated user record returned from the API. */
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/** Payload for creating a new user (POST /api/users). */
export interface CreateUserDto {
  email: string
  name: string
  password: string
  role?: UserRole
}

/** Payload for updating an existing user (PATCH /api/users/:id). */
export interface UpdateUserDto {
  name?: string
  email?: string
  isActive?: boolean
}
