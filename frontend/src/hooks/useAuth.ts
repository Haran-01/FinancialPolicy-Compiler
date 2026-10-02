import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import type { LoginFormData, RegisterFormData } from '@/types';

// ─── useAuth Hook ─────────────────────────────────────────────────────────────

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, isLoading, initialize, logout: storeLogout } = useAuthStore();

  // ── Login Mutation ──────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authService.login(data),
    onSuccess: ({ user, token }) => {
      initialize(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    },
    onError: (err: { error?: string }) => {
      toast.error(err?.error ?? 'Login failed. Please check your credentials.');
    },
  });

  // ── Register Mutation ───────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => authService.register(data),
    onSuccess: ({ user, token }) => {
      initialize(user, token);
      toast.success('Account created! Welcome to FinPolicy Compiler.');
      navigate('/dashboard');
    },
    onError: (err: { error?: string }) => {
      toast.error(err?.error ?? 'Registration failed. Please try again.');
    },
  });

  // ── Logout Mutation ─────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      storeLogout();
      queryClient.clear();
      navigate('/login');
      toast.success('You have been logged out.');
    },
  });

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,

    // Mutations
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
