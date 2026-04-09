import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { collections, type CollectionId } from '../data/collections'
import { products } from '../data/products'
import { ProductCard } from '../components/product/ProductCard'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'

const grid = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}

const cell = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function isCollectionId(v: string | null): v is CollectionId {
  return v !== null && collections.some((c) => c.id === v)
}

export function ShopAllPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterRaw = searchParams.get('collection')
  const filter = isCollectionId(filterRaw) ? filterRaw : null

  const visible = useMemo(
    () => (filter ? products.filter((p) => p.collection === filter) : products),
    [filter],
  )

  const setFilter = (next: CollectionId | null) => {
    if (next === null) {
      setSearchParams({})
    } else {
      setSearchParams({ collection: next })
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            Catalogue
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">Shop all</h1>
          <p className="mt-4 text-lg text-scnt-text-muted">
            Every bottle in the house — filter by line, or wander the full grid.
          </p>
          <p className="mt-2 text-sm text-scnt-text/60">
            {visible.length === products.length
              ? `${products.length} fragrances`
              : `${visible.length} in this line · ${products.length} total`}
          </p>
        </header>

        <StarDivider className="py-8 sm:py-10" />

        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">Filter by line</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter(null)}
              aria-pressed={filter === null}
              className={`rounded-full border px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] transition-[background-color,border-color,color,box-shadow] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                filter === null
                  ? 'border-scnt-text bg-scnt-text text-scnt-bg shadow-[0_12px_32px_-18px_rgba(42,38,34,0.35)]'
                  : 'border-scnt-border/80 bg-scnt-bg-elevated/40 text-scnt-text-muted hover:border-scnt-text/25 hover:text-scnt-text'
              }`}
            >
              All
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                aria-pressed={filter === c.id}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] transition-[background-color,border-color,color,box-shadow] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  filter === c.id
                    ? 'text-scnt-bg shadow-[0_12px_32px_-18px_rgba(42,38,34,0.22)]'
                    : 'border-scnt-border/80 bg-scnt-bg-elevated/40 text-scnt-text-muted hover:border-scnt-text/25 hover:text-scnt-text'
                }`}
                style={
                  filter === c.id
                    ? { borderColor: c.accent, backgroundColor: c.accent }
                    : undefined
                }
              >
                {c.name.replace(/^The /, '')}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-scnt-text-muted">Nothing in this line yet.</p>
        ) : (
          <motion.div
            key={filter ?? 'all'}
            variants={grid}
            initial="hidden"
            animate="show"
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10"
          >
            {visible.map((p) => (
              <motion.div key={p.id} variants={cell}>
                <ProductCard product={p} entrance={false} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <p className="mt-14 text-center text-sm text-scnt-text-muted">
          Prefer to choose by temperament?{' '}
          <Link to="/collections" className="text-scnt-text underline-offset-4 transition-colors hover:underline">
            Browse collections
          </Link>
        </p>
      </div>
    </Layout>
  )
}
