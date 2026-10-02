import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole } from '@/types';
import LoadingSpinner from './LoadingSpinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { hasRole } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-text-primary">Access Denied</h2>
          <p className="text-sm text-text-muted text-center max-w-sm">
            You don&apos;t have permission to view this page. Contact your administrator to
            request access.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
