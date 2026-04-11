import { useLocation } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { EightPointStar } from '../components/ui/EightPointStar'
import { useI18n } from '../i18n/I18nContext'

export function NotFoundPage() {
  const { t } = useI18n()
  const { pathname } = useLocation()

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
        <p className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
          <EightPointStar size={9} className="opacity-45" />
          {t('notFound.kicker')}
        </p>
        <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('notFound.title')}</h1>
        <p className="mt-5 max-w-md text-scnt-text-muted">{t('notFound.sub')}</p>
        <p className="mt-6 max-w-full break-all text-xs text-scnt-text-muted/80">
          <span className="font-medium text-scnt-text-muted">{t('notFound.pathLabel')}</span>{' '}
          <code className="rounded-md bg-scnt-bg-elevated/60 px-1.5 py-0.5 font-mono text-[0.7rem] text-scnt-text-muted sm:text-xs">
            {pathname}
          </code>
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <Button to="/">{t('notFound.home')}</Button>
          <Button to="/shop" variant="outline">
            {t('notFound.shop')}
          </Button>
        </div>
      </div>
    </Layout>
  )
}
