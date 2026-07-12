import { useMemo, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChartCard } from '@/components/charts/PieChartCard'
import { LineChartCard } from '@/components/charts/LineChartCard'
import CreateBillDialog from '@/components/bills/CreateBillDialog'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '上午好'
  if (hour < 17) return '下午好'
  return '晚上好'
}

export default function Home() {
  const { bills } = useStore()
  const [createOpen, setCreateOpen] = useState(false)
  const greeting = getGreeting()

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const monthlyIncome = bills.filter((b) => b.type === 'income' && new Date(b.date) >= monthStart && new Date(b.date) <= monthEnd).reduce((sum, b) => sum + b.amount, 0)
    const monthlyExpense = bills.filter((b) => b.type === 'expense' && new Date(b.date) >= monthStart && new Date(b.date) <= monthEnd).reduce((sum, b) => sum + b.amount, 0)
    return { monthlyIncome, monthlyExpense, monthlyBalance: monthlyIncome - monthlyExpense, billCount: bills.length }
  }, [bills])

  const expenseCategories = useMemo(() => {
    const map = new Map<string, number>()
    bills.filter((b) => b.type === 'expense').forEach((b) => map.set(b.category, (map.get(b.category) || 0) + b.amount))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [bills])

  const incomeCategories = useMemo(() => {
    const map = new Map<string, number>()
    bills.filter((b) => b.type === 'income').forEach((b) => map.set(b.category, (map.get(b.category) || 0) + b.amount))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [bills])

  const recentTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dateKey = format(date, 'yyyy-MM-dd')
      const income = bills.filter((b) => b.type === 'income' && b.date === dateKey).reduce((s, b) => s + b.amount, 0)
      const expense = bills.filter((b) => b.type === 'expense' && b.date === dateKey).reduce((s, b) => s + b.amount, 0)
      return { date: format(date, 'M/d', { locale: zhCN }), income, expense }
    })
  }, [bills])

  const monthlyTrend = useMemo(() => {
    const today = new Date()
    const startDate = subDays(today, 29)
    const allDays = eachDayOfInterval({ start: startDate, end: today })
    const dayMap = new Map<string, { income: number; expense: number }>()
    bills.forEach((bill) => {
      if (!dayMap.has(bill.date)) dayMap.set(bill.date, { income: 0, expense: 0 })
      const entry = dayMap.get(bill.date)!
      if (bill.type === 'income') entry.income += bill.amount; else entry.expense += bill.amount
    })
    return allDays.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      const existing = dayMap.get(key)
      return { date: format(day, 'M/d'), income: existing?.income || 0, expense: existing?.expense || 0 }
    })
  }, [bills])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="pt-4 md:pt-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{greeting}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })}</p>
        </div>
        <Button variant="outline" size="lg" className="rounded-full px-6 border-2 border-foreground/15 hover:border-foreground/30 hover:bg-accent transition-all text-sm font-medium shadow-none" onClick={() => setCreateOpen(true)}>
          <i data-lucide="plus" className="w-4 h-4 mr-2"></i>
          开始记账
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '本月收入', value: stats.monthlyIncome, color: 'text-emerald-600' },
          { label: '本月支出', value: stats.monthlyExpense, color: 'text-red-500' },
          { label: '本月结余', value: stats.monthlyBalance, color: stats.monthlyBalance >= 0 ? 'text-foreground' : 'text-red-500' },
          { label: '总记录数', value: stats.billCount, color: '', format: false },
        ].map((s) => (
          <Card key={s.label} className="shadow-none border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>
                {s.format === false ? s.value : `¥${Number(s.value).toFixed(2)}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none border"><CardContent className="p-5"><PieChartCard title="支出分类占比" data={expenseCategories} emptyMessage="暂无支出记录" /></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-5"><PieChartCard title="收入分类占比" data={incomeCategories} emptyMessage="暂无收入记录" /></CardContent></Card>
      </div>
      <Card className="shadow-none border"><CardContent className="p-5"><LineChartCard title="近7天收支趋势" data={recentTrend} emptyMessage="暂无记录" /></CardContent></Card>
      <Card className="shadow-none border"><CardContent className="p-5"><LineChartCard title="近30天收支趋势" data={monthlyTrend} emptyMessage="暂无记录" /></CardContent></Card>
      <CreateBillDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
