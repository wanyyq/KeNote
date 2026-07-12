import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CreateBillDialog from '@/components/bills/CreateBillDialog'
import Timelist from '@/components/bills/Timelist'
import Heatmap from '@/components/charts/Heatmap'

type FilterType = 'all' | 'income' | 'expense'
type DisplayMode = 'timeline' | 'heatmap'

export default function Bills() {
  const { bills, removeBill, getAllCategories } = useStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('timeline')

  const allCategories = useMemo(() => {
    const all = new Set<string>()
    getAllCategories('expense').forEach((c) => all.add(c.name))
    getAllCategories('income').forEach((c) => all.add(c.name))
    return Array.from(all).sort()
  }, [getAllCategories])

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (filterType === 'income' && bill.type !== 'income') return false
      if (filterType === 'expense' && bill.type !== 'expense') return false
      if (filterCategory !== 'all' && bill.category !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        if (!bill.note.toLowerCase().includes(q) && !bill.category.toLowerCase().includes(q) && !bill.amount.toString().includes(q)) return false
      }
      return true
    })
  }, [bills, filterType, filterCategory, search])

  const hasActiveFilters = filterType !== 'all' || filterCategory !== 'all' || search !== ''

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-5">
      <div className="pt-4 md:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">账单</h1>
        <p className="text-muted-foreground mt-1">您的收入与支出</p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <i data-lucide="plus" className="w-4 h-4 mr-1.5"></i>创建账单
          </Button>
          <div className="relative flex-1">
            <i data-lucide="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
            <Input placeholder="搜索账单..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Toggle pressed={filterType === 'all'} onPressedChange={() => setFilterType('all')} size="sm" variant="outline" className="text-xs">全部</Toggle>
          <Toggle pressed={filterType === 'income'} onPressedChange={() => setFilterType(filterType === 'income' ? 'all' : 'income')} size="sm" variant="outline" className="text-xs">收入</Toggle>
          <Toggle pressed={filterType === 'expense'} onPressedChange={() => setFilterType(filterType === 'expense' ? 'all' : 'expense')} size="sm" variant="outline" className="text-xs">支出</Toggle>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="全部分类" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {allCategories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as DisplayMode)}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="timeline">时间轴</SelectItem>
              <SelectItem value="heatmap">热力图</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {displayMode === 'heatmap' ? (
        <Card className="shadow-none border"><CardContent className="p-5"><h3 className="text-sm font-medium text-muted-foreground mb-3">年度收支热力图</h3><Heatmap bills={filteredBills} /></CardContent></Card>
      ) : (
        <Timelist bills={filteredBills} onDelete={(id) => removeBill(id)}
          emptyMessage={hasActiveFilters ? '没有符合筛选条件的账单' : '暂无账单记录，点击上方"创建账单"开始吧'}
        />
      )}
      <CreateBillDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
