import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EightPointStar } from '../ui/EightPointStar'
import { Button } from '../ui/Button'
import { ScntMatcher } from '../matcher/ScntMatcher'
import { useI18n } from '../../i18n/I18nContext'

export function FindYourScent() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
  const [inlineOpen, setInlineOpen] = useState(false)

  return (
    <section
      id="find-your-scent"
      className="relative scroll-mt-24 border-t border-scnt-border/80 bg-gradient-to-b from-scnt-bg-muted/20 via-transparent to-scnt-bg px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-scnt-border/80 to-transparent" />

      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
          <EightPointStar size={10} className="text-scnt-text" />
          <span>{isAr ? 'العثور على عطرك المثالي' : 'Dual-Mode Fragrance Finder'}</span>
        </p>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-scnt-text sm:text-5xl">
          {isAr ? 'مساران لاختيار عطرك. دون أي تردد.' : 'Two paths to lock in your scent. Zero guesswork.'}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
          {isAr
            ? 'سواء كنت تريد مطابقة عطرك لمناسبة محددة في ١٥ ثانية، أو ترغب في رحلة استشارية عميقة تكشف هويتك العطرية عبر المجموعات الأربع.'
            : 'Whether you want a 15-second outing match for your exact moment, or a bespoke atelier journey mapping your identity archetype across our four collections.'}
        </p>
      </div>

      {/* Dual Entry Cards */}
      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* Path 1: THE SCNT MATCHER */}
        <article className="group relative overflow-hidden rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/70 p-6 sm:p-8 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-scnt-text/40 hover:shadow-[0_20px_50px_-25px_rgba(42,38,34,0.3)] flex flex-col justify-between">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/matcher/categories/sweat-motion.webp"
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-15 filter brightness-90 contrast-110 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108 group-hover:opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scnt-bg via-scnt-bg/85 to-transparent" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-scnt-border/80 bg-scnt-bg/80 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-scnt-text">
                {isAr ? '⚡ ١٥ ثانية · حسب المناسبة' : '⚡ 15s · Outing & Scene Finder'}
              </span>
              <span className="text-xs font-semibold text-scnt-text-muted">Mode 01</span>
            </div>

            <h3 className="mt-5 font-serif text-2xl font-medium text-scnt-text sm:text-3xl">
              {isAr ? 'أين وجهتك اليوم؟ (THE SCNT MATCHER)' : 'Where Are You Headed? (THE SCNT MATCHER)'}
            </h3>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
              {isAr
                ? 'صالة الألعاب، موعد عشاء، قيادة ساحلية بالساحل أو السخنة، أو زفاف رسمي. ٣ نقرات دون أي كتابة — نحدد زجاجتك الكاملة مع عينة استكشافية إضافية مجاناً.'
                : 'Gym sessions, client boardrooms, coastal drives, or candlelit dates. 3 taps, zero typing. Locks in your full bottle plus complimentary discovery decants.'}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              to="/find-your-scnt?mode=matcher"
              variant="primary"
              className="w-full py-3 text-xs sm:text-sm font-semibold sm:w-auto"
            >
              <span>{isAr ? 'فتح المحرك التفاعلي' : 'Launch SCNT Matcher'}</span>
              <span aria-hidden="true">{isAr ? '←' : '→'}</span>
            </Button>
            <Button
              onClick={() => setInlineOpen((prev) => !prev)}
              variant="outline"
              className="w-full py-3 text-xs font-medium sm:w-auto"
            >
              {inlineOpen
                ? isAr ? 'إغلاق المعاينة' : 'Hide Live Preview'
                : isAr ? 'تجربة سريعة هنا' : 'Try Live Here'}
            </Button>
          </div>
        </article>

        {/* Path 2: Identity Atelier */}
        <article className="group relative overflow-hidden rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/70 p-6 sm:p-8 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-scnt-text/40 hover:shadow-[0_20px_50px_-25px_rgba(42,38,34,0.3)] flex flex-col justify-between">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/matcher/categories/hustle-focus.webp"
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-15 filter brightness-90 contrast-110 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108 group-hover:opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scnt-bg via-scnt-bg/85 to-transparent" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-scnt-border/80 bg-scnt-bg/80 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-scnt-text">
                {isAr ? '💎 استشارة حسية متكاملة' : '💎 Bespoke · Identity Atelier'}
              </span>
              <span className="text-xs font-semibold text-scnt-text-muted">Mode 02</span>
            </div>

            <h3 className="mt-5 font-serif text-2xl font-medium text-scnt-text sm:text-3xl">
              {isAr ? 'اكتشف هويتك العطرية الخاصة' : 'Find My Signature Identity'}
            </h3>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
              {isAr
                ? 'رحلة استشارية تحلل حضورك الشخصي، وطاقتك، ونمط حياتك لتربطك بالمجموعة الأقرب إليك: إكزكتيف، إكسبلورر، تشارمر، أو آيكون مع تحليل دقيق لنوتات الهرم العطري.'
                : 'Our comprehensive personality profiling engine. Decodes your presence across The Executive, The Explorer, The Charmer, and The Icon to pinpoint your enduring signature.'}
            </p>
          </div>

          <div className="mt-8">
            <Button
              to="/find-your-scnt?mode=identity"
              variant="outline"
              className="w-full py-3 text-xs sm:text-sm font-semibold hover:bg-scnt-bg sm:w-auto"
            >
              <span>{isAr ? 'بدء استشارة الهوية' : 'Start Identity Atelier'}</span>
              <span aria-hidden="true">{isAr ? '←' : '→'}</span>
            </Button>
          </div>
        </article>
      </div>

      {/* Optional Inline Live Matcher Drawer */}
      <AnimatePresence>
        {inlineOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/80 p-6 sm:p-8 backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-scnt-border/50 pb-4 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                {isAr ? 'معاينة حية فورية' : 'Live Interactive Matcher'}
              </span>
              <button
                type="button"
                onClick={() => setInlineOpen(false)}
                className="cursor-pointer text-xs text-scnt-text-muted hover:text-scnt-text underline"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
            <ScntMatcher embedded={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
