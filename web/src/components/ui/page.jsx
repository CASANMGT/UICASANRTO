import { cn } from '../../lib/utils'

/** Rows per page for all tab tables */
export const PAGE_SIZE = 20

/** Minimum table width class for consistent layout across tabs */
export const TABLE_MIN_WIDTH = 'min-w-[1200px]'

export function PageShell({ className, ...props }) {
  return (
    <section
      className={cn(
        'flex min-h-0 flex-col rounded-lg border border-border bg-background px-6 py-5 shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function PageHeader({ className, ...props }) {
  return <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-4', className)} {...props} />
}

export function PageTitle({ className, ...props }) {
  return <h2 className={cn('text-base font-semibold leading-none tracking-tight text-foreground', className)} {...props} />
}

export function PageMeta({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-muted px-4 py-1.5 text-base font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function FilterBar({ className, ...props }) {
  return <div className={cn('mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3', className)} {...props} />
}

export function StatsGrid({ className, ...props }) {
  return <div className={cn('mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4', className)} {...props} />
}

export function StatCard({ label, value, valueClassName, className }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-5 shadow-sm', className)}>
      <div className="text-base font-medium text-muted-foreground">{label}</div>
      <div className={cn('mt-2 text-base font-bold text-foreground', valueClassName)}>{value}</div>
    </div>
  )
}

export function DataPanel({ className, ...props }) {
  return <div className={cn('min-h-0 flex-1 overflow-auto rounded-lg border border-border', className)} {...props} />
}

export function PageFooter({ className, ...props }) {
  return (
    <div
      className={cn('mt-5 flex items-center justify-between gap-4 border-t border-border pt-5', className)}
      {...props}
    />
  )
}

export function PaginationInfo({ currentPage, totalPages, totalItems, itemName = 'rows', className }) {
  return (
    <div className={cn('text-sm font-semibold text-muted-foreground', className)}>
      Page {currentPage} of {totalPages} ({totalItems} {itemName})
    </div>
  )
}
