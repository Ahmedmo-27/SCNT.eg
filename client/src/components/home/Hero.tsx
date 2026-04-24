import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Button } from '../ui/Button'
import { EightPointStar } from '../ui/EightPointStar'

const headlineContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.25, delayChildren: 0.1 },
  },
}

const headlineLine = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Hero() {
  const { t } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05])

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
      <motion.picture 
        className="pointer-events-none absolute inset-0 z-0 origin-top"
        style={{ y, scale }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        <source srcSet="/Hero%20Section%20Image.png" type="image/png" />
        <img
          src="/Hero%20Section%20Image.png"
          alt=""
          className="h-full w-full object-cover object-center"
          aria-hidden="true"
        />
      </motion.picture>
      <div className="pointer-events-none absolute inset-0 z-0 bg-scnt-bg/40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-44 bg-gradient-to-b from-transparent via-scnt-bg-muted/40 to-scnt-bg-muted"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute left-[10%] top-[28%] z-0 text-scnt-text/[0.15]"
        initial={{ y: 0, rotate: 0 }}
        {...floatProps(14)}
        aria-hidden
      >
        <EightPointStar size={16} />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-[12%] top-[36%] z-0 text-scnt-text/[0.12]"
        initial={{ y: 0, rotate: 0 }}
        {...floatPropsAlt(17, 1.2)}
        aria-hidden
      >
        <EightPointStar size={12} />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute bottom-[32%] left-[8%] z-0 text-collection-icon/[0.2] sm:left-[14%]"
        initial={{ y: 0, rotate: 0 }}
        {...floatPropsAlt(19, 2.4)}
        aria-hidden
      >
        <EightPointStar size={10} />
      </motion.div>

      <div className="relative z-10 mx-auto flex min-h-[min(52vh,540px)] max-w-3xl flex-col justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex justify-center"
        >
          <span className="inline-flex items-center gap-3 rounded-full border border-scnt-border/70 bg-scnt-bg-elevated/35 px-5 py-2.5 text-scnt-text-muted shadow-[0_8px_32px_-12px_var(--color-scnt-shadow)] backdrop-blur-sm">
            <EightPointStar size={10} className="text-collection-icon/50" />
            <span className="text-[0.7rem] font-normal uppercase tracking-[0.38em]">{t('hero.badge')}</span>
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
            {t('hero.title1')}
          </motion.span>
          <motion.span
            variants={headlineLine}
            className="mt-5 block font-serif text-[1.4rem] font-normal leading-snug tracking-normal text-scnt-text-muted sm:text-[1.85rem] md:text-[2.05rem]"
          >
            <span className="italic text-scnt-text/85">{t('hero.title2')}</span>
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
          {t('hero.body')}
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
          <Button to="/collections">{t('hero.explore')}</Button>
          <Link
            to="/find-your-scnt"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-scnt-border/90 bg-scnt-bg-elevated/60 px-8 py-3 text-sm font-medium tracking-wide text-scnt-text shadow-[0_6px_24px_-10px_var(--color-scnt-shadow)] transition-[background-color,box-shadow,border-color] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-scnt-border hover:bg-scnt-bg-elevated hover:shadow-[0_12px_36px_-14px_var(--color-scnt-shadow)]"
          >
            <span
              className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 transition-[transform,opacity] duration-[950ms] ease-out group-hover:translate-x-[120%] group-hover:opacity-100"
              aria-hidden
            />
            <span className="relative z-[1]">{t('hero.findLink')}</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
