import { useState, useMemo } from "react"
import { useStore, Bill, BillType } from "@/store/useStore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import CreateBillDialog from "@/components/bills/CreateBillDialog"
import Timelist from "@/components/bills/Timelist"
import Heatmap from "@/components/charts/Heatmap"

type FT = "all"|"income"|"expense"; type DM = "timeline"|"heatmap"

export default function Bills() {
  const { bills, removeBill, shiftBillDate, getAllCategories } = useStore()
  const [co, setCo] = useState(false)
  const [editBill, setEditBill] = useState<Bill | null>(null)
  const [s, setS] = useState("")
  const [ft, setFt] = useState<FT>("all")
  const [fc, setFc] = useState("all")
  const [dm, setDm] = useState<DM>("timeline")

  const cats = useMemo(() => {
    const a = new Set<string>(); getAllCategories("expense").forEach(c=>a.add(c.name)); getAllCategories("income").forEach(c=>a.add(c.name))
    return Array.from(a).sort()
  }, [getAllCategories])

  const fb = useMemo(() => bills.filter(b=>{
    if(ft==="income"&&b.type!=="income") return false; if(ft==="expense"&&b.type!=="expense") return false
    if(fc!=="all"&&b.category!==fc) return false
    if(s){ const q=s.toLowerCase(); if(!b.note.toLowerCase().includes(q)&&!b.category.toLowerCase().includes(q)&&!b.amount.toString().includes(q)) return false }
    return true
  }),[bills,ft,fc,s])

  const handleEdit = (b: Bill) => { setEditBill(b); setCo(true) }
  const handleClose = () => { setCo(false); setEditBill(null) }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <div className="pt-4 md:pt-8 flex items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">账单</h1><p className="text-muted-foreground mt-1">您的收入与支出</p></div>
        <Button onClick={()=>{setEditBill(null);setCo(true)}}><i data-lucide="plus" className="size-4 mr-1.5"></i>创建账单</Button>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <Input placeholder="搜索账单..." value={s} onChange={e=>setS(e.target.value)} className="flex-1 min-w-[160px] h-9" />
        <Select value={ft} onValueChange={v=>setFt(v as FT)}><SelectTrigger className="w-[100px]"><SelectValue placeholder="类型"/></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="income">收入</SelectItem><SelectItem value="expense">支出</SelectItem></SelectContent></Select>
        <Select value={fc} onValueChange={setFc}><SelectTrigger className="w-[120px]"><SelectValue placeholder="分类"/></SelectTrigger><SelectContent><SelectItem value="all">全部分类</SelectItem>{cats.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Select value={dm} onValueChange={v=>setDm(v as DM)}><SelectTrigger className="w-[110px]"><SelectValue placeholder="视图"/></SelectTrigger><SelectContent><SelectItem value="timeline">时间轴</SelectItem><SelectItem value="heatmap">热力图</SelectItem></SelectContent></Select>
      </div>
      {dm==="heatmap"?<Card><CardContent className="py-5"><Heatmap bills={fb}/></CardContent></Card>
        :<Timelist bills={fb} onDelete={removeBill} onEdit={handleEdit} onShift={shiftBillDate} emptyMessage={ft!=="all"||fc!=="all"||s?"没有符合筛选条件的账单":"暂无账单记录"}/>}
      {co && <CreateBillDialog
        open={co}
        onOpenChange={handleClose}
        editBill={editBill ? { id: editBill.id, amount: editBill.amount, type: editBill.type as BillType, category: editBill.category, note: editBill.note, date: editBill.date } : undefined}
      />}
    </div>
  )
}
