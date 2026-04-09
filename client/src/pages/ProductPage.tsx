import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout } from '../components/layout/Layout'
import { getProductById, getRelatedProducts } from '../data/products'
import { getCollectionById } from '../data/collections'
import { Button } from '../components/ui/Button'
import { EightPointStar } from '../components/ui/EightPointStar'
import { ScentPyramid } from '../components/product/ScentPyramid'
import { ProductImageCarousel } from '../components/product/ProductImageCarousel'
import { ProductRecommendations } from '../components/product/ProductRecommendations'
import { StarDivider } from '../components/ui/StarDivider'
import { useCartStore } from '../store/cartStore'
import { PlaceholderPage } from './PlaceholderPage'

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

const cardShell =
  'rounded-2xl bg-scnt-bg-elevated/65 p-6 ring-1 ring-scnt-border/90 backdrop-blur-md'

export function ProductPage() {
  const { id } = useParams()
  const product = id ? getProductById(id) : undefined
  const addItem = useCartStore((s) => s.addItem)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const t = window.setTimeout(() => setJustAdded(false), 2400)
    return () => window.clearTimeout(t)
  }, [justAdded])

  if (!product) {
    return (
      <PlaceholderPage
        title="Product not found"
        subtitle="This SKU is not in the current catalogue."
      />
    )
  }

  const col = getCollectionById(product.collection)
  const accent = col?.accent ?? '#2a2622'
  const related = getRelatedProducts(product.id, 3)

  function handleAddToCart() {
    if (!product) return
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    })
    setJustAdded(true)
  }

  return (
    <Layout collection={product.collection}>
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <nav className="mb-10 text-xs text-scnt-text-muted">
          <Link to="/" className="hover:text-scnt-text">
            Home
          </Link>
          <span className="mx-2 opacity-40">/</span>
          <Link to="/collections" className="hover:text-scnt-text">
            Collections
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
            className="relative lg:col-span-7 lg:sticky lg:top-28 xl:col-span-8"
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
            <ProductImageCarousel
              productId={product.id}
              productName={product.name}
              images={product.galleryImages}
              gradient={product.placeholderGradient}
              accent={accent}
            />
          </motion.div>

          <div className="min-w-0 lg:col-span-5 xl:col-span-4">
            <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
              {col?.name}
            </p>
            <h1 className="mt-3 font-serif text-4xl text-scnt-text sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 text-sm text-scnt-text-muted">
              <span className="uppercase tracking-[0.2em] text-scnt-text/55">
                Inspired by{' '}
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
                <p className="font-serif text-2xl text-scnt-text">{formatEgp(product.price)}</p>
                <span className="text-scnt-text/25">·</span>
                <p className="text-sm text-scnt-text-muted">
                  {product.format} · {product.volume}
                </p>
              </div>
              <p className="mt-3 text-xs tracking-wide text-scnt-text-muted">
                {product.concentrationHint}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Button type="button" onClick={handleAddToCart}>
                    Add to cart
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
                        Added — yours to wear
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <Link
                  to="/cart"
                  className="text-sm text-scnt-text-muted transition-colors duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] hover:text-scnt-text"
                >
                  View cart
                </Link>
              </div>
            </div>

            <div className={`mt-8 ${cardShell}`}>
              <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
                Scent story
              </p>
              <p className="mt-4 text-base leading-relaxed text-scnt-text sm:text-[1.05rem]">
                {product.emotionalStory}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-scnt-text-muted">
                <span className="text-scnt-text/80">Lives like this: </span>
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

        <ProductRecommendations items={related} />
      </div>
    </Layout>
  )
}
