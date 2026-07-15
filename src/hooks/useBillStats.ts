import { useState, useEffect } from 'react'
import { getAllBills, getBillCount } from '@/lib/db'
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

/**
 * Hook for Home page statistics
 * Loads all bills once for aggregate calculations
 */
export function useBillStats(): BillStats {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const allBills = await getAllBills()
        setBills(allBills)
      } catch (error) {
        console.error('Failed to load bill stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  // Calculate totals
  const totalIncome = bills.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const totalExpense = bills.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0)

  // Get current month bounds
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const monthStartStr = monthStart.toISOString().slice(0, 10)
  const monthEndStr = monthEnd.toISOString().slice(0, 10)

  // Get current year bounds
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear(), 11, 31)
  const yearStartStr = yearStart.toISOString().slice(0, 10)
  const yearEndStr = yearEnd.toISOString().slice(0, 10)

  // Calculate month totals
  const monthBills = bills.filter(b => b.date >= monthStartStr && b.date <= monthEndStr)
  const monthIncome = monthBills.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const monthExpense = monthBills.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0)

  // Calculate year totals
  const yearBills = bills.filter(b => b.date >= yearStartStr && b.date <= yearEndStr)
  const yearIncome = yearBills.filter(b => b.type === 'income').reduce((a, b) => a + b.amount, 0)
  const yearExpense = yearBills.filter(b => b.type === 'expense').reduce((a, b) => a + b.amount, 0)

  return {
    bills,
    total: bills.length,
    totalIncome,
    totalExpense,
    monthIncome,
    monthExpense,
    yearIncome,
    yearExpense,
    loading,
  }
}