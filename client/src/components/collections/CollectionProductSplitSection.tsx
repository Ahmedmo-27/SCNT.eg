import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CollectionSummary, ProductSummary } from '../../types/catalog'
import { Button } from '../ui/Button'
import { EightPointStar } from '../ui/EightPointStar'
import { useCartStore } from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { useI18n } from '../../i18n/I18nContext'
import { formatEgp } from '../../lib/formatEgp'

type Props = {
  product: ProductSummary
  collection?: CollectionSummary
}

function firstOrDash(items: string[] | undefined) {
  const v = items?.[0]?.trim()
  return v || '—'
}

export function CollectionProductSplitSection({ product, collection }: Props) {
  const { locale } = useI18n()
  const accent = collection?.accent ?? '#2a2622'
  const bottleSrc = product.clearBackground_Image?.trim() || ''
  const coverSrc = product.coverImage?.trim() || ''
  const [selectedSize, setSelectedSize] = useState(product.volume)
  const [justAdded, setJustAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const isWishlisted = useWishlistStore((s) => s.hasItem(product.apiId))

  function handleAddToCart() {
    addItem({
      productId: product.apiId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.galleryImages[0],
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2400)
  }

  function handleToggleWishlist() {
    toggleWishlist({
      productId: product.apiId,
      slug: product.id,
      name: product.name,
      price: product.price,
      image: product.galleryImages[0],
      inspiredBy: product.inspiredBy,
      collection: collection?.name ?? product.collection,
    })
  }

  return (
    <div className="relative h-[calc(100svh-var(--scnt-header-h,5.5rem))] lg:h-auto lg:min-h-[calc(100svh-var(--scnt-header-h,5.5rem))]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-95"
        style={{
          background: `radial-gradient(ellipse 75% 60% at 12% 8%, ${accent}20 0%, transparent 60%), radial-gradient(ellipse 70% 58% at 95% 85%, ${accent}14 0%, transparent 62%)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto h-full w-full overflow-hidden">
        <div className="flex h-full w-full flex-col lg:grid lg:min-h-[calc(100svh-var(--scnt-header-h,5.5rem))] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.64fr)_minmax(0,1.16fr)] lg:items-stretch">
          <div className="order-2 flex flex-1 flex-col justify-start overflow-y-auto px-5 py-8 pb-12 lg:order-1 lg:h-auto lg:justify-center lg:overflow-visible lg:px-8 lg:py-4 lg:pe-12">
            <div className="w-full max-w-[53rem]">
              <p className="mb-3 inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.34em] text-scnt-text/70">
                <EightPointStar size={9} className="opacity-45" />
                {collection?.name ?? product.collection}
              </p>

              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="min-w-0 flex-1 font-serif text-[clamp(2rem,3.8vw,3.35rem)] leading-[0.9] text-scnt-text">{product.name}</h2>
                <Link
                  to={`/product/${product.id}`}
                  className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg border border-scnt-text/40 px-3 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-scnt-text transition-colors hover:bg-scnt-text hover:text-scnt-bg"
                >
                  View Full Details
                </Link>
              </div>

              <p className="mt-5 hidden max-w-xl whitespace-pre-line text-[0.94rem] leading-relaxed text-scnt-text/78 md:block">
                {product.vibeSentence}
              </p>

              <div className="relative z-40 mt-6 flex max-w-[42rem] flex-col gap-5 md:gap-6 md:rounded-3xl md:border md:border-scnt-border/70 md:bg-scnt-bg-elevated/55 md:p-4 md:backdrop-blur-sm lg:p-5">
                <div className="hidden grid-cols-3 gap-3 sm:gap-4 md:grid">
                  <div>
                    <p className="text-[1.25rem] uppercase tracking-[0.3em] text-scnt-text/60">Top</p>
                    <p className="mt-1.5 text-[1.15rem] text-scnt-text">{firstOrDash(product.topNotes)}</p>
                  </div>
                  <div>
                    <p className="text-[1.25rem] uppercase tracking-[0.3em] text-scnt-text/60">Heart</p>
                    <p className="mt-1.5 text-[1.15rem] text-scnt-text">{firstOrDash(product.heartNotes)}</p>
                  </div>
                  <div>
                    <p className="text-[1.25rem] uppercase tracking-[0.3em] text-scnt-text/60">Base</p>
                    <p className="mt-1.5 text-[1.15rem] text-scnt-text">{firstOrDash(product.baseNotes)}</p>
                  </div>
                </div>

                {product.inspiredBy ? (
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.3em] text-scnt-text/60">Inspired By</p>
                    <p className="mt-1.5 text-[1.3rem] font-serif italic leading-none text-scnt-text sm:text-[1.8rem]">{product.inspiredBy}</p>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/68 p-4">
                  <p className="font-serif text-[1.45rem] leading-none text-scnt-text">{formatEgp(product.price, locale)}</p>

                  <div className="mt-4">
                    <label className="text-[0.7rem] uppercase tracking-[0.26em] text-scnt-text/70">Size</label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSize(product.volume)}
                        className={`rounded-xl border px-4 py-2 text-[0.88rem] font-semibold transition-all ${selectedSize === product.volume
                          ? 'border-scnt-text bg-scnt-text text-scnt-bg'
                          : 'border-scnt-border/60 bg-scnt-bg text-scnt-text hover:border-scnt-text'
                          }`}
                      >
                        {product.volume}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Button type="button" onClick={handleAddToCart} className="h-[2.85rem] flex-1 rounded-full text-[0.9rem]">
                      {justAdded ? 'Added' : 'Add to Cart'}
                    </Button>
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-scnt-border/70 bg-scnt-bg/90 text-scnt-text-muted transition-colors hover:text-scnt-text"
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <svg
                        width="18"
                        height="18"
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[25%] items-center justify-center lg:pointer-events-auto lg:relative lg:order-2 lg:h-auto lg:items-center lg:border-x lg:border-scnt-border/40 lg:bg-scnt-bg/28 lg:px-6 lg:py-10 lg:overflow-visible">
            {bottleSrc ? (
              <picture>
                <source srcSet={bottleSrc} type="image/png" />
                <img
                  src={bottleSrc}
                  alt=""
                  className="relative z-30 h-[12.5rem] sm:h-[12.5rem] md:h-[14.5rem] w-auto object-contain drop-shadow-2xl translate-y-4 sm:translate-y-5 md:translate-y-6 lg:translate-y-0 lg:h-auto lg:max-h-[80vh] lg:w-[min(31rem,100%)] lg:scale-[1.1] lg:translate-x-[25%]"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            ) : (
              <div className="hidden h-[28rem] w-[min(31rem,100%)] place-items-center bg-scnt-bg-elevated/35 lg:grid">
                <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">Image slot</p>
              </div>
            )}

            <div
              className="pointer-events-none absolute inset-0 hidden lg:block"
              aria-hidden
            />
          </div>

          <div className="relative z-10 order-1 h-[clamp(7rem,22svh,15rem)] w-full overflow-hidden border-b border-scnt-border/40 lg:order-3 lg:-ml-24 lg:block lg:h-auto lg:w-[calc(100%+6rem)] lg:border-b-0 lg:border-s">
            {coverSrc ? (
              <picture>
                <source srcSet={coverSrc} type="image/png" />
                <img
                  src={coverSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            ) : (
              <div className="grid h-full w-full place-items-center bg-scnt-bg-elevated/35">
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-[0.32em] text-scnt-text/55">Cover image</p>
                  <p className="mt-2 max-w-xs text-xs text-scnt-text/55">You'll add a per-product cover later.</p>
                </div>
              </div>
            )}

            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(90deg, rgba(235,228,217,0.2) 0%, transparent 36%), radial-gradient(circle at 50% 50%, transparent 0%, rgba(42,38,34,0.12) 95%)`,
              }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  )
}

