import { motion } from 'framer-motion'
import { getBestsellers } from '../../data/products'
import { ProductCard } from '../product/ProductCard'
import { EightPointStar } from '../ui/EightPointStar'
import { StarDivider } from '../ui/StarDivider'

const grid = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
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

export function BestSellers() {
  const list = getBestsellers(4)

  return (
    <section className="relative px-5 py-24 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-x-8 top-0 hidden h-px bg-gradient-to-r from-transparent via-scnt-border/70 to-transparent sm:block" />

      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
              <EightPointStar size={9} className="opacity-45" />
              Best sellers
            </p>
            <h2 className="font-serif text-3xl font-medium text-scnt-text sm:text-4xl">
              The quiet favorites
            </h2>
            <p className="mt-3 max-w-lg text-sm text-scnt-text-muted sm:text-base">
              Worn often, talked about softly — where skin meets intention.
            </p>
          </div>
        </motion.header>

        <StarDivider className="py-2 sm:py-4" />

        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10"
        >
          {list.map((p) => (
            <motion.div key={p.id} variants={cell}>
              <ProductCard product={p} entrance={false} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
