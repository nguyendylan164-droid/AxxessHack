import { Link } from 'react-router-dom'

export function SignUp() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign up</h1>
        <p className="auth-subtitle">Create an account. (Form coming soon.)</p>

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
