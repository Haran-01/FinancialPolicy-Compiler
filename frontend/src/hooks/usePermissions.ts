import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types';

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  AUDITOR: 1,
  POLICY_MANAGER: 2,
  ADMIN: 3,
};

function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ─── usePermissions Hook ──────────────────────────────────────────────────────

export function usePermissions() {
  const { user } = useAuthStore();
  const role = user?.role;

  return {
    // Policy permissions
    canViewPolicies: hasRole(role, 'VIEWER'),
    canCreatePolicy: hasRole(role, 'POLICY_MANAGER'),
    canEditPolicy: hasRole(role, 'POLICY_MANAGER'),
    canDeletePolicy: hasRole(role, 'ADMIN'),
    canPublishPolicy: hasRole(role, 'POLICY_MANAGER'),
    canDeprecatePolicy: hasRole(role, 'POLICY_MANAGER'),

    // Compiler permissions
    canCompile: hasRole(role, 'POLICY_MANAGER'),
    canViewCompilationOutput: hasRole(role, 'VIEWER'),

    // Execution permissions
    canExecute: hasRole(role, 'POLICY_MANAGER'),
    canViewExecutions: hasRole(role, 'VIEWER'),

    // Analytics permissions
    canViewAnalytics: hasRole(role, 'VIEWER'),

    // Audit permissions
    canViewAudit: hasRole(role, 'AUDITOR'),
    canExportAudit: hasRole(role, 'AUDITOR'),

    // User management permissions
    canManageUsers: hasRole(role, 'ADMIN'),
    canInviteUsers: hasRole(role, 'ADMIN'),
    canChangeUserRoles: hasRole(role, 'ADMIN'),

    // Settings permissions
    canViewSettings: hasRole(role, 'VIEWER'),
    canEditOrganization: hasRole(role, 'ADMIN'),
    canManageApiKeys: hasRole(role, 'ADMIN'),

    // Utility
    isAdmin: role === 'ADMIN',
    isPolicyManager: role === 'POLICY_MANAGER',
    isAuditor: role === 'AUDITOR',
    isViewer: role === 'VIEWER',
    currentRole: role,

    // Helper: check arbitrary role
    hasRole: (requiredRole: UserRole) => hasRole(role, requiredRole),
  };
}
