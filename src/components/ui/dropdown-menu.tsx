import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type Ctx = { open: boolean; setOpen: (o: boolean) => void; triggerEl: HTMLElement | null; setTriggerEl: (el: HTMLElement | null) => void }
const C = React.createContext<Ctx>({ open: false, setOpen: () => {}, triggerEl: null, setTriggerEl: () => {} })

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [triggerEl, setTriggerEl] = React.useState<HTMLElement | null>(null)
  return <C.Provider value={{ open, setOpen, triggerEl, setTriggerEl }}>{children}</C.Provider>
}

export function DropdownMenuTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setOpen, setTriggerEl } = React.useContext(C)
  return (
    <button ref={el => setTriggerEl(el)}
      className={cn("inline-flex items-center [&_svg]:pointer-events-none", className)}
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
      onContextMenu={e => e.preventDefault()}
    >{children}</button>
  )
}

export function DropdownMenuContent({ children, className, align = "start" }: { children: React.ReactNode; className?: string; align?: "start" | "end" }) {
  const { open, setOpen, triggerEl } = React.useContext(C)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })
  const ref = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    if (open && triggerEl) {
      const r = triggerEl.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: align === "end" ? r.right - 128 : r.left })
    }
  }, [open, triggerEl, align])

  React.useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open, setOpen])

  if (!open) return null
  return createPortal(
    <div ref={ref} className={cn("fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)} style={{ top: pos.top, left: pos.left }}>{children}</div>,
    document.body
  )
}

export function DropdownMenuItem({ className, onClick, children }: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(C)
  return <button onMouseDown={e => { e.preventDefault(); onClick?.(e); setOpen(false) }} className={cn("relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent", className)}>{children}</button>
}
export function DropdownMenuSeparator() { return <div className="-mx-1 my-1 h-px bg-border" /> }
export function DropdownMenuLabel({ children }: { children: React.ReactNode }) { return <div className="px-2 py-1.5 text-sm font-semibold">{children}</div> }
