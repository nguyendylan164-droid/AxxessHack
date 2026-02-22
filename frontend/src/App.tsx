import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { Home } from './pages/Home'
import { About } from './pages/About'
import './App.css'

function Layout() {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="nav-link">Clinician</Link>
          <Link to="/about" className="nav-link">About</Link>
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
      </Route>
    </Routes>
  )
}

export default App
