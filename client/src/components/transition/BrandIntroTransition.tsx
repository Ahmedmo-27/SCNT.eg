import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EightPointStar } from '../ui/EightPointStar'
import { useI18n } from '../../i18n/I18nContext'

const STORAGE_KEY = 'scnt_intro_seen'
const AUTO_DISMISS_MS = 2100

function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReducedMotion) return false

    const urlParams = new URLSearchParams(window.location.search)
    const forceIntro = urlParams.get('intro') === 'true' || urlParams.has('intro')
    if (forceIntro) return true

    const hasSeen = sessionStorage.getItem(STORAGE_KEY) === '1'
    return !hasSeen
  } catch {
    return false
  }
}

export function BrandIntroTransition() {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(shouldShowIntro)

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Ignore sessionStorage errors in restricted environments
    }
    setIsVisible(false)
  }, [])

  // Auto-dismiss timer
  useEffect(() => {
    if (!isVisible) return

    const timer = window.setTimeout(() => {
      dismiss()
    }, AUTO_DISMISS_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isVisible, dismiss])

  // Lock body scroll and handle keyboard shortcut while visible
  useEffect(() => {
    if (!isVisible) return

    const { body, documentElement } = document
    const prevBodyOverflow = body.style.overflow
    const prevHtmlOverflow = documentElement.style.overflow

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      body.style.overflow = prevBodyOverflow
      documentElement.style.overflow = prevHtmlOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, dismiss])

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.aside
          key="scnt-brand-intro"
          role="status"
          aria-live="polite"
          aria-label={t('transition.badge')}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: '-10%',
            transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-scnt-bg text-scnt-text select-none overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 50% 45%, #f5efe7 0%, #ebe4d9 65%, #dfd7cc 100%)',
          }}
        >
          {/* Top Bar with Brand Badge & Skip Button */}
          <div className="w-full flex items-center justify-between px-6 py-6 sm:px-10">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-scnt-text-muted/70 font-sans"
            >
              <EightPointStar size={8} className="opacity-40" />
              <span>{t('transition.badge')}</span>
            </motion.div>

            <motion.button
              type="button"
              onClick={dismiss}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              aria-label={t('transition.skip')}
              className="group inline-flex items-center gap-1.5 rounded-full border border-scnt-border bg-scnt-bg-elevated/70 px-3.5 py-1.5 text-xs font-medium tracking-wider text-scnt-text-muted transition-all duration-300 hover:border-scnt-text/30 hover:bg-scnt-bg-elevated hover:text-scnt-text focus:outline-none focus-visible:ring-1 focus-visible:ring-scnt-text"
            >
              <span>{t('transition.skip')}</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              >
                &rarr;
              </span>
            </motion.button>
          </div>

          {/* Central Luxury Lockup */}
          <div className="relative flex flex-col items-center justify-center text-center px-4 -mt-6">
            {/* Ambient Star Halo Animation */}
            <div className="relative mb-6 flex items-center justify-center">
              {/* Outer compass ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
                animate={{ scale: 1, opacity: 0.35, rotate: 90 }}
                transition={{
                  scale: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.8, ease: 'easeOut' },
                  rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
                }}
                className="absolute h-24 w-24 sm:h-28 sm:w-28 rounded-full border border-dashed border-scnt-text/30"
                aria-hidden="true"
              />

              {/* Pulsing subtle glow backdrop */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.2, 0.45, 0.2] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute h-20 w-20 rounded-full bg-scnt-text/[0.06] blur-xl"
                aria-hidden="true"
              />

              {/* Signature 8-point compass star */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative text-scnt-text z-10"
              >
                <EightPointStar size={36} />
              </motion.div>
            </div>

            {/* Brand Logo & Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-[0.14em] text-scnt-text uppercase">
                SCNT<span className="text-scnt-text-muted/70">.</span>eg
              </h1>
              <span className="mt-2.5 text-[0.62rem] sm:text-xs font-light tracking-[0.55em] uppercase text-scnt-text/80 ps-1">
                FRAGRANCES
              </span>
            </motion.div>

            {/* Editorial Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-serif text-base sm:text-lg italic text-scnt-text-muted max-w-sm tracking-wide"
            >
              &ldquo;{t('transition.tagline')}&rdquo;
            </motion.p>
          </div>

          {/* Bottom Hairline Progress Indicator */}
          <div className="w-full pb-8 sm:pb-10 px-8 flex flex-col items-center">
            <div className="w-36 sm:w-44 h-[1px] bg-scnt-border relative overflow-hidden rounded-full">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{
                  duration: AUTO_DISMISS_MS / 1000,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="absolute inset-0 bg-scnt-text/60"
              />
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
