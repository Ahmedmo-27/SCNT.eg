import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { EightPointStar } from '../ui/EightPointStar'
import { StarDivider } from '../ui/StarDivider'

const grid = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
}

const cell = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 20V14a10 10 0 0 1 20 0v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20h28v22a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V20Z" />
    </svg>
  )
}

function IconDecant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" d="M22 8v6c0 2 1.5 3.5 4 4.5 3 1.2 5 3.5 5 6.5v17a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V25c0-3 2-5.3 5-6.5 2.5-1 4-2.5 4-4.5V8" />
      <path strokeLinecap="round" d="M18 8h12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 32h6M28 32h4" />
    </svg>
  )
}

function IconDecide({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 38V22l5-5 6 6 7-7 5 5v12a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2Z" />
      <path strokeLinecap="round" d="m29 17-3-8a2 2 0 0 1 .5-1.8l1-1" />
    </svg>
  )
}

function ArrowAcross({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeDasharray="3 4"
      aria-hidden
    >
      <path d="M4 12h50M50 8l8 4-8 4" />
    </svg>
  )
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeDasharray="3 4"
      aria-hidden
    >
      <path d="M12 4v34M8 34l4 8 4-8" />
    </svg>
  )
}

export function HowItWorks() {
  const { t } = useI18n()
  const steps = useMemo(
    () =>
      [
        { title: t('home.hiw.step1'), Icon: IconBag, body: t('home.hiw.step1b') },
        { title: t('home.hiw.step2'), Icon: IconDecant, body: t('home.hiw.step2b') },
        { title: t('home.hiw.step3'), Icon: IconDecide, body: t('home.hiw.step3b') },
      ] as const,
    [t],
  )

  return (
    <section className="relative bg-scnt-bg-muted/80 px-5 py-24 sm:px-8 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-scnt-border/80 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            {t('home.hiw.kicker')}
          </p>
          <h2 className="font-serif text-3xl font-medium leading-tight text-scnt-text sm:text-4xl md:text-[2.65rem] text-balance">
            {t('home.hiw.title')}
          </h2>
        </motion.header>

        <StarDivider className="py-8 sm:py-10" />

        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="flex flex-col items-stretch gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-4"
        >
          {steps.map((step, i) => (
            <div key={step.title} className="contents lg:contents">
              <motion.div variants={cell} className="flex flex-1 flex-col items-center text-center lg:max-w-[17.5rem]">
                <step.Icon className="mb-6 h-12 w-12 shrink-0 text-scnt-text" />
                <h3 className="font-sans text-base font-semibold tracking-wide text-scnt-text">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted">{step.body}</p>
              </motion.div>

              {i < steps.length - 1 ? (
                <>
                  <div className="hidden shrink-0 self-center pt-10 text-scnt-text/35 lg:block">
                    <ArrowAcross className="h-6 w-14" />
                  </div>
                  <div className="flex justify-center text-scnt-text/35 lg:hidden">
                    <ArrowDown className="h-10 w-6" />
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-14 max-w-3xl text-center text-xs leading-relaxed text-scnt-text-muted sm:text-sm"
        >
          <strong className="font-semibold text-scnt-text">{t('home.hiw.noteLabel')}</strong> {t('home.hiw.noteBody')}
        </motion.p>
      </div>
    </section>
  )
}
