import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { PatientSelectionProvider } from './contexts/PatientSelectionContext.tsx'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PatientSelectionProvider>
          <App />
        </PatientSelectionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
