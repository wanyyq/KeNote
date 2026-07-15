import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { isMigrationCompleted, getOldDataForMigration } from '@/lib/db'
import MigrationDialog from './MigrationDialog'

interface BillsContextValue {
  isReady: boolean
  migrationNeeded: boolean
}

const BillsContext = createContext<BillsContextValue>({ isReady: false, migrationNeeded: false })

export function useBillsContext() {
  return useContext(BillsContext)
}

interface BillsProviderProps {
  children: ReactNode
}

export default function BillsProvider({ children }: BillsProviderProps) {
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkMigration = async () => {
      // Check if migration has been completed
      if (isMigrationCompleted()) {
        // No migration needed, app is ready
        setIsReady(true)
        return
      }

      // Check if there's old data to migrate
      const { hasData } = getOldDataForMigration()
      
      if (hasData) {
        // Migration needed
        setMigrationNeeded(true)
        setShowMigrationDialog(true)
      } else {
        // No old data, mark migration as complete
        setIsReady(true)
      }
    }

    checkMigration()
  }, [])

  const handleMigrationComplete = () => {
    setShowMigrationDialog(false)
    setIsReady(true)
  }

  return (
    <BillsContext.Provider value={{ isReady, migrationNeeded }}>
      {children}
      {showMigrationDialog && (
        <MigrationDialog 
          open={showMigrationDialog} 
          onComplete={handleMigrationComplete} 
        />
      )}
    </BillsContext.Provider>
  )
}