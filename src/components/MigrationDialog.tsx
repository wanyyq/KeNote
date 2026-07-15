/**
 * Migration Dialog Component
 * Shows during localStorage to IndexedDB migration
 */

import { useState, useEffect } from 'react'
import { bulkInsertBills, setMigrationCompleted, clearOldBillsFromLocalStorage, getOldDataForMigration } from '@/lib/db'

interface MigrationDialogProps {
  open: boolean
  onComplete: () => void
}

type MigrationStatus = 'preparing' | 'migrating' | 'verifying' | 'cleaning' | 'complete' | 'error'

export default function MigrationDialog({ open, onComplete }: MigrationDialogProps) {
  const [status, setStatus] = useState<MigrationStatus>('preparing')
  const [progress, setProgress] = useState(0)
  const [totalBills, setTotalBills] = useState(0)
  const [migratedCount, setMigratedCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) return

    const runMigration = async () => {
      try {
        setStatus('preparing')
        const { bills, hasData } = getOldDataForMigration()
        
        if (!hasData || bills.length === 0) {
          setMigrationCompleted()
          setStatus('complete')
          setTimeout(onComplete, 500)
          return
        }

        setTotalBills(bills.length)
        await new Promise(r => setTimeout(r, 300))

        setStatus('migrating')
        const BATCH_SIZE = 100
        let inserted = 0
        
        for (let i = 0; i < bills.length; i += BATCH_SIZE) {
          const batch = bills.slice(i, i + BATCH_SIZE)
          const count = await bulkInsertBills(batch)
          inserted += count
          setMigratedCount(inserted)
          setProgress(Math.round((inserted / bills.length) * 100))
        }

        setStatus('verifying')
        await new Promise(r => setTimeout(r, 500))
        
        setStatus('cleaning')
        clearOldBillsFromLocalStorage()
        setMigrationCompleted()
        
        setStatus('complete')
        setTimeout(onComplete, 800)

      } catch (error) {
        console.error('Migration error:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : '迁移过程中发生未知错误')
      }
    }

    runMigration()
  }, [open, onComplete])

  if (!open) return null

  const getStatusText = () => {
    switch (status) {
      case 'preparing': return '正在准备迁移...'
      case 'migrating': return `正在迁移账单数据... ${progress}%`
      case 'verifying': return '正在验证数据完整性...'
      case 'cleaning': return '正在清理旧数据...'
      case 'complete': return '迁移完成!'
      case 'error': return '迁移失败'
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'preparing':
      case 'migrating':
      case 'verifying':
      case 'cleaning':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i data-lucide="loader-2" className="size-6 text-blue-500 animate-spin"></i>
          </div>
        )
      case 'complete':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <i data-lucide="check" className="size-6 text-green-500"></i>
          </div>
        )
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <i data-lucide="alert-circle" className="size-6 text-red-500"></i>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm bg-black/20" />
      <div className="relative z-[101] w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-4">
          {getIcon()}
          
          <div className="text-center">
            <h2 className="text-lg font-semibold">数据迁移</h2>
            <p className="text-sm text-muted-foreground mt-1">{getStatusText()}</p>
          </div>

          {status === 'migrating' && totalBills > 0 && (
            <div className="w-full space-y-2">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                已迁移 {migratedCount} / {totalBills} 条账单
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {errorMessage}
            </div>
          )}

          {status === 'complete' && (
            <p className="text-sm text-muted-foreground text-center">
              成功迁移 {migratedCount} 条账单到新存储系统
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
