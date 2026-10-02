import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { InboxIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  className?: string;
  headerClassName?: string;
  cell: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  keyExtractor: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  skeletonRows?: number;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ columns }: { columns: ColumnDef<unknown>[] }) {
  return (
    <tr>
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="skeleton h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  keyExtractor,
  emptyTitle = 'No data',
  emptyDescription = 'Nothing to display here yet.',
  footer,
  className,
  onRowClick,
  rowClassName,
  skeletonRows = 5,
}: DataTableProps<T>) {
  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-border bg-surface/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase tracking-wide whitespace-nowrap',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <SkeletonRow key={i} columns={columns as ColumnDef<any>[]} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={InboxIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    size="sm"
                    className="py-12"
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-surface-hover',
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-text-secondary align-middle',
                        col.className
                      )}
                    >
                      {col.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer (pagination, etc.) */}
      {footer && !isLoading && data.length > 0 && (
        <div className="border-t border-border px-4 py-3">{footer}</div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" label="Loading..." />
        </div>
      )}
    </div>
  );
}
