import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

// ─── Size Map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<SpinnerSize, { container: string; ring: string }> = {
  xs: { container: 'h-3 w-3', ring: 'border-[1.5px]' },
  sm: { container: 'h-4 w-4', ring: 'border-2' },
  md: { container: 'h-6 w-6', ring: 'border-2' },
  lg: { container: 'h-8 w-8', ring: 'border-[3px]' },
  xl: { container: 'h-12 w-12', ring: 'border-4' },
};

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

export default function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const { container, ring } = sizeMap[size];

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className={cn(
          container,
          ring,
          'rounded-full border-border border-t-primary'
        )}
        role="status"
        aria-label={label ?? 'Loading'}
      />
      {label && (
        <p className="text-xs text-text-muted">{label}</p>
      )}
    </div>
  );
}
