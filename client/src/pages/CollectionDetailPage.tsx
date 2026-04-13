import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n/I18nContext'
import { ProductCard } from '../components/product/ProductCard'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'
import { StarLoader } from '../components/ui/StarLoader'
import { parseCollectionIdParam } from '../types/catalog'
import { PlaceholderPage } from './PlaceholderPage'

export function CollectionDetailPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const { collections, products, loading } = useCatalog()
  const collectionId = id ? parseCollectionIdParam(id) : null
  const c = collectionId ? collections.find((x) => x.id === collectionId) : undefined

  if (loading) {
    return (
      <Layout>
        <StarLoader className="py-32" label={t('col.loading')} />
      </Layout>
    )
  }

  if (!c) {
    return (
      <PlaceholderPage title={t('col.notFound')} subtitle={t('col.notFoundSub')} />
    )
  }

  const line = products.filter((p) => p.collection === c.id)

  const personaKey = `col.persona.${c.id}` as const
  const persona = t(personaKey)

  const headlineBody = (() => {
    if (c.id === 'executive')
      return { head: t('col.exec.head'), body: t('col.exec.body') } as const
    if (c.id === 'charmer') return { head: t('col.charm.head'), body: t('col.charm.body') } as const
    if (c.id === 'explorer') return { head: t('col.expl.head'), body: t('col.expl.body') } as const
    return { head: t('col.icon.head'), body: t('col.icon.body') } as const
  })()

  return (
    <Layout collection={c.id}>
      <section
        className={`relative border-b border-scnt-border/80 py-16 sm:py-24 ${c.id === 'icon' ? 'text-center' : ''}`}
      >
        <div
          className="absolute inset-0 -z-10 opacity-95"
          style={{
            background:
              c.id === 'executive'
                ? `linear-gradient(180deg, ${c.accentSoft} 0%, transparent 55%)`
                : c.id === 'charmer'
                  ? `radial-gradient(ellipse 70% 50% at 88% -8%, rgba(255, 214, 190, 0.14) 0%, transparent 50%), radial-gradient(ellipse at 8% 100%, ${c.accentSoft} 0%, transparent 58%)`
                  : c.id === 'explorer'
                    ? `radial-gradient(ellipse at 50% -10%, ${c.accentSoft} 0%, transparent 60%)`
                    : `linear-gradient(165deg, ${c.accentSoft} 0%, transparent 50%)`,
          }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -right-[18%] top-1/4 -z-10 h-[min(420px,52vw)] w-[min(420px,52vw)] rounded-full opacity-30 blur-3xl md:block"
          style={{
            background:
              c.id === 'charmer'
                ? `radial-gradient(circle, ${c.accent}55, transparent 70%)`
                : c.id === 'explorer'
                  ? `radial-gradient(circle at 40% 0%, ${c.accent}55, transparent 75%)`
                  : c.id === 'icon'
                    ? `radial-gradient(circle, ${c.accent}66, transparent 75%)`
                    : `radial-gradient(circle, ${c.accent}44, transparent 70%)`,
          }}
          aria-hidden
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        {c.id === 'charmer' ? (
          <motion.div
            className="pointer-events-none absolute -left-[14%] bottom-[18%] -z-10 hidden h-[min(360px,48vw)] w-[min(360px,48vw)] rounded-full opacity-[0.22] blur-3xl sm:block"
            style={{
              background: `radial-gradient(circle, rgba(255, 205, 175, 0.35), transparent 72%)`,
            }}
            aria-hidden
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 0.22, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          />
        ) : null}

        <div
          className={`relative mx-auto w-full max-w-6xl px-5 sm:px-8 ${
            c.id === 'icon'
              ? 'flex flex-col items-center'
              : 'md:grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.92fr)] md:items-center md:gap-12 lg:gap-14'
          }`}
        >
          <div
            className={
              c.id === 'executive'
                ? 'md:pe-4 lg:pe-8'
                : c.id === 'charmer'
                  ? 'md:pe-3 lg:pe-6'
                  : c.id === 'explorer'
                    ? 'md:max-w-xl'
                    : 'max-w-3xl'
            }
          >
            <motion.div
              initial={{ opacity: 0, y: c.id === 'explorer' ? 26 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: c.id === 'icon' ? 1.1 : 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
            <p
              className={`mb-4 inline-flex items-center gap-2 text-xs uppercase text-scnt-text-muted ${
                c.id === 'executive'
                  ? 'tracking-[0.32em]'
                  : c.id === 'charmer'
                    ? 'tracking-[0.28em]'
                    : c.id === 'explorer'
                      ? 'tracking-[0.26em]'
                      : 'tracking-[0.34em]'
              } ${c.id === 'icon' ? 'justify-center' : ''}`}
            >
              <EightPointStar size={9} className="opacity-45" />
              {c.code}
            </p>
            <h1
              className={`font-serif text-4xl text-scnt-text sm:text-5xl md:text-[3.15rem] ${
                c.id === 'icon' ? 'mx-auto max-w-3xl' : 'max-w-2xl'
              }`}
            >
              {c.name}
            </h1>

            <p
              className={`mt-3 max-w-xl text-sm font-medium uppercase text-scnt-text/70 ${
                c.id === 'icon' ? 'mx-auto tracking-[0.26em]' : 'tracking-[0.2em] md:tracking-[0.22em]'
              }`}
            >
              {persona}
            </p>

            <p
              className={`mt-6 font-serif text-2xl text-scnt-text sm:text-[1.75rem] md:text-[1.9rem] ${
                c.id === 'charmer' ? 'max-w-xl italic' : 'max-w-xl'
              } ${c.id === 'icon' ? 'mx-auto max-w-2xl text-3xl sm:text-[2.1rem]' : ''}`}
            >
              {headlineBody.head}
            </p>
            <p
              className={`mt-3 max-w-xl text-sm leading-relaxed text-scnt-text-muted sm:text-[0.95rem] ${
                c.id === 'icon' ? 'mx-auto max-w-xl sm:text-[0.98rem]' : ''
              }`}
            >
              {headlineBody.body}
            </p>

            <p
              className={`mt-6 text-[0.9rem] leading-relaxed text-scnt-text sm:text-[0.98rem] ${
                c.id === 'icon' ? 'mx-auto max-w-2xl' : 'max-w-2xl'
              }`}
            >
              {c.worldIntro}
            </p>

            {c.id === 'icon' && c.coverImage ? (
              <motion.div
                className="relative mt-12 w-full max-w-md px-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
              >
                <div className="overflow-hidden rounded-2xl border border-scnt-border/45 shadow-[0_28px_70px_-38px_rgba(42,38,34,0.22)]">
                  <img src={c.coverImage} alt="" className="aspect-[4/5] w-full object-cover" />
                </div>
              </motion.div>
            ) : null}

            <Link
              to="/collections"
              className={`mt-10 inline-flex items-center gap-2 text-sm text-scnt-text-muted underline-offset-4 transition-colors duration-[550ms] hover:text-scnt-text ${
                c.id === 'icon' ? 'justify-center' : ''
              }`}
            >
              {t('col.allCollections')}
            </Link>
            </motion.div>
          </div>
          {c.coverImage && c.id !== 'icon' ? (
            <motion.div
              className="relative mt-12 w-full max-w-md md:mt-0 md:max-w-none md:justify-self-end"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            >
              <div className="mx-auto max-h-[min(520px,62vh)] overflow-hidden rounded-2xl border border-scnt-border/40 shadow-[0_32px_80px_-40px_rgba(42,38,34,0.2)] md:mx-0 md:aspect-[4/5] md:max-h-[min(560px,70vh)]">
                <img src={c.coverImage} alt="" className="h-full min-h-[220px] w-full object-cover sm:min-h-[280px] md:min-h-0" />
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>

      <StarDivider className="mx-auto max-w-6xl px-5 sm:px-8" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className={`mb-12 ${c.id === 'icon' ? 'max-w-3xl text-center' : 'max-w-2xl'}`}
        >
          <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">{t('col.inWorld')}</p>
          <h2
            className={`mt-2 font-serif text-2xl text-scnt-text sm:text-3xl ${
              c.id === 'icon' ? 'mx-auto' : ''
            }`}
          >
            {t('col.bottlesTitle')}
          </h2>
          <p
            className={`mt-3 text-sm text-scnt-text-muted ${c.id === 'icon' ? 'mx-auto max-w-2xl' : ''}`}
          >
            {t('col.bottlesSub')}
          </p>
        </motion.div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {line.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </Layout>
  )
}
