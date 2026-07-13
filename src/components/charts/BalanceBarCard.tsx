import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts"

interface Props { title: string; data: { name: string; value: number }[]; emptyMessage?: string; color?: string }

export function BalanceBarCard({ title, data, emptyMessage = "暂无数据", color = "#3B82F6" }: Props) {
  const has = data.some(d => Math.abs(d.value) > 0)
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      {has ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <ReferenceLine y={0} stroke="#d4d4d8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={45} tickFormatter={v => `¥${v}`} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`¥${v.toFixed(2)}`, ""]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.value >= 0 ? "#10B981" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : <div className="h-52 flex items-center justify-center"><p className="text-sm text-muted-foreground">{emptyMessage}</p></div>}
    </div>
  )
}
