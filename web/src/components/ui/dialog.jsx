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

export function DialogContent({ className, children, tone = 'default' }) {
  const { open, onOpenChange } = useContext(DialogContext)
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          'max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl border p-4 shadow-[0_20px_55px_rgba(15,23,42,0.18)]',
          tone === 'legacy' ? 'border-[color:var(--b1)] bg-[color:var(--s1)]' : 'border-[color:var(--b1)] bg-[color:var(--s1)]',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-3', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-[18px] font-extrabold text-[color:var(--t1)]', className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn('text-[13px] text-[color:var(--t2)]', className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-4 flex justify-end gap-2', className)} {...props} />
}
