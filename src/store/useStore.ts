import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BillType = 'income' | 'expense'

export interface CategoryDef {
  name: string
  icon: string
  isCustom?: boolean
}

export interface Bill {
  id: string
  type: BillType
  amount: number
  category: string
  note: string
  date: string
  createdAt: number
}

export const DEFAULT_EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: '餐饮', icon: 'utensils' },
  { name: '交通', icon: 'car' },
  { name: '购物', icon: 'shopping-bag' },
  { name: '娱乐', icon: 'gamepad-2' },
  { name: '住房', icon: 'home' },
  { name: '医疗', icon: 'heart' },
  { name: '教育', icon: 'book-open' },
  { name: '数码', icon: 'monitor' },
  { name: '其他', icon: 'more-horizontal' },
]

export const DEFAULT_INCOME_CATEGORIES: CategoryDef[] = [
  { name: '工资', icon: 'banknote' },
  { name: '奖金', icon: 'gift' },
  { name: '投资', icon: 'trending-up' },
  { name: '兼职', icon: 'briefcase' },
  { name: '理财', icon: 'piggy-bank' },
  { name: '其他', icon: 'more-horizontal' },
]

export function getCategoryIcon(categoryName: string, type: BillType): string {
  const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
  const found = defaults.find((c) => c.name === categoryName)
  return found?.icon || 'circle'
}

export interface AppSettings {
  currency: string
}

interface AppState {
  bills: Bill[]
  settings: AppSettings
  customExpenseCategories: CategoryDef[]
  customIncomeCategories: CategoryDef[]
  addBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => void
  removeBill: (id: string) => void
  updateBill: (id: string, updates: Partial<Bill>) => void
  shiftBillDate: (id: string, days: number) => void
  addCustomCategory: (type: BillType, category: CategoryDef) => void
  removeCustomCategory: (type: BillType, name: string) => void
  getAllCategories: (type: BillType) => CategoryDef[]
  updateSettings: (settings: Partial<AppSettings>) => void
  exportAllData: () => string
  exportBillsCSV: () => void
  importData: (jsonData: string) => { success: boolean; merged: number; skipped: number }
  replaceAllData: (jsonData: string) => { success: boolean; count: number }
  clearAllData: () => void
}

let billCounter = Date.now()
function generateId(): string {
  return `bill_${++billCounter}_${Math.random().toString(36).slice(2, 9)}`
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      bills: [],
      settings: { currency: '¥' },
      customExpenseCategories: [],
      customIncomeCategories: [],

      addBill: (bill) => {
        const newBill: Bill = { ...bill, id: generateId(), createdAt: Date.now() }
        set((state) => ({ bills: [newBill, ...state.bills] }))
      },
      removeBill: (id) => set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),
      updateBill: (id, updates) => set((state) => ({
        bills: state.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      })),
      shiftBillDate: (id, days) => set((state) => {
        const updated = state.bills.map((b) => {
          if (b.id !== id) return b
          return { ...b, createdAt: b.createdAt + days * 60000 }
        })
        updated.sort((a, b) => b.createdAt - a.createdAt)
        return { bills: updated }
      }),
      addCustomCategory: (type, category) => {
        set((state) => {
          const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
          const customs = type === 'expense' ? state.customExpenseCategories : state.customIncomeCategories
          if ([...defaults, ...customs].some((c) => c.name === category.name)) return state
          if (type === 'expense') return { customExpenseCategories: [...state.customExpenseCategories, category] }
          return { customIncomeCategories: [...state.customIncomeCategories, category] }
        })
      },
      removeCustomCategory: (type, name) => {
        set((state) => {
          if (type === 'expense')
            return { customExpenseCategories: state.customExpenseCategories.filter((c) => c.name !== name) }
          return { customIncomeCategories: state.customIncomeCategories.filter((c) => c.name !== name) }
        })
      },
      getAllCategories: (type) => {
        const state = get()
        const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
        const customs = type === 'expense' ? state.customExpenseCategories : state.customIncomeCategories
        return [...defaults, ...customs]
      },
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      exportAllData: () => {
        const state = get()
        return JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          bills: state.bills,
          settings: state.settings,
          customExpenseCategories: state.customExpenseCategories,
          customIncomeCategories: state.customIncomeCategories,
        }, null, 2)
      },
      exportBillsCSV: () => {
        const state = get()
        const headers = ['类型', '金额', '分类', '备注', '日期', '创建时间']
        const colWidths = [80, 100, 120, 260, 130, 180]
        const typeMap: Record<string, string> = { income: '收入', expense: '支出' }
        const escape = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const rows = state.bills.map((b) => {
          const d = new Date(b.createdAt)
          const fallbackDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          return [
            typeMap[b.type] || b.type,
            String(b.amount),
            b.category,
            b.note,
            b.date || fallbackDate,
            d.toLocaleString('zh-CN'),
          ]
        })
        const headRow = headers.map((h, i) => `<th style="width:${colWidths[i]}px">${escape(h)}</th>`).join('')
        const bodyRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 8px;white-space:nowrap}th{background:#f5f5f5;text-align:center;font-weight:bold}td{text-align:left}</style></head><body><table>${headRow}${bodyRows}</table></body></html>`
        const bom = '\uFEFF'
        const blob = new Blob([bom + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const now = new Date()
        a.download = `账单导出_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xls`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      },
      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData)
          if (!data.bills || !Array.isArray(data.bills)) return { success: false, merged: 0, skipped: 0 }
          const currentBills = get().bills
          const existingIds = new Set(currentBills.map((b) => b.id))
          let merged = 0, skipped = 0
          const newBills: Bill[] = [...currentBills]
          for (const bill of data.bills) {
            if (existingIds.has(bill.id)) { skipped++ }
            else { newBills.push(bill); existingIds.add(bill.id); merged++ }
          }
          newBills.sort((a, b) => b.createdAt - a.createdAt)
          set({
            bills: newBills,
            settings: data.settings ? { ...get().settings, ...data.settings } : get().settings,
            customExpenseCategories: data.customExpenseCategories || get().customExpenseCategories,
            customIncomeCategories: data.customIncomeCategories || get().customIncomeCategories,
          })
          return { success: true, merged, skipped }
        } catch { return { success: false, merged: 0, skipped: 0 } }
      },
      replaceAllData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData)
          if (!data.bills || !Array.isArray(data.bills)) return { success: false, count: 0 }
          set({
            bills: data.bills,
            settings: data.settings || get().settings,
            customExpenseCategories: data.customExpenseCategories || [],
            customIncomeCategories: data.customIncomeCategories || [],
          })
          return { success: true, count: data.bills.length }
        } catch { return { success: false, count: 0 } }
      },
      clearAllData: () => {
        set({
          bills: [],
          settings: { currency: '¥' },
          customExpenseCategories: [],
          customIncomeCategories: [],
        })
      },
    }),
    { name: 'kenote-storage', version: 2 }
  )
)
