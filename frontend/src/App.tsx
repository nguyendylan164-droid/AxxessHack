import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { usePatientSelection } from './contexts/PatientSelectionContext'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { MOCK_PATIENTS } from './data/mockData'
import './App.css'

function Layout() {
  const { session, profile, signOut, loading } = useAuth()
  const { selectedPatientId, setSelectedPatientId } = usePatientSelection()
  const isClinician = profile?.role === 'clinician'

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          {!loading && session && isClinician && (
            <div className="nav-patient-wrap">
              <select
                className="nav-patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                aria-label="Select patient"
              >
                {MOCK_PATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · Last visit {p.lastVisit}
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
