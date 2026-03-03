import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-muted text-muted-foreground border-border',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-rose-100 text-rose-700 border-rose-200',
  info: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  primary: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
}

const sizes = {
  default: 'px-2 py-0.5 text-xs',
  sm: 'px-1.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export function Badge({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}) {
  // #region agent log - hypothesis C
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7870/ingest/65ed9fd0-f2c1-47a1-ab1c-6ee276a8f045',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a58c06'},body:JSON.stringify({sessionId:'a58c06',location:'badge.jsx:27',message:'Badge rendered',data:{variant,size,hasCustomClass:!!className},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold transition-colors',
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status, className, size = 'default' }) {
  const normalized = String(status || '').toLowerCase()

  const statusMap = {
    // Success states
    active: 'success',
    paid: 'success',
    approved: 'success',
    confirmed: 'success',
    online: 'success',
    running: 'success',
    completed: 'success',
    submitted: 'success',
    available: 'neutral',

    // Warning states
    pending: 'warning',
    grace: 'warning',
    review: 'warning',
    planned: 'warning',
    rescheduled: 'info',
    pending_docs: 'warning',

    // Danger states
    rejected: 'danger',
    failed: 'danger',
    immobilized: 'danger',
    no_show: 'danger',
    missing: 'danger',
    offline: 'neutral',
    stopped: 'neutral',

    // Info states
    paused: 'info',
  }

  const variant = statusMap[normalized] || 'default'

  return (
    <Badge variant={variant} size={size} className={className}>
      {status?.toUpperCase?.() || status || '-'}
    </Badge>
  )
}

export function ScoreBadge({ score, className, size = 'default' }) {
  const value = Number(score || 0)
  let variant = 'danger'
  if (value >= 80) variant = 'success'
  else if (value >= 60) variant = 'info'
  else if (value >= 41) variant = 'warning'
  else if (value >= 21) variant = 'danger'

  return (
    <Badge variant={variant} size={size} className={className}>
      {value}
    </Badge>
  )
}
