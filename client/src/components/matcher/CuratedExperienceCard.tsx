import { motion } from 'framer-motion'
import { EightPointStar } from '../ui/EightPointStar'
import type { FragranceCatalogueEntry } from '../../data/scntMatcherData'

interface CuratedExperienceCardProps {
  primary: FragranceCatalogueEntry
  runnerUp: FragranceCatalogueEntry
  onSwap: () => void
  matchedOutingTitle?: string
  locale?: string
}

export function CuratedExperienceCard({
  primary,
  runnerUp,
  onSwap,
  matchedOutingTitle,
  locale = 'en',
}: CuratedExperienceCardProps) {
  const isAr = locale === 'ar'

  return (
    <div className="relative mx-auto w-full max-w-2xl select-none overflow-hidden rounded-3xl border border-[#D5C0AB] bg-gradient-to-br from-[#F7EFE7] via-[#F3E7DB] to-[#EBD9C8] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(42,38,34,0.18)]">
      {/* Subtle Paper Texture & Watermark */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#2A2622 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />
      <div className="pointer-events-none absolute -bottom-16 -end-16 h-64 w-64 rounded-full bg-gradient-to-tl from-[#1B3047]/10 via-[#B89B5E]/12 to-transparent blur-2xl" />

      {/* Card Header */}
      <div className="relative text-center">
        <div className="inline-flex items-center justify-center gap-2 text-[0.68rem] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[#6B635A]">
          <span>SCNT.eg</span>
          <EightPointStar size={10} className="text-[#2A2622]" />
          <span>{isAr ? 'تجربتك العطرية المنسقة' : 'YOUR CURATED EXPERIENCE'}</span>
        </div>
        <p className="mt-1 text-[0.68rem] sm:text-xs uppercase tracking-widest text-[#8A7D6E]">
          {isAr ? 'بطاقة الاكتشاف الثنائية · عينات إكستري دو بارفان ٢ مل' : 'Dual-Sided Discovery Insert · 2ml Discovery Decants'}
        </p>
      </div>

      {/* Vial Slots Container */}
      <div className="relative mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Slot 1: Primary Match Tester */}
        <motion.div
          key={`slot-primary-${primary.name}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col justify-between rounded-2xl border border-[#DECDBE] bg-gradient-to-b from-[#FFFDF9]/95 to-[#EFE2D4]/80 p-5 shadow-[inset_0_2px_6px_rgba(42,38,34,0.06),0_8px_20px_-8px_rgba(42,38,34,0.08)]"
        >
          {/* Header Label */}
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#1B3047]/10 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-[#1B3047] border border-[#1B3047]/20">
                {isAr ? 'عينة عطرك الأساسي' : '#1 Bottle Tester'}
              </span>
              <span className="text-[0.65rem] font-medium text-[#8A7D6E]">2ml Decant</span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-wider text-[#6B635A]">
              {isAr ? 'عينة تجربتك لعطر SCNT المختار:' : "Here's a tester for your SCNT:"}
            </p>
          </div>

          {/* Vial Representation & Midnight Royal Ink Handwritten Name */}
          <div className="my-5 flex items-center gap-4">
            {/* Visual Mini Discovery Vial */}
            <div className="relative flex h-24 w-8 flex-shrink-0 flex-col items-center justify-end rounded-full border border-[#D0BAA4] bg-gradient-to-b from-[#E6D4C2]/50 via-white/80 to-[#D4BAA0]/40 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]">
              {/* Atomizer Cap */}
              <div className="absolute -top-3 h-3.5 w-3.5 rounded-t-sm border border-[#444] bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800" />
              {/* Perfume Liquid Level */}
              <div className="h-16 w-5 rounded-full bg-gradient-to-t from-[#C5A059]/45 via-[#E2C98F]/40 to-transparent shadow-inner" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rotate-90 text-[0.45rem] font-mono tracking-widest text-[#2A2622]/60">SCNT</span>
              </div>
            </div>

            {/* Handwritten-Style Midnight Navy Ink Name */}
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-2xl font-semibold italic tracking-wide text-[#1B3047] drop-shadow-[0_1px_1px_rgba(27,48,71,0.18)]">
                {primary.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-[#6B635A] uppercase tracking-wider">
                {primary.collection}
              </p>
              {/* Divider Authenticity */}
              <div className="my-1.5 flex items-center">
                {primary.dividerStyle === 'dashed' ? (
                  <div className="w-16 border-t-2 border-dashed border-[#2A2622]/60" title="Dashed Divider" />
                ) : (
                  <div className="h-0.5 w-16 bg-[#2A2622]" title="Solid Divider" />
                )}
              </div>
              <p className="text-[0.68rem] leading-tight text-[#8A7D6E] line-clamp-2">
                {primary.tagline}
              </p>
            </div>
          </div>

          <div className="border-t border-[#DECDBE]/70 pt-2 text-[0.65rem] text-[#8A7D6E]">
            {isAr ? 'افتح العينة أولاً — احتفظ بالزجاجة الكبيرة مغلقة' : 'Test decant on skin before breaking bottle seal'}
          </div>
        </motion.div>

        {/* Slot 2: Runner-Up Contrast Tester */}
        <motion.div
          key={`slot-runner-${runnerUp.name}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col justify-between rounded-2xl border border-[#DECDBE] bg-gradient-to-b from-[#FFFDF9]/95 to-[#EFE2D4]/80 p-5 shadow-[inset_0_2px_6px_rgba(42,38,34,0.06),0_8px_20px_-8px_rgba(42,38,34,0.08)]"
        >
          {/* Header Label */}
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#B89B5E]/15 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-[#8A7338] border border-[#B89B5E]/30">
                {isAr ? 'عينة استكشافية مجانية' : 'Complimentary Decant'}
              </span>
              <span className="text-[0.65rem] font-medium text-[#8A7D6E]">2ml Decant</span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-wider text-[#6B635A]">
              {isAr ? 'وقد يعجبك أيضاً هذا النقاء:' : 'and you might also like:'}
            </p>
          </div>

          {/* Vial Representation & Midnight Royal Ink Name */}
          <div className="my-5 flex items-center gap-4">
            {/* Visual Mini Discovery Vial */}
            <div className="relative flex h-24 w-8 flex-shrink-0 flex-col items-center justify-end rounded-full border border-[#D0BAA4] bg-gradient-to-b from-[#E6D4C2]/50 via-white/80 to-[#D4BAA0]/40 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]">
              {/* Atomizer Cap */}
              <div className="absolute -top-3 h-3.5 w-3.5 rounded-t-sm border border-[#444] bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800" />
              {/* Perfume Liquid Level */}
              <div className="h-16 w-5 rounded-full bg-gradient-to-t from-[#B89B5E]/40 via-[#F3DEAA]/35 to-transparent shadow-inner" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rotate-90 text-[0.45rem] font-mono tracking-widest text-[#2A2622]/60">SCNT</span>
              </div>
            </div>

            {/* Handwritten-Style Name */}
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-2xl font-semibold italic tracking-wide text-[#1B3047] drop-shadow-[0_1px_1px_rgba(27,48,71,0.18)]">
                {runnerUp.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-[#6B635A] uppercase tracking-wider">
                {runnerUp.collection}
              </p>
              {/* Divider Authenticity */}
              <div className="my-1.5 flex items-center">
                {runnerUp.dividerStyle === 'dashed' ? (
                  <div className="w-16 border-t-2 border-dashed border-[#2A2622]/60" title="Dashed Divider" />
                ) : (
                  <div className="h-0.5 w-16 bg-[#2A2622]" title="Solid Divider" />
                )}
              </div>
              <p className="text-[0.68rem] leading-tight text-[#8A7D6E] line-clamp-2">
                {runnerUp.tagline}
              </p>
            </div>
          </div>

          <div className="border-t border-[#DECDBE]/70 pt-2 text-[0.65rem] text-[#8A7D6E]">
            {isAr ? 'عينة إضافية لاكتشاف التناغم العطري المقابل' : 'Contrast scent matched to balance your primary choice'}
          </div>
        </motion.div>
      </div>

      {/* 1-Click Swap Primary & Decant Control */}
      <div className="mt-5 flex items-center justify-center">
        <motion.button
          type="button"
          onClick={onSwap}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.97 }}
          className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#B89B5E]/40 bg-[#FFFDF9] px-5 py-2 text-xs font-semibold text-[#2A2622] shadow-[0_2px_8px_rgba(42,38,34,0.06)] transition-all hover:border-[#1B3047]/60 hover:bg-white hover:shadow-md"
        >
          <svg
            className="h-3.5 w-3.5 text-[#1B3047] transition-transform duration-500 group-hover:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>{isAr ? 'تبديل: جعل العينة الثانية هي الزجاجة الكبيرة' : 'Swap Primary Bottle & Decant'}</span>
        </motion.button>
      </div>

      {/* Outing Context Pill & 14-Day Guarantee Notice */}
      <div className="mt-5 border-t border-[#DECDBE] pt-4 text-center">
        {matchedOutingTitle && (
          <p className="text-[0.68rem] font-medium uppercase tracking-wider text-[#8A7D6E]">
            {isAr ? `تنسيق المناسبة: ${matchedOutingTitle}` : `Curated for: ${matchedOutingTitle}`}
          </p>
        )}
        <p className="mt-1 text-xs text-[#6B635A] font-serif italic">
          &ldquo;
          {isAr
            ? 'جرب العينة على جلدك أولاً. احتفظ بالزجاجة الأساسية مغلقة — استرجاع كامل للمبلغ خلال ١٤ يوماً إذا لم يكن عطرك المثالي.'
            : "Test the decant on skin first. Keep the full bottle sealed—14-day full-refund returns if it's not a match."}
          &rdquo;
        </p>
      </div>
    </div>
  )
}
