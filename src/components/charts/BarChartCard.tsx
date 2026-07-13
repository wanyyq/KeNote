import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts"

interface Props { title: string; data: { name: string; income: number; expense: number }[]; emptyMessage?: string }

const INCOME_COLOR = "#10B981"
const EXPENSE_COLOR = "#EF4444"

export function BarChartCard({ title, data, emptyMessage = "暂无数据" }: Props) {
  const has = data.some(d => d.income > 0 || d.expense > 0)
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      {has ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={45} tickFormatter={v => `¥${v}`} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} formatter={(v: number) => [`¥${v.toFixed(2)}`, ""]} />
              <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} name="收入" />
              <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <div className="h-52 flex items-center justify-center"><p className="text-sm text-muted-foreground">{emptyMessage}</p></div>}
    </div>
  )
}
