import { Link } from 'react-router-dom'

export function Login() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Log in</h1>
        <p className="auth-subtitle">Sign in with your username and password.</p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
            // Placeholder until backend auth is set up
          }}
        >
          <label className="auth-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            className="auth-input"
            placeholder="Enter username"
            autoComplete="username"
          />

          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="auth-input"
            placeholder="Enter password"
            autoComplete="current-password"
          />

          <button type="submit" className="auth-submit">
            Log in
          </button>
        </form>

        <p className="auth-footer">
          Don’t have an account?{' '}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
