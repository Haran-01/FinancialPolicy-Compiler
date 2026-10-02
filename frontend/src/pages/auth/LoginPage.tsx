import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Cpu, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── LoginPage ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data, {
      onError: () => {
        setError('root', { message: 'Invalid email or password.' });
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow-primary">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">FinPolicy Compiler</h1>
          <p className="mt-1 text-sm text-text-muted">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-card-hover">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Global error */}
            {errors.root && (
              <div className="flex items-center gap-2 rounded-md bg-error/10 border border-error/30 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-error" />
                <p className="text-xs text-error">{errors.root.message}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
                className="input-base"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-text-secondary">
                  Password
                </label>
                <a href="#" className="text-xs text-accent hover:text-primary">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="input-base pr-10"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary w-full mt-2"
            >
              {isLoggingIn ? (
                <>
                  <LoadingSpinner size="xs" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-5 text-center text-xs text-text-muted">
            Don&apos;t have an account?{' '}
            <Link
              to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'}
              className="text-accent hover:text-primary font-medium"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Version */}
        <p className="mt-6 text-center text-2xs text-text-disabled">
          FinPolicy Compiler v{import.meta.env.VITE_APP_VERSION ?? '1.0.0'}
        </p>
      </motion.div>
    </div>
  );
}
