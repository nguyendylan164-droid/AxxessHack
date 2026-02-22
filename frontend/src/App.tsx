import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { usePatientSelection } from './contexts/PatientSelectionContext'
import { getClients, type ClientOption } from './data/api'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import './App.css'

function Layout() {
  const { session, profile, signOut, loading } = useAuth()
  const { selectedPatientId, setSelectedPatientId } = usePatientSelection()
  const isClinician = profile?.role === 'clinician'
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const selectedPatientIdRef = useRef(selectedPatientId)
  selectedPatientIdRef.current = selectedPatientId

  useEffect(() => {
    if (!session || !isClinician) {
      setClients([])
      setClientsError(null)
      return
    }
    setClientsLoading(true)
    setClientsError(null)
    getClients()
      .then((list) => {
        setClients(list)
        setClientsError(null)
        const current = selectedPatientIdRef.current
        if (list.length > 0 && !list.some((c) => c.id === current)) {
          setSelectedPatientId(list[0].id)
        }
      })
      .catch((err) => {
        setClients([])
        setClientsError(err instanceof Error ? err.message : 'Could not load clients')
      })
      .finally(() => setClientsLoading(false))
  }, [session, isClinician, setSelectedPatientId])

  return (
    <div className="layout">
      
      <nav className="navbar">
        <div className="navbar-inner">
          <img src = "/Logo.png" alt="Axxess Logo" className="Logo"/>
          <Link to="/" className="nav-link">Clinician</Link>
          <Link to="/about" className="nav-link">About</Link>
          {!loading && session && isClinician && (
            <div className="nav-patient-wrap">
              <select
                className="nav-patient-select"
                value={clients.some((c) => c.id === selectedPatientId) ? selectedPatientId : (clients[0]?.id ?? '')}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                aria-label="Select patient"
                disabled={clientsLoading}
              >
                {clientsLoading && (
                  <option value="">Loading clients…</option>
                )}
                {!clientsLoading && clients.length === 0 && (
                  <option value="">
                    {clientsError ? `Error: ${clientsError.slice(0, 40)}…` : 'No clients'}
                  </option>
                )}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · Last visit {c.lastVisit}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!loading && (
            session
              ? (
                <div className="nav-auth">
                  <span className="nav-user">
                    {profile?.name ?? session.user?.email}
                    {profile && (
                      <span className="nav-role">({profile.role})</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="nav-link nav-btn"
                    onClick={() => signOut()}
                  >
                    Log out
                  </button>
                </div>
                )
              : (
                <Link to="/login" className="nav-link nav-link--right">
                  Log in
                </Link>
                )
          )}
        </div>
      </nav>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
    </Routes>
  )
}

export default App
