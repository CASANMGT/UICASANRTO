import { cn } from '../../lib/utils'

export function PageShell({ className, ...props }) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-4 shadow-[0_10px_30px_rgba(79,70,229,0.08)]',
        'border-[color:var(--b1)] bg-[color:var(--s1)] backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

export function PageHeader({ className, ...props }) {
  return <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)} {...props} />
}

export function PageTitle({ className, ...props }) {
  return <h2 className={cn('text-[22px] font-extrabold text-[color:var(--t1)] tracking-[-0.02em]', className)} {...props} />
}

export function PageMeta({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-full border px-3 py-1 text-[13px] font-semibold',
        'border-[color:var(--b1)] bg-[color:var(--s2)] text-[color:var(--t2)]',
        className,
      )}
      {...props}
    />
  )
}

export function FilterBar({ className, ...props }) {
  return <div className={cn('mb-4 grid grid-cols-1 gap-2 lg:grid-cols-3', className)} {...props} />
}

export function StatsGrid({ className, ...props }) {
  return <div className={cn('mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4', className)} {...props} />
}

export function StatCard({ label, value, valueClassName, className }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-slate-50 p-3', className)}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={cn('text-xl font-extrabold text-slate-900', valueClassName)}>{value}</div>
    </div>
  )
}

export function DataPanel({ className, ...props }) {
  return <div className={cn('overflow-x-auto rounded-xl border border-[color:var(--b1)]', className)} {...props} />
}

export function PageFooter({ className, ...props }) {
  return <div className={cn('mt-4 flex items-center justify-between gap-2', className)} {...props} />
}
