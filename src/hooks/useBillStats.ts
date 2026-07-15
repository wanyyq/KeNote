import { useState, useEffect } from 'react'
import { getAllBills } from '@/lib/db'
import type { Bill } from '@/store/useStore'

interface BillStats {
  bills: Bill[]
  total: number
  totalIncome: number
  totalExpense: number
  monthIncome: number
  monthExpense: number
  yearIncome: number
  yearExpense: number
  loading: boolean
}

export function useBillStats(refreshKey?: number): BillStats {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    getAllBills().then(allBills => {
      if (!mounted) return
      setLoading(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mounted) setBills(allBills)
        })
      })
    }).catch(error => {
      console.error('Failed to load bill stats:', error)
      if (mounted) setLoading(false)
    })
    
    return () => { mounted = false }
  }, [refreshKey])

  const totalIncome = bills.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const totalExpense = bills.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const monthStartStr = monthStart.toISOString().slice(0, 10)
  const monthEndStr = monthEnd.toISOString().slice(0, 10)

  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear(), 11, 31)
  const yearStartStr = yearStart.toISOString().slice(0, 10)
  const yearEndStr = yearEnd.toISOString().slice(0, 10)

  const monthBills = bills.filter(b => b.date >= monthStartStr && b.date <= monthEndStr)
  const monthIncome = monthBills.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const monthExpense = monthBills.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0)

  const yearBills = bills.filter(b => b.date >= yearStartStr && b.date <= yearEndStr)
  const yearIncome = yearBills.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const yearExpense = yearBills.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0)

  return {
    bills, total: bills.length, totalIncome, totalExpense,
    monthIncome, monthExpense, yearIncome, yearExpense, loading,
  }
}