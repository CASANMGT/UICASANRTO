import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-indigo-600 text-white hover:bg-indigo-700',
  outline:
    'border border-[color:var(--b1)] bg-white text-[color:var(--t1)] hover:bg-[color:var(--s2)]',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700',
  legacyPrimary:
    'border border-[color:var(--ac)] bg-[color:var(--ac)] text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] hover:brightness-95',
  legacyGhost:
    'border border-[color:var(--b1)] bg-white text-[color:var(--t1)] hover:bg-[color:var(--s2)]',
  legacyDanger: 'border border-[color:var(--dd)] bg-[color:var(--dd)] text-white hover:brightness-95',
  legacyPill:
    'border border-[color:var(--b1)] bg-white text-[color:var(--t1)] hover:bg-[color:var(--s2)]',
}

const sizes = {
  default: 'px-3 py-2 text-[13px]',
  sm: 'px-3 py-1 text-[12px]',
  legacy: 'px-3 py-1 text-[12px]',
}

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'legacyPill' ? 'rounded-full' : '',
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className,
      )}
      {...props}
    />
  )
}
