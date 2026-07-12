import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ICONS = [
  "activity","airplay","alarm-clock","alert-circle","anchor","aperture","archive","arrow-down","arrow-left","arrow-right",
  "arrow-up","award","baby","banknote","barcode","battery-full","beef","bell","bike","bird",
  "bolt","book-open","bookmark","briefcase","building","bus","calculator","calendar","camera","car",
  "chart-line","check-circle","chrome","circle","clock","cloud","code","coffee","compass","cookie",
  "copy","credit-card","crown","database","diamond","dollar-sign","download","droplet","dumbbell","edit",
  "eye","feather","file-text","film","flag","flame","folder","gamepad-2","gem","gift",
  "git-branch","globe","graduation-cap","hand","hard-drive","headphones","heart","home","image","inbox",
  "key","laptop","leaf","lightbulb","link","lock","mail","map","map-pin","message-circle",
  "mic","monitor","moon","more-horizontal","music","navigation","notebook","package","palette","paperclip",
  "pen-tool","phone","pie-chart","piggy-bank","play","rocket","search","settings","shopping-bag","shopping-cart",
  "smartphone","smile","star","sun","tag","trash","trending-up","truck","umbrella","user","users","utensils","wallet","wifi","wrench","zap"
]

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onSelect: (n: string) => void; selected?: string }

export default function IconPicker({ open, onOpenChange, onSelect, selected }: Props) {
  const [search, setSearch] = useState("")

  useEffect(() => { if (open) setSearch("") }, [open])

  const filtered = useMemo(() => {
    if (!search.trim()) return ICONS
    const q = search.toLowerCase(); return ICONS.filter(n => n.includes(q))
  }, [search])

  // Force lucide to render icons when content appears
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const lucide = (window as any).lucide
      if (lucide?.createIcons) lucide.createIcons()
    }, 50)
    return () => clearTimeout(timer)
  }, [open, filtered])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-[100] w-full max-w-lg flex flex-col rounded-lg border bg-card shadow-lg" style={{ maxHeight: "calc(100vh - 2rem)" }}>
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-lg font-semibold leading-none tracking-tight">选择图标</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}><i data-lucide="x" className="size-4 block"></i></Button>
        </div>
        <div className="px-4 pb-2"><Input placeholder="搜索图标..." value={search} onChange={e => setSearch(e.target.value)} autoFocus /></div>
        <Separator />
        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
          <div className="grid grid-cols-7 gap-1">
            {filtered.map(name => (
              <button key={name} type="button" onClick={() => { onSelect(name); onOpenChange(false) }}
                className={cn("flex flex-col items-center gap-0.5 p-2 rounded-md transition-colors hover:bg-accent", selected === name && "bg-accent ring-1 ring-ring")} title={name}>
                <i data-lucide={name} className="size-6 block"></i>
                <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">{name.length > 7 ? name.slice(0,6)+"…" : name}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-12 text-center text-sm text-muted-foreground">未找到匹配的图标</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
