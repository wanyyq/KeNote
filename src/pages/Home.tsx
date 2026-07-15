import { useMemo, useState } from "react"
import { useBillStats } from "@/hooks/useBillStats"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChartCard } from "@/components/charts/PieChartCard"
import { LineChartCard } from "@/components/charts/LineChartCard"
import { BarChartCard } from "@/components/charts/BarChartCard"
import { BalanceBarCard } from "@/components/charts/BalanceBarCard"
import CreateBillDialog from "@/components/bills/CreateBillDialog"
import Heatmap from "@/components/charts/Heatmap"
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import { zhCN } from "date-fns/locale"

function getGreeting() { const h = new Date().getHours(); if (h<12) return "上午好"; if (h<17) return "下午好"; return "晚上好" }

export default function Home() {
  const { bills, loading, total, monthIncome, monthExpense, yearIncome, yearExpense } = useBillStats()
  const [createOpen, setCreateOpen] = useState(false)
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const yearStr = format(new Date(), "yyyy")

  // Helper: sum bills by type and date range
  const sum = (type: "income"|"expense", from?: Date, to?: Date) =>
    bills.filter(b => b.type===type && (!from || b.date>=format(from,"yyyy-MM-dd")) && (!to || b.date<=format(to,"yyyy-MM-dd"))).reduce((a,b) => a+b.amount,0)

  // Month stats
  const stats = useMemo(() => ({
    mi: monthIncome,
    me: monthExpense,
    bal: monthIncome - monthExpense,
    cnt: total
  }), [monthIncome, monthExpense, total])

  // Today
  const todayPie = useMemo(() => [{name:"收入",value:sum("income")},{name:"支出",value:sum("expense")}].map(d=>({...d,value:bills.filter(b=>b.type===(d.name==="收入"?"income":"expense")&&b.date===todayStr).reduce((a,b)=>a+b.amount,0)})), [bills,todayStr])
  const todayExpCats = useMemo(() => {const m=new Map<string,number>();bills.filter(b=>b.type==="expense"&&b.date===todayStr).forEach(b=>m.set(b.category,(m.get(b.category)||0)+b.amount));return Array.from(m.entries()).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value)},[bills,todayStr])

  // Total ratio pie
  const totalRatio = useMemo(() => [{name:"收入",value:bills.filter(b=>b.type==="income").reduce((a,b)=>a+b.amount,0)},{name:"支出",value:bills.filter(b=>b.type==="expense").reduce((a,b)=>a+b.amount,0)}],[bills])

  // Category pies
  const expCats = useMemo(() => {const m=new Map<string,number>();bills.filter(b=>b.type==="expense").forEach(b=>m.set(b.category,(m.get(b.category)||0)+b.amount));return Array.from(m.entries()).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value)},[bills])
  const incCats = useMemo(() => {const m=new Map<string,number>();bills.filter(b=>b.type==="income").forEach(b=>m.set(b.category,(m.get(b.category)||0)+b.amount));return Array.from(m.entries()).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value)},[bills])

  // 7-day trend
  const recent7 = useMemo(() => Array.from({length:7},(_,i)=>{const d=subDays(new Date(),6-i);const k=format(d,"yyyy-MM-dd");return {date:format(d,"M/d",{locale:zhCN}),income:bills.filter(b=>b.type==="income"&&b.date===k).reduce((a,b)=>a+b.amount,0),expense:bills.filter(b=>b.type==="expense"&&b.date===k).reduce((a,b)=>a+b.amount,0)}}),[bills])

  // 7-day net balance
  const balance7 = useMemo(() => Array.from({length:7},(_,i)=>{const d=subDays(new Date(),6-i);const k=format(d,"yyyy-MM-dd");const inc=bills.filter(b=>b.type==="income"&&b.date===k).reduce((a,b)=>a+b.amount,0);const exp=bills.filter(b=>b.type==="expense"&&b.date===k).reduce((a,b)=>a+b.amount,0);return {name:format(d,"M/d"),value:inc-exp}}),[bills])

  // 30-day trend
  const recent30 = useMemo(() => {
    const today=new Date();const all=Array.from({length:30},(_,i)=>subDays(today,29-i))
    const dm=new Map<string,{income:number;expense:number}>()
    bills.forEach(b=>{if(!dm.has(b.date))dm.set(b.date,{income:0,expense:0});const e=dm.get(b.date)!;b.type==="income"?e.income+=b.amount:e.expense+=b.amount})
    return all.map(d=>{const k=format(d,"yyyy-MM-dd");const x=dm.get(k);return {date:format(d,"M/d"),income:x?.income||0,expense:x?.expense||0}})
  },[bills])

  // 5-week comparison
  const weekly5 = useMemo(() => {
    const today=new Date()
    return Array.from({length:5},(_,i)=>{const ws=startOfWeek(subWeeks(today,4-i),{locale:zhCN});const we=endOfWeek(ws,{locale:zhCN});const sk=format(ws,"yyyy-MM-dd");const ek=format(we,"yyyy-MM-dd");return {name:`${format(ws,"M/d")}`,income:bills.filter(b=>b.type==="income"&&b.date>=sk&&b.date<=ek).reduce((a,b)=>a+b.amount,0),expense:bills.filter(b=>b.type==="expense"&&b.date>=sk&&b.date<=ek).reduce((a,b)=>a+b.amount,0)}})
  },[bills])

  // 3-month monthly balance
  const monthly3 = useMemo(() => {
    const today=new Date()
    return Array.from({length:3},(_,i)=>{const ms=startOfMonth(subMonths(today,2-i));const me=endOfMonth(ms);const sk=format(ms,"yyyy-MM-dd");const ek=format(me,"yyyy-MM-dd");const inc=bills.filter(b=>b.type==="income"&&b.date>=sk&&b.date<=ek).reduce((a,b)=>a+b.amount,0);const exp=bills.filter(b=>b.type==="expense"&&b.date>=sk&&b.date<=ek).reduce((a,b)=>a+b.amount,0);return {date:format(ms,"M月"),income:inc,expense:exp}})
  },[bills])

  // Filtered heatmaps
  const incomeBills = useMemo(() => bills.filter(b => b.type === "income"), [bills])
  const expenseBills = useMemo(() => bills.filter(b => b.type === "expense"), [bills])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {/* Header */}
      <div className="pt-4 md:pt-8 flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{getGreeting()}</h1><p className="text-muted-foreground mt-1 text-sm">{format(new Date(),"yyyy年M月d日 EEEE",{locale:zhCN})}</p></div>
        <Button onClick={()=>setCreateOpen(true)}><i data-lucide="plus" className="size-4 mr-1.5"></i>新建记账</Button>
      </div>

      {/* Row 1: Month summary + Year totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {l:"本月收入",v:stats.mi,c:"text-emerald-600"},
          {l:"本月支出",v:stats.me,c:"text-red-500"},
          {l:"本月结余",v:stats.bal,c:stats.bal>=0?"text-foreground":"text-red-500"},
          {l:"总记录数",v:stats.cnt,f:0},
          {l:`${yearStr}总收入`,v:yearIncome,c:"text-emerald-600",s:true},
          {l:`${yearStr}总支出`,v:yearExpense,c:"text-red-500",s:true},
        ].map(s=><Card key={s.l} className={s.s?"md:col-span-1":""}><CardContent className="py-3 px-4"><p className="text-xs text-muted-foreground mb-1">{s.l}</p><p className={`text-base font-bold ${s.c||""}`}>{s.f===0?s.v:`¥${Number(s.v).toFixed(2)}`}</p></CardContent></Card>)}
      </div>

      {/* Row 2: Today pies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="py-5"><PieChartCard title="今天收入 vs 支出" data={todayPie} emptyMessage="今天暂无记录"/></CardContent></Card>
        <Card><CardContent className="py-5"><PieChartCard title="今天支出分类占比" data={todayExpCats} emptyMessage="今天暂无支出"/></CardContent></Card>
      </div>

      {/* Row 3: 7-day trend + 7-day balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="py-5"><LineChartCard title="近7天收支趋势" data={recent7} emptyMessage="暂无记录"/></CardContent></Card>
        <Card><CardContent className="py-5"><BalanceBarCard title="近7天每天结余" data={balance7} emptyMessage="暂无记录"/></CardContent></Card>
      </div>

      {/* Row 4: 30-day trend */}
      <Card><CardContent className="py-5"><LineChartCard title="近30天收支趋势" data={recent30} emptyMessage="暂无记录"/></CardContent></Card>

      {/* Row 5: Category pies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="py-5"><PieChartCard title="全部支出分类占比" data={expCats} emptyMessage="暂无支出记录"/></CardContent></Card>
        <Card><CardContent className="py-5"><PieChartCard title="全部收入分类占比" data={incCats} emptyMessage="暂无收入记录"/></CardContent></Card>
      </div>

      {/* Row 6: Total ratio + Weekly bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="py-5"><PieChartCard title="总收入 vs 总支出" data={totalRatio} emptyMessage="暂无记录"/></CardContent></Card>
        <Card><CardContent className="py-5"><BarChartCard title="近5周收支对比" data={weekly5} emptyMessage="暂无记录"/></CardContent></Card>
      </div>

      {/* Row 7: 3-month balance line */}
      <Card><CardContent className="py-5"><LineChartCard title="近3个月每月结余" data={monthly3} emptyMessage="暂无记录"/></CardContent></Card>

      {/* Row 8: Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="py-5"><h3 className="text-sm font-medium text-muted-foreground mb-3">收入热力图</h3><Heatmap bills={incomeBills}/></CardContent></Card>
        <Card><CardContent className="py-5"><h3 className="text-sm font-medium text-muted-foreground mb-3">支出热力图</h3><Heatmap bills={expenseBills}/></CardContent></Card>
      </div>

      <CreateBillDialog open={createOpen} onOpenChange={setCreateOpen}/>
    </div>
  )
}
