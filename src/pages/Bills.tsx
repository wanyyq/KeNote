import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useStore, useSettingsStore, Bill, BillType } from "@/store/useStore"
import { useBillsPaginated } from "@/hooks/useBillsPaginated"
import { useFilteredBills } from "@/hooks/useFilteredBills"
import { getAllDistinctDates, getBillsAroundDate } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import CreateBillDialog from "@/components/bills/CreateBillDialog"
import Timelist from "@/components/bills/Timelist"
import Heatmap from "@/components/charts/Heatmap"
import { format } from "date-fns"

type FT = "all"|"income"|"expense"; type DM = "timeline"|"heatmap"

export default function Bills() {
  const { removeBill, shiftBillDate, exportBillsCSV } = useStore()
  const { getAllCategories } = useSettingsStore()
  const [co, setCo] = useState(false)
  const [editBill, setEditBill] = useState<Bill | null>(null)
  const [s, setS] = useState("")
  const [ft, setFt] = useState<FT>("all")
  const [fc, setFc] = useState("all")
  const [dm, setDm] = useState<DM>("timeline")
  const [gotoOpen, setGotoOpen] = useState(false)
  const [gotoDate, setGotoDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [calOpen, setCalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  // Jump mode: when user jumps to a date, show these bills instead of paginated
  const [jumpBills, setJumpBills] = useState<Bill[] | null>(null)
  const [jumpDate, setJumpDate] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  const { 
    bills: paginatedBills, 
    loading, 
    hasMore, 
    total,
    loadMore, 
    refresh 
  } = useBillsPaginated({ type: ft, category: fc, search: s })

  const { bills: heatmapBills } = useFilteredBills({ type: ft, category: fc, search: s })

  // Keep ref to latest refresh function to avoid stale closures
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) loadMore()
    }, { rootMargin: '100px' })
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, loadMore])

  const cats = useMemo(() => {
    const a = new Set<string>()
    getAllCategories("expense").forEach(c=>a.add(c.name))
    getAllCategories("income").forEach(c=>a.add(c.name))
    return Array.from(a).sort()
  }, [getAllCategories])

  const handleEdit = (b: Bill) => { setEditBill(b); setCo(true) }
  
  const handleClose = () => { 
    setCo(false); setEditBill(null)
    // Refresh list after dialog closes (bill was added/edited)
    setTimeout(() => refreshRef.current(), 100)
  }
  
  const handleDelete = async (id: string) => { 
    await removeBill(id)
    refreshRef.current()
  }
  
  const handleShift = async (id: string, days: number) => { 
    await shiftBillDate(id, days)
    refreshRef.current()
  }

  // Refresh when dialog closes
  useEffect(() => { 
    if (!co) refreshRef.current()
  }, [co])

  const doGoto = async () => {
    setGotoOpen(false)
    const allDates = await getAllDistinctDates()
    if (allDates.length === 0) return
    
    // Find closest date
    let closest = allDates[0]
    let minDiff = Math.abs(new Date(gotoDate).getTime() - new Date(closest).getTime())
    for (const d of allDates) {
      const diff = Math.abs(new Date(gotoDate).getTime() - new Date(d).getTime())
      if (diff < minDiff) { minDiff = diff; closest = d }
    }
    
    setDm("timeline")
    // Load bills around target date
    const aroundBills = await getBillsAroundDate(closest, 200)
    setJumpBills(aroundBills)
    setJumpDate(closest)
    
    setTimeout(() => {
      const el = document.getElementById(`bill-date-${closest}`)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 300)
  }

  // Reset jump mode when filters change
  useEffect(() => {
    setJumpBills(null)
    setJumpDate(null)
  }, [ft, fc, s])

  // Use jump bills if in jump mode, otherwise use paginated
  const displayBills = jumpBills || paginatedBills

  const handleExport = async () => {
    setExporting(true)
    try { await exportBillsCSV() }
    finally { setExporting(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <div className="pt-4 md:pt-8 flex items-center justify-between gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">账单</h1><p className="text-muted-foreground mt-1">收入与支出阅览 {total > 0 && <span className="text-xs">共 {total} 条</span>}</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}><i data-lucide="download" className="size-4 mr-1"></i>{exporting ? "导出中..." : "导出到Excel"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setGotoDate(format(new Date(),"yyyy-MM-dd")); setGotoOpen(true) }}><i data-lucide="calendar" className="size-4 mr-1"></i>跳转至某一天</Button>
          <Button onClick={()=>{setEditBill(null);setCo(true)}}><i data-lucide="plus" className="size-4 mr-1.5"></i>新建记账</Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <Input placeholder="搜索账单..." value={s} onChange={e=>setS(e.target.value)} className="flex-1 min-w-[160px] h-9" />
        <Select value={ft} onValueChange={v=>setFt(v as FT)}><SelectTrigger className="w-[100px]"><SelectValue placeholder="类型"/></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="income">收入</SelectItem><SelectItem value="expense">支出</SelectItem></SelectContent></Select>
        <Select value={fc} onValueChange={setFc}><SelectTrigger className="w-[120px]"><SelectValue placeholder="分类"/></SelectTrigger><SelectContent><SelectItem value="all">全部分类</SelectItem>{cats.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Select value={dm} onValueChange={v=>setDm(v as DM)}><SelectTrigger className="w-[110px]"><SelectValue placeholder="视图"/></SelectTrigger><SelectContent><SelectItem value="timeline">时间轴</SelectItem><SelectItem value="heatmap">热力图</SelectItem></SelectContent></Select>
      </div>
      {dm==="heatmap"?<Card><CardContent className="py-5"><Heatmap bills={heatmapBills}/></CardContent></Card>
        :<div ref={timelineRef}>
          {jumpDate && (
            <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 mb-2">
              <span className="text-xs text-muted-foreground">已跳转至 {jumpDate}</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setJumpBills(null); setJumpDate(null) }}>
                返回最新
              </Button>
            </div>
          )}
          <Timelist bills={displayBills} onDelete={handleDelete} onEdit={handleEdit} onShift={handleShift} emptyMessage={ft!=="all"||fc!=="all"||s?"没有符合筛选条件的账单":"暂无账单记录"}/>
          {!jumpDate && hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <i data-lucide="loader-2" className="size-4 animate-spin"></i>
                  <span className="text-sm">加载中...</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={loadMore}>加载更多</Button>
              )}
            </div>
          )}
          {!hasMore && paginatedBills.length > 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">已加载全部 {paginatedBills.length} 条账单</div>
          )}
        </div>}
      {co && <CreateBillDialog open={co} onOpenChange={handleClose} editBill={editBill ? { id: editBill.id, amount: editBill.amount, type: editBill.type as BillType, category: editBill.category, note: editBill.note, date: editBill.date } : undefined} />}

      {gotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 backdrop-blur-sm" onClick={() => setGotoOpen(false)} />
          <div className="relative z-50 w-full max-w-xs rounded-lg border bg-background p-6 shadow-lg space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold leading-none tracking-tight">调整至</h2><Button variant="ghost" size="icon-xs" onClick={() => setGotoOpen(false)}><i data-lucide="x" className="size-3.5 block"></i></Button></div>
            <div className="flex gap-2">
              <Input type="date" value={gotoDate} onChange={e => setGotoDate(e.target.value)} className="flex-1" />
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild><Button variant="outline" size="icon"><i data-lucide="calendar" className="size-4"></i></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={new Date(gotoDate)} onSelect={d => { if(d){setGotoDate(format(d,"yyyy-MM-dd"));setCalOpen(false)} }} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGotoOpen(false)}>取消</Button>
              <Button onClick={doGoto}>确定</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}