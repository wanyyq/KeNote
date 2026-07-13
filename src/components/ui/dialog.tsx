import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}
const DialogContext = React.createContext<DialogContextValue>({ open: false, setOpen: () => {} })

function Dialog({ children, open, onOpenChange, ...props }: { children?: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  return <DialogContext.Provider value={{ open: isOpen, setOpen }}>{children}</DialogContext.Provider>
}

function DialogTrigger({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = React.useContext(DialogContext)
  if (asChild && React.isValidElement(children)) return React.cloneElement(children as React.ReactElement<any>, { onClick: () => setOpen(true) })
  return <span onClick={() => setOpen(true)}>{children}</span>
}

function DialogOverlay({ className }: { className?: string }) {
  const { open, setOpen } = React.useContext(DialogContext)
  if (!open) return null
  return <div className={cn("fixed inset-0 z-50 bg-transparent", className)} onClick={() => setOpen(false)} />
}

function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = React.useContext(DialogContext)
  if (!open) return null
  return createPortal(
    <>
      <div className="fixed inset-0 z-50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 sm:max-w-lg",
        className
      )}>
        {children}
        <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <i data-lucide="x" className="size-4 block"></i><span className="sr-only">Close</span>
        </button>
      </div>
    </>,
    document.body
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />
}
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}
function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg leading-none font-semibold tracking-tight", className)} {...props} />
}
function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Dialog, DialogTrigger, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
