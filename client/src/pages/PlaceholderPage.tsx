import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { useI18n } from '../i18n/I18nContext'
import { EightPointStar } from '../components/ui/EightPointStar'

type PlaceholderPageProps = {
  title: string
  subtitle?: string
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  const { t } = useI18n()
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <p className="mb-4 inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
          <EightPointStar size={9} className="opacity-45" />
          SCNT.eg
        </p>
        <h1 className="font-serif text-4xl text-scnt-text">{title}</h1>
        {subtitle ? (
          <p className="mt-4 text-scnt-text-muted">{subtitle}</p>
        ) : null}
        <p className="mt-10 text-sm text-scnt-text-muted">{t('ph.wip')}</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm text-scnt-text underline-offset-4 transition-opacity hover:opacity-75"
        >
          <EightPointStar size={10} className="opacity-40" />
          {t('ph.back')}
        </Link>
      </div>
    </Layout>
  )
}
