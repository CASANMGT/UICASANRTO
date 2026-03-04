import { cn } from '../../lib/utils'

/** Rows per page for all tab tables */
export const PAGE_SIZE = 20

/** Minimum table width class for consistent layout across tabs */
export const TABLE_MIN_WIDTH = 'min-w-[1200px]'

/** Shared form control classes for modals (inputs, selects, textareas) — text-base for readability */
export const FORM_CONTROL_CLS =
  'w-full rounded-md border border-input bg-background px-4 py-3 text-base text-foreground outline-none ring-ring focus:ring-2'

/** Shared checkbox classes for consistent sizing and accent */
export const CHECKBOX_CLS = 'h-4 w-4 rounded border-input accent-cyan-600'

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
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className={cn('mt-1.5 text-2xl font-bold tabular-nums text-foreground', valueClassName)}>{value}</div>
    </div>
  )
}

export function DataPanel({ className, ...props }) {
  // #region agent log - hypothesis D
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7870/ingest/65ed9fd0-f2c1-47a1-ab1c-6ee276a8f045',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a58c06'},body:JSON.stringify({sessionId:'a58c06',location:'page.jsx:59',message:'DataPanel rendered with flex layout',data:{hasFlex1:true,hasOverflow:true,hasMinH0:true},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  }
  // #endregion
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
