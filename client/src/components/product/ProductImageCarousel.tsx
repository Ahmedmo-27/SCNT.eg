import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { productImageFrameFull } from './productImageFrame'

const SLIDE_LABELS = ['Bottle front', 'Bottle back', 'Box'] as const

const easeScnt = [0.22, 1, 0.36, 1] as const

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type ProductImageCarouselProps = {
  productId: string
  productName: string
  images: readonly string[]
  gradient: readonly [string, string]
  accent: string
}

export function ProductImageCarousel({
  productId,
  productName,
  images,
  gradient,
  accent,
}: ProductImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const count = images.length
  const hasImages = count > 0
  const getSlideLabel = (i: number) => SLIDE_LABELS[i] ?? `Image ${i + 1}`

  useEffect(() => {
    setIndex(0)
    setDirection(0)
  }, [productId])

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return
      setDirection(delta)
      setIndex((i) => (i + delta + count) % count)
    },
    [count],
  )

  const goTo = useCallback((i: number) => {
    if (i === index) return
    setDirection(i > index ? 1 : -1)
    setIndex(i)
  }, [index])

  const [g0, g1] = gradient
  const activeImage = hasImages ? images[index] : ''
  const swipeThresholdPx = 48

  return (
    <div
      className="w-full max-w-none"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${productName} photos`}
    >
      <div
        className={`relative aspect-scnt-product w-full overflow-hidden ring-1 ring-scnt-border/90 outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/20 ${productImageFrameFull}`}
        style={{
          background: `linear-gradient(145deg, ${g0}, ${g1})`,
          boxShadow: `0 32px 90px -48px ${accent}55, inset 0 0 0 1px rgba(255,255,255,0.12)`,
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            go(-1)
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            go(1)
          }
        }}
        onTouchStart={(e) => {
          const t = e.touches[0]
          touchStartX.current = t.clientX
          touchStartY.current = t.clientY
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || touchStartY.current === null) return
          const t = e.changedTouches[0]
          const deltaX = t.clientX - touchStartX.current
          const deltaY = t.clientY - touchStartY.current

          touchStartX.current = null
          touchStartY.current = null

          if (Math.abs(deltaX) < swipeThresholdPx) return
          if (Math.abs(deltaX) <= Math.abs(deltaY)) return

          go(deltaX < 0 ? 1 : -1)
        }}
      >
        <div
          className={`pointer-events-none absolute inset-0 z-0 opacity-55 ${productImageFrameFull}`}
          style={{
            background: `radial-gradient(ellipse 90% 75% at 50% 38%, rgba(255,255,255,0.32), transparent 52%), linear-gradient(210deg, rgba(255,255,255,0.18) 0%, transparent 48%, rgba(42,38,34,0.06) 100%)`,
          }}
          aria-hidden
        />

        {hasImages ? (
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={`${productId}-${index}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: easeScnt }}
              className={`absolute inset-0 z-[1] overflow-hidden ${productImageFrameFull}`}
            >
              <picture>
                <source srcSet={activeImage} type="image/png" />
                <img
                  src={activeImage}
                  alt={`${productName} — ${getSlideLabel(index)}`}
                  className="block h-full w-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding={index === 0 ? 'sync' : 'async'}
                  draggable={false}
                />
              </picture>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div
            className={`absolute inset-0 z-[1] grid place-items-center ${productImageFrameFull}`}
            aria-label={`${productName} image unavailable`}
          >
            <span className="text-sm text-scnt-text-muted">Image unavailable</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[2] flex -translate-y-1/2 justify-between px-0.5 sm:px-2 lg:px-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-scnt-bg-elevated/90 text-scnt-text shadow-sm ring-1 ring-scnt-border/90 backdrop-blur-sm transition-[background-color,transform] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] hover:bg-scnt-bg-elevated active:scale-95 lg:h-10 lg:w-10"
            aria-label="Previous image"
            disabled={count <= 1}
          >
            <ChevronLeft className="opacity-80" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-scnt-bg-elevated/90 text-scnt-text shadow-sm ring-1 ring-scnt-border/90 backdrop-blur-sm transition-[background-color,transform] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] hover:bg-scnt-bg-elevated active:scale-95 lg:h-10 lg:w-10"
            aria-label="Next image"
            disabled={count <= 1}
          >
            <ChevronRight className="opacity-80" />
          </button>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Product photo"
      >
        {images.map((_, i) => {
          const selected = i === index
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full transition-[width,background-color] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] ${
                selected
                  ? 'h-2 w-8 bg-scnt-text/70'
                  : 'h-2 w-2 bg-scnt-text/20 hover:bg-scnt-text/35'
              }`}
              aria-label={`Show ${getSlideLabel(i)}`}
              aria-current={selected ? 'true' : undefined}
            />
          )
        })}
      </div>
      {hasImages ? (
        <p className="sr-only" aria-live="polite">
          {getSlideLabel(index)}
        </p>
      ) : null}
    </div>
  )
}
