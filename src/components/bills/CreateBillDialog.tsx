import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useStore, BillType } from "@/store/useStore"
import CategoryIcon from "@/components/bills/CategoryIcon"
import IconPicker from "@/components/bills/IconPicker"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Props { open: boolean; onOpenChange: (o: boolean) => void; editBill?: { id:string; amount:number; type:BillType; category:string; note:string; date:string } }

export default function CreateBillDialog({ open, onOpenChange, editBill }: Props) {
  const { addBill, updateBill, getAllCategories, addCustomCategory } = useStore()
  const [type, setType] = useState<BillType>(editBill?.type||"expense")
  const [amount, setAmount] = useState(editBill?String(editBill.amount):"")
  const [category, setCategory] = useState(editBill?.category||"")
  const [note, setNote] = useState(editBill?.note||"")
  const [date, setDate] = useState(editBill?.date||format(new Date(),"yyyy-MM-dd"))
  const [error, setError] = useState("")
  const [calOpen, setCalOpen] = useState(false)

  // Custom category flow
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customIcon, setCustomIcon] = useState("circle")
  const [ipOpen, setIpOpen] = useState(false)

  const cats = getAllCategories(type)

  // Re-render lucide icons when customIcon changes
  useEffect(() => {
    if (customOpen) {
      setTimeout(() => { (window as any).lucide?.createIcons() }, 100)
    }
  }, [customIcon, customOpen])

  const reset = () => { setType("expense"); setAmount(""); setCategory(""); setNote(""); setDate(format(new Date(),"yyyy-MM-dd")); setError(""); setCustomName(""); setCustomIcon("circle"); setCustomOpen(false) }
  const close = () => { reset(); onOpenChange(false) }

  const submit = () => {
    setError(""); const n = parseFloat(amount)
    if(!amount||isNaN(n)||n<=0){setError("请输入有效的金额");return}
    if(!category){setError("请选择分类");return}
    editBill?updateBill(editBill.id,{type,amount:n,category,note,date}):addBill({type,amount:n,category,note,date})
    close()
  }

  const doAddCustom = () => {
    if(!customName.trim()) return
    addCustomCategory(type, { name: customName.trim(), icon: customIcon, isCustom: true })
    setCategory(customName.trim())
    setCustomName(""); setCustomIcon("circle"); setCustomOpen(false)
  }

  const adjust = (delta: number) => {
    setAmount(Math.max(0, (parseFloat(amount)||0) + delta).toFixed(2))
  }

  if (!open) return null

  return (
    <>
      {/* Main Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 backdrop-blur-sm" onClick={close} />
        <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold leading-none tracking-tight">{editBill?"编辑账单":"新建账单"}</h2>
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-md border border-input overflow-hidden">
                <button onClick={() => { setType("expense"); setCategory("") }} className={cn("px-3 py-1 text-xs font-medium transition-colors", type==="expense"?"bg-red-50 text-red-600":"hover:bg-accent")}>支出</button>
                <div className="w-px bg-border" />
                <button onClick={() => { setType("income"); setCategory("") }} className={cn("px-3 py-1 text-xs font-medium transition-colors", type==="income"?"bg-emerald-50 text-emerald-600":"hover:bg-accent")}>收入</button>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={close}><i data-lucide="x" className="size-3.5 block"></i></Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>金额</Label>
            <div className="flex gap-2">
              <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">¥</span><Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} className="pl-7" autoFocus /></div>
              <Button variant="outline" size="icon" onClick={() => adjust(-1)}><i data-lucide="minus" className="size-4"></i></Button>
              <Button variant="outline" size="icon" onClick={() => adjust(1)}><i data-lucide="plus" className="size-4"></i></Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>备注与分类</Label>
            <div className="flex gap-2">
              <Input placeholder="备注（可选）" value={note} onChange={e=>setNote(e.target.value)} className="flex-1" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[130px] shrink-0"><SelectValue placeholder="分类" /></SelectTrigger>
                <SelectContent align="end" className="max-h-52">
                  {cats.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      <span className="flex items-center gap-2"><CategoryIcon iconName={c.icon} size={14} />{c.name}</span>
                    </SelectItem>
                  ))}
                  <div className="border-t pt-1 mt-1">
                    <button className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent flex items-center gap-2 text-muted-foreground" onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setCustomOpen(true) }}>
                      <i data-lucide="plus" className="size-3.5"></i>自定义分类
                    </button>
                  </div>
                </SelectContent>
              </Select>
            </div>
            {/* Custom category inline form */}
            {customOpen && (
              <div className="flex items-center gap-2 pl-1 pt-1">
                <button onMouseDown={e => { e.preventDefault(); setIpOpen(true) }} className="shrink-0 p-1.5 rounded-md border hover:bg-accent"><CategoryIcon iconName={customIcon} size={16} /></button>
                <Input placeholder="新分类名" value={customName} onChange={e=>setCustomName(e.target.value)} className="h-8 text-xs flex-1" onKeyDown={e=>{if(e.key==="Enter")doAddCustom()}} />
                <Button size="sm" onClick={doAddCustom} disabled={!customName.trim()} className="h-8 text-xs">添加</Button>
                <Button variant="ghost" size="icon-xs" onClick={() => { setCustomOpen(false); setCustomName(""); setCustomIcon("circle") }}><i data-lucide="x" className="size-3"></i></Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>日期</Label>
            <div className="flex gap-2">
              <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1" />
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild><Button variant="outline" size="icon"><i data-lucide="calendar" className="size-4"></i></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={new Date(date)} onSelect={d => { if(d){setDate(format(d,"yyyy-MM-dd"));setCalOpen(false)} }} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>取消</Button>
            <Button onClick={submit}>{editBill?"保存修改":"确认添加"}</Button>
          </div>
        </div>
      </div>

      {/* Icon Picker */}
      <IconPicker open={ipOpen} selected={customIcon} onSelect={n => { setCustomIcon(n); setIpOpen(false) }} onClose={() => setIpOpen(false)} />
    </>
  )
}
