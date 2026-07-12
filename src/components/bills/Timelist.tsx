import { useMemo, useState } from "react"
import type { Bill } from "@/store/useStore"
import { getCategoryIcon } from "@/store/useStore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import CategoryIcon from "@/components/bills/CategoryIcon"
import { format, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"

interface P { bills: Bill[]; onDelete: (id: string) => void; emptyMessage?: string }

export default function Timelist({ bills, onDelete, emptyMessage = "暂无账单记录" }: P) {
  const [delId, setDelId] = useState<string | null>(null)
  const bt = delId ? bills.find(b => b.id === delId) : null

  const g = useMemo(() => {
    const m = new Map<string, Bill[]>()
    bills.forEach(b => { if (!m.has(b.date)) m.set(b.date, []); m.get(b.date)!.push(b) })
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [bills])

  if (g.length === 0) return <Card><CardContent className="py-8 flex flex-col items-center justify-center min-h-[200px]"><i data-lucide="file-text" className="size-10 text-muted-foreground mb-3"></i><p className="text-muted-foreground text-sm">{emptyMessage}</p></CardContent></Card>

  const fmt = (ds: string) => { try { const d = parseISO(ds); const t = format(new Date(), "yyyy-MM-dd"); const y = format(new Date(Date.now() - 86400000), "yyyy-MM-dd"); const w = format(d, "EEEE", { locale: zhCN }); if (ds === t) return `今天 ${w}`; if (ds === y) return `昨天 ${w}`; return format(d, "M月d日", { locale: zhCN }) + ` ${w}` } catch { return ds } }
  const dt = (bs: Bill[]) => { const i = bs.filter(b => b.type === "income").reduce((a, b) => a + b.amount, 0); const e = bs.filter(b => b.type === "expense").reduce((a, b) => a + b.amount, 0); return { i, e } }

  return (
    <>
      <div className="space-y-4">
        {g.map(([ds, bs]) => {
          const t = dt(bs)
          return <div key={ds}>
            <div className="flex items-center justify-between mb-2 px-1"><h3 className="text-sm font-medium text-muted-foreground">{fmt(ds)}</h3><div className="flex gap-3 text-xs text-muted-foreground">{t.i > 0 && <span className="text-emerald-600">收 ¥{t.i.toFixed(2)}</span>}{t.e > 0 && <span className="text-red-500">支 ¥{t.e.toFixed(2)}</span>}</div></div>
            <div className="space-y-2">
              {bs.map(b => (
                <Card key={b.id} className="group hover:border-border/80 transition-colors">
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className={`size-9 rounded-md flex items-center justify-center shrink-0 ${b.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}><CategoryIcon iconName={getCategoryIcon(b.category, b.type)} size={18} /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{b.category}</p>{b.note && <p className="text-xs text-muted-foreground truncate">{b.note}</p>}</div>
                    <div className="text-right shrink-0"><p className={`font-semibold text-sm ${b.type === "income" ? "text-emerald-600" : "text-red-500"}`}>{b.type === "income" ? "+" : "-"}¥{b.amount.toFixed(2)}</p></div>
                    <button onClick={() => setDelId(b.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 shrink-0"><i data-lucide="trash" className="size-3.5"></i></button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        })}
      </div>
      <AlertDialog open={delId !== null} onOpenChange={o => { if (!o) setDelId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认删除账单</AlertDialogTitle><AlertDialogDescription>{bt ? `确定要删除"${bt.category}" ¥${bt.amount.toFixed(2)} 吗？此操作不可撤销。` : "确定要删除这条账单吗？此操作不可撤销。"}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => { if (delId) { onDelete(delId); setDelId(null) } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
