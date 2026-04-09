import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { Button } from '../ui/Button'
import { EightPointStar } from '../ui/EightPointStar'

const headlineContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.06 },
  },
}

const headlineLine = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const yOrb = useTransform(scrollYProgress, [0, 1], [0, 56])
  const yMist = useTransform(scrollYProgress, [0, 1], [0, 32])
  const fade = useTransform(scrollYProgress, [0, 0.65], [1, 0.88])
  const scaleGlow = useTransform(scrollYProgress, [0, 1], [1, 1.04])

  const floatProps = (duration: number, delay = 0) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, -6, 0], rotate: [0, 4, 0] },
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay,
          },
        }

  const floatPropsAlt = (duration: number, delay = 0) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, 5, 0], rotate: [0, -5, 0] },
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay,
          },
        }

  return (
    <section
      ref={ref}
      className="relative min-h-[min(88vh,900px)] overflow-hidden px-5 pb-28 pt-20 sm:px-8 sm:pb-36 sm:pt-28"
    >
      {/* Soft vignette + depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_38%,transparent_0%,rgba(42,38,34,0.035)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-scnt-bg-muted/20 to-scnt-bg-muted/45"
        aria-hidden
      />

      <motion.div
        style={{ y: yOrb, opacity: fade, scale: scaleGlow }}
        className="pointer-events-none absolute -left-[12%] top-[6%] h-[min(460px,58vw)] w-[min(460px,58vw)] rounded-full bg-gradient-to-br from-white/30 via-amber-50/12 to-transparent blur-3xl"
        aria-hidden
      />
      <motion.div
        style={{ y: yMist }}
        className="pointer-events-none absolute -right-[8%] top-[18%] h-[min(380px,50vw)] w-[min(380px,50vw)] rounded-full bg-gradient-to-bl from-collection-icon/15 via-slate-300/12 to-transparent blur-3xl"
        aria-hidden
      />
      <motion.div
        style={{ y: yMist }}
        className="pointer-events-none absolute bottom-[8%] left-[28%] h-[min(300px,42vw)] w-[min(300px,42vw)] rounded-full bg-gradient-to-t from-amber-100/22 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(520px,85vw)] w-[min(720px,120%)] max-w-4xl -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(184,155,94,0.09),transparent_72%)]"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute left-[10%] top-[28%] text-scnt-text/[0.08]"
        initial={{ y: 0, rotate: 0 }}
        {...floatProps(14)}
        aria-hidden
      >
        <EightPointStar size={16} />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-[12%] top-[36%] text-scnt-text/[0.07]"
        initial={{ y: 0, rotate: 0 }}
        {...floatPropsAlt(17, 1.2)}
        aria-hidden
      >
        <EightPointStar size={12} />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute bottom-[32%] left-[8%] text-collection-icon/[0.12] sm:left-[14%]"
        initial={{ y: 0, rotate: 0 }}
        {...floatPropsAlt(19, 2.4)}
        aria-hidden
      >
        <EightPointStar size={10} />
      </motion.div>

      <div className="relative mx-auto flex min-h-[min(52vh,540px)] max-w-3xl flex-col justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex justify-center"
        >
          <span className="inline-flex items-center gap-3 rounded-full border border-scnt-border/70 bg-scnt-bg-elevated/35 px-5 py-2.5 text-scnt-text-muted shadow-[0_8px_32px_-12px_var(--color-scnt-shadow)] backdrop-blur-sm">
            <EightPointStar size={10} className="text-collection-icon/50" />
            <span className="text-[0.7rem] font-normal uppercase tracking-[0.38em]">
              House of SCNT
            </span>
            <EightPointStar size={10} className="text-collection-icon/50" />
          </span>
        </motion.div>

        <motion.h1
          variants={headlineContainer}
          initial="hidden"
          animate="show"
          className="font-serif text-[2.5rem] font-medium leading-[1.05] tracking-[-0.02em] text-scnt-text [text-shadow:0_2px_48px_rgba(42,38,34,0.07)] sm:text-5xl md:text-[3.45rem] text-balance"
        >
          <motion.span variants={headlineLine} className="block">
            Leave a trail, not a memory.
          </motion.span>
          <motion.span
            variants={headlineLine}
            className="mt-5 block font-serif text-[1.4rem] font-normal leading-snug tracking-normal text-scnt-text-muted sm:text-[1.85rem] md:text-[2.05rem]"
          >
            <span className="italic text-scnt-text/85">Presence before words.</span>
          </motion.span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.35 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{
            duration: 1,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto mt-10 h-px w-[min(200px,42vw)] origin-center bg-gradient-to-r from-transparent via-collection-icon/35 to-transparent"
          aria-hidden
        />

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.85,
            delay: 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto mt-10 max-w-lg text-base leading-relaxed text-scnt-text-muted sm:text-lg"
        >
          Four collections — each a mood you can wear. Nothing to decode; only
          what stays on skin, and in the room after you leave.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.52,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
        >
          <Button to="/collections">Explore collections</Button>
          <Link
            to="/find-your-scnt"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-scnt-border/90 bg-scnt-bg-elevated/60 px-8 py-3 text-sm font-medium tracking-wide text-scnt-text shadow-[0_6px_24px_-10px_var(--color-scnt-shadow)] transition-[background-color,box-shadow,border-color] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-scnt-border hover:bg-scnt-bg-elevated hover:shadow-[0_12px_36px_-14px_var(--color-scnt-shadow)]"
          >
            <span
              className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 transition-[transform,opacity] duration-[950ms] ease-out group-hover:translate-x-[120%] group-hover:opacity-100"
              aria-hidden
            />
            <span className="relative z-[1]">Find your SCNT</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
