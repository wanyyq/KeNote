/**
 * IndexedDB Service Layer for KeNote
 * Optimized for large datasets (10,000+ bills) with efficient queries
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Bill, BillType } from '@/store/useStore'

// Database schema definition
interface KeNoteDBSchema extends DBSchema {
  bills: {
    key: string
    value: Bill
    indexes: {
      'by-date': number          // createdAt timestamp (for sorting)
      'by-type': BillType        // income/expense (for filtering)
      'by-category': string      // category name (for filtering)
      'by-date-type': [number, BillType]  // compound index for filtered queries
      'by-date-category': [number, string] // compound index for filtered queries
    }
  }
}

const DB_NAME = 'kenote-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<KeNoteDBSchema>> | null = null

/**
 * Get or create the database connection
 * Singleton pattern to avoid multiple connections
 */
export async function getDB(): Promise<IDBPDatabase<KeNoteDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<KeNoteDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create bills store with indexes for efficient queries
        const store = db.createObjectStore('bills', { keyPath: 'id' })
        
        // Index for date-based sorting (most common operation)
        store.createIndex('by-date', 'createdAt')
        
        // Index for type filtering
        store.createIndex('by-type', 'type')
        
        // Index for category filtering
        store.createIndex('by-category', 'category')
        
        // Compound indexes for filtered queries
        store.createIndex('by-date-type', ['createdAt', 'type'])
        store.createIndex('by-date-category', ['createdAt', 'category'])
      },
    })
  }
  return dbPromise
}

// ==================== Bill CRUD Operations ====================

/**
 * Get all bills, sorted by createdAt descending (newest first)
 * Uses getAllFromIndex for fast bulk loading
 */
export async function getAllBills(): Promise<Bill[]> {
  const db = await getDB()
  // getAllFromIndex returns records sorted by the index key ascending
  const bills = await db.getAllFromIndex('bills', 'by-date')
  // Reverse to get newest first
  return bills.reverse()
}

/**
 * Get bills by type (income/expense), sorted by date descending
 */
export async function getBillsByType(type: BillType): Promise<Bill[]> {
  const db = await getDB()
  const bills: Bill[] = []
  
  let cursor = await db.transaction('bills').store.index('by-date-type')
    .openCursor(IDBKeyRange.bound([-Infinity, type], [Infinity, type]), 'prev')
  
  while (cursor) {
    // Check if type matches (compound index might return multiple)
    if (cursor.value.type === type) {
      bills.push(cursor.value)
    }
    cursor = await cursor.continue()
  }
  
  return bills
}

/**
 * Get bills by category, sorted by date descending
 */
export async function getBillsByCategory(category: string): Promise<Bill[]> {
  const db = await getDB()
  const bills: Bill[] = []
  
  let cursor = await db.transaction('bills').store.index('by-date-category')
    .openCursor(IDBKeyRange.bound([-Infinity, category], [Infinity, category]), 'prev')
  
  while (cursor) {
    if (cursor.value.category === category) {
      bills.push(cursor.value)
    }
    cursor = await cursor.continue()
  }
  
  return bills
}

/**
 * Get all distinct dates from bills
 * Used for jump to date feature
 */
export async function getAllDistinctDates(): Promise<string[]> {
  const db = await getDB()
  const dates = new Set<string>()
  
  let cursor = await db.transaction('bills').store.index('by-date').openCursor(null, 'prev')
  
  while (cursor) {
    dates.add(cursor.value.date)
    cursor = await cursor.continue()
  }
  
  return Array.from(dates).sort().reverse()
}

/**
 * Get all bills within a date range, sorted by date descending
 */
export async function getBillsByDateRange(startDate: number, endDate: number): Promise<Bill[]> {
  const db = await getDB()
  const bills: Bill[] = []
  
  let cursor = await db.transaction('bills').store.index('by-date')
    .openCursor(IDBKeyRange.bound(startDate, endDate), 'prev')
  
  while (cursor) {
    bills.push(cursor.value)
    cursor = await cursor.continue()
  }
  
  return bills
}

/**
 * Add a single bill
 */
export async function addBill(bill: Bill): Promise<string> {
  const db = await getDB()
  await db.put('bills', bill)
  return bill.id
}

/**
 * Update a bill
 */
export async function updateBill(id: string, updates: Partial<Bill>): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('bills', 'readwrite')
  const store = tx.objectStore('bills')
  
  const bill = await store.get(id)
  if (bill) {
    const updated = { ...bill, ...updates }
    await store.put(updated)
  }
  
  await tx.done
}

/**
 * Delete a bill by id
 */
export async function deleteBill(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('bills', id)
}

/**
 * Bulk insert bills (for import/migration)
 * Uses transaction for atomic operation
 */
export async function bulkInsertBills(bills: Bill[]): Promise<number> {
  if (bills.length === 0) return 0
  
  const db = await getDB()
  const tx = db.transaction('bills', 'readwrite')
  const store = tx.objectStore('bills')
  
  let inserted = 0
  for (const bill of bills) {
    try {
      await store.put(bill)
      inserted++
    } catch {
      // Skip duplicates or invalid bills
    }
  }
  
  await tx.done
  return inserted
}

/**
 * Bulk delete bills by ids
 */
export async function bulkDeleteBills(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  
  const db = await getDB()
  const tx = db.transaction('bills', 'readwrite')
  const store = tx.objectStore('bills')
  
  for (const id of ids) {
    await store.delete(id)
  }
  
  await tx.done
}

