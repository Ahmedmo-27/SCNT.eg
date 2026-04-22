import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { getRelatedProducts, mapApiProductToSummary } from '../lib/catalogMappers'
import { apiGetData } from '../services/api'
import type { ApiProduct, ProductSummary } from '../types/catalog'
import { Button } from '../components/ui/Button'
import { EightPointStar } from '../components/ui/EightPointStar'
import { ScentPyramid } from '../components/product/ScentPyramid'
import { ProductImageCarousel } from '../components/product/ProductImageCarousel'
import { ProductRecommendations } from '../components/product/ProductRecommendations'
import { StarDivider } from '../components/ui/StarDivider'
import { StarLoader } from '../components/ui/StarLoader'
import { useCartStore } from '../store/cartStore'
import { useWishlistStore } from '../store/wishlistStore'
import { PlaceholderPage } from './PlaceholderPage'
import { useI18n } from '../i18n/I18nContext'
import { formatEgp } from '../lib/formatEgp'

const cardShell =
  'rounded-2xl bg-scnt-bg-elevated/65 p-6 ring-1 ring-scnt-border/90 backdrop-blur-md'

export function ProductPage() {
  const { t, locale } = useI18n()
  const { id } = useParams()
  const { collections, products } = useCatalog()
  const [product, setProduct] = useState<ProductSummary | undefined>()
  const [pending, setPending] = useState(true)
  const addItem = useCartStore((s) => s.addItem)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const isWishlisted = useWishlistStore((s) => (product ? s.hasItem(product.apiId) : false))
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const t = window.setTimeout(() => setJustAdded(false), 2400)
    return () => window.clearTimeout(t)
  }, [justAdded])

  useEffect(() => {
    if (!id) {
      setProduct(undefined)
      setPending(false)
      return
    }
    let cancelled = false
    setPending(true)
    apiGetData<ApiProduct>(`/products/${id}`)
      .then((raw) => {
        if (!cancelled) setProduct(mapApiProductToSummary(raw, locale))
      })
      .catch(() => {
        if (!cancelled) setProduct(undefined)
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, locale])

  if (pending) {
    return (
      <Layout>
        <StarLoader className="py-32" label={t('product.loading')} />
      </Layout>
    )
  }

  if (!product) {
    return (
      <PlaceholderPage title={t('product.notFound')} subtitle={t('product.notFoundSub')} />
    )
  }

  const col = collections.find((x) => x.id === product.collection)
  const accent = col?.accent ?? '#2a2622'
  const related = getRelatedProducts(products, product.id, 3)

  function handleAddToCart() {
    if (!product) return
    addItem({
      productId: product.apiId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.galleryImages[0],
    })
    setJustAdded(true)
  }

  function handleToggleWishlist() {
    if (!product) return
    toggleWishlist({
      productId: product.apiId,
      slug: product.id,
      name: product.name,
      price: product.price,
      image: product.galleryImages[0],
      inspiredBy: product.inspiredBy,
      collection: col?.name ?? product.collection,
    })
  }

  return (
    <Layout collection={product.collection}>
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <nav className="mb-10 text-xs text-scnt-text-muted">
          <Link to="/" className="hover:text-scnt-text">
            {t('product.breadcrumb.home')}
          </Link>
          <span className="mx-2 opacity-40">/</span>
          <Link to="/collections" className="hover:text-scnt-text">
            {t('product.breadcrumb.collections')}
          </Link>
          <span className="mx-2 opacity-40">/</span>
          {col ? (
            <Link
              to={`/collections/${col.id}`}
              className="hover:text-scnt-text"
            >
              {col.name}
            </Link>
          ) : null}
        </nav>

        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-14 xl:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative lg:col-span-7 xl:col-span-8"
          >
            <motion.div
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-90"
              style={{
                background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${accent}2e, transparent 68%), radial-gradient(circle at 50% 88%, rgba(255,255,255,0.5), transparent 45%)`,
              }}
              animate={{
                opacity: [0.85, 1, 0.85],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
            <div
              className="absolute -inset-2 -z-10 rounded-[1.5rem] opacity-50 blur-3xl"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${accent}40, transparent 62%)`,
              }}
              aria-hidden
            />
            <div className={`rounded-2xl bg-scnt-bg-elevated/55 p-3 ring-1 ring-scnt-border/90 backdrop-blur-md sm:p-4`}>
              <ProductImageCarousel
                productId={product.id}
                productName={product.name}
                images={product.galleryImages}
                gradient={product.placeholderGradient}
                accent={accent}
              />

              <div className="px-1 pb-1 pt-6 sm:px-2 sm:pt-8">
                <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
                  {col?.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{product.name}</h1>
                  <span className="rounded-full border border-scnt-border bg-scnt-bg-elevated/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-scnt-text">
                    {product.gender === 'female' ? t('product.forHer') : t('product.forHim')}
                  </span>
                </div>
                <p className="mt-3 text-sm text-scnt-text-muted">
                  <span className="uppercase tracking-[0.2em] text-scnt-text/55">
                    {t('product.inspiredBy')}{' '}
                  </span>
                  {product.inspiredBy}
                </p>
                {col ? (
                  <p className="mt-4 font-serif text-xl italic text-scnt-text-muted sm:text-2xl">
                    {col.heroTagline}
                  </p>
                ) : null}
                <p className="mt-4 text-base leading-relaxed text-scnt-text/90 sm:text-[1.05rem]">
                  {product.vibeSentence}
                </p>

                <div className={`mt-8 ${cardShell}`}>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-scnt-border/90 pb-5">
                    <p className="font-serif text-2xl text-scnt-text">{formatEgp(product.price, locale)}</p>
                    <span className="text-scnt-text/25">·</span>
                    <p className="text-sm text-scnt-text-muted">
                      {t('product.formatEdp')} · {product.volume}
                    </p>
                  </div>
                  <p className="mt-3 text-xs tracking-wide text-scnt-text-muted">
                    {t('product.concHint')}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <Button type="button" onClick={handleAddToCart}>
                        {t('product.addToCart')}
                      </Button>
                      <AnimatePresence>
                        {justAdded ? (
                          <motion.span
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{
                              duration: 0.65,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="pointer-events-none absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-xs text-scnt-text-muted"
                          >
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                            >
                              <EightPointStar size={10} className="opacity-60" />
                            </motion.span>
                            {t('product.addedToast')}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className="inline-flex items-center gap-1.5 text-sm text-scnt-text-muted transition-colors duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] hover:text-scnt-text"
                      aria-label={
                        isWishlisted
                          ? t('pc.rmWishlist', { name: product.name })
                          : t('pc.addWishlist', { name: product.name })
                      }
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={isWishlisted ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21s-7-4.3-9-8.5C1.2 8.5 3.3 5 7 5c2 0 3.4 1 5 3 1.6-2 3-3 5-3 3.7 0 5.8 3.5 4 7.5C19 16.7 12 21 12 21z"
                        />
                      </svg>
                      {isWishlisted ? t('product.savedWishlist') : t('product.addWishlist')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="min-w-0 lg:col-span-5 xl:col-span-4">
            <div className={cardShell}>
              <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">{t('product.scentStory')}</p>
              <p className="mt-4 text-base leading-relaxed text-scnt-text sm:text-[1.05rem]">
                {product.emotionalStory}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-scnt-text-muted">
                <span className="text-scnt-text/80">{t('product.livesLike')} </span>
                {product.lifestyleLine}
              </p>
            </div>

            <StarDivider />

            <div className="mt-0">
              <ScentPyramid
                topNotes={product.topNotes}
                heartNotes={product.heartNotes}
                baseNotes={product.baseNotes}
              />
            </div>
          </div>
        </div>

        <ProductRecommendations
          items={related}
          title={t('product.recTitle')}
          subtitle={t('product.recSub')}
        />
      </div>
    </Layout>
  )
}
