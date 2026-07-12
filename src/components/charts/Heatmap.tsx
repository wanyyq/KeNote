import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Bill } from '@/store/useStore'

interface HeatmapProps {
  bills: Bill[]
}

function getHeatmapColor(amount: number, maxAmount: number): string {
  if (amount === 0) return 'bg-gray-100'
  const ratio = Math.min(amount / maxAmount, 1)
  if (ratio <= 0.2) return 'bg-emerald-100'
  if (ratio <= 0.4) return 'bg-emerald-200'
  if (ratio <= 0.6) return 'bg-emerald-400'
  if (ratio <= 0.8) return 'bg-emerald-600'
  return 'bg-emerald-800'
}

export default function Heatmap({ bills }: HeatmapProps) {
  const today = new Date()
  const yearStart = startOfYear(today)
  const yearEnd = endOfYear(today)
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd })
  const startDay = getDay(yearStart)

  // Aggregate bills by date (absolute value)
  const dailyAmounts = useMemo(() => {
    const map = new Map<string, number>()
    bills.forEach((bill) => {
      const dateKey = bill.date
      const current = map.get(dateKey) || 0
      map.set(dateKey, current + Math.abs(bill.amount))
    })
    return map
  }, [bills])

  const maxAmount = useMemo(() => {
    let max = 0
    dailyAmounts.forEach((v) => { if (v > max) max = v })
    return max
  }, [dailyAmounts])

  const weeks: (Date | null)[][] = []
  let currentWeek: (Date | null)[] = []

  // Pad start of year
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null)
  }

  allDays.forEach((day) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  })

  // Pad end of year
  while (currentWeek.length < 7) {
    currentWeek.push(null)
  }
  weeks.push(currentWeek)

  const months = Array.from({ length: 12 }, (_, i) =>
    format(new Date(today.getFullYear(), i, 1), 'M月', { locale: zhCN })
  )

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-[700px]">
        {/* Month labels */}
        <div className="flex gap-0.5 ml-8 mb-1">
          {months.map((m, i) => (
            <div
              key={m}
              className="text-[10px] text-muted-foreground"
              style={{ width: `${100 / 12}%`, minWidth: 0 }}
            >
              {m}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {['', '一', '', '三', '', '五', ''].map((d, i) => (
              <div key={i} className="text-[10px] text-muted-foreground w-6 h-3 flex items-center justify-end pr-1">
                {d}
              </div>
            ))}
          </div>
          {/* Week columns */}
          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => {
                  if (!day) return <div key={`${wi}-${di}`} className="w-3 h-3 rounded-sm" />
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const amount = dailyAmounts.get(dateKey) || 0
                  return (
                    <div
                      key={`${wi}-${di}`}
                      className={cn(
                        'w-3 h-3 rounded-sm transition-colors',
                        getHeatmapColor(amount, maxAmount)
                      )}
                      title={`${dateKey}: ¥${amount.toFixed(2)}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1 ml-8 mt-2">
          <span className="text-[10px] text-muted-foreground">少</span>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <div
              key={ratio}
              className={cn('w-3 h-3 rounded-sm', getHeatmapColor(ratio * maxAmount || 1, maxAmount || 1))}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">多</span>
        </div>
      </div>
    </div>
  )
}
