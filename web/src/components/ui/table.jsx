import { cn } from '../../lib/utils'

export function Table({ className, density = 'default', ...props }) {
  return (
    <table
      className={cn(
        'w-full border-collapse text-[color:var(--t2)]',
        density === 'legacy' ? 'text-[12px]' : 'text-[13px]',
        className,
      )}
      {...props}
    />
  )
}

export function TableHeader({ className, tone = 'default', ...props }) {
  return (
    <thead
      className={cn(
        'text-[12px] uppercase tracking-wide',
        tone === 'legacy'
          ? 'bg-[color:var(--s2)] text-[color:var(--t3)]'
          : 'bg-[color:var(--s2)] text-[color:var(--t3)]',
        className,
      )}
      {...props}
    />
  )
}

export function TableBody(props) {
  return <tbody {...props} />
}

export function TableRow({ className, tone = 'default', ...props }) {
  return (
    <tr
      className={cn(
        tone === 'legacy' ? 'border-t border-[color:var(--b1)]' : 'border-t border-[color:var(--b1)]',
        className,
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }) {
  return <th className={cn('px-3 py-2 text-left', className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td className={cn('px-3 py-2', className)} {...props} />
}
