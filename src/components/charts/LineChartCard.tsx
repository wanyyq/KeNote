import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LineChartCardProps {
  title: string
  data: { date: string; income: number; expense: number }[]
  emptyMessage?: string
}

const INCOME_COLOR = '#10B981'
const EXPENSE_COLOR = '#EF4444'

export function LineChartCard({ title, data, emptyMessage = '暂无数据' }: LineChartCardProps) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0)

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      {hasData ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                width={45}
                tickFormatter={(v: number) => `¥${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                formatter={(value: number) => [`¥${value.toFixed(2)}`, '']}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke={INCOME_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: INCOME_COLOR }}
                name="收入"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke={EXPENSE_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: EXPENSE_COLOR }}
                name="支出"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-52 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}
