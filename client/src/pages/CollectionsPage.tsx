import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n/I18nContext'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'
import { StarLoader } from '../components/ui/StarLoader'

export function CollectionsPage() {
  const { t } = useI18n()
  const { collections, loading } = useCatalog()

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            {t('collections.kicker')}
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('collections.title')}</h1>
          <p className="mt-4 text-lg text-scnt-text-muted">{t('collections.sub')}</p>
        </header>

        <StarDivider className="py-8 sm:py-10" />

        {loading ? (
          <StarLoader className="py-20" label={t('collections.loading')} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.65,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to={`/collections/${c.id}`}
                  className="group flex h-full flex-col justify-between overflow-hidden rounded-xl border border-scnt-border border-t-[3px] bg-scnt-bg-elevated/50 text-left transition-[transform,box-shadow] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_24px_60px_-32px_rgba(42,38,34,0.14)]"
                  style={{ borderTopColor: c.accent }}
                >
                  {c.coverImage ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-scnt-bg-muted/50">
                      <img
                        src={c.coverImage}
                        alt=""
                        className="h-full w-full object-cover transition-[transform,filter] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-between px-5 py-6">
                    <div>
                      <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-scnt-text-muted">
                        {c.code}
                      </p>
                      <h2 className="mt-2 font-serif text-xl text-scnt-text">{c.name}</h2>
                      <p className="mt-2 line-clamp-2 text-xs italic leading-relaxed text-scnt-text/75">
                        {c.subTagline || c.tagline}
                      </p>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs text-scnt-text-muted transition-colors duration-[550ms] group-hover:text-scnt-text">
                      {t('collections.enter')}
                      <EightPointStar size={9} />
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}
