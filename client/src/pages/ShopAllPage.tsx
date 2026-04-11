import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n/I18nContext'
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

function genderFilter(v: string | null): ProductSummary['gender'] | null {
  if (v === null) return null
  const s = v.trim().toLowerCase()
  return s === 'male' || s === 'female' ? (s as ProductSummary['gender']) : null
}

export function ShopAllPage() {
  const { t, locale } = useI18n()
  const { collections, products, loading } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterRaw = searchParams.get('collection')
  const filter = collectionFilter(filterRaw)
  const genderRaw = searchParams.get('gender')
  const gender = genderFilter(genderRaw)
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
    const params = new URLSearchParams({
      q: qParam,
      limit: '48',
      page: '1',
    })
    if (gender) params.set('gender', gender)
    apiGetData<ApiProductListResponse>(`/products?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setShopQueryResults(data.items.map((item) => mapApiProductToSummary(item, locale)))
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
  }, [qParam, gender, locale])

  const catalogueList = qParam ? shopQueryResults : products

  const visible = useMemo(() => {
    const gendered = gender ? catalogueList.filter((p) => p.gender === gender) : catalogueList
    return filter ? gendered.filter((p) => p.collection === filter) : gendered
  }, [filter, gender, catalogueList])

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

  const setGender = (next: ProductSummary['gender'] | null) => {
    const nextParams = new URLSearchParams(searchParams)
    if (next === null) {
      nextParams.delete('gender')
    } else {
      nextParams.set('gender', next)
    }
    setSearchParams(nextParams)
  }

  const statusLine = (() => {
    if (gridLoading) {
      return qParam ? t('shop.searchingCat') : t('shop.loadingCat')
    }
    if (qParam) {
      if (visible.length === catalogueList.length) {
        return visible.length === 1
          ? t('shop.matchOne', { n: String(visible.length), q: qParam })
          : t('shop.matchMany', { n: String(visible.length), q: qParam })
      }
      return t('shop.lineMatches', { v: String(visible.length), t: String(catalogueList.length) })
    }
    if (visible.length === products.length) {
      return t('shop.frags', { n: String(products.length) })
    }
    return t('shop.lineTotal', { v: String(visible.length), t: String(products.length) })
  })()

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <header className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            {t('shop.kicker')}
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('shop.title')}</h1>
          <p className="mt-4 text-lg text-scnt-text-muted">{t('shop.sub')}</p>
          <p className="mt-2 text-sm text-scnt-text/60">{statusLine}</p>
        </header>

        <StarDivider className="py-8 sm:py-10" />

        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
              {t('shop.filterLine')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
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
                {t('shop.all')}
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

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
              {t('shop.filterGender')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGender(null)}
                aria-pressed={gender === null}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] transition-[background-color,border-color,color,box-shadow] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  gender === null
                    ? 'border-scnt-text bg-scnt-text text-scnt-bg shadow-[0_12px_32px_-18px_rgba(42,38,34,0.35)]'
                    : 'border-scnt-border/80 bg-scnt-bg-elevated/40 text-scnt-text-muted hover:border-scnt-text/25 hover:text-scnt-text'
                }`}
              >
                {t('shop.all')}
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                aria-pressed={gender === 'male'}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] transition-[background-color,border-color,color,box-shadow] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  gender === 'male'
                    ? 'border-scnt-text bg-scnt-text text-scnt-bg shadow-[0_12px_32px_-18px_rgba(42,38,34,0.35)]'
                    : 'border-scnt-border/80 bg-scnt-bg-elevated/40 text-scnt-text-muted hover:border-scnt-text/25 hover:text-scnt-text'
                }`}
              >
                {t('shop.male')}
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                aria-pressed={gender === 'female'}
                className={`rounded-full border px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] transition-[background-color,border-color,color,box-shadow] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  gender === 'female'
                    ? 'border-scnt-text bg-scnt-text text-scnt-bg shadow-[0_12px_32px_-18px_rgba(42,38,34,0.35)]'
                    : 'border-scnt-border/80 bg-scnt-bg-elevated/40 text-scnt-text-muted hover:border-scnt-text/25 hover:text-scnt-text'
                }`}
              >
                {t('shop.female')}
              </button>
            </div>
          </div>
        </div>

        {gridLoading ? (
          <StarLoader className="py-20" label={qParam ? t('shop.searching') : t('shop.loadingShop')} />
        ) : visible.length === 0 ? (
          <p className="text-sm text-scnt-text-muted">
            {qParam ? t('shop.noFor', { q: qParam }) : t('shop.emptyLine')}
          </p>
        ) : (
          <motion.div
            key={`${filter ?? 'all'}-${gender ?? 'all'}`}
            variants={grid}
            initial="hidden"
            animate="show"
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10"
          >
            {visible.map((p) => (
              <motion.div key={p.id} variants={cell}>
                <ProductCard product={p} entrance={false} carousel />
              </motion.div>
            ))}
          </motion.div>
        )}

        <p className="mt-14 text-center text-sm text-scnt-text-muted">
          {t('shop.prefer')}{' '}
          <Link to="/collections" className="text-scnt-text underline-offset-4 transition-colors hover:underline">
            {t('shop.browseCol')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
