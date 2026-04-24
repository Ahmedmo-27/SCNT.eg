import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

export function BrandHeritage() {
  const { t } = useI18n()

  return (
    <section className="relative flex flex-col items-center justify-center bg-scnt-bg px-4 py-8 sm:flex-row sm:px-12 sm:py-16 lg:px-24 lg:py-20">
      {/* Text Content - Generous Whitespace */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full flex-col pr-0 sm:w-1/2 sm:pr-20"
      >
        <span className="mb-4 text-xs uppercase tracking-[0.4em] text-scnt-text-muted">
          {t('home.heritage.kicker')}
        </span>
        <h2 className="font-serif text-4xl font-medium leading-[1.15] text-scnt-text sm:text-5xl lg:text-6xl text-balance">
          {t('home.heritage.title')}{' '}
          <span className="italic text-scnt-text/85 block mt-2 sm:mt-1">{t('home.heritage.titleItalic')}</span>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-scnt-text-muted sm:text-base">
          {t('home.heritage.body')}
        </p>
      </motion.div>

      {/* Editorial Image Placement */}
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 w-full sm:mt-0 sm:w-1/2"
      >
        <div className="group relative aspect-square w-full max-w-md overflow-hidden bg-scnt-bg-elevated sm:aspect-[4/5] sm:max-w-none">
          {/* Subtle gradient fallback until real image is loaded */}
          <div className="absolute inset-0 bg-gradient-to-tr from-scnt-bg-muted to-scnt-bg-elevated" />

          {/* We are using a high-quality placeholder image here. 
              The scale animation continues to give it life. */}
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            src="/Brand Heritage.png"
            alt="Macro photography of raw ingredients"
            className="relative z-10 block h-full w-full object-cover transition-transform duration-[1.5s] ease-[var(--ease-scnt)] group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 z-20 bg-scnt-bg/10 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-0" />
        </div>
      </motion.div>
    </section>
  )
}
