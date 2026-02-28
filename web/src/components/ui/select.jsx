import { cn } from '../../lib/utils'

const variants = {
  default: 'border-[color:var(--b1)] bg-white text-[color:var(--t1)] ring-[color:var(--ac)]',
  legacy: 'border-[color:var(--b1)] bg-white text-[color:var(--t1)] ring-[color:var(--ac)]',
}

export function Select({ className, children, variant = 'default', ...props }) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border px-3 py-2 text-[13px] outline-none focus:ring-2',
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
