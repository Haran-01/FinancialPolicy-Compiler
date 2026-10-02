import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F1117',
        surface: '#1A1D27',
        'surface-elevated': '#222536',
        'surface-hover': '#262A3A',
        border: '#2D3148',
        'border-subtle': '#1E2135',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          muted: '#1E3A8A',
          foreground: '#FFFFFF',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#CBD5E1',
          muted: '#64748B',
          disabled: '#334155',
        },
        success: {
          DEFAULT: '#10B981',
          muted: '#064E3B',
          foreground: '#ECFDF5',
        },
        error: {
          DEFAULT: '#EF4444',
          muted: '#450A0A',
          foreground: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          muted: '#451A03',
          foreground: '#FFFBEB',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          muted: '#1E3A8A',
        },
        status: {
          allow: '#10B981',
          deny: '#EF4444',
          review: '#F59E0B',
          draft: '#64748B',
          published: '#3B82F6',
          deprecated: '#F97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
        card: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern':
          'linear-gradient(rgba(45,49,72,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,49,72,0.3) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
    },
  },
  plugins: [],
};

export default config;
