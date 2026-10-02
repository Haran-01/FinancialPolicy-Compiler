import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { JWT_TOKEN_KEY, USER_STORAGE_KEY } from '@/lib/constants';
import type { User } from '@/types';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  initialize: (user: User, token: string) => void;
  logout: () => void;
}

// ─── Auth Store ───────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: {
        id: 'usr-admin-01',
        email: 'admin@finpolicy.dev',
        name: 'Aarav Mehta',
        role: 'ADMIN',
        organizationId: 'org-finpolicy-demo',
        isActive: true,
        createdAt: '2026-09-20T08:00:00.000Z',
        updatedAt: '2026-10-02T09:00:00.000Z',
      },
      token: 'finpolicy-local-enterprise-jwt-v1',
      isAuthenticated: true,
      isLoading: false,

      setUser: (user: User) =>
        set({ user, isAuthenticated: true }),

      setToken: (token: string) => {
        localStorage.setItem(JWT_TOKEN_KEY, token);
        set({ token });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      initialize: (user: User, token: string) => {
        localStorage.setItem(JWT_TOKEN_KEY, token);
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem(JWT_TOKEN_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: USER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
