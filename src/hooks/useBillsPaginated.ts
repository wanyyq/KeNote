import { useState, useEffect, useCallback, useRef } from 'react'
import { getFilteredBillsPaginated, getBillCount } from '@/lib/db'
import type { Bill, BillType } from '@/store/useStore'

const PAGE_SIZE = 50

interface UseBillsPaginatedOptions {
  type?: 'all' | BillType
  category?: string
  search?: string
}

interface UseBillsPaginatedReturn {
  bills: Bill[]
  loading: boolean
  hasMore: boolean
  total: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useBillsPaginated(options: UseBillsPaginatedOptions = {}): UseBillsPaginatedReturn {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Track the last bill's createdAt for pagination
  const lastCreatedAtRef = useRef<number | undefined>(undefined)
  
  // Track if this is the initial load
  const isInitialLoad = useRef(true)

  // Load initial data and count
  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      // Get total count
      const count = await getBillCount()
      setTotal(count)
      
      // Reset pagination
      lastCreatedAtRef.current = undefined
      isInitialLoad.current = false
      
      // Load first page
      const filter = {
        type: options.type && options.type !== 'all' ? options.type : undefined,
        category: options.category && options.category !== 'all' ? options.category : undefined,
        search: options.search || undefined,
      }
      
      const result = await getFilteredBillsPaginated(filter, PAGE_SIZE)
      setBills(result.bills)
      setHasMore(result.hasMore)
      
      if (result.bills.length > 0) {
        lastCreatedAtRef.current = result.bills[result.bills.length - 1].createdAt
      }
    } catch (error) {
      console.error('Failed to load bills:', error)
    } finally {
      setLoading(false)
    }
  }, [options.type, options.category, options.search])

  // Load more bills
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const filter = {
        type: options.type && options.type !== 'all' ? options.type : undefined,
        category: options.category && options.category !== 'all' ? options.category : undefined,
        search: options.search || undefined,
      }
      
      const result = await getFilteredBillsPaginated(filter, PAGE_SIZE, lastCreatedAtRef.current)
      
      setBills(prev => [...prev, ...result.bills])
      setHasMore(result.hasMore)
      
      if (result.bills.length > 0) {
        lastCreatedAtRef.current = result.bills[result.bills.length - 1].createdAt
      }
    } catch (error) {
      console.error('Failed to load more bills:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, options.type, options.category, options.search])

  // Refresh (reload from beginning)
  const refresh = useCallback(async () => {
    await loadInitial()
  }, [loadInitial])

  // Load on mount and when filters change
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  return {
    bills,
    loading,
    hasMore,
    total,
    loadMore,
    refresh,
  }
}