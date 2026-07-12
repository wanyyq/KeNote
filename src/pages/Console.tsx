import { useState, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function Console() {
  const { bills, exportAllData, importData } = useStore()
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `KeNote_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const result = importData(text)
        setImportStatus(result.success
          ? { type: 'success', message: `导入成功！合并了 ${result.merged} 条记录，跳过 ${result.skipped} 条重复` }
          : { type: 'error', message: '导入失败：数据格式不正确' })
      } catch { setImportStatus({ type: 'error', message: '导入失败：无法解析文件' }) }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const totalIncome = bills.filter((b) => b.type === 'income').reduce((sum, b) => sum + b.amount, 0)
  const totalExpense = bills.filter((b) => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0)

  const infoRows = [
    ['版本', '1.0.0'],
    ['技术栈', 'React 19 + Vite + Shadcn UI'],
    ['账单总数', `${bills.length} 条`],
    ['累计收入', `¥${totalIncome.toFixed(2)}`, 'text-emerald-600'],
    ['累计支出', `¥${totalExpense.toFixed(2)}`, 'text-red-500'],
    ['账户结余', `¥${(totalIncome - totalExpense).toFixed(2)}`, totalIncome - totalExpense >= 0 ? '' : 'text-red-500'],
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <div className="pt-4 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">控制台</h1>
        <p className="text-muted-foreground mt-1">软件信息与设置</p>
      </div>
      <Card className="shadow-none border">
        <CardHeader><CardTitle className="text-base">关于 KeNote</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {infoRows.map(([label, value, cls], i) => (
            <div key={label}>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${cls || ''}`}>{value}</span>
              </div>
              {i < infoRows.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle className="text-base">数据管理</CardTitle>
          <CardDescription>导出与导入记账数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导出所有数据</p>
              <p className="text-xs text-muted-foreground mt-0.5">将全部账单记录导出为 JSON 文件</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <i data-lucide="download" className="w-3.5 h-3.5 mr-1.5"></i>导出
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导入数据</p>
              <p className="text-xs text-muted-foreground mt-0.5">从导出的 JSON 文件恢复账单，自动合并不重复的数据</p>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <i data-lucide="upload" className="w-3.5 h-3.5 mr-1.5"></i>导入
              </Button>
            </div>
          </div>
          {importStatus && (
            <div className={`text-sm p-3 rounded-md ${importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-destructive'}`}>
              {importStatus.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
