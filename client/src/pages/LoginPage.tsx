import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'
import { setStoredAuthToken } from '../lib/authStorage'
import { login as loginRequest } from '../services/authApi'

type LoginLocationState = { from?: string }

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as LoginLocationState | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await loginRequest({
        email: email.trim(),
        password,
      })
      setStoredAuthToken(token)
      const destination =
        returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/profile'
      navigate(destination, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-xl">
          <header className="text-center">
            <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
              <EightPointStar size={9} className="opacity-45" />
              Welcome Back
            </p>
            <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">Login</h1>
            <p className="mt-4 text-scnt-text-muted">Sign in to view your profile, orders, and saved addresses.</p>
          </header>

          <Card asMotion={false} className="mt-8 p-6 sm:p-8">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60 disabled:opacity-60"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60 disabled:opacity-60"
                  placeholder="Enter your password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-scnt-text" role="alert">
                {error}
              </p>
            ) : null}
          </Card>

          <p className="mt-6 text-center text-sm text-scnt-text-muted">
            New here?{' '}
            <Link to="/register" className="text-scnt-text underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
