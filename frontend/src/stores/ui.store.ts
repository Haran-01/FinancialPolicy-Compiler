import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface UIStore {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  breadcrumbs: { label: string; href?: string }[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setBreadcrumbs: (crumbs: { label: string; href?: string }[]) => void;
}

// ─── UI Store ─────────────────────────────────────────────────────────────────

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      breadcrumbs: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      setTheme: (theme: 'dark' | 'light') => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },

      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
    }),
    {
      name: 'finpolicy_ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
