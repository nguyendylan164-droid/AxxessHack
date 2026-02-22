import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Home } from './pages/Home'
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
          <img src = "/Logo.png" alt="Axxess Logo" className="Logo"/>
          <Link to="/" className="nav-link">Clinician</Link>
          <Link to="/about" className="nav-link">About</Link>
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
