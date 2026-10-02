import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const iconColors = {
    danger: 'bg-error/10 border-error/30 text-error',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info: 'bg-primary/10 border-primary/30 text-accent',
  };

  const confirmColors = {
    danger: 'bg-error hover:bg-red-600 text-white',
    warning: 'bg-warning hover:bg-amber-500 text-black',
    info: 'bg-primary hover:bg-primary-hover text-white',
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        {/* Overlay */}
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />

        {/* Content */}
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface-elevated border border-border rounded-xl shadow-card p-6 data-[state=open]:animate-fade-in">
          <div className="flex gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                iconColors[variant]
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <AlertDialog.Title className="text-base font-semibold text-text-primary">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm text-text-muted">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button className="btn-secondary" disabled={isLoading}>
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  confirmColors[variant]
                )}
              >
                {isLoading && <LoadingSpinner size="xs" />}
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
