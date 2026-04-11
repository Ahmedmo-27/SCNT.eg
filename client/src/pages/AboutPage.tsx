import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { useI18n } from '../i18n/I18nContext'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'

const ease = [0.22, 1, 0.36, 1] as const

export function AboutPage() {
  const { t } = useI18n()
  return (
    <Layout>
      <div className="flex flex-col">
        <div className="flex min-h-0 items-center justify-center px-4 py-6 sm:px-5 md:min-h-[min(34vh,18rem)] md:py-0">
          <h1 className="m-0 w-full max-w-md text-balance text-center font-serif text-3xl leading-snug tracking-tight text-scnt-text sm:max-w-xl sm:text-4xl md:max-w-none md:text-[clamp(0.7rem,2.85vw+0.2rem,2.85rem)] md:leading-none md:whitespace-nowrap">
            {t('about.title')}
          </h1>
        </div>

        <div className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
          <StarDivider className="pt-2 pb-6 md:py-10" />

          <div className="mx-auto max-w-2xl space-y-12">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease }}
              className="space-y-5 text-base leading-relaxed text-scnt-text-muted"
            >
              <p>{t('about.p1')}</p>
              <p>{t('about.p2')}</p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.06, ease }}
              className="space-y-4"
            >
              <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{t('about.missionTitle')}</h2>
              <p className="text-base leading-relaxed text-scnt-text-muted">{t('about.missionBody')}</p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease }}
              className="space-y-4"
            >
              <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{t('about.philoTitle')}</h2>
              <p className="text-base leading-relaxed text-scnt-text-muted">{t('about.philoBody')}</p>
            </motion.section>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.18, ease }}
              className="border-t border-scnt-border pt-10 font-serif text-xl italic leading-snug text-scnt-text sm:text-2xl"
            >
              {t('about.tagline')}
            </motion.p>
          </div>

          <p className="mx-auto mt-14 max-w-2xl text-center text-sm text-scnt-text-muted">
            <Link
              to="/"
              className="inline-flex items-center gap-2 underline-offset-4 transition-opacity hover:opacity-75"
            >
              <EightPointStar size={10} className="opacity-40" />
              {t('about.back')}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
