import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { useStore, BillType, CategoryDef } from '@/store/useStore'
import CategoryIcon from '@/components/bills/CategoryIcon'
import IconPicker from '@/components/bills/IconPicker'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editBill?: { id: string; amount: number; type: BillType; category: string; note: string; date: string }
}

export default function CreateBillDialog({ open, onOpenChange, editBill }: Props) {
  const { addBill, updateBill, getAllCategories, addCustomCategory, removeCustomCategory } = useStore()
  const [type, setType] = useState<BillType>(editBill?.type || 'expense')
  const [amount, setAmount] = useState(editBill ? String(editBill.amount) : '')
  const [category, setCategory] = useState(editBill?.category || '')
  const [note, setNote] = useState(editBill?.note || '')
  const [date, setDate] = useState(editBill?.date || format(new Date(), 'yyyy-MM-dd'))
  const [error, setError] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('circle')
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  const categories = getAllCategories(type)

  const handleSubmit = () => {
    setError('')
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) { setError('请输入有效的金额'); return }
    if (!category) { setError('请选择分类'); return }
    if (editBill) {
      updateBill(editBill.id, { type, amount: numAmount, category, note, date })
    } else {
      addBill({ type, amount: numAmount, category, note, date })
    }
    setType('expense'); setAmount(''); setCategory(''); setNote('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    onOpenChange(false)
  }

  const reset = () => {
    setError(''); setShowNewCategory(false); setNewCategoryName(''); setNewCategoryIcon('circle')
    if (!editBill) { setAmount(''); setCategory(''); setNote(''); setType('expense'); setDate(format(new Date(), 'yyyy-MM-dd')) }
  }

  const handleClose = (o: boolean) => { if (!o) reset(); onOpenChange(o) }

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return
    addCustomCategory(type, { name: newCategoryName.trim(), icon: newCategoryIcon, isCustom: true })
    setCategory(newCategoryName.trim())
    setShowNewCategory(false)
    setNewCategoryName('')
    setNewCategoryIcon('circle')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editBill ? '编辑账单' : '新建账单'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Toggle pressed={type === 'expense'} onPressedChange={() => { setType('expense'); setCategory('') }} variant="outline" className="flex-1 data-[state=on]:bg-red-50 data-[state=on]:text-red-600 data-[state=on]:border-red-200">支出</Toggle>
              <Toggle pressed={type === 'income'} onPressedChange={() => { setType('income'); setCategory('') }} variant="outline" className="flex-1 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-600 data-[state=on]:border-emerald-200">收入</Toggle>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">金额</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">¥</span>
                <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-7" autoFocus />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>分类</Label>
                <button type="button" onClick={() => setShowNewCategory(!showNewCategory)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">+ 自定义</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.name} type="button" onClick={() => setCategory(cat.name)}
                    className={cn(
                      'flex items-center gap-1.5 py-2 px-2.5 text-xs rounded-md border transition-colors text-left',
                      category === cat.name ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'
                    )}
                  >
                    <CategoryIcon iconName={cat.icon} size={14} />
                    <span className="truncate">{cat.name}</span>
                    {cat.isCustom && (
                      <span onClick={(e) => { e.stopPropagation(); removeCustomCategory(type, cat.name); if (category === cat.name) setCategory('') }} className="ml-auto shrink-0 opacity-50 hover:opacity-100" title="删除">
                        <i data-lucide="x" className="w-[10px] h-[10px]"></i>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {showNewCategory && (
                <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIconPickerOpen(true)} className="shrink-0 p-1.5 rounded-md border hover:bg-accent transition-colors" title="选择图标">
                      <CategoryIcon iconName={newCategoryIcon} size={18} />
                    </button>
                    <Input placeholder="分类名称" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="h-8 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomCategory() }} />
                    <Button type="button" size="sm" onClick={handleAddCustomCategory} disabled={!newCategoryName.trim()} className="h-8 text-xs shrink-0">添加</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">备注（可选）</Label>
              <Input id="note" placeholder="添加备注..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">日期</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editBill ? '保存修改' : '确认添加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <IconPicker open={iconPickerOpen} onOpenChange={setIconPickerOpen} selected={newCategoryIcon} onSelect={(n) => setNewCategoryIcon(n)} />
    </>
  )
}
