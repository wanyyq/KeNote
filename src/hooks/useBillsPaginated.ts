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
  const [initialized, setInitialized] = useState(false)
  
  const lastCreatedAtRef = useRef<number | undefined>(undefined)
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadInitial = useCallback(async () => {
    if (!mountedRef.current) return
    setLoading(true)
    try {
      const count = await getBillCount()
      if (!mountedRef.current) return
      setTotal(count)
      
      lastCreatedAtRef.current = undefined
      
      const filter = {
        type: options.type && options.type !== 'all' ? options.type : undefined,
        category: options.category && options.category !== 'all' ? options.category : undefined,
        search: options.search || undefined,
      }
      
      const result = await getFilteredBillsPaginated(filter, PAGE_SIZE)
      if (!mountedRef.current) return
      setBills(result.bills)
      setHasMore(result.hasMore)
      
      if (result.bills.length > 0) {
        lastCreatedAtRef.current = result.bills[result.bills.length - 1].createdAt
      }
    } catch (error) {
      console.error('Failed to load bills:', error)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setInitialized(true)
      }
    }
  }, [options.type, options.category, options.search])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoading(true)
    try {
      const filter = {
        type: options.type && options.type !== 'all' ? options.type : undefined,
        category: options.category && options.category !== 'all' ? options.category : undefined,
        search: options.search || undefined,
      }
      
      const result = await getFilteredBillsPaginated(filter, PAGE_SIZE, lastCreatedAtRef.current)
      if (!mountedRef.current) return
      setBills(prev => [...prev, ...result.bills])
      setHasMore(result.hasMore)
      
      if (result.bills.length > 0) {
        lastCreatedAtRef.current = result.bills[result.bills.length - 1].createdAt
      }
    } catch (error) {
      console.error('Failed to load more bills:', error)
    } finally {
      if (mountedRef.current) setLoading(false)
      loadingRef.current = false
    }
  }, [hasMore, options.type, options.category, options.search])

  const refresh = useCallback(async () => {
    await loadInitial()
  }, [loadInitial])

  // Load on mount and when filters change
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  return {
    bills,
    loading: loading || !initialized,
    hasMore,
    total,
    loadMore,
    refresh,
  }
}