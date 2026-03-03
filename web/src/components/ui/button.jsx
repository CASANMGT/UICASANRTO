import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  legacyPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_20px_rgba(79,70,229,0.22)]',
  legacyGhost: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  legacyDanger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  legacyPill: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-full',
}

const sizes = {
  default: 'h-10 rounded-md px-4 py-2 text-base',
  sm: 'h-9 rounded-md px-3 text-base',
  lg: 'h-11 rounded-md px-8 text-base',
  icon: 'h-10 w-10',
  legacy: 'h-10 rounded-md px-4 text-base',
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className,
      )}
      {...props}
    />
  )
}
