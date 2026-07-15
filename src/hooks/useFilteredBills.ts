import { useState, useEffect } from 'react'
import { getAllBills } from '@/lib/db'
import type { Bill, BillType } from '@/store/useStore'

interface UseFilteredBillsOptions {
  type?: 'all' | BillType
  category?: string
  search?: string
}

export function useFilteredBills(options: UseFilteredBillsOptions = {}) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    getAllBills().then(allBills => {
      if (!mounted) return
      let filtered = allBills
      
      if (options.type && options.type !== 'all') {
        filtered = filtered.filter(b => b.type === options.type)
      }
      if (options.category && options.category !== 'all') {
        filtered = filtered.filter(b => b.category === options.category)
      }
      if (options.search) {
        const q = options.search.toLowerCase()
        filtered = filtered.filter(b => 
          b.note.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.amount.toString().includes(q)
        )
      }
      
      setBills(filtered)
      setLoading(false)
    }).catch(error => {
      if (!mounted) return
      console.error('Failed to load filtered bills:', error)
      setLoading(false)
    })
    
    return () => { mounted = false }
  }, [options.type, options.category, options.search])

  return { bills, loading }
}