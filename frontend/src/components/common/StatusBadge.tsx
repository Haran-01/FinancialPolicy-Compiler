import { cn } from '@/lib/utils';
import type {
  PolicyStatus,
  CompilationStatus,
  ExecutionStatus,
  DecisionResult,
  UserRole,
} from '@/types';

// ─── Badge Config Types ───────────────────────────────────────────────────────

type StatusValue =
  | PolicyStatus
  | CompilationStatus
  | ExecutionStatus
  | DecisionResult
  | UserRole
  | string;

interface StatusConfig {
  label: string;
  className: string;
  dotColor?: string;
}

// ─── Status Config Map ────────────────────────────────────────────────────────

const STATUS_CONFIG: Partial<Record<string, StatusConfig>> = {
  // Decision
  ALLOW: {
    label: 'Allow',
    className: 'bg-success/15 text-success border border-success/30',
    dotColor: 'bg-success',
  },
  DENY: {
    label: 'Deny',
    className: 'bg-error/15 text-error border border-error/30',
    dotColor: 'bg-error',
  },
  REVIEW: {
    label: 'Review',
    className: 'bg-warning/15 text-warning border border-warning/30',
    dotColor: 'bg-warning',
  },

  // Policy status
  DRAFT: {
    label: 'Draft',
    className: 'bg-text-muted/15 text-text-muted border border-text-muted/30',
  },
  PUBLISHED: {
    label: 'Published',
    className: 'bg-primary/15 text-accent border border-primary/30',
    dotColor: 'bg-accent',
  },
  DEPRECATED: {
    label: 'Deprecated',
    className: 'bg-warning/15 text-warning border border-warning/30',
  },
  ARCHIVED: {
    label: 'Archived',
    className: 'bg-text-disabled/15 text-text-disabled border border-text-disabled/30',
  },

  // Compilation / Execution status
  PENDING: {
    label: 'Pending',
    className: 'bg-text-muted/15 text-text-muted border border-text-muted/30',
  },
  RUNNING: {
    label: 'Running',
    className: 'bg-accent/15 text-accent border border-accent/30',
    dotColor: 'bg-accent',
  },
  SUCCESS: {
    label: 'Success',
    className: 'bg-success/15 text-success border border-success/30',
    dotColor: 'bg-success',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-error/15 text-error border border-error/30',
  },
  TIMEOUT: {
    label: 'Timeout',
    className: 'bg-warning/15 text-warning border border-warning/30',
  },

  // User roles
  ADMIN: {
    label: 'Admin',
    className: 'bg-error/15 text-error border border-error/30',
  },
  POLICY_MANAGER: {
    label: 'Policy Manager',
    className: 'bg-primary/15 text-accent border border-primary/30',
  },
  AUDITOR: {
    label: 'Auditor',
    className: 'bg-warning/15 text-warning border border-warning/30',
  },
  VIEWER: {
    label: 'Viewer',
    className: 'bg-text-muted/15 text-text-muted border border-text-muted/30',
  },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: StatusValue;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({
  status,
  showDot = false,
  className,
  size = 'md',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as string] ?? {
    label: status as string,
    className: 'bg-text-muted/15 text-text-muted border border-text-muted/30',
  };

  return (
    <span
      className={cn(
        'badge font-medium',
        size === 'sm' ? 'text-2xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        config.className,
        className
      )}
    >
      {showDot && config.dotColor && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', config.dotColor, {
            'animate-pulse': status === 'RUNNING',
          })}
        />
      )}
      {config.label}
    </span>
  );
}
