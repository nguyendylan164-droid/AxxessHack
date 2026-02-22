import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Nurse Login</h1>
        <p className="auth-subtitle">
          This app is for nurses only. Enter your credentials to access the dashboard.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <div>
            <label className="auth-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nurse@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="auth-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
