import { createContext, useContext } from 'react'
import { cn } from '../../lib/utils'

const DialogContext = createContext({ open: false, onOpenChange: () => {} })

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

/** shadcn-aligned dialog content. tone "legacy" kept for backward compatibility. */
export function DialogContent({ className, children, tone = 'default' }) {
  const { open, onOpenChange } = useContext(DialogContext)
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          'max-h-[92vh] w-full max-w-lg overflow-auto rounded-lg border border-border bg-background p-6 shadow-lg space-y-4',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-2', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn('text-base text-muted-foreground', className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-5 flex flex-row justify-end gap-3', className)} {...props} />
}
