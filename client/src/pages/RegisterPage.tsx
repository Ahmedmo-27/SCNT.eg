import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'

export function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const canGoToStepTwo = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8
  const canSubmit =
    addressLine.trim().length > 0 &&
    city.trim().length > 0 &&
    governorate.trim().length > 0 &&
    postalCode.trim().length > 0

  const onNextStep = () => {
    if (!canGoToStepTwo) return
    setStep(2)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitted(true)
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
            <p className="mt-4 text-scnt-text-muted">Create an account to manage orders and personalize your fragrance journey.</p>
          </header>

          <Card asMotion={false} className="mt-8 p-6 sm:p-8">
            <p className="mb-5 text-center text-xs uppercase tracking-[0.2em] text-scnt-text-muted">
              Step {step} of 2
            </p>
            <form className="space-y-5" onSubmit={onSubmit}>
              {step === 1 ? (
                <>
                  <div>
                    <label htmlFor="name" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                      placeholder="Your full name"
                    />
                  </div>

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
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
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
                      minLength={8}
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <Button type="button" className="w-full" onClick={onNextStep} disabled={!canGoToStepTwo}>
                    Continue to address details
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="addressLine" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                      Address line
                    </label>
                    <input
                      id="addressLine"
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      required
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                      placeholder="Street, building, floor..."
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="city" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label htmlFor="governorate" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                        Governorate
                      </label>
                      <input
                        id="governorate"
                        type="text"
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                        placeholder="Governorate"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                      Postal code
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-scnt-text outline-none transition-colors focus:border-scnt-text/60"
                      placeholder="Postal code"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="w-1/2" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit" className="w-1/2" disabled={!canSubmit}>
                      Create account
                    </Button>
                  </div>
                </>
              )}
            </form>

            {submitted ? (
              <p className="mt-4 rounded-xl border border-scnt-border/70 bg-scnt-bg-muted/60 px-4 py-3 text-sm text-scnt-text-muted">
                Account form submitted. Connect this to your backend registration endpoint next.
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
