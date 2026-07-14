import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

/* ---------- types & constants ---------- */

type BtnKey = 'C' | '⌫' | '%' | '÷' | '7' | '8' | '9' | '×' | '4' | '5' | '6' | '-' | '1' | '2' | '3' | '+' | '0' | '.' | '='

interface HistoryEntry { expr: string; result: string }

const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'])
const OPS = new Set(['+', '-', '×', '÷', '%'])

const KEYBOARD: { key: BtnKey; span: 1 | 2; variant: "secondary" | "default" }[] = [
  { key: 'C', span: 1, variant: 'default' },
  { key: '⌫', span: 1, variant: 'secondary' },
  { key: '%', span: 1, variant: 'secondary' },
  { key: '÷', span: 1, variant: 'secondary' },
  { key: '7', span: 1, variant: 'secondary' },
  { key: '8', span: 1, variant: 'secondary' },
  { key: '9', span: 1, variant: 'secondary' },
  { key: '×', span: 1, variant: 'secondary' },
  { key: '4', span: 1, variant: 'secondary' },
  { key: '5', span: 1, variant: 'secondary' },
  { key: '6', span: 1, variant: 'secondary' },
  { key: '-', span: 1, variant: 'secondary' },
  { key: '1', span: 1, variant: 'secondary' },
  { key: '2', span: 1, variant: 'secondary' },
  { key: '3', span: 1, variant: 'secondary' },
  { key: '+', span: 1, variant: 'secondary' },
  { key: '0', span: 2, variant: 'secondary' },
  { key: '.', span: 1, variant: 'secondary' },
  { key: '=', span: 1, variant: 'default' },
]

/* ---------- helpers ---------- */

function compute(expr: string): string {
  if (!expr || expr === '0') return '0'
  const s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100')
  if (!/^[\d.+\-*/()e]+$/.test(s)) throw new Error('invalid')
  try {
    const r = new Function(`return (${s})`)()
    if (typeof r !== 'number' || !isFinite(r)) throw new Error('div0')
    return String(Math.round(r * 1e10) / 1e10)
  } catch { throw new Error('error') }
}

function lastNumToken(s: string): string {
  let i = s.length - 1
  while (i >= 0 && DIGITS.has(s[i])) i--
  return s.slice(i + 1)
}

function endsWithOp(s: string): boolean {
  return s.length > 0 && OPS.has(s[s.length - 1])
}

function todayStr(): string { return new Date().toISOString().slice(0, 10) }
function monthStart(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }

/* ---------- component ---------- */

