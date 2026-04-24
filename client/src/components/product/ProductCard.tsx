import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { getCollectionVivid } from '../../data/collectionThemes'
import { hexToRgba, tintedBeigeGlass } from '../../lib/colorUtils'
import { useCartStore } from '../../store/cartStore'
import type { CollectionId } from '../../types/catalog'
import type { ProductSummary } from '../../types/catalog'
import { productImageFrameFull, productImageFrameTop } from './productImageFrame'
import { useCollectionVisual } from '../../context/CollectionVisualContext'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n/I18nContext'
import { formatEgp } from '../../lib/formatEgp'
import { useWishlistStore } from '../../store/wishlistStore'

type ProductCardProps = {
  product: ProductSummary
  /** Disable scroll reveal when parent handles stagger (e.g. home best sellers). */
  entrance?: boolean
  /** Enable image carousel controls/swipe on the card media. */
  carousel?: boolean
}

export function ProductCard({ product, entrance = true, carousel = false }: ProductCardProps) {
  const { t, locale } = useI18n()
  const isRtl = locale === 'ar'
  const { collections } = useCatalog()
  const addItem = useCartStore((s) => s.addItem)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const isWishlisted = useWishlistStore((s) => s.hasItem(product.apiId))
  const col = collections.find((c) => c.id === product.collection)
  const [g0, g1] = product.placeholderGradient
  const [imageIndex, setImageIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const swipeThresholdPx = 48
  const imagesCount = product.galleryImages.length
  const accent = col?.accent ?? '#2a2622'
  const vivid = getCollectionVivid(product.collection as CollectionId)
  const sweepBg = `linear-gradient(100deg, transparent 5%, ${hexToRgba(
    vivid,
    0.5,
  )} 50%, transparent 95%)`

  const currentCollectionId = product.collection as CollectionId
  const { accentDeep } = useCollectionVisual()

  const isExecutive = currentCollectionId === 'executive'
  const isCharmer = currentCollectionId === 'charmer'
  const isExplorer = currentCollectionId === 'explorer'
  const isIcon = currentCollectionId === 'icon'

  const hoverY =
    isExecutive || isIcon
      ? -6
      : isExplorer
        ? -4
        : -5

  useEffect(() => {
    setImageIndex(0)
  }, [product.id])

  const goImage = useCallback(
    (delta: number) => {
      setImageIndex((i) => (i + delta + imagesCount) % imagesCount)
    },
    [imagesCount],
  )
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), 1800)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  function handleAddToCart() {
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
    <motion.article
      layout
      initial={entrance ? { opacity: 0, y: 22 } : false}
      whileInView={entrance ? { opacity: 1, y: 0 } : undefined}
      viewport={entrance ? { once: true, margin: '-40px' } : undefined}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: hoverY,
        x: isExplorer ? 2 : 0,
      }}
      className={`group ${
        isIcon ? 'lg:col-span-1' : ''
      }`}
    >
      <div
        className={`group/card relative block overflow-hidden border border-[rgba(42,38,34,0.1)] backdrop-blur-md transition-[box-shadow,transform] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] ${
          isExecutive
            ? 'hover:shadow-[0_28px_88px_-40px_rgba(10,24,44,0.9)]'
            : isCharmer
              ? 'hover:shadow-[0_32px_90px_-44px_rgba(64,18,32,0.95)]'
              : isExplorer
                ? 'hover:shadow-[0_32px_90px_-44px_rgba(4,40,60,0.9)]'
                : 'hover:shadow-[0_36px_96px_-48px_rgba(42,38,34,0.95)]'
        } ${productImageFrameFull}`}
        style={{
          background: tintedBeigeGlass(accent),
          boxShadow: isIcon
            ? `0 22px 60px -36px ${accentDeep}26`
            : `0 18px 50px -32px ${accent}14`,
        }}
      >
        <Link to={`/product/${product.id}`} className="block">
          <div
            className={`relative aspect-scnt-product w-full overflow-hidden ${productImageFrameTop}`}
            style={{
              background: `linear-gradient(145deg, ${g0}, ${g1})`,
            }}
            onTouchStart={
              carousel && imagesCount > 1
                ? (e) => {
                    const t = e.touches[0]
                    touchStartX.current = t.clientX
                    touchStartY.current = t.clientY
                  }
                : undefined
            }
            onTouchEnd={
              carousel && imagesCount > 1
                ? (e) => {
                    if (touchStartX.current === null || touchStartY.current === null) return
                    const t = e.changedTouches[0]
                    const deltaX = t.clientX - touchStartX.current
                    const deltaY = t.clientY - touchStartY.current

                    touchStartX.current = null
                    touchStartY.current = null

                    if (Math.abs(deltaX) < swipeThresholdPx) return
                    if (Math.abs(deltaX) <= Math.abs(deltaY)) return

                    goImage(deltaX < 0 ? (isRtl ? -1 : 1) : isRtl ? 1 : -1)
                  }
                : undefined
            }
          >
            {/* Studio rim — soft highlight like glass under light */}
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background: `linear-gradient(200deg, rgba(255,255,255,0.35) 0%, transparent 42%, rgba(42,38,34,0.06) 100%)`,
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] group-hover:opacity-100"
              style={{
                background: isExecutive
                  ? `linear-gradient(180deg, transparent 30%, ${accent}45 100%)`
                  : isCharmer
                    ? `radial-gradient(circle at 50% 115%, ${accent}50, transparent 60%)`
                    : isExplorer
                      ? `radial-gradient(circle at 50% 115%, ${accent}38, transparent 65%)`
                      : `radial-gradient(circle at 50% 118%, ${accentDeep}40, transparent 62%)`,
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] group-hover:opacity-100"
              style={{
                background: isCharmer
                  ? `radial-gradient(circle at 30% 15%, rgba(255,255,255,0.32), transparent 48%)`
                  : isExplorer
                    ? `radial-gradient(circle at 20% 10%, rgba(255,255,255,0.22), transparent 50%)`
                    : isIcon
                      ? `radial-gradient(circle at 10% 0%, rgba(255,255,255,0.4), transparent 55%)`
                      : `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 45%)`,
              }}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-0 z-[3] translate-x-[-125%] skew-x-[-12deg] opacity-0 mix-blend-overlay transition-[transform,opacity] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] group-hover/card:translate-x-[125%] group-hover/card:opacity-100"
              style={{ background: sweepBg }}
              aria-hidden
            />
            <div
              className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${productImageFrameTop}`}
            >
              <picture>
                <source srcSet={product.galleryImages[imageIndex]} type="image/png" />
                <img
                  src={product.galleryImages[imageIndex]}
                  alt=""
                  className="block h-full w-full object-contain object-center transition-[transform,filter] duration-700 ease-out group-hover/card:scale-105"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </picture>
            </div>
            {carousel && imagesCount > 1 && (
              <div className="absolute inset-x-0 top-1/2 z-[5] flex -translate-y-1/2 justify-between px-1 sm:px-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    goImage(-1)
                  }}
                  className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-scnt-bg-elevated/90 text-scnt-text shadow-sm ring-1 ring-scnt-border/90 backdrop-blur-sm transition-[background-color,transform] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] hover:bg-scnt-bg-elevated active:scale-95"
                  aria-label={t('pc.prevImg', { name: product.name })}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d={isRtl ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    goImage(1)
                  }}
                  className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-scnt-bg-elevated/90 text-scnt-text shadow-sm ring-1 ring-scnt-border/90 backdrop-blur-sm transition-[background-color,transform] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] hover:bg-scnt-bg-elevated active:scale-95"
                  aria-label={t('pc.nextImg', { name: product.name })}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d={isRtl ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
            {carousel && imagesCount > 1 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[5] flex items-center justify-center gap-1.5">
                {product.galleryImages.map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-[width,background-color] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] ${
                      i === imageIndex ? 'h-1.5 w-5 bg-scnt-text/70' : 'h-1.5 w-1.5 bg-scnt-text/35'
                    }`}
                  />
                ))}
              </div>
            )}
            {/* Glassmorphism Add to Cart Reveal (Desktop only) */}
            <div className="absolute inset-x-0 bottom-6 z-[6] hidden items-center justify-center px-6 sm:flex pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleAddToCart()
                }}
                className="pointer-events-auto flex w-[90%] translate-y-6 items-center justify-center rounded-full border border-white/10 bg-black/30 px-6 py-3.5 text-[0.65rem] tracking-[0.2em] font-medium uppercase text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:translate-y-0 group-hover/card:opacity-100 hover:bg-black/50 hover:scale-[1.02]"
              >
                {t('pc.addToCart')}
              </button>
            </div>
          </div>
          <div className="space-y-2 px-5 py-6 text-center">
            <p
              className={`text-xs uppercase text-scnt-text-muted ${
                isExecutive
                  ? 'tracking-[0.24em]'
                  : isCharmer
                    ? 'tracking-[0.2em]'
                    : isExplorer
                      ? 'tracking-[0.18em]'
                      : 'tracking-[0.26em]'
              }`}
            >
              {col?.name ?? product.collection}
            </p>
            <h3 className="font-serif text-xl text-scnt-text">{product.name}</h3>
            <p
              className={`text-[0.65rem] uppercase text-scnt-text/45 ${
                isCharmer
                  ? 'tracking-[0.16em]'
                  : isExplorer
                    ? 'tracking-[0.14em]'
                    : 'tracking-[0.18em]'
              }`}
            >
              {t('pc.inspiredBy')} {product.inspiredBy}
            </p>
            <p className="line-clamp-2 text-xs italic leading-relaxed text-scnt-text-muted/95">
              {product.vibeSentence}
            </p>
            <p className="pt-1 text-sm text-scnt-text-muted">{formatEgp(product.price, locale)}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`absolute end-4 top-4 z-[7] inline-flex h-10 w-10 items-center justify-center rounded-full border border-scnt-border/70 backdrop-blur-sm transition-colors ${
            isWishlisted
              ? 'bg-scnt-text text-scnt-bg'
              : 'bg-scnt-bg-elevated/85 text-scnt-text-muted hover:text-scnt-text'
          }`}
          aria-label={
            isWishlisted
              ? t('pc.rmWishlist', { name: product.name })
              : t('pc.addWishlist', { name: product.name })
          }
        >
          <svg
            width="16"
            height="16"
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
        </button>
        <div className="border-t border-scnt-border/75 px-5 pb-5 pt-4 text-center sm:hidden">
          <div className="space-y-2">
            <Button type="button" className="w-full px-5 py-2 text-xs" onClick={handleAddToCart}>
              {t('pc.addToCart')}
            </Button>
            {justAdded ? (
              <span className="text-xs text-scnt-text-muted">{t('pc.added')}</span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
