import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'
import { useI18n } from '../i18n/I18nContext'
import { verifyEmailWithToken } from '../services/authApi'
import type { AuthUser } from '../services/authApi'

type Phase = 'loading' | 'success' | 'error' | 'missing'

export function VerifyEmailPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState<Phase>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')?.trim() ?? ''
    if (!token) {
      setPhase('missing')
      setMessage(null)
      return
    }

    let cancelled = false
    setPhase('loading')
    setMessage(null)

    verifyEmailWithToken(token)
      .then((data) => {
        if (cancelled) return
        setUser(data)
        setPhase('success')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setPhase('error')
        setMessage(e instanceof Error ? e.message : '')
      })

    return () => {
      cancelled = true
    }
  }, [searchParams])

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-xl">
          <header className="text-center">
            <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
              <EightPointStar size={9} className="opacity-45" />
              {t('verify.kicker')}
            </p>
            <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('verify.title')}</h1>
            <p className="mt-4 text-scnt-text-muted">{t('verify.sub')}</p>
          </header>

          <Card asMotion={false} className="mt-8 p-6 sm:p-8">
            {phase === 'loading' ? (
              <p className="text-center text-scnt-text-muted">{t('verify.working')}</p>
            ) : null}

            {phase === 'success' && user ? (
              <div className="space-y-4 text-center">
                <p className="text-scnt-text">{t('verify.done', { email: user.email })}</p>
                <Button to="/login" className="w-full sm:w-auto">
                  {t('verify.toLogin')}
                </Button>
              </div>
            ) : null}

            {phase === 'missing' ? (
              <div className="space-y-4 text-center">
                <p className="text-scnt-text-muted">{t('verify.noToken')}</p>
                <Button to="/register" variant="outline" className="w-full sm:w-auto">
                  {t('verify.toRegister')}
                </Button>
              </div>
            ) : null}

            {phase === 'error' ? (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-scnt-text" role="alert">
                {message?.trim() ? message : t('verify.fail')}
              </p>
            ) : null}

            {phase === 'error' ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button to="/login" variant="outline">
                  {t('verify.toLogin')}
                </Button>
                <Button to="/" variant="outline">
                  {t('verify.home')}
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </Layout>
  )
}
