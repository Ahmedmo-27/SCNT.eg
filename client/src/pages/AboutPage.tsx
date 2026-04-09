import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'

const ease = [0.22, 1, 0.36, 1] as const

export function AboutPage() {
  return (
    <Layout>
      <div className="flex flex-col">
        <div className="flex min-h-[min(52vh,32rem)] items-center justify-center px-5 sm:px-8">
          <h1 className="w-full max-w-[100vw] text-center font-serif text-[clamp(0.7rem,2.85vw+0.2rem,2.85rem)] leading-none tracking-tight text-scnt-text whitespace-nowrap">
            Beyond the Bottle: Engineering the Essence
          </h1>
        </div>

        <div className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
        <StarDivider className="py-8 sm:py-10" />

        <div className="mx-auto max-w-2xl space-y-12">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
            className="space-y-5 text-base leading-relaxed text-scnt-text-muted"
          >
            <p>
              At SCNT.eg, we don&apos;t believe a fragrance is just an accessory—we believe it is a
              silent architecture that defines the space you occupy.
            </p>
            <p>
              Born in the heart of Egypt, SCNT.eg was founded on a singular frustration: the gap
              between world-class luxury and everyday accessibility. We saw a market filled with
              fleeting scents and unattainable price tags. We decided to rewrite the code.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease }}
            className="space-y-4"
          >
            <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">
              Our Mission: High Performance. No Compromise.
            </h2>
            <p className="text-base leading-relaxed text-scnt-text-muted">
              We specialize in &quot;Beast Mode&quot; performance. By prioritizing high-concentration
              oils and meticulous sourcing, we&apos;ve engineered a collection of fragrances inspired
              by the world&apos;s most iconic profiles, optimized for longevity and sillage that lasts
              from the morning board meeting to the midnight hour.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease }}
            className="space-y-4"
          >
            <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">The SCNT.eg Philosophy</h2>
            <p className="text-base leading-relaxed text-scnt-text-muted">
              Whether it&apos;s the professional precision of The Executive or the spirited curiosity
              of The Explorer, every bottle in our lineup is a tribute to the modern individual.
              We&apos;ve stripped away the retail markup of traditional luxury houses, leaving only
              what matters: the scent, the performance, and the persona.
            </p>
          </motion.section>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease }}
            className="border-t border-scnt-border pt-10 font-serif text-xl italic leading-snug text-scnt-text sm:text-2xl"
          >
            Luxury, Redefined. Performance, Engineered.
          </motion.p>
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center text-sm text-scnt-text-muted">
          <Link
            to="/"
            className="inline-flex items-center gap-2 underline-offset-4 transition-opacity hover:opacity-75"
          >
            <EightPointStar size={10} className="opacity-40" />
            Back to home
          </Link>
        </p>
        </div>
      </div>
    </Layout>
  )
}
