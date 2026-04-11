import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'
import { useI18n } from '../i18n/I18nContext'

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-scnt-border/60 pb-1 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-left font-medium text-scnt-text [-webkit-details-marker]:hidden [&::-webkit-details-marker]:hidden">
        <span className="text-base leading-snug sm:text-[1.05rem]">{question}</span>
        <span className="mt-0.5 shrink-0 text-scnt-text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <div className="pb-5 pt-0 pe-8 ps-0 text-sm leading-relaxed text-scnt-text-muted">{answer}</div>
    </details>
  )
}

export function FaqPage() {
  const { t } = useI18n()

  const faqs = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        question: t(`faq.q${n}`),
        answer: t(`faq.a${n}`),
      })),
    [t],
  )

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            {t('faq.kicker')}
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('faq.title')}</h1>
          <p className="mt-4 text-lg text-scnt-text-muted">
            {t('faq.sub.before')}{' '}
            <Link to="/contact" className="text-scnt-text underline-offset-4 hover:underline">
              {t('faq.sub.link')}
            </Link>
            {t('faq.sub.after')}
          </p>
        </header>

        <StarDivider className="py-8 sm:py-10" />

        <Card asMotion={false} className="mx-auto max-w-3xl px-6 py-2 sm:px-10 sm:py-4">
          {faqs.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </Card>

        <p className="mx-auto mt-14 max-w-2xl text-center text-sm text-scnt-text-muted">
          <Link
            to="/"
            className="inline-flex items-center gap-2 underline-offset-4 transition-opacity hover:opacity-75"
          >
            <EightPointStar size={10} className="opacity-40" />
            {t('faq.back')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
