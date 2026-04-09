import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '../ui/Button'
import { EightPointStar } from '../ui/EightPointStar'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const yOrb = useTransform(scrollYProgress, [0, 1], [0, 56])
  const yMist = useTransform(scrollYProgress, [0, 1], [0, 32])
  const fade = useTransform(scrollYProgress, [0, 0.65], [1, 0.88])

  return (
    <section
      ref={ref}
      className="relative min-h-[78vh] overflow-hidden px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28"
    >
      <motion.div
        style={{ y: yOrb, opacity: fade }}
        className="pointer-events-none absolute -left-[10%] top-[8%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-gradient-to-br from-white/25 via-white/5 to-transparent blur-3xl"
        aria-hidden
      />
      <motion.div
        style={{ y: yMist }}
        className="pointer-events-none absolute -right-[5%] top-[22%] h-[min(360px,48vw)] w-[min(360px,48vw)] rounded-full bg-gradient-to-bl from-slate-300/20 to-transparent blur-3xl"
        aria-hidden
      />
      <motion.div
        style={{ y: yMist }}
        className="pointer-events-none absolute bottom-[5%] left-1/3 h-[min(280px,40vw)] w-[min(280px,40vw)] rounded-full bg-gradient-to-t from-amber-100/18 to-transparent blur-3xl"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute left-[12%] top-[30%] text-scnt-text/[0.07]"
        animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <EightPointStar size={14} />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-[14%] top-[38%] text-scnt-text/[0.06]"
        animate={{ y: [0, 5, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        aria-hidden
      >
        <EightPointStar size={11} />
      </motion.div>

      <div className="relative mx-auto flex min-h-[min(56vh,520px)] max-w-3xl flex-col justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 inline-flex items-center justify-center gap-3 text-scnt-text-muted"
        >
          <EightPointStar size={11} className="opacity-50" />
          <span className="text-xs font-normal uppercase tracking-[0.35em]">
            House of SCNT
          </span>
          <EightPointStar size={11} className="opacity-50" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-[2.35rem] font-medium leading-[1.06] tracking-tight text-scnt-text sm:text-5xl md:text-[3.25rem]"
        >
          Leave a trail, not a memory.
          <span className="mt-4 block font-serif text-[1.35rem] font-normal leading-snug italic text-scnt-text-muted sm:text-3xl md:text-[2rem]">
            Presence before words.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-9 max-w-lg text-base leading-relaxed text-scnt-text-muted sm:text-lg"
        >
          Four collections — each a mood you can wear. Nothing to decode; only
          what stays on skin, and in the room after you leave.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button to="/collections">Explore collections</Button>
          <Link
            to={{ pathname: '/', hash: 'find-your-scent' }}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-scnt-border bg-scnt-bg-elevated/50 px-8 py-3 text-sm font-medium tracking-wide text-scnt-text transition-colors duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-scnt-bg-elevated"
          >
            <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/14 to-transparent opacity-0 transition-[transform,opacity] duration-[950ms] ease-out group-hover:translate-x-[120%] group-hover:opacity-100" aria-hidden />
            <span className="relative z-[1]">Find your scent</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
