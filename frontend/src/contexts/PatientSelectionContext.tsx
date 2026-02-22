import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { MOCK_PATIENTS } from '../data/mockData'

const defaultId = MOCK_PATIENTS[0]?.id ?? ''

interface PatientSelectionContextValue {
  selectedPatientId: string
  setSelectedPatientId: (id: string) => void
}

const PatientSelectionContext = createContext<PatientSelectionContextValue | null>(null)

export function PatientSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedPatientId, setSelectedPatientId] = useState(defaultId)
  const setter = useCallback((id: string) => setSelectedPatientId(id), [])
  return (
    <PatientSelectionContext.Provider value={{ selectedPatientId, setSelectedPatientId: setter }}>
      {children}
    </PatientSelectionContext.Provider>
  )
}

export function usePatientSelection(): PatientSelectionContextValue {
  const ctx = useContext(PatientSelectionContext)
  if (!ctx) throw new Error('usePatientSelection must be used within PatientSelectionProvider')
  return ctx
}
