import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { useI18n } from '../i18n/I18nContext'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'

const INSTAGRAM_USER = 'scnt.eg'
const EMAIL = 'scnt.eg.fragrances@gmail.com'
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USER}/`

export function ContactPage() {
  const { t } = useI18n()
  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            {t('contact.kicker')}
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('contact.title')}</h1>
          <p className="mt-4 text-lg text-scnt-text-muted">{t('contact.sub')}</p>
        </header>

        <StarDivider className="py-8 sm:py-10" />

        <ul className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          <motion.li
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/20 focus-visible:ring-offset-2 focus-visible:ring-offset-scnt-bg"
            >
              <Card
                asMotion={false}
                className="h-full p-8 transition-[transform,box-shadow] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_24px_60px_-32px_rgba(42,38,34,0.14)]"
              >
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-scnt-text-muted">
                  {t('contact.ig')}
                </p>
                <p className="mt-3 font-serif text-2xl text-scnt-text">@{INSTAGRAM_USER}</p>
                <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted">{t('contact.igBody')}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs text-scnt-text-muted">
                  {t('contact.openIg')}
                  <EightPointStar size={9} />
                </span>
              </Card>
            </a>
          </motion.li>

          <motion.li
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <a
              href={`mailto:${EMAIL}`}
              className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/20 focus-visible:ring-offset-2 focus-visible:ring-offset-scnt-bg"
            >
              <Card
                asMotion={false}
                className="h-full p-8 transition-[transform,box-shadow] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_24px_60px_-32px_rgba(42,38,34,0.14)]"
              >
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-scnt-text-muted">
                  {t('contact.email')}
                </p>
                <p className="mt-3 break-all font-serif text-xl text-scnt-text sm:text-2xl">{EMAIL}</p>
                <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted">{t('contact.emailBody')}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs text-scnt-text-muted">
                  {t('contact.send')}
                  <EightPointStar size={9} />
                </span>
              </Card>
            </a>
          </motion.li>
        </ul>

        <p className="mx-auto mt-14 max-w-2xl text-center text-sm text-scnt-text-muted">
          <Link
            to="/"
            className="inline-flex items-center gap-2 underline-offset-4 transition-opacity hover:opacity-75"
          >
            <EightPointStar size={10} className="opacity-40" />
            {t('contact.back')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
