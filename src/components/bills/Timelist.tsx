import { useMemo } from 'react'
import type { Bill } from '@/store/useStore'
import { getCategoryIcon } from '@/store/useStore'
import { Card, CardContent } from '@/components/ui/card'
import CategoryIcon from '@/components/bills/CategoryIcon'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TimelistProps { bills: Bill[]; onDelete: (id: string) => void; emptyMessage?: string }

export default function Timelist({ bills, onDelete, emptyMessage = '暂无账单记录' }: TimelistProps) {
  const groupedBills = useMemo(() => {
    const groups = new Map<string, Bill[]>()
    bills.forEach((bill) => {
      if (!groups.has(bill.date)) groups.set(bill.date, [])
      groups.get(bill.date)!.push(bill)
    })
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [bills])

  if (groupedBills.length === 0) {
    return (
      <Card className="shadow-none border">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          <i data-lucide="file-text" className="w-10 h-10 text-muted-foreground mb-3"></i>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  const formatDateLabel = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      const today = format(new Date(), 'yyyy-MM-dd')
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
      const weekDay = format(date, 'EEEE', { locale: zhCN })
      if (dateStr === today) return `今天 ${weekDay}`
      if (dateStr === yesterday) return `昨天 ${weekDay}`
      return format(date, 'M月d日', { locale: zhCN }) + ` ${weekDay}`
    } catch { return dateStr }
  }

  const getDailyTotal = (dayBills: Bill[]) => {
    const income = dayBills.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)
    const expense = dayBills.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
    return { income, expense }
  }

  return (
    <div className="space-y-4">
      {groupedBills.map(([dateStr, dayBills]) => {
        const dayTotal = getDailyTotal(dayBills)
        return (
          <div key={dateStr}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-medium text-muted-foreground">{formatDateLabel(dateStr)}</h3>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {dayTotal.income > 0 && <span className="text-emerald-600">收 ¥{dayTotal.income.toFixed(2)}</span>}
                {dayTotal.expense > 0 && <span className="text-red-500">支 ¥{dayTotal.expense.toFixed(2)}</span>}
              </div>
            </div>
            <div className="space-y-2">
              {dayBills.map((bill) => (
                <Card key={bill.id} className="group shadow-none border hover:border-border/80 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${bill.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      <CategoryIcon iconName={getCategoryIcon(bill.category, bill.type)} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bill.category}</p>
                      {bill.note && <p className="text-xs text-muted-foreground truncate">{bill.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold text-sm ${bill.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {bill.type === 'income' ? '+' : '-'}¥{bill.amount.toFixed(2)}
                      </p>
                    </div>
                    <button onClick={() => onDelete(bill.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 shrink-0" title="删除">
                      <i data-lucide="trash" className="w-[14px] h-[14px]"></i>
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
