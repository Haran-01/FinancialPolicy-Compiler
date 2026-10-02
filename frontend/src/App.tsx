import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// ─── Lazy Imports ─────────────────────────────────────────────────────────────

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const FinPolicyStudioPage = lazy(() => import('@/pages/studio/FinPolicyStudioPage'));

// ─── Page Loader ──────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public Routes ─────────────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/studio" replace />} />

          {/* ── Core Financial Policy Compiler Studio ───────────────────── */}
          <Route
            path="/studio"
            element={
              <ProtectedRoute>
                <FinPolicyStudioPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/studio" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
