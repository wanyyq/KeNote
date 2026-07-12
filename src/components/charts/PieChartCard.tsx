import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6']

interface PieChartCardProps {
  title: string
  data: { name: string; value: number }[]
  emptyMessage?: string
}

export function PieChartCard({ title, data, emptyMessage = '暂无数据' }: PieChartCardProps) {
  const hasData = data.some((d) => d.value > 0)

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      {hasData ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
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
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
            </RechartsPieChart>
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