/**
 * Clear all bills from the database
 */
export async function clearAllBills(): Promise<void> {
  const db = await getDB()
  await db.clear('bills')
}

/**
 * Get bill count
 */
export async function getBillCount(): Promise<number> {
  const db = await getDB()
  return db.count('bills')
}

/**
 * Get bills paginated (for infinite scroll)
 * @param limit - Number of bills to fetch
 * @param lastCreatedAt - Get bills older than this timestamp (for pagination)
 * @returns Array of bills and whether there are more bills
 */
export async function getBillsPaginated(
  limit: number,
  lastCreatedAt?: number
): Promise<{ bills: Bill[]; hasMore: boolean }> {
  const db = await getDB()
  const bills: Bill[] = []
  
  // Start from the beginning or after the last item
  const startKey = lastCreatedAt ? lastCreatedAt - 1 : Infinity
  
  let cursor = await db.transaction('bills').store.index('by-date').openCursor(
    IDBKeyRange.upperBound(startKey),
    'prev'
  )
  
  while (cursor && bills.length < limit) {
    bills.push(cursor.value)
    cursor = await cursor.continue()
  }
  
  // Check if there are more bills
  let hasMore = false
  if (cursor) {
    hasMore = true
  }
  
  return { bills, hasMore }
}

/**
 * Get filtered bills paginated
 * @param filter - Filter options
 * @param limit - Number of bills to fetch
 * @param lastCreatedAt - Get bills older than this timestamp
 */
export async function getFilteredBillsPaginated(
  filter: { type?: BillType; category?: string; search?: string },
  limit: number,
  lastCreatedAt?: number
): Promise<{ bills: Bill[]; hasMore: boolean }> {
  const db = await getDB()
  const bills: Bill[] = []
  const startKey = lastCreatedAt ? lastCreatedAt - 1 : Infinity
  
  let cursor = await db.transaction('bills').store.index('by-date').openCursor(
    IDBKeyRange.upperBound(startKey),
    'prev'
  )
  
  while (cursor && bills.length < limit) {
    const bill = cursor.value
    
    // Apply filters
    let matches = true
    
    if (filter.type && bill.type !== filter.type) {
      matches = false
    }
    
    if (filter.category && filter.category !== 'all' && bill.category !== filter.category) {
      matches = false
    }
    
    if (filter.search) {
      const q = filter.search.toLowerCase()
      const noteMatch = bill.note.toLowerCase().includes(q)
      const categoryMatch = bill.category.toLowerCase().includes(q)
      const amountMatch = bill.amount.toString().includes(q)
      if (!noteMatch && !categoryMatch && !amountMatch) {
        matches = false
      }
    }
    
    if (matches) {
      bills.push(bill)
    }
    
    if (bills.length < limit) {
      cursor = await cursor.continue()
    } else {
      break
    }
  }
  
  // Check if there are more bills
  let hasMore = false
  if (cursor) {
    // Check if there are more matching bills
    while (cursor) {
      const bill = cursor.value
      let matches = true
      
      if (filter.type && bill.type !== filter.type) matches = false
      if (filter.category && filter.category !== 'all' && bill.category !== filter.category) matches = false
      if (filter.search) {
        const q = filter.search.toLowerCase()
        if (!bill.note.toLowerCase().includes(q) && 
            !bill.category.toLowerCase().includes(q) && 
            !bill.amount.toString().includes(q)) {
          matches = false
        }
      }
      
      if (matches) {
        hasMore = true
        break
      }
      cursor = await cursor.continue()
    }
  }
  
  return { bills, hasMore }
}

/**
 * Check if a bill exists
 */
export async function billExists(id: string): Promise<boolean> {
  const db = await getDB()
  const bill = await db.get('bills', id)
  return !!bill
}

/**
 * Get a single bill by id
 */
export async function getBillById(id: string): Promise<Bill | undefined> {
  const db = await getDB()
  return db.get('bills', id)
}

// ==================== Migration Helpers ====================

const MIGRATION_FLAG_KEY = 'kenote-migration-completed'

/**
 * Check if migration from localStorage has been completed
 */
export function isMigrationCompleted(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true'
}

/**
 * Mark migration as completed
 */
export function setMigrationCompleted(): void {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
}

/**
 * Get old data from localStorage (for migration)
 */
export function getOldDataForMigration(): { bills: Bill[]; hasData: boolean } {
  try {
    const stored = localStorage.getItem('kenote-storage')
    if (!stored) return { bills: [], hasData: false }
    
    const parsed = JSON.parse(stored)
    const bills = parsed?.state?.bills || []
    
    return {
      bills: Array.isArray(bills) ? bills : [],
      hasData: bills.length > 0
    }
  } catch {
    return { bills: [], hasData: false }
  }
}

/**
 * Clear old bills from localStorage after migration
 * Keeps settings and custom categories
 */
export function clearOldBillsFromLocalStorage(): void {
  try {
    const stored = localStorage.getItem('kenote-storage')
    if (!stored) return
    
    const parsed = JSON.parse(stored)
    if (parsed?.state?.bills) {
      // Remove bills but keep other data
      parsed.state.bills = []
      localStorage.setItem('kenote-storage', JSON.stringify(parsed))
    }
  } catch {
    // If parsing fails, just leave it
  }
}