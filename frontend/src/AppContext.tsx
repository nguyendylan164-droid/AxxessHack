import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type SymptomSeverity = 'mild' | 'moderate' | 'severe'

export interface PatientReportItem {
  id: string
  name: string
  severity: SymptomSeverity
}

const STORAGE_KEY = 'app-completed-task-ids'

interface AppContextValue {
  patientReports: PatientReportItem[]
  setPatientReports: React.Dispatch<React.SetStateAction<PatientReportItem[]>>
  completedTaskIds: Set<string>
  toggleTaskCompleted: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patientReports, setPatientReports] = useState<PatientReportItem[]>([])
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return new Set()
      const arr = JSON.parse(raw) as string[]
      return new Set(Array.isArray(arr) ? arr : [])
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedTaskIds]))
    } catch {
      // ignore
    }
  }, [completedTaskIds])

  const toggleTaskCompleted = useCallback((id: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        patientReports,
        setPatientReports,
        completedTaskIds,
        toggleTaskCompleted,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
