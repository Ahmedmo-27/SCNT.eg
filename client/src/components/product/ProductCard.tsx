import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ProductSummary } from '../../data/products'
import { getCollectionById } from '../../data/collections'
import { EightPointStar } from '../ui/EightPointStar'

type ProductCardProps = {
  product: ProductSummary
  /** Disable scroll reveal when parent handles stagger (e.g. home best sellers). */
  entrance?: boolean
}

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function ProductCard({ product, entrance = true }: ProductCardProps) {
  const col = getCollectionById(product.collection)
  const [g0, g1] = product.placeholderGradient
  const [bottleFront] = product.galleryImages
  const accent = col?.accent ?? '#2a2622'

  return (
    <motion.article
      layout
      initial={entrance ? { opacity: 0, y: 22 } : false}
      whileInView={entrance ? { opacity: 1, y: 0 } : undefined}
      viewport={entrance ? { once: true, margin: '-40px' } : undefined}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group"
    >
      <Link
        to={`/product/${product.id}`}
        className="block overflow-hidden rounded-2xl bg-scnt-bg-elevated/55 ring-1 ring-scnt-border/90 transition-[box-shadow] duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-[0_32px_80px_-36px_rgba(42,38,34,0.18)]"
        style={{
          boxShadow: `0 18px 50px -32px ${accent}14`,
        }}
      >
        <div
          className="relative aspect-[4/5] w-full overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${g0}, ${g1})`,
          }}
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
            className="absolute inset-0 opacity-0 transition-opacity duration-[750ms] group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at 50% 115%, ${accent}40, transparent 58%)`,
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-[750ms] group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 45%)`,
            }}
            aria-hidden
          />
          <img
            src={bottleFront}
            alt=""
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-contain p-6 sm:p-8"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute right-4 top-4 z-[2] text-scnt-bg/90 opacity-0 transition-all duration-[750ms] group-hover:translate-y-0 group-hover:opacity-100 sm:translate-y-1">
            <motion.span
              initial={false}
              whileHover={{ scale: 1.08, rotate: 12 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <EightPointStar size={18} />
            </motion.span>
          </div>
        </div>
        <div className="space-y-2 px-5 py-6">
          <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">
            {col?.name ?? product.collection}
          </p>
          <h3 className="font-serif text-xl text-scnt-text">{product.name}</h3>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-scnt-text/45">
            Inspired by {product.inspiredBy}
          </p>
          <p className="line-clamp-2 text-xs italic leading-relaxed text-scnt-text-muted/95">
            {product.vibeSentence}
          </p>
          <p className="pt-1 text-sm text-scnt-text-muted">{formatEgp(product.price)}</p>
        </div>
      </Link>
    </motion.article>
  )
}
