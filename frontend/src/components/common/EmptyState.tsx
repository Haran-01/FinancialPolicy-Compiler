import { type ReactNode, type ElementType } from 'react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const iconSizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
  const containerSizes = { sm: 'h-16 w-16', md: 'h-20 w-20', lg: 'h-24 w-24' };
  const titleSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const descSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-sm' };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-8 text-center',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            containerSizes[size],
            'flex items-center justify-center rounded-full bg-surface-elevated border border-border'
          )}
        >
          <Icon className={cn(iconSizes[size], 'text-text-muted')} />
        </div>
      )}
      <div>
        <p className={cn('font-semibold text-text-primary', titleSizes[size])}>{title}</p>
        {description && (
          <p className={cn('mt-1 text-text-muted max-w-xs', descSizes[size])}>{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
