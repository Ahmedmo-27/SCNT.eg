import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { mapApiProductToSummary } from '../lib/catalogMappers'
import { parseCollectionIdParam, type ApiProductListResponse, type CollectionId, type ProductSummary } from '../types/catalog'
import { apiGetData } from '../services/api'
import { ProductCard } from '../components/product/ProductCard'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'
import { StarLoader } from '../components/ui/StarLoader'

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

function collectionFilter(v: string | null): CollectionId | null {
  if (v === null) return null
  return parseCollectionIdParam(v)
}

export function ShopAllPage() {
  const { collections, products, loading } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterRaw = searchParams.get('collection')
  const filter = collectionFilter(filterRaw)
  const qRaw = searchParams.get('q')
  const qParam = qRaw?.trim() ?? ''

  const [shopQueryResults, setShopQueryResults] = useState<ProductSummary[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (!qParam) {
      setShopQueryResults([])
      setSearchLoading(false)
      return
    }
    let cancelled = false
    setSearchLoading(true)
    apiGetData<ApiProductListResponse>(`/products?q=${encodeURIComponent(qParam)}&limit=48&page=1`)
      .then((data) => {
        if (!cancelled) setShopQueryResults(data.items.map(mapApiProductToSummary))
      })
      .catch(() => {
        if (!cancelled) setShopQueryResults([])
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [qParam])

  const catalogueList = qParam ? shopQueryResults : products

  const visible = useMemo(
    () => (filter ? catalogueList.filter((p) => p.collection === filter) : catalogueList),
    [filter, catalogueList],
  )

  const gridLoading = loading || (qParam !== '' && searchLoading)

  const setFilter = (next: CollectionId | null) => {
    const nextParams = new URLSearchParams(searchParams)
    if (next === null) {
      nextParams.delete('collection')
    } else {
      nextParams.set('collection', next)
    }
    setSearchParams(nextParams)
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
            {gridLoading
              ? qParam
                ? 'Searching catalogue…'
                : 'Loading catalogue…'
              : qParam
                ? visible.length === catalogueList.length
                  ? `${visible.length} match${visible.length === 1 ? '' : 'es'} for “${qParam}”`
                  : `${visible.length} in this line · ${catalogueList.length} matches`
                : visible.length === products.length
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

        {gridLoading ? (
          <StarLoader className="py-20" label={qParam ? 'Searching' : 'Loading shop'} />
        ) : visible.length === 0 ? (
          <p className="text-sm text-scnt-text-muted">
            {qParam ? `No products found for “${qParam}”.` : 'Nothing in this line yet.'}
          </p>
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
