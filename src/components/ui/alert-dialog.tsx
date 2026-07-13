import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface AlertDialogContextValue { open: boolean; setOpen: (open: boolean) => void }
const AlertDialogContext = React.createContext<AlertDialogContextValue>({ open: false, setOpen: () => {} })

function AlertDialog({ children, open, onOpenChange }: { children?: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [o, s] = React.useState(false)
  return <AlertDialogContext.Provider value={{ open: open !== undefined ? open : o, setOpen: onOpenChange || s }}>{children}</AlertDialogContext.Provider>
}
function AlertDialogTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = React.useContext(AlertDialogContext)
  return <span onClick={() => setOpen(true)}>{children}</span>
}
function AlertDialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = React.useContext(AlertDialogContext)
  if (!open) return null
  return createPortal(
    <>
      <div className="fixed inset-0 z-50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 sm:max-w-lg", className)}>
        {children}
      </div>
    </>, document.body)
}
function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} /> }
function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} /> }
function AlertDialogTitle({ className, ...props }: React.ComponentProps<"h2">) { return <h2 className={cn("text-lg font-semibold", className)} {...props} /> }
function AlertDialogDescription({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("text-sm text-muted-foreground", className)} {...props} /> }
function AlertDialogAction({ className, ...props }: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(AlertDialogContext)
  return <button {...props} className={cn(buttonVariants(), className)} onClick={e => { props.onClick?.(e); setOpen(false) }} />
}
function AlertDialogCancel({ className, ...props }: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(AlertDialogContext)
  return <button {...props} className={cn(buttonVariants({ variant: "outline" }), className)} onClick={e => { props.onClick?.(e); setOpen(false) }} />
}

export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel }
