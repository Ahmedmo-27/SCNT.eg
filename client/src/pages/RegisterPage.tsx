import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'
import { EGYPT_GOVERNORATES, getCitiesForGovernorate } from '../data/egyptLocations'
import { setStoredAuthToken } from '../lib/authStorage'
import { registerAccount, type RegisterPayload } from '../services/authApi'

const locationSelectClass =
  'w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60 disabled:cursor-not-allowed disabled:opacity-50'

const step1LabelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-scnt-text/92'
const step1InputClass =
  'w-full rounded-xl border border-scnt-border/85 bg-scnt-bg-elevated/55 px-4 py-3 text-scnt-text shadow-[0_1px_2px_rgba(42,38,34,0.06)] outline-none transition-[border-color,box-shadow] placeholder:text-scnt-text-muted/70 focus:border-scnt-text/40 focus:ring-1 focus:ring-scnt-text/10'

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cityOptions = useMemo(() => getCitiesForGovernorate(governorate), [governorate])

  const canGoToStepTwo = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8

  const buildPayload = (includeAddressFields: boolean): RegisterPayload => {
    const full_name = name.trim()
    const payload: RegisterPayload = {
      full_name,
      email: email.trim(),
      password,
    }
    if (!includeAddressFields) return payload
    const line = addressLine.trim()
    const c = city.trim()
    const g = governorate.trim()
    const pc = postalCode.trim()
    const ph = phone.trim()
    if (!line && !c && !g && !pc && !ph) return payload
    payload.address = {
      fullName: full_name,
      phone: ph || undefined,
      addressLine1: line || undefined,
      city: c || undefined,
      addressLine2: g || undefined,
      postalCode: pc || undefined,
    }
    return payload
  }

  const runRegister = async (includeAddressFields: boolean) => {
    if (!canGoToStepTwo || loading) return
    setError(null)
    setLoading(true)
    try {
      const { token } = await registerAccount(buildPayload(includeAddressFields))
      setStoredAuthToken(token)
      navigate('/profile', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const onNextStep = () => {
    if (!canGoToStepTwo) return
    setStep(2)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runRegister(true)
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-xl">
          <header className="text-center">
            <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
              <EightPointStar size={9} className="opacity-45" />
              Join SCNT.eg
            </p>
            <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">Create Account</h1>
            <p className={`mx-auto mt-4 max-w-md ${step === 1 ? 'text-scnt-text/88' : 'text-scnt-text-muted'}`}>
              Create an account to manage orders and personalize your fragrance journey.
            </p>
          </header>

          <Card asMotion={false} className="mt-8 p-6 sm:p-8">
            <p
              className={`mb-5 text-center text-xs uppercase tracking-[0.2em] ${
                step === 1 ? 'font-semibold text-scnt-text' : 'text-scnt-text-muted'
              }`}
            >
              Step {step} of 2
            </p>
            <form className="space-y-5" onSubmit={onSubmit}>
              {step === 1 ? (
                <>
                  <div>
                    <label htmlFor="name" className={step1LabelClass}>
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={step1InputClass}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={step1LabelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={step1InputClass}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className={step1LabelClass}>
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className={step1InputClass}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <Button type="button" className="w-full" onClick={onNextStep} disabled={!canGoToStepTwo || loading}>
                    Continue to address details
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-scnt-text-muted">
                    Delivery address is optional. You can skip and add it later at checkout or on your profile.
                  </p>

                  <div>
                    <label htmlFor="addressLine" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                      Address line <span className="font-normal normal-case tracking-normal text-scnt-text-muted/80">(optional)</span>
                    </label>
                    <input
                      id="addressLine"
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                      placeholder="Street, building, floor..."
                    />
                  </div>

                  <div>
                    <label htmlFor="regPhone" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                      Phone <span className="font-normal normal-case tracking-normal text-scnt-text-muted/80">(optional)</span>
                    </label>
                    <input
                      id="regPhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                      placeholder="01xxxxxxxxx"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="governorate" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                        Governorate <span className="font-normal normal-case tracking-normal text-scnt-text-muted/80">(optional)</span>
                      </label>
                      <select
                        id="governorate"
                        value={governorate}
                        onChange={(e) => {
                          setGovernorate(e.target.value)
                          setCity('')
                        }}
                        className={locationSelectClass}
                      >
                        <option value="">Select governorate</option>
                        {EGYPT_GOVERNORATES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="city" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                        City <span className="font-normal normal-case tracking-normal text-scnt-text-muted/80">(optional)</span>
                      </label>
                      <select
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!governorate}
                        className={locationSelectClass}
                      >
                        <option value="">{governorate ? 'Select city' : 'Select governorate first'}</option>
                        {cityOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                      Postal code <span className="font-normal normal-case tracking-normal text-scnt-text-muted/80">(optional)</span>
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                      placeholder="Postal code"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button type="button" variant="outline" className="w-full sm:w-auto sm:flex-1" onClick={() => setStep(1)} disabled={loading}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto sm:flex-1"
                      onClick={() => void runRegister(false)}
                      disabled={loading}
                    >
                      Skip address and create account
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto sm:flex-[1.2]" disabled={loading}>
                      {loading ? 'Creating account…' : 'Create account'}
                    </Button>
                  </div>
                </>
              )}
            </form>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-scnt-text" role="alert">
                {error}
              </p>
            ) : null}
          </Card>

          <p className="mt-6 text-center text-sm text-scnt-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-scnt-text underline-offset-4 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
