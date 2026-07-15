import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

/* ---------- component ---------- */

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const displayRef = useRef(display)
  displayRef.current = display

  const [error, setError] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [panel, setPanel] = useState<'none' | 'history'>('none')

  const historyEndRef = useRef<HTMLDivElement>(null)

  // keyboard support
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

  // ---- button handler ----
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
    </div>
  )
}
