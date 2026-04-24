import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { useI18n } from '../../i18n/I18nContext'
import { formatEgp } from '../../lib/formatEgp'
import type { ProductSummary } from '../../types/catalog'
import { productImageFrameFull, productImageFrameTop } from './productImageFrame'
import { EightPointStar } from '../ui/EightPointStar'

type Props = {
  items: ProductSummary[]
  title?: string
  subtitle?: string
}

export function ProductRecommendations({
  items,
  title = 'You might also like',
  subtitle = 'Chosen for a similar mood — not a formula.',
}: Props) {
  const { t, locale } = useI18n()
  const { collections } = useCatalog()
  if (items.length === 0) return null

  return (
    <section className="mt-20 border-t border-scnt-border/80 pt-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 max-w-xl"
      >
        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
          <EightPointStar size={9} className="opacity-45" />
          {t('product.recKicker')}
        </p>
        <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-scnt-text-muted">{subtitle}</p>
      </motion.header>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => {
          const col = collections.find((c) => c.id === p.collection)
          const [g0, g1] = p.placeholderGradient
          const [bottleFront] = p.galleryImages
          const accent = col?.accent ?? '#2a2622'

          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                to={`/product/${p.id}`}
                className={`group block overflow-hidden bg-scnt-bg-elevated/50 ring-1 ring-scnt-border/90 transition-[transform,box-shadow] duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(42,38,34,0.16)] ${productImageFrameFull}`}
                style={{ boxShadow: `0 14px 40px -28px ${accent}18` }}
              >
                <div
                  className={`relative aspect-scnt-product w-full overflow-hidden ${productImageFrameTop}`}
                  style={{
                    background: `linear-gradient(145deg, ${g0}, ${g1})`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background: `linear-gradient(200deg, rgba(255,255,255,0.32) 0%, transparent 42%, rgba(42,38,34,0.06) 100%)`,
                    }}
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[750ms] group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, ${accent}35, transparent 55%)`,
                    }}
                    aria-hidden
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${productImageFrameTop}`}
                  >
                    <picture>
                      <source srcSet={bottleFront} type="image/png" />
                      <img
                        src={bottleFront}
                        alt=""
                        className="block h-full w-full object-contain object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                  </div>
                </div>
                <div className="space-y-1.5 px-5 py-5">
                  <p className="text-[0.65rem] uppercase tracking-[0.22em] text-scnt-text-muted">
                    {col?.name}
                  </p>
                  <h3 className="font-serif text-lg text-scnt-text">{p.name}</h3>
                  <p className="text-[0.6rem] uppercase tracking-[0.16em] text-scnt-text/45">
                    {t('pc.inspiredBy')} {p.inspiredBy}
                  </p>
                  <p className="line-clamp-2 text-xs italic text-scnt-text-muted/95">
                    {p.vibeSentence}
                  </p>
                  <p className="pt-1 text-sm text-scnt-text-muted">{formatEgp(p.price, locale)}</p>
                </div>
              </Link>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
