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
      <div className="relative border-b border-scnt-border/80 px-5 py-16 sm:px-8 sm:py-24">
        <div
          className="absolute inset-0 -z-10 opacity-95"
          style={{
            background: `linear-gradient(185deg, ${c.accentSoft} 0%, transparent 58%)`,
          }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -right-[20%] top-1/4 -z-10 h-[min(380px,50vw)] w-[min(380px,50vw)] rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${c.accent}44, transparent 70%)`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
              <EightPointStar size={9} className="opacity-45" />
              {c.code}
            </p>
            <h1 className="max-w-2xl font-serif text-4xl text-scnt-text sm:text-5xl md:text-[3.15rem]">
              {c.name}
            </h1>
            <p className="mt-4 max-w-xl font-serif text-xl italic text-scnt-text-muted sm:text-2xl">
              {c.subTagline || c.tagline}
            </p>
            {c.subTagline ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-scnt-text-muted sm:text-base">
                {c.tagline}
              </p>
            ) : null}
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-scnt-text sm:text-[1.05rem]">
              {c.worldIntro}
            </p>
            {c.id === 'executive' && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-scnt-text-muted">
                Executive dresses your day in a tailored suit and tie — clean lines, confident
                shoulders, and a quiet power that enters every room before you do.
              </p>
            )}
            {c.id === 'charmer' && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-scnt-text-muted">
                Charmer feels like a warm date night in a bottle — soft candlelight, easy laughter,
                and skin-close warmth that lingers long after the evening ends.
              </p>
            )}
            {c.id === 'explorer' && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-scnt-text-muted">
                Explorer is charged with adventure and sea breeze — salt-kissed air, sun on your
                back, and the thrill of taking the next unknown turn.
              </p>
            )}
            {c.id === 'icon' && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-scnt-text-muted">
                Icon is made for the one-of-a-kind person — magnetic, unmistakable, and remembered
                long after everyone else fades into the background.
              </p>
            )}
            <Link
              to="/collections"
              className="mt-10 inline-flex items-center gap-2 text-sm text-scnt-text-muted underline-offset-4 transition-colors duration-[550ms] hover:text-scnt-text"
            >
              All collections
            </Link>
          </motion.div>
        </div>
      </div>

      <StarDivider className="mx-auto max-w-6xl px-5 sm:px-8" />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
            In this line
          </p>
          <h2 className="mt-2 font-serif text-2xl text-scnt-text sm:text-3xl">
            Bottles that carry the same temperament.
          </h2>
          <p className="mt-3 text-sm text-scnt-text-muted">
            Each name is a moment — choose the one you want to live in.
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