export default function Calculator() {
  const { bills } = useStore()

  const [display, setDisplay] = useState('0')
  const displayRef = useRef(display)
  displayRef.current = display

  const [error, setError] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [panel, setPanel] = useState<'none' | 'history' | 'import'>('none')

  const [impStart, setImpStart] = useState(monthStart())
  const [impEnd, setImpEnd] = useState(todayStr())
  const [impType, setImpType] = useState<'all' | 'income' | 'expense'>('expense')
  const [impCategory, setImpCategory] = useState('all')

  const [calOpenStart, setCalOpenStart] = useState(false)
  const [calOpenEnd, setCalOpenEnd] = useState(false)

  const historyEndRef = useRef<HTMLDivElement>(null)

  // keyboard support — no longer blocked by import panel
  useEffect(() => {
    const map: Record<string, BtnKey> = {
      Escape: 'C', Backspace: '⌫', Delete: 'C',
      '%': '%', '/': '÷', '*': '×', '-': '-', '+': '+',
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': '.', ',': '.', '=': '=', Enter: '=',
    }
    const h = (e: KeyboardEvent) => {
      const key = map[e.key]
      if (key) { e.preventDefault(); handlePress(key) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => { if (panel === 'history') historyEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, panel])

  // ---- import stats ----
  const importResult = (() => {
    const start = new Date(impStart)
    const end = new Date(impEnd + 'T23:59:59')
    let filtered = bills.filter(b => {
      const d = new Date(b.date || new Date(b.createdAt).toISOString().slice(0, 10))
      return d >= start && d <= end
    })
    if (impType !== 'all') filtered = filtered.filter(b => b.type === impType)
    if (impCategory !== 'all') filtered = filtered.filter(b => b.category === impCategory)
    const income = filtered.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
    const expense = filtered.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
    return { income, expense, balance: income - expense, count: filtered.length }
  })()

  const doImport = () => {
    const val = impType === 'income' ? importResult.income : impType === 'expense' ? importResult.expense : importResult.income + importResult.expense
    if (val === 0 || importResult.count === 0) return
    displayRef.current = String(val)
    setDisplay(String(val))
    setPanel('none')
  }

  // ---- button handler — uses ref for latest display, not reliant on closure ----
  const handlePress = useCallback((key: BtnKey) => {
    setError(false)

    if (key === 'C') { setDisplay('0'); return }
    if (key === '⌫') { setDisplay(p => p.length <= 1 ? '0' : p.slice(0, -1)); return }
    if (key === '=') {
      try {
        const result = compute(displayRef.current)
        setHistory(h => [{ expr: displayRef.current, result }, ...h.slice(0, 49)])
        setDisplay(result)
      } catch { setDisplay('错误'); setError(true) }
      return
    }
    if (OPS.has(key)) {
      setDisplay(p => {
        if (error) return key
        if (p === '0') return '0' + key
        if (endsWithOp(p) && !p.endsWith('%')) return p.slice(0, -1) + key
        return p + key
      })
      return
    }
    setDisplay(p => {
      if (error) return key
      if (key === '.' && lastNumToken(p).includes('.')) return p
      if (p === '0') return key === '.' ? '0.' : key
      return p + key
    })
  }, [error])

  const dx = display.length
  const fontSize = dx > 18 ? 'text-2xl' : dx > 13 ? 'text-3xl' : dx > 8 ? 'text-4xl' : 'text-5xl'

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-4 pt-4 pb-2 select-none font-sans">
      {/* Display */}
      <div className="flex-1 flex flex-col justify-end mb-4 min-h-0">
        <div className={cn(
          "text-right font-medium transition-all duration-100 px-2",
          "text-foreground break-all leading-tight tracking-tight",
          error && "text-destructive", fontSize
        )}>
          {error ? '错误' : display}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2">
        {KEYBOARD.map((btn) => (
          <Button
            key={btn.key}
            variant={btn.variant}
            size="lg"
            className={cn(
              "h-13 text-lg font-medium rounded-xl transition-colors",
              !Number.isNaN(Number(btn.key)) || btn.key === '.' ? "bg-secondary/80 hover:bg-secondary" : "",
              btn.key === '=' && "bg-primary text-primary-foreground hover:bg-primary/90 text-xl",
              btn.key === 'C' && "bg-destructive/10 text-destructive hover:bg-destructive/20",
              btn.span === 2 && "col-span-2"
            )}
            onClick={() => handlePress(btn.key)}
          >
            {btn.key}
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mt-3 mb-2 shrink-0">
        <Button
          variant="ghost" size="sm"
          className={cn("text-xs gap-1 rounded-lg flex-1", panel === 'history' && "bg-accent")}
          onClick={() => setPanel(panel === 'history' ? 'none' : 'history')}
        ><i data-lucide="history" className="size-3.5"></i>历史</Button>
        <Button
          variant="ghost" size="sm"
          className={cn("text-xs gap-1 rounded-lg flex-1", panel === 'import' && "bg-accent")}
          onClick={() => setPanel(panel === 'import' ? 'none' : 'import')}
        ><i data-lucide="download" className="size-3.5"></i>查账</Button>
      </div>

      {/* History Panel */}
      {panel === 'history' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-t pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">计算历史 ({history.length})</span>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setHistory([])}>清空</Button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">暂无历史</div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {history.map((entry, i) => (
                <button
                  key={i}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
                  onClick={() => { setDisplay(entry.result); setPanel('none') }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground truncate">{entry.expr}</div>
                    <div className="text-sm font-medium">{entry.result}</div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded" onClick={e => { e.stopPropagation(); setHistory(h => h.filter((_, j) => j !== i)) }}>
                    <i data-lucide="x" className="size-3 text-muted-foreground"></i>
                  </button>
                </button>
              ))}
              <div ref={historyEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Import Panel */}
      {panel === 'import' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-t pt-2">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">开始</label>
                <div className="flex gap-1">
                  <Input type="date" value={impStart} onChange={e => setImpStart(e.target.value)} className="h-8 text-xs flex-1" />
                  <Popover open={calOpenStart} onOpenChange={setCalOpenStart}>
                    <PopoverTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 shrink-0"><i data-lucide="calendar" className="size-3.5"></i></Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={new Date(impStart)} onSelect={d => { if (d) { setImpStart(format(d, 'yyyy-MM-dd')); setCalOpenStart(false) } }} initialFocus /></PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">结束</label>
                <div className="flex gap-1">
                  <Input type="date" value={impEnd} onChange={e => setImpEnd(e.target.value)} className="h-8 text-xs flex-1" />
                  <Popover open={calOpenEnd} onOpenChange={setCalOpenEnd}>
                    <PopoverTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 shrink-0"><i data-lucide="calendar" className="size-3.5"></i></Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={new Date(impEnd)} onSelect={d => { if (d) { setImpEnd(format(d, 'yyyy-MM-dd')); setCalOpenEnd(false) } }} initialFocus /></PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">类型</label>
                <Select value={impType} onValueChange={v => setImpType(v as typeof impType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="income">收入</SelectItem><SelectItem value="expense">支出</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">分类</label>
                <Select value={impCategory} onValueChange={setImpCategory}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    {[...new Set(bills.filter(b => impType === 'all' || b.type === impType).map(b => b.category))].filter(Boolean).sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">收入</span><span className="font-medium text-emerald-600">+{importResult.income.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">支出</span><span className="font-medium text-red-500">-{importResult.expense.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-1.5 mt-1.5"><span className="text-muted-foreground">结余</span><span className={cn("font-medium", importResult.balance >= 0 ? "text-emerald-600" : "text-red-500")}>{importResult.balance >= 0 ? '+' : ''}{importResult.balance.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">笔数</span><span className="font-medium">{importResult.count}</span></div>
            </div>
            <Button className="w-full h-9 text-sm" disabled={importResult.count === 0} onClick={doImport}>
              {impType === 'income' ? `导入收入 ¥${importResult.income.toFixed(2)}` :
               impType === 'expense' ? `导入支出 ¥${importResult.expense.toFixed(2)}` :
               `导入合计 ¥${(importResult.income + importResult.expense).toFixed(2)}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
