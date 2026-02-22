import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../contexts/AuthContext'

export function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('client')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: err } = await signUp(email.trim(), password, name.trim(), role)
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    setSuccess(true)
    // If Supabase has session (email confirm off), go home; else stay for "check email" message
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s) navigate('/', { replace: true })
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            If your project requires email confirmation, confirm your email then log in.
            Otherwise you’re signed in.
          </p>
          <p className="auth-footer">
            <Link to="/login" className="auth-link">
              Go to Log in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign up</h1>
        <p className="auth-subtitle">Create an account. Choose client or clinician.</p>

        {!isSupabaseConfigured && (
          <div className="auth-error" role="alert">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the frontend folder (or project root), then restart the dev server.
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            className="auth-input"
            placeholder="Enter email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="auth-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            className="auth-input"
            placeholder="Enter password (min 6 characters)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <label className="auth-label" htmlFor="signup-name">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            className="auth-input"
            placeholder="Enter your name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="auth-label">I am a</label>
          <select
            className="auth-input auth-select"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            aria-label="Account type"
          >
            <option value="client">Client (patient)</option>
            <option value="clinician">Clinician</option>
          </select>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
