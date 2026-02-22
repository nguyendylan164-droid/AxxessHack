import { Routes, Route, Link, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Home } from './pages/Home'
import { Recording } from './pages/Recording'
import { About } from './pages/About'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import './App.css'

function Layout() {
  const { session, profile, signOut, loading } = useAuth()

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-inner">
          <img src="/Logo.png" alt="Axxess Logo" className="Logo" />
          <Link to="/" className="nav-link">Dashboard</Link>
          <p className = "program-title">ReinCare AI</p>
          <img src = "/Logo.png" alt="Axxess Logo" className="Logo"/>
          <Link to="/" className="nav-link">Clinician</Link>
          <Link to="/recording" className="nav-link">Recording</Link>
          <Link to="/about" className="nav-link">About</Link>
          {!loading && (
            session
              ? (
                <div className="nav-auth">
                  <span className="nav-user">
                    {profile?.name ?? session.user?.email}
                    {profile && (
                      <span className="nav-role">(nurse)</span>
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
                <div className="nav-auth-links">
                  <Link to="/login" className="nav-link nav-link--right">Log in</Link>
                  <Link to="/signup" className="nav-link nav-link--right">Sign up</Link>
                </div>
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

/** Protect nurse-only routes: redirect non-nurses to login */
function NurseRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <div className="welcome-page"><div className="welcome-block"><p className="welcome-text">Loading…</p></div></div>
  if (!session) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'clinician') {
    return (
      <div className="welcome-page">
        <div className="welcome-block">
          <h1 className="welcome-title">Nurses Only</h1>
          <p className="welcome-text">
            This app is for nurses only. Please log in with a nurse account.
          </p>
          <Link to="/login" className="welcome-btn">Go to login</Link>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<NurseRoute><Home /></NurseRoute>} />
        <Route path="/recording" element={<NurseRoute><Recording /></NurseRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
    </Routes>
  )
}

export default App
