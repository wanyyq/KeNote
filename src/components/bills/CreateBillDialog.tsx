import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useStore, BillType, CategoryDef } from "@/store/useStore"
import CategoryIcon from "@/components/bills/CategoryIcon"
import IconPicker from "@/components/bills/IconPicker"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const QUICK_DATES = ["今天","昨天","前天"]
function qd(label: string) { const n=new Date(); if(label==="昨天") return format(new Date(n.getTime()-86400000),"yyyy-MM-dd"); if(label==="前天") return format(new Date(n.getTime()-172800000),"yyyy-MM-dd"); return format(n,"yyyy-MM-dd") }

interface Props { open: boolean; onOpenChange: (o: boolean) => void; editBill?: { id:string; amount:number; type:BillType; category:string; note:string; date:string } }

export default function CreateBillDialog({ open, onOpenChange, editBill }: Props) {
  const { addBill, updateBill, getAllCategories, addCustomCategory, removeCustomCategory } = useStore()
  const [type, setType] = useState<BillType>(editBill?.type||"expense")
  const [amount, setAmount] = useState(editBill?String(editBill.amount):"")
  const [category, setCategory] = useState(editBill?.category||"")
  const [note, setNote] = useState(editBill?.note||"")
  const [date, setDate] = useState(editBill?.date||format(new Date(),"yyyy-MM-dd"))
  const [error, setError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("circle")
  const [ipOpen, setIpOpen] = useState(false)
  const cats = getAllCategories(type)

  const submit = () => {
    setError(""); const n = parseFloat(amount)
    if(!amount||isNaN(n)||n<=0){setError("请输入有效的金额");return}
    if(!category){setError("请选择分类");return}
    editBill?updateBill(editBill.id,{type,amount:n,category,note,date}):addBill({type,amount:n,category,note,date})
    setType("expense");setAmount("");setCategory("");setNote("");setDate(format(new Date(),"yyyy-MM-dd"));onOpenChange(false)
  }
  const reset = () => { setError("");setShowNew(false);setNewName("");setNewIcon("circle");if(!editBill){setAmount("");setCategory("");setNote("");setType("expense");setDate(format(new Date(),"yyyy-MM-dd"))} }
  const close = (o:boolean) => { if(!o)reset(); onOpenChange(o) }
  const addCustom = () => { if(!newName.trim())return; addCustomCategory(type,{name:newName.trim(),icon:newIcon,isCustom:true}); setCategory(newName.trim()); setShowNew(false);setNewName("");setNewIcon("circle") }

  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editBill?"编辑账单":"新建账单"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Toggle pressed={type==="expense"} onPressedChange={()=>{setType("expense");setCategory("")}} variant="outline" className="flex-1 data-[state=on]:bg-red-50 data-[state=on]:text-red-600 data-[state=on]:border-red-200">支出</Toggle>
              <Toggle pressed={type==="income"} onPressedChange={()=>{setType("income");setCategory("")}} variant="outline" className="flex-1 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-600 data-[state=on]:border-emerald-200">收入</Toggle>
            </div>
            <div className="space-y-2"><Label htmlFor="amount">金额</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">¥</span><Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} className="pl-7" autoFocus/></div></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>分类</Label><button type="button" onClick={()=>setShowNew(!showNew)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ 自定义</button></div>
              <div className="grid grid-cols-3 gap-1.5">
                {cats.map(c=><button key={c.name} type="button" onClick={()=>setCategory(c.name)} className={cn("flex items-center gap-1.5 py-2 px-2.5 text-xs rounded-md border transition-colors text-left",category===c.name?"bg-primary text-primary-foreground border-primary":"border-input hover:bg-accent")}><CategoryIcon iconName={c.icon} size={14}/><span className="truncate">{c.name}</span>{c.isCustom&&<span onClick={e=>{e.stopPropagation();removeCustomCategory(type,c.name);if(category===c.name)setCategory("")}} className="ml-auto shrink-0 opacity-50 hover:opacity-100" title="删除"><i data-lucide="x" className="size-[10px]"></i></span>}</button>)}
              </div>
              {showNew&&<div className="space-y-2 p-3 border rounded-md bg-muted/30"><div className="flex items-center gap-2"><button type="button" onClick={()=>setIpOpen(true)} className="shrink-0 p-1.5 rounded-md border hover:bg-accent transition-colors" title="选择图标"><CategoryIcon iconName={newIcon} size={18}/></button><Input placeholder="分类名称" value={newName} onChange={e=>setNewName(e.target.value)} className="h-8 text-xs" onKeyDown={e=>{if(e.key==="Enter")addCustom()}}/><Button type="button" size="sm" onClick={addCustom} disabled={!newName.trim()} className="h-8 text-xs shrink-0">添加</Button></div></div>}
            </div>
            <div className="space-y-2"><Label htmlFor="note">备注（可选）</Label><Input id="note" placeholder="添加备注..." value={note} onChange={e=>setNote(e.target.value)}/></div>
            <div className="space-y-2">
              <Label>日期</Label>
              <ContextMenu>
                <ContextMenuTrigger className="block w-full"><Input id="date" type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full"/></ContextMenuTrigger>
                <ContextMenuContent className="w-32">
                  {QUICK_DATES.map(l=><ContextMenuItem key={l} onClick={()=>setDate(qd(l))}><i data-lucide="calendar" className="size-4 mr-2"></i>{l}</ContextMenuItem>)}
                </ContextMenuContent>
              </ContextMenu>
            </div>
            {error&&<p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>close(false)}>取消</Button><Button onClick={submit}>{editBill?"保存修改":"确认添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <IconPicker open={ipOpen} onOpenChange={setIpOpen} selected={newIcon} onSelect={n=>setNewIcon(n)}/>
    </>
  )
}
