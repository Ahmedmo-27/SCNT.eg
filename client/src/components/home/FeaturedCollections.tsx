import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { collections } from '../../data/collections'
import { EightPointStar } from '../ui/EightPointStar'
import { StarDivider } from '../ui/StarDivider'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function FeaturedCollections() {
  return (
    <section className="relative border-t border-scnt-border/80 bg-gradient-to-b from-scnt-bg-muted/25 via-scnt-bg/40 to-scnt-bg px-5 py-24 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-scnt-border to-transparent opacity-80" />

      <div className="mx-auto max-w-6xl">
        <header className="mb-4 max-w-2xl text-center sm:mx-auto">
          <p className="mb-3 inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            Collections
          </p>
          <h2 className="font-serif text-3xl font-medium text-scnt-text sm:text-4xl">
            Four identities. One house.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-scnt-text-muted sm:text-base">
            Not categories — people. Pick the line that sounds like you, then
            find the bottle that fits the night.
          </p>
        </header>

        <StarDivider className="py-6 sm:py-8" />

        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-6 sm:grid-cols-2 lg:gap-8"
        >
          {collections.map((c) => (
            <motion.li key={c.id} variants={item}>
              <Link
                to={`/collections/${c.id}`}
                className="group/card block h-full rounded-2xl bg-scnt-bg-elevated/55 p-1 ring-1 ring-scnt-border/90 transition-[box-shadow,transform] duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_36px_90px_-40px_rgba(42,38,34,0.14)]"
              >
                <div
                  className="relative overflow-hidden rounded-[0.9rem] px-7 py-8 sm:px-9 sm:py-10"
                  style={{
                    background: `linear-gradient(135deg, ${c.accentSoft} 0%, transparent 55%), var(--color-scnt-bg-elevated)`,
                  }}
                >
                  <span
                    className="absolute left-0 top-0 h-full w-1.5 rounded-full opacity-90 transition-opacity duration-[750ms] group-hover/card:opacity-100"
                    style={{ backgroundColor: c.accent }}
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute -right-6 -top-10 h-40 w-40 rounded-full opacity-40 blur-2xl transition-opacity duration-[750ms] group-hover/card:opacity-70"
                    style={{
                      background: `radial-gradient(circle, ${c.accent}33, transparent 65%)`,
                    }}
                    aria-hidden
                  />
                  <div className="relative pl-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">
                      {c.code}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl text-scnt-text sm:text-3xl">
                      {c.name}
                    </h3>
                    <p className="mt-2 max-w-md font-serif text-sm italic text-scnt-text/85 sm:text-base">
                      {c.identityLine}
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-scnt-text-muted">
                      {c.tagline}
                    </p>
                    <p className="mt-6 text-xs tracking-wide text-scnt-text/55">
                      {c.mood}
                    </p>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm text-scnt-text transition-colors duration-[750ms]">
                      Enter collection
                      <span className="inline-block text-scnt-text/35 transition-transform duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:translate-x-1 group-hover/card:rotate-12">
                        <EightPointStar size={11} />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
