import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

export function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signUp(email, password, name, 'clinician')
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
        <h1 className="auth-title">Nurse Sign Up</h1>
        <p className="auth-subtitle">
          Create a nurse account to access the dashboard.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <div>
            <label className="auth-label" htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              type="text"
              className="auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label className="auth-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  )
}
