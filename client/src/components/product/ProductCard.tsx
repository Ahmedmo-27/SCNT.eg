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
import { EightPointStar } from '../ui/EightPointStar'
import { useCollectionVisual } from '../../context/CollectionVisualContext'
import { Button } from '../ui/Button'

type ProductCardProps = {
  product: ProductSummary
  /** Disable scroll reveal when parent handles stagger (e.g. home best sellers). */
  entrance?: boolean
  /** Enable image carousel controls/swipe on the card media. */
  carousel?: boolean
}

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function ProductCard({ product, entrance = true, carousel = false }: ProductCardProps) {
  const { collections } = useCatalog()
  const addItem = useCartStore((s) => s.addItem)
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
    const t = window.setTimeout(() => setJustAdded(false), 1800)
    return () => window.clearTimeout(t)
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

                    goImage(deltaX < 0 ? 1 : -1)
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
              <img
                src={product.galleryImages[imageIndex]}
                alt=""
                className="block h-full w-full object-contain object-center"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
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
                  aria-label={`Previous image for ${product.name}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 6l-6 6 6 6"
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
                  aria-label={`Next image for ${product.name}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M9 6l6 6-6 6"
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
            <div className="absolute right-4 top-4 z-[4] text-scnt-bg/90 opacity-0 transition-all duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] group-hover:translate-y-0 group-hover:opacity-100 sm:translate-y-1">
              <motion.span
                initial={false}
                whileHover={
                  isExecutive || isIcon
                    ? { scale: 1.04 }
                    : { scale: 1.08, rotate: 12 }
                }
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <EightPointStar size={18} />
              </motion.span>
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
              Inspired by {product.inspiredBy}
            </p>
            <p className="line-clamp-2 text-xs italic leading-relaxed text-scnt-text-muted/95">
              {product.vibeSentence}
            </p>
            <p className="pt-1 text-sm text-scnt-text-muted">{formatEgp(product.price)}</p>
          </div>
        </Link>
        <div className="border-t border-scnt-border/75 px-5 pb-5 pt-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <Button type="button" className="px-5 py-2 text-xs" onClick={handleAddToCart}>
              Add to cart
            </Button>
            {justAdded ? (
              <span className="text-xs text-scnt-text-muted">Added</span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
