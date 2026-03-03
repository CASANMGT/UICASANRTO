import { cn } from '../../lib/utils'

export function Table({ className, density, ...props }) {
  return (
    <table
      className={cn('w-full caption-bottom text-base', className)}
      {...props}
    />
  )
}

export function TableHeader({ className, tone, ...props }) {
  return (
    <thead
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

export function TableBody(props) {
  return <tbody className="[&_tr:last-child]:border-0" {...props} />
}

export function TableRow({ className, tone = 'default', ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50',
        tone === 'legacy' && 'bg-background even:bg-muted/30',
        className,
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground first:pl-6',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }) {
  return (
    <td className={cn('px-4 py-3 align-middle first:pl-6', className)} {...props} />
  )
}
