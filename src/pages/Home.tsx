import { useMemo, useState } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChartCard } from "@/components/charts/PieChartCard"
import { LineChartCard } from "@/components/charts/LineChartCard"
import CreateBillDialog from "@/components/bills/CreateBillDialog"
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { zhCN } from "date-fns/locale"

function getGreeting() { const h = new Date().getHours(); if (h<12) return "上午好"; if (h<17) return "下午好"; return "晚上好" }

export default function Home() {
  const { bills } = useStore()
  const [createOpen, setCreateOpen] = useState(false)

  const stats = useMemo(() => {
    const now = new Date(); const s = startOfMonth(now); const e = endOfMonth(now)
    const mi = bills.filter(b => b.type==="income" && new Date(b.date)>=s && new Date(b.date)<=e).reduce((a,b) => a+b.amount,0)
    const me = bills.filter(b => b.type==="expense" && new Date(b.date)>=s && new Date(b.date)<=e).reduce((a,b) => a+b.amount,0)
    return { mi, me, bal: mi-me, cnt: bills.length }
  }, [bills])

  const expCats = useMemo(() => {
    const m = new Map<string,number>(); bills.filter(b=>b.type==="expense").forEach(b=>m.set(b.category,(m.get(b.category)||0)+b.amount))
    return Array.from(m.entries()).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value)
  }, [bills])
  const incCats = useMemo(() => {
    const m = new Map<string,number>(); bills.filter(b=>b.type==="income").forEach(b=>m.set(b.category,(m.get(b.category)||0)+b.amount))
    return Array.from(m.entries()).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value)
  }, [bills])
  const recentTrend = useMemo(() => Array.from({length:7},(_,i)=>{
    const d=subDays(new Date(),6-i); const k=format(d,"yyyy-MM-dd")
    return {date:format(d,"M/d",{locale:zhCN}),income:bills.filter(b=>b.type==="income"&&b.date===k).reduce((a,b)=>a+b.amount,0),expense:bills.filter(b=>b.type==="expense"&&b.date===k).reduce((a,b)=>a+b.amount,0)}
  }),[bills])
  const monthlyTrend = useMemo(() => {
    const t=new Date(); const sd=subDays(t,29); const all=eachDayOfInterval({start:sd,end:t})
    const dm=new Map<string,{income:number;expense:number}>()
    bills.forEach(b=>{if(!dm.has(b.date))dm.set(b.date,{income:0,expense:0}); const e=dm.get(b.date)!; b.type==="income"?e.income+=b.amount:e.expense+=b.amount})
    return all.map(d=>{const k=format(d,"yyyy-MM-dd"); const x=dm.get(k); return {date:format(d,"M/d"),income:x?.income||0,expense:x?.expense||0}})
  },[bills])

  const cards = [
    {label:"本月收入",v:stats.mi,c:"text-emerald-600"},
    {label:"本月支出",v:stats.me,c:"text-red-500"},
    {label:"本月结余",v:stats.bal,c:stats.bal>=0?"text-foreground":"text-red-500"},
    {label:"总记录数",v:stats.cnt,c:"",f:false},
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="pt-4 md:pt-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{getGreeting()}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{format(new Date(),"yyyy年M月d日 EEEE",{locale:zhCN})}</p>
        </div>
        <Button onClick={()=>setCreateOpen(true)}><i data-lucide="plus" className="size-4 mr-1.5"></i>开始记账</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(s=><Card key={s.label}><CardContent className="py-4"><p className="text-xs text-muted-foreground mb-1">{s.label}</p><p className={`text-lg font-bold ${s.c}`}>{s.f===false?s.v:`¥${Number(s.v).toFixed(2)}`}</p></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="py-5"><PieChartCard title="支出分类占比" data={expCats} emptyMessage="暂无支出记录"/></CardContent></Card>
        <Card><CardContent className="py-5"><PieChartCard title="收入分类占比" data={incCats} emptyMessage="暂无收入记录"/></CardContent></Card>
      </div>
      <Card><CardContent className="py-5"><LineChartCard title="近7天收支趋势" data={recentTrend} emptyMessage="暂无记录"/></CardContent></Card>
      <Card><CardContent className="py-5"><LineChartCard title="近30天收支趋势" data={monthlyTrend} emptyMessage="暂无记录"/></CardContent></Card>
      <CreateBillDialog open={createOpen} onOpenChange={setCreateOpen}/>
    </div>
  )
}
