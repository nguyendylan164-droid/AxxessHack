import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import './App.css'

function Layout() {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="nav-link">Clinician</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/login" className="nav-link nav-link--right">Log in</Link>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
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
