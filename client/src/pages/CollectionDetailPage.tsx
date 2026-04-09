import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { ProductCard } from '../components/product/ProductCard'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'
import { StarLoader } from '../components/ui/StarLoader'
import { parseCollectionIdParam } from '../types/catalog'
import { PlaceholderPage } from './PlaceholderPage'

export function CollectionDetailPage() {
  const { id } = useParams()
  const { collections, products, loading } = useCatalog()
  const collectionId = id ? parseCollectionIdParam(id) : null
  const c = collectionId ? collections.find((x) => x.id === collectionId) : undefined

  if (loading) {
    return (
      <Layout>
        <StarLoader className="py-32" label="Loading collection" />
      </Layout>
    )
  }

  if (!c) {
    return (
      <PlaceholderPage
        title="Collection not found"
        subtitle="This identifier is not part of the house catalogue."
      />
    )
  }

  const line = products.filter((p) => p.collection === c.id)

  return (
    <Layout collection={c.id}>
      <section
        className={`relative border-b border-scnt-border/80 px-5 py-16 sm:px-8 sm:py-24 ${
          c.id === 'icon'
            ? 'text-center'
            : c.id === 'executive'
              ? 'md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center'
              : 'md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)] md:items-center md:gap-10'
        }`}
      >
        <div
          className="absolute inset-0 -z-10 opacity-95"
          style={{
            background:
              c.id === 'executive'
                ? `linear-gradient(180deg, ${c.accentSoft} 0%, transparent 55%)`
                : c.id === 'charmer'
                  ? `radial-gradient(ellipse at 10% 100%, ${c.accentSoft} 0%, transparent 55%)`
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

        <div
          className={`relative mx-auto max-w-6xl ${
            c.id === 'executive'
              ? 'md:col-span-1 md:pr-16'
              : c.id === 'charmer'
                ? 'md:col-span-1 md:pr-10'
                : c.id === 'explorer'
                  ? 'md:col-span-1 md:max-w-xl'
                  : 'md:col-span-2 md:max-w-3xl'
          }`}
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

            {/* Persona identity line */}
            {c.id === 'executive' && (
              <p className="mt-3 max-w-xl text-sm font-medium uppercase tracking-[0.22em] text-scnt-text/70">
                CONTROLLED · DISCIPLINED · PRECISE
              </p>
            )}
            {c.id === 'charmer' && (
              <p className="mt-3 max-w-xl text-sm font-medium uppercase tracking-[0.2em] text-scnt-text/70">
                WARM · INTIMATE · MAGNETIC
              </p>
            )}
            {c.id === 'explorer' && (
              <p className="mt-3 max-w-xl text-sm font-medium uppercase tracking-[0.2em] text-scnt-text/70">
                FREE · RESTLESS · OPEN
              </p>
            )}
            {c.id === 'icon' && (
              <p className="mt-4 text-sm font-medium uppercase tracking-[0.26em] text-scnt-text/80">
                RARE · DELIBERATE · UNMISTAKABLE
              </p>
            )}

            {/* Emotional headline + identity statement */}
            {c.id === 'executive' && (
              <>
                <p className="mt-6 max-w-xl font-serif text-2xl text-scnt-text sm:text-[1.75rem]">
                  Presence without effort.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-scnt-text-muted sm:text-[0.95rem]">
                  Clean lines, quiet authority, and a tailored signature that enters every room
                  before you do.
                </p>
              </>
            )}
            {c.id === 'charmer' && (
              <>
                <p className="mt-6 max-w-xl font-serif text-2xl italic text-scnt-text sm:text-[1.9rem]">
                  Draw them closer.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-scnt-text-muted sm:text-[0.95rem]">
                  Soft candlelight, easy laughter, and skin-close warmth that lingers long after the
                  evening ends.
                </p>
              </>
            )}
            {c.id === 'explorer' && (
              <>
                <p className="mt-6 max-w-xl font-serif text-2xl text-scnt-text sm:text-[1.9rem]">
                  Chase the horizon.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-scnt-text-muted sm:text-[0.95rem]">
                  Salt on your skin, wind in your collar, and a trail that always leads somewhere
                  new.
                </p>
              </>
            )}
            {c.id === 'icon' && (
              <>
                <p className="mt-7 mx-auto max-w-2xl font-serif text-3xl text-scnt-text sm:text-[2.1rem]">
                  Not made to blend in.
                </p>
                <p className="mt-4 mx-auto max-w-xl text-sm leading-relaxed text-scnt-text-muted sm:text-[0.98rem]">
                  Rare, deliberate, unmistakable — a golden signature they will only ever associate
                  with you.
                </p>
              </>
            )}

            {/* World intro as quiet supporting note */}
            <p
              className={`mt-6 text-[0.9rem] leading-relaxed text-scnt-text sm:text-[0.98rem] ${
                c.id === 'icon' ? 'mx-auto max-w-2xl' : 'max-w-2xl'
              }`}
            >
              {c.worldIntro}
            </p>

            <Link
              to="/collections"
              className={`mt-10 inline-flex items-center gap-2 text-sm text-scnt-text-muted underline-offset-4 transition-colors duration-[550ms] hover:text-scnt-text ${
                c.id === 'icon' ? 'justify-center' : ''
              }`}
            >
              All collections
            </Link>
          </motion.div>
        </div>

      </section>

      <StarDivider className="mx-auto max-w-6xl px-5 sm:px-8" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className={`mb-12 ${
            c.id === 'icon' ? 'max-w-3xl text-center' : 'max-w-2xl'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
            In this world
          </p>
          <h2
            className={`mt-2 font-serif text-2xl text-scnt-text sm:text-3xl ${
              c.id === 'icon' ? 'mx-auto' : ''
            }`}
          >
            Bottles that carry the same temperament.
          </h2>
          <p
            className={`mt-3 text-sm text-scnt-text-muted ${
              c.id === 'icon' ? 'mx-auto max-w-2xl' : ''
            }`}
          >
            Each name is a moment — choose the one you want to live inside tonight.
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
