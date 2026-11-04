import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EightPointStar } from '../ui/EightPointStar'
import { CheckIcon } from '../icons'
import { Button } from '../ui/Button'
import { CuratedExperienceCard } from './CuratedExperienceCard'
import {
  scntMatcherData,
  getFragrance,
  getMacroCategory,
  getEventsForCategory,
  getEvent,
  type GenderAudience,
  type MatcherEvent,
  type FragranceCatalogueEntry,
} from '../../data/scntMatcherData'
import { useCatalog } from '../../context/CatalogContext'
import { useCartStore } from '../../store/cartStore'
import { useI18n } from '../../i18n/I18nContext'
import { formatEgp } from '../../lib/formatEgp'

function scrollElementToTop(element: HTMLElement | null, offset = 84) {
  if (!element || typeof window === 'undefined') return
  const rect = element.getBoundingClientRect()
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  const targetTop = Math.max(0, rect.top + scrollTop - offset)
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  window.scrollTo({
    top: targetTop,
    behavior: prefersReduced ? 'auto' : 'smooth',
  })
}

type MatcherStep = 'radar' | 'scene' | 'instinct' | 'reveal'
type BottleSize = '50ml' | '100ml'

interface ScntMatcherProps {
  onRestartRequest?: () => void
  embedded?: boolean
}

export function ScntMatcher({ embedded = false }: ScntMatcherProps) {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const { products } = useCatalog()
  const addItem = useCartStore((s) => s.addItem)

  // Top-level Audience Toggle: 'for_him' | 'for_her'
  const [audience, setAudience] = useState<GenderAudience>('for_him')

  // State Machine Step
  const [step, setStep] = useState<MatcherStep>('radar')
  const [isMatching, setIsMatching] = useState(false)
  const [matchingStage, setMatchingStage] = useState(0)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('sweat-motion')
  const [selectedEventId, setSelectedEventId] = useState<string>('ev-01-gym')
  const [chosenSide, setChosenSide] = useState<'optionA' | 'optionB'>('optionA')
  const [isSwapped, setIsSwapped] = useState<boolean>(false)
  const [selectedSize, setSelectedSize] = useState<BottleSize>('100ml')
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false)
  const [bundleAddedSuccess, setBundleAddedSuccess] = useState<boolean>(false)
  const matcherTransitionRef = useRef<HTMLDivElement | null>(null)

  const matchingStages = useMemo(
    () => [
      {
        title: t('fz.matching.searchingProfiles'),
        sub: t('fz.matching.searchingProfilesSub'),
        stepLabel: t('fz.matching.step1'),
      },
      {
        title: t('fz.matching.matchingCollection'),
        sub: t('fz.matching.matchingCollectionSub'),
        stepLabel: t('fz.matching.step2'),
      },
      {
        title: t('fz.matching.matchingFragrance'),
        sub: t('fz.matching.matchingFragranceSub'),
        stepLabel: t('fz.matching.step3'),
      },
      {
        title: t('fz.matching.finalizing'),
        sub: t('fz.matching.finalizingSub'),
        stepLabel: t('fz.matching.step4'),
      },
    ],
    [t],
  )

  useEffect(() => {
    if (!isMatching) return

    const t1 = setTimeout(() => setMatchingStage(1), 1100)
    const t2 = setTimeout(() => setMatchingStage(2), 2200)
    const t3 = setTimeout(() => setMatchingStage(3), 3300)
    const t4 = setTimeout(() => {
      setIsMatching(false)
      setStep('reveal')
    }, 4400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [isMatching])

  function handleFastTrackMatching() {
    setIsMatching(false)
    setStep('reveal')
  }

  useEffect(() => {
    if (step === 'reveal' && matcherTransitionRef.current) {
      const target = matcherTransitionRef.current
      const t1 = setTimeout(() => scrollElementToTop(target, 84), 60)
      const t2 = setTimeout(() => scrollElementToTop(target, 84), 380)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [step])

  // Current selections
  const activeCategory = useMemo(() => getMacroCategory(selectedCategoryId), [selectedCategoryId])
  const activeEvent = useMemo(() => getEvent(selectedEventId) ?? scntMatcherData.events[0], [selectedEventId])
  const categoryEvents = useMemo(() => getEventsForCategory(selectedCategoryId), [selectedCategoryId])

  // Resolve fragrance IDs based on audience (handling herOverride dynamically)
  const effectiveOptionA = useMemo(() => {
    if (audience === 'for_her' && activeEvent.herOverride) {
      return {
        fragranceId: activeEvent.herOverride.optionAFragranceId,
        pitch: activeEvent.herOverride.optionAPitch,
        buttonLabel: activeEvent.optionA.buttonLabel,
        vibeTag: activeEvent.optionA.vibeTag,
      }
    }
    return activeEvent.optionA
  }, [audience, activeEvent])

  const effectiveOptionB = useMemo(() => {
    if (audience === 'for_her' && activeEvent.herOverride) {
      return {
        fragranceId: activeEvent.herOverride.optionBFragranceId,
        pitch: activeEvent.herOverride.optionBPitch,
        buttonLabel: activeEvent.optionB.buttonLabel,
        vibeTag: activeEvent.optionB.vibeTag,
      }
    }
    return activeEvent.optionB
  }, [audience, activeEvent])

  // Resolve Primary and Runner-Up Fragrances
  const initialPrimaryId = chosenSide === 'optionA' ? effectiveOptionA.fragranceId : effectiveOptionB.fragranceId
  const initialRunnerUpId = chosenSide === 'optionA' ? effectiveOptionB.fragranceId : effectiveOptionA.fragranceId

  const primaryFragranceKey = isSwapped ? initialRunnerUpId : initialPrimaryId
  const runnerUpFragranceKey = isSwapped ? initialPrimaryId : initialRunnerUpId

  const primaryFragrance: FragranceCatalogueEntry = useMemo(
    () => getFragrance(primaryFragranceKey) ?? scntMatcherData.fragranceCatalogue['azure-code'],
    [primaryFragranceKey]
  )
  const runnerUpFragrance: FragranceCatalogueEntry = useMemo(
    () => getFragrance(runnerUpFragranceKey) ?? scntMatcherData.fragranceCatalogue['cobalt-drive'],
    [runnerUpFragranceKey]
  )

  // Contextual pitch for the primary choice
  const primaryPitch = useMemo(() => {
    if (primaryFragranceKey === effectiveOptionA.fragranceId) return effectiveOptionA.pitch
    return effectiveOptionB.pitch
  }, [primaryFragranceKey, effectiveOptionA, effectiveOptionB])

  // Look up catalog API products for pricing and MongoDB apiId
  const primaryCatalogProduct = useMemo(
    () => products.find((p) => p.id === primaryFragranceKey),
    [products, primaryFragranceKey]
  )
  const runnerUpCatalogProduct = useMemo(
    () => products.find((p) => p.id === runnerUpFragranceKey),
    [products, runnerUpFragranceKey]
  )

  // Step 1: Handle Macro Category Selection
  function handleSelectCategory(catId: string) {
    setSelectedCategoryId(catId)
    const available = getEventsForCategory(catId)
    if (available.length > 0) {
      setSelectedEventId(available[0].eventId)
    }
    setTimeout(() => {
      setStep('scene')
    }, 320)
  }

  // Step 2: Handle Event Scene Selection
  function handleSelectEvent(event: MatcherEvent) {
    setSelectedEventId(event.eventId)
    setIsSwapped(false)
    setAddedSuccess(false)
    setBundleAddedSuccess(false)
    setTimeout(() => {
      setStep('instinct')
    }, 280)
  }

  // Step 3: Handle Instinct Binary Selection
  function handleSelectOption(side: 'optionA' | 'optionB') {
    setChosenSide(side)
    setIsSwapped(false)
    setAddedSuccess(false)
    setBundleAddedSuccess(false)
    setIsMatching(true)
    setMatchingStage(0)
    if (matcherTransitionRef.current) {
      scrollElementToTop(matcherTransitionRef.current, 84)
    }
  }

  // Handle 1-Click Swap
  function handleSwap() {
    setIsSwapped((prev) => !prev)
    setAddedSuccess(false)
  }

  // Reset to Step 1
  function handleReset() {
    setIsMatching(false)
    setMatchingStage(0)
    setStep('radar')
    setIsSwapped(false)
    setAddedSuccess(false)
    setBundleAddedSuccess(false)
    if (matcherTransitionRef.current) {
      scrollElementToTop(matcherTransitionRef.current, 84)
    }
  }

  // Primary CTA: Lock in Selected Bottle + Free Tester
  function handleAddPrimaryToCart() {
    const price = selectedSize === '50ml' ? 500 : 750
    const productId = primaryCatalogProduct?.apiId || primaryFragranceKey
    const image =
      primaryCatalogProduct?.galleryImages?.[0] ||
      primaryFragrance.bottleClearMockup ||
      primaryFragrance.bottleMockup

    addItem({
      productId,
      name: primaryFragrance.name,
      size: selectedSize,
      price,
      quantity: 1,
      image,
      metadata: {
        primary_tester_vial: primaryFragrance.name,
        complimentary_second_vial: runnerUpFragrance.name,
        matched_outing: activeEvent.title,
      },
    })

    setAddedSuccess(true)
    setTimeout(() => setAddedSuccess(false), 5000)
  }

  // Bundle CTA: Both 100ml Bottles (EGP 1,500 + Free Shipping)
  function handleAddBundleToCart() {
    const primaryId = primaryCatalogProduct?.apiId || primaryFragranceKey
    const runnerId = runnerUpCatalogProduct?.apiId || runnerUpFragranceKey

    const primaryImg =
      primaryCatalogProduct?.galleryImages?.[0] ||
      primaryFragrance.bottleClearMockup ||
      primaryFragrance.bottleMockup

    const runnerImg =
      runnerUpCatalogProduct?.galleryImages?.[0] ||
      runnerUpFragrance.bottleClearMockup ||
      runnerUpFragrance.bottleMockup

    // Add Primary 100ml
    addItem({
      productId: primaryId,
      name: primaryFragrance.name,
      size: '100ml',
      price: 750,
      quantity: 1,
      image: primaryImg,
      metadata: {
        primary_tester_vial: primaryFragrance.name,
        complimentary_second_vial: runnerUpFragrance.name,
        matched_outing: activeEvent.title,
        bundle_type: 'curated_duo_100ml',
      },
    })

    // Add Runner-Up 100ml
    addItem({
      productId: runnerId,
      name: runnerUpFragrance.name,
      size: '100ml',
      price: 750,
      quantity: 1,
      image: runnerImg,
      metadata: {
        primary_tester_vial: primaryFragrance.name,
        complimentary_second_vial: runnerUpFragrance.name,
        matched_outing: activeEvent.title,
        bundle_type: 'curated_duo_100ml',
      },
    })

    setBundleAddedSuccess(true)
    setTimeout(() => setBundleAddedSuccess(false), 5000)
  }

  const stepsList: { id: MatcherStep; labelKey: string }[] = [
    { id: 'radar', labelKey: 'fz.matcher.step1' },
    { id: 'scene', labelKey: 'fz.matcher.step2' },
    { id: 'instinct', labelKey: 'fz.matcher.step3' },
    { id: 'reveal', labelKey: 'fz.matcher.step4' },
  ]

  const currentStepIndex = stepsList.findIndex((s) => s.id === step)

  return (
    <div className={`relative w-full ${embedded ? 'py-4' : 'py-8'}`}>
      {/* Editorial Header & Top Audience Pill Toggle */}
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-scnt-border/80 bg-scnt-bg-elevated/80 px-3.5 py-1 text-[0.68rem] sm:text-xs font-semibold uppercase tracking-[0.28em] text-scnt-text-muted backdrop-blur-md">
          <EightPointStar size={10} className="text-scnt-text" />
          <span>{scntMatcherData.matcherMeta.title}</span>
        </div>

        <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-scnt-text sm:text-4xl">
          {isAr ? '٣ نقرات. ١٥ ثانية. حدد وجهتك — نضمن لك عطرك وعينتك التجريبية.' : scntMatcherData.matcherMeta.subtitle}
        </h2>

        {/* Audience Pill Toggle: For Him | For Her */}
        <div className="mt-6 flex items-center justify-center">
          <div className="relative inline-flex items-center rounded-full border border-scnt-border/90 bg-scnt-bg-elevated/90 p-1 shadow-sm backdrop-blur-md">
            <button
              type="button"
              onClick={() => setAudience('for_him')}
              className={`relative z-10 cursor-pointer rounded-full px-5 py-2 text-xs font-semibold tracking-wider transition-colors duration-200 ${
                audience === 'for_him' ? 'text-scnt-bg' : 'text-scnt-text-muted hover:text-scnt-text'
              }`}
            >
              {audience === 'for_him' && (
                <motion.span
                  layoutId="matcherAudiencePill"
                  className="absolute inset-0 rounded-full bg-scnt-text shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{isAr ? 'المجموعة الرجالية (For Him)' : 'For Him'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAudience('for_her')}
              className={`relative z-10 cursor-pointer rounded-full px-5 py-2 text-xs font-semibold tracking-wider transition-colors duration-200 ${
                audience === 'for_her' ? 'text-scnt-bg' : 'text-scnt-text-muted hover:text-scnt-text'
              }`}
            >
              {audience === 'for_her' && (
                <motion.span
                  layoutId="matcherAudiencePill"
                  className="absolute inset-0 rounded-full bg-scnt-text shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{isAr ? 'المجموعة النسائية (For Her · The Icon)' : 'For Her (The Icon)'}</span>
            </button>
          </div>
        </div>

        {/* Modern Interactive Stepper Bar */}
        <div className="mt-8 flex items-center justify-center">
          <nav
            aria-label="Matcher progress"
            className="flex items-center gap-1.5 sm:gap-3 rounded-2xl border border-scnt-border/80 bg-scnt-bg-elevated/70 px-3 py-2 sm:px-5 sm:py-2.5 backdrop-blur-md shadow-sm"
          >
            {stepsList.map((st, idx) => {
              const isActive = (step === st.id && !isMatching) || (isMatching && st.id === 'reveal')
              const isPassed = isMatching ? idx < 3 : currentStepIndex > idx
              const canClick = !isMatching && (isPassed || isActive)

              return (
                <div key={st.id} className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={!canClick}
                    onClick={() => setStep(st.id)}
                    className={`group flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 py-1 text-xs transition-all duration-200 ${
                      isActive
                        ? 'bg-scnt-text text-scnt-bg font-semibold shadow-xs'
                        : isPassed
                          ? 'cursor-pointer text-scnt-text hover:bg-scnt-bg/80'
                          : 'cursor-not-allowed text-scnt-text-muted/60 opacity-60'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-scnt-bg text-scnt-text'
                          : isPassed
                            ? 'bg-scnt-text/10 text-scnt-text'
                            : 'border border-scnt-border/70 text-scnt-text-muted/60'
                      }`}
                    >
                      {isPassed ? <CheckIcon size={11} strokeWidth={2.4} /> : idx + 1}
                    </span>
                    <span className="hidden sm:inline tracking-wider uppercase text-[0.68rem]">
                      {t(st.labelKey)}
                    </span>
                  </button>

                  {idx < stepsList.length - 1 && (
                    <span className="text-scnt-border select-none" aria-hidden="true">
                      &rsaquo;
                    </span>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Conversational Transition Area */}
      <div ref={matcherTransitionRef} className="mx-auto mt-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {/* MATCHING ANIMATION (Exact match with Find My Signature Identity) */}
          {isMatching && (
            <motion.div
              key="matcher-matching"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 py-8 sm:py-12"
              role="status"
              aria-live="polite"
            >
              {/* Central animated luxury motif */}
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(184,155,94,0.22),transparent_70%)] blur-xl" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border border-dashed border-scnt-border"
                />
                <motion.div
                  animate={{ scale: [0.94, 1.05, 0.94], opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-2.5 rounded-full border border-scnt-border/80 bg-scnt-bg/50 shadow-[0_0_24px_rgba(184,155,94,0.12)]"
                />
                <div className="relative text-scnt-text">
                  <motion.div
                    animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 1] }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  >
                    <EightPointStar size={34} />
                  </motion.div>
                </div>
              </div>

              {/* Progressive matching title and description */}
              <div className="mt-6 min-h-[90px] text-center sm:min-h-[96px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={matchingStage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="font-serif text-2xl font-medium tracking-tight text-scnt-text sm:text-3xl">
                      {matchingStages[matchingStage]?.title}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                      {matchingStages[matchingStage]?.sub}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Micro-visualizer reflecting each analysis phase */}
              <div className="mt-4 flex min-h-[58px] items-center justify-center">
                <AnimatePresence mode="wait">
                  {matchingStage === 0 ? (
                    <motion.div
                      key="stage-0"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-wrap items-center justify-center gap-2"
                    >
                      {[
                        activeCategory?.label || (isAr ? 'المجال العام' : 'Macro Atmosphere'),
                        activeEvent?.title || (isAr ? 'المشهد' : 'Scene'),
                        chosenSide === 'optionA' ? effectiveOptionA.vibeTag : effectiveOptionB.vibeTag,
                        audience === 'for_her'
                          ? isAr
                            ? 'المجموعة النسائية'
                            : 'For Her'
                          : isAr
                            ? 'المجموعة الرجالية'
                            : 'For Him',
                      ].map((trait, i) => (
                        <span
                          key={trait}
                          className="inline-flex items-center gap-1.5 rounded-full border border-scnt-border/80 bg-scnt-bg/60 px-3 py-1.5 text-xs text-scnt-text-muted"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-scnt-text/60 animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }}
                          />
                          {trait}
                        </span>
                      ))}
                    </motion.div>
                  ) : matchingStage === 1 ? (
                    <motion.div
                      key="stage-1"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4"
                    >
                      {[
                        {
                          id: 'executive',
                          name: isAr ? 'ذا إكزكتيف' : 'The Executive',
                          pct: primaryFragrance.collection === 'THE EXECUTIVE' ? 94 : 35,
                        },
                        {
                          id: 'explorer',
                          name: isAr ? 'ذا إكسبلورر' : 'The Explorer',
                          pct: primaryFragrance.collection === 'THE EXPLORER' ? 95 : 38,
                        },
                        {
                          id: 'charmer',
                          name: isAr ? 'ذا تشارمر' : 'The Charmer',
                          pct: primaryFragrance.collection === 'THE CHARMER' ? 96 : 40,
                        },
                        {
                          id: 'icon',
                          name: isAr ? 'ذا آيكون' : 'The Icon',
                          pct: primaryFragrance.collection === 'THE ICON' ? 97 : 42,
                        },
                      ].map((col) => (
                        <div key={col.id} className="rounded-xl border border-scnt-border/70 bg-scnt-bg/50 p-2.5 text-center">
                          <p className="truncate text-[0.68rem] font-medium uppercase tracking-wider text-scnt-text-muted">
                            {col.name}
                          </p>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-scnt-border/50">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[rgba(122,143,163,0.85)] to-[rgba(184,155,94,0.9)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${col.pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : matchingStage === 2 ? (
                    <motion.div
                      key="stage-2"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
                    >
                      {[
                        {
                          tier: isAr ? 'النوتات الافتتاحية' : 'Top Accords',
                          detail: primaryFragrance.keyNotes.slice(0, 2).join(' · '),
                        },
                        {
                          tier: isAr ? 'قلب العطر' : 'Heart Notes',
                          detail: primaryFragrance.keyNotes[2] || primaryFragrance.keyNotes[1],
                        },
                        {
                          tier: isAr ? 'القاعدة العطرية' : 'Base Sillage',
                          detail: primaryFragrance.keyNotes.slice(-2).join(' · '),
                        },
                      ].map((noteTier) => (
                        <div
                          key={noteTier.tier}
                          className="min-w-[120px] max-w-[170px] rounded-xl border border-scnt-border/70 bg-scnt-bg/50 px-3.5 py-2 text-center"
                        >
                          <span className="text-[0.65rem] uppercase tracking-wider text-scnt-text-muted">{noteTier.tier}</span>
                          <p className="mt-1 truncate text-xs font-medium text-scnt-text">{noteTier.detail}</p>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stage-3"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center"
                    >
                      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(184,155,94,0.45)] bg-[rgba(184,155,94,0.1)] px-4 py-2 text-xs font-medium text-scnt-text">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgba(184,155,94,0.7)] opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[rgba(184,155,94,1)]" />
                        </span>
                        <span>{isAr ? 'تم العثور على التطابق المثالي' : 'Perfect Fragrance Match Found'}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fast-Track skip button */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleFastTrackMatching}
                  className="inline-flex items-center gap-1.5 text-xs text-scnt-text-muted hover:text-scnt-text transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  <span>{t('fz.fastTrack')}</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: The Radar (Macro Category) */}
          {!isMatching && step === 'radar' && (
            <motion.div
              key="step-radar"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-scnt-text-muted">
                  {isAr ? 'الخطوة الأولى: أين وجهتك اليوم؟' : 'Step 1 — Tap The Radar'}
                </p>
                <h3 className="mt-1 font-serif text-2xl font-medium text-scnt-text sm:text-3xl">
                  {isAr ? 'اختر الأجواء العامة ليومك أو مناسبتك' : 'Select Your Scene Atmosphere'}
                </h3>
              </div>

              {/* 6 Macro Category Cards - 2-Col Mobile (3 rows) -> 2-Col Tablet -> 3-Col Desktop */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 lg:gap-5">
                {scntMatcherData.macroCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id
                  return (
                    <article
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectCategory(cat.id)
                        }
                      }}
                      className={`group relative flex flex-col cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border text-start transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/40 ${
                        isSelected
                          ? 'border-scnt-text bg-scnt-bg-elevated shadow-lg ring-1 sm:ring-2 ring-scnt-text/30'
                          : 'border-scnt-border/80 bg-scnt-bg-elevated/70 hover:border-scnt-text/40'
                      }`}
                    >
                      {/* Atmospheric Category Hero Header */}
                      {cat.imageUrl && (
                        <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-scnt-bg/50">
                          <img
                            src={cat.imageUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-106 brightness-100 group-hover:brightness-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute inset-x-2 sm:inset-x-3.5 top-2 sm:top-3.5 flex items-center justify-between pointer-events-none">
                            {cat.badgeLabel ? (
                              <span className="inline-flex items-center rounded-full border border-white/25 bg-black/65 px-2 py-0.5 sm:px-3 sm:py-1 text-[0.55rem] sm:text-[0.62rem] font-semibold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
                                {cat.badgeLabel}
                              </span>
                            ) : <span />}
                            <span className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border text-white backdrop-blur-md transition-all duration-300 ${
                              isSelected
                                ? 'bg-scnt-text border-scnt-text text-scnt-bg shadow-sm'
                                : 'bg-black/40 border-white/30 group-hover:scale-110 shadow-sm'
                            }`}>
                              <span className="text-[0.62rem] sm:text-xs">
                                {isSelected ? <CheckIcon size={13} strokeWidth={2.4} /> : isAr ? '←' : '→'}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-5">
                        <div>
                          <span className="block font-serif text-sm sm:text-xl font-medium leading-snug sm:leading-normal text-scnt-text group-hover:text-scnt-text">
                            {cat.label}
                          </span>
                          <p className="mt-1 line-clamp-2 text-[0.68rem] sm:text-sm leading-relaxed text-scnt-text-muted">
                            {cat.subtext}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-4 flex items-center justify-between border-t border-scnt-border/40 pt-1.5 sm:pt-2 text-[0.62rem] sm:text-[0.68rem] text-scnt-text-muted">
                          <span className="truncate">{isSelected ? (isAr ? 'تم الاختيار' : 'Selected') : (isAr ? 'استكشف المشهد' : 'Explore Scene')}</span>
                          <span className="font-semibold text-scnt-text group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                            {isAr ? '←' : '→'}
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Bot Reaction Bubble with concierge note */}
              {activeCategory && (
                <motion.div
                  key={`reaction-${activeCategory.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto max-w-xl rounded-2xl border border-scnt-border/80 bg-scnt-bg-elevated/80 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-scnt-text text-scnt-bg">
                      <EightPointStar size={11} />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-scnt-text-muted">
                        {isAr ? 'نصيحة الخبير العطري:' : 'SCNT Matcher Note:'}
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-scnt-text">
                        &ldquo;{activeCategory.botReaction}&rdquo;
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2: The Exact Scene (4 Events per Category) */}
          {!isMatching && step === 'scene' && (
            <motion.div
              key="step-scene"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-scnt-text-muted">
                    {isAr ? `المجال: ${activeCategory?.label}` : `Category: ${activeCategory?.label}`}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-medium text-scnt-text sm:text-3xl">
                    {isAr ? 'حدد مناسبتك المحددة بالتفصيل' : 'Select Your Exact Outing'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('radar')}
                  className="inline-flex items-center gap-1 cursor-pointer rounded-full border border-scnt-border/80 bg-scnt-bg/60 px-3.5 py-1.5 text-xs text-scnt-text-muted transition hover:border-scnt-text/40 hover:text-scnt-text"
                >
                  <span>{isAr ? '→' : '←'}</span>
                  <span>{isAr ? 'تغيير المجال' : 'Back to Radar'}</span>
                </button>
              </div>

              {/* 4 Outing Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {categoryEvents.map((ev) => {
                  const isSelected = selectedEventId === ev.eventId
                  return (
                    <article
                      key={ev.eventId}
                      onClick={() => handleSelectEvent(ev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectEvent(ev)
                        }
                      }}
                      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 text-start transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/40 ${
                        isSelected
                          ? 'border-scnt-text bg-scnt-bg-elevated ring-1 ring-scnt-text/20'
                          : 'border-scnt-border/80 bg-scnt-bg/60 hover:border-scnt-text/30 hover:bg-scnt-bg-elevated/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-lg font-medium text-scnt-text">
                          {ev.title}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-scnt-text transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                          <span>{isAr ? 'متابعة' : 'Lock Scene'}</span>
                          <span aria-hidden="true">{isAr ? '←' : '→'}</span>
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-scnt-text-muted">
                        {ev.conciergePrompt}
                      </p>
                    </article>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: The Instinct Round ("This or That" Binary Split) */}
          {!isMatching && step === 'instinct' && (
            <motion.div
              key="step-instinct"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {/* Matcher Prompt Speech Bubble */}
              <div className="mx-auto max-w-2xl rounded-2xl border border-scnt-border/90 bg-scnt-bg-elevated/85 p-5 text-center shadow-sm">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-scnt-text-muted">
                  <EightPointStar size={10} className="text-scnt-text" />
                  <span>{activeEvent.title}</span>
                </div>
                <h3 className="mt-3 font-serif text-xl sm:text-2xl font-medium text-scnt-text">
                  &ldquo;{activeEvent.conciergePrompt}&rdquo;
                </h3>
                <p className="mt-2 text-xs text-scnt-text-muted">
                  {isAr
                    ? 'اختر بناءً على إحساسك العفوي بالرائحة — سنكشف العطر ومطابقه في الخطوة التالية.'
                    : 'Choose purely on sensory vibe and instinct. We will unveil your exact fragrance and pairing.'}
                </p>
              </div>

              {/* Side-by-Side Binary Split: Option A vs Option B */}
              {(() => {
                const fragOptA = getFragrance(effectiveOptionA.fragranceId)
                const fragOptB = getFragrance(effectiveOptionB.fragranceId)
                return (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Option A Vibe Card */}
                    <motion.article
                      onClick={() => handleSelectOption('optionA')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectOption('optionA')
                        }
                      }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="group relative flex flex-col cursor-pointer overflow-hidden rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/90 text-start shadow-sm transition-all duration-300 hover:border-scnt-text/60 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/40"
                    >
                      {/* High-Fidelity Fragrance Vibe Hero Header */}
                      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-scnt-bg/50">
                        <img
                          src={`/matcher/vibes/${effectiveOptionA.fragranceId}.webp`}
                          alt={effectiveOptionA.vibeTag}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-106"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />

                        {/* Floating Badges */}
                        <div className="absolute inset-x-4 top-4 flex items-center justify-between pointer-events-none">
                          <span className="rounded-full border border-white/25 bg-black/60 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
                            {effectiveOptionA.vibeTag}
                          </span>
                          <span className="rounded-full border border-white/25 bg-black/50 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
                            Side A
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                        <div>
                          {fragOptA?.collection && (
                            <span className="text-[0.68rem] uppercase tracking-wider text-scnt-text-muted font-medium">
                              {fragOptA.collection}
                            </span>
                          )}
                          <h4 className="mt-1 font-serif text-xl sm:text-2xl font-medium text-scnt-text group-hover:text-scnt-text">
                            {effectiveOptionA.buttonLabel}
                          </h4>

                          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                            {effectiveOptionA.pitch}
                          </p>

                          {/* Olfactory Accord Chips */}
                          {fragOptA?.keyNotes && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {fragOptA.keyNotes.slice(0, 3).map((note) => (
                                <span
                                  key={note}
                                  className="rounded-full border border-scnt-border/60 bg-scnt-bg/80 px-2.5 py-0.5 text-[0.62rem] font-medium text-scnt-text-muted backdrop-blur-xs"
                                >
                                  {note}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-scnt-border/50 pt-3.5">
                          <span className="text-xs text-scnt-text-muted font-medium">
                            {isAr ? 'اضغط لاختيار هذا المسار' : 'Tap to lock this vibe'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-scnt-text px-3.5 py-1.5 text-xs font-semibold text-scnt-bg shadow-sm transition group-hover:bg-scnt-text/90">
                            <span>{isAr ? 'اختيار' : 'Select'}</span>
                            <span aria-hidden="true">{isAr ? '←' : '→'}</span>
                          </span>
                        </div>
                      </div>
                    </motion.article>

                    {/* Option B Vibe Card */}
                    <motion.article
                      onClick={() => handleSelectOption('optionB')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectOption('optionB')
                        }
                      }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="group relative flex flex-col cursor-pointer overflow-hidden rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/90 text-start shadow-sm transition-all duration-300 hover:border-scnt-text/60 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/40"
                    >
                      {/* High-Fidelity Fragrance Vibe Hero Header */}
                      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-scnt-bg/50">
                        <img
                          src={`/matcher/vibes/${effectiveOptionB.fragranceId}.webp`}
                          alt={effectiveOptionB.vibeTag}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-106"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />

                        {/* Floating Badges */}
                        <div className="absolute inset-x-4 top-4 flex items-center justify-between pointer-events-none">
                          <span className="rounded-full border border-white/25 bg-black/60 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
                            {effectiveOptionB.vibeTag}
                          </span>
                          <span className="rounded-full border border-white/25 bg-black/50 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
                            Side B
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                        <div>
                          {fragOptB?.collection && (
                            <span className="text-[0.68rem] uppercase tracking-wider text-scnt-text-muted font-medium">
                              {fragOptB.collection}
                            </span>
                          )}
                          <h4 className="mt-1 font-serif text-xl sm:text-2xl font-medium text-scnt-text group-hover:text-scnt-text">
                            {effectiveOptionB.buttonLabel}
                          </h4>

                          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                            {effectiveOptionB.pitch}
                          </p>

                          {/* Olfactory Accord Chips */}
                          {fragOptB?.keyNotes && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {fragOptB.keyNotes.slice(0, 3).map((note) => (
                                <span
                                  key={note}
                                  className="rounded-full border border-scnt-border/60 bg-scnt-bg/80 px-2.5 py-0.5 text-[0.62rem] font-medium text-scnt-text-muted backdrop-blur-xs"
                                >
                                  {note}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-scnt-border/50 pt-3.5">
                          <span className="text-xs text-scnt-text-muted font-medium">
                            {isAr ? 'اضغط لاختيار هذا المسار' : 'Tap to lock this vibe'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-scnt-text px-3.5 py-1.5 text-xs font-semibold text-scnt-bg shadow-sm transition group-hover:bg-scnt-text/90">
                            <span>{isAr ? 'اختيار' : 'Select'}</span>
                            <span aria-hidden="true">{isAr ? '←' : '→'}</span>
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  </div>
                )
              })()}
            </motion.div>
          )}

          {/* STEP 4: The Reveal (Dual Match + Full Bottle Feature Box + Curated Packaging Preview) */}
          {!isMatching && step === 'reveal' && (
            <motion.div
              key="step-reveal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              {/* Primary Match Full Bottle Feature Box (Appears First) */}
              <div className="mx-auto max-w-2xl rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/75 p-6 sm:p-8 backdrop-blur-md">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  {/* Bottle Mockup Image with clear front cutout */}
                  <div className="relative mx-auto flex h-52 w-40 flex-shrink-0 items-center justify-center rounded-2xl border border-scnt-border/60 bg-white/40 p-2 shadow-inner">
                    <picture>
                      <source
                        srcSet={primaryCatalogProduct?.galleryImages?.[0] || primaryFragrance.bottleClearMockup}
                        type="image/png"
                      />
                      <img
                        src={primaryFragrance.bottleClearMockup || primaryFragrance.bottleMockup}
                        alt={primaryFragrance.name}
                        className="h-full w-full object-contain drop-shadow-[0_15px_25px_rgba(42,38,34,0.18)]"
                        loading="eager"
                      />
                    </picture>
                  </div>

                  {/* Bottle Details & Contextual Olfactory Pitch */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="inline-flex items-center gap-2">
                      <span className="rounded-full bg-scnt-text px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-scnt-bg">
                        {isAr ? 'العطر الأساسي المختار' : '#1 Primary Match'}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-scnt-text-muted">
                        {primaryFragrance.collection}
                      </span>
                    </div>

                    <h3 className="font-serif text-3xl font-medium text-scnt-text">
                      {primaryFragrance.name}
                    </h3>

                    {/* Collection Divider Authenticity */}
                    <div className="my-1 flex items-center">
                      {primaryFragrance.dividerStyle === 'dashed' ? (
                        <div className="w-20 border-t-2 border-dashed border-scnt-text/60" title="Dashed Divider" />
                      ) : (
                        <div className="h-0.5 w-20 bg-scnt-text" title="Solid Divider" />
                      )}
                    </div>

                    <p className="text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                      {primaryPitch}
                    </p>

                    {/* Key Notes Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {primaryFragrance.keyNotes.map((note) => (
                        <span
                          key={note}
                          className="rounded-full border border-scnt-border/80 bg-scnt-bg/70 px-2.5 py-0.5 text-[0.68rem] text-scnt-text font-medium"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Size Selector: 50ml — EGP 500 | 100ml — EGP 750 */}
                <div className="mt-8 border-t border-scnt-border/60 pt-6">
                  <p className="text-xs uppercase tracking-wider text-scnt-text-muted font-semibold">
                    {isAr ? 'اختر حجم الزجاجة الكاملة:' : 'Choose Bottle Size:'}
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSize('50ml')}
                      className={`cursor-pointer rounded-2xl border p-3.5 text-start transition-all duration-300 ${
                        selectedSize === '50ml'
                          ? 'border-scnt-text bg-scnt-text text-scnt-bg shadow-sm'
                          : 'border-scnt-border bg-scnt-bg/60 text-scnt-text hover:border-scnt-text/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">50ml</span>
                        <span className="text-xs font-semibold">{formatEgp(500, locale)}</span>
                      </div>
                      <p
                        className={`mt-1 text-[0.65rem] ${
                          selectedSize === '50ml' ? 'text-scnt-bg/80' : 'text-scnt-text-muted'
                        }`}
                      >
                        {isAr ? 'عطر إكستري دو بارفان' : 'Eau de Parfum'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSize('100ml')}
                      className={`cursor-pointer rounded-2xl border p-3.5 text-start transition-all duration-300 ${
                        selectedSize === '100ml'
                          ? 'border-scnt-text bg-scnt-text text-scnt-bg shadow-sm'
                          : 'border-scnt-border bg-scnt-bg/60 text-scnt-text hover:border-scnt-text/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">100ml</span>
                        <span className="text-xs font-semibold">{formatEgp(750, locale)}</span>
                      </div>
                      <p
                        className={`mt-1 text-[0.65rem] ${
                          selectedSize === '100ml' ? 'text-scnt-bg/80' : 'text-scnt-text-muted'
                        }`}
                      >
                        {isAr ? 'الحجم الأفضل قيمة' : 'Best Value Size'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Primary Cart CTA */}
                <div className="mt-6">
                  <Button
                    onClick={handleAddPrimaryToCart}
                    variant="primary"
                    className="w-full py-4 text-xs sm:text-sm font-semibold tracking-wide"
                  >
                    {isAr
                      ? `تأكيد ${primaryFragrance.name} (${selectedSize === '50ml' ? '٥٠ مل' : '١٠٠ مل'}) + عينة ${runnerUpFragrance.name} مجاناً — ${formatEgp(selectedSize === '50ml' ? 500 : 750, locale)}`
                      : `Lock In ${primaryFragrance.name} (${selectedSize}) + Free ${runnerUpFragrance.name} Tester — ${formatEgp(selectedSize === '50ml' ? 500 : 750, locale)}`}
                  </Button>

                  {addedSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center justify-between rounded-xl bg-green-900/10 border border-green-800/30 px-4 py-2.5 text-xs text-green-950 font-medium"
                    >
                      <span className="inline-flex items-center gap-1.5"><CheckIcon size={14} className="shrink-0 text-emerald-700" /><span>{isAr ? `تمت إضافة ${primaryFragrance.name} مع العينتين بنجاح!`
                          : `Added ${primaryFragrance.name} + discovery testers to your cart!`}</span></span>
                      <Link to="/cart" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-black font-semibold">
                        <span>{isAr ? 'عرض السلة' : 'View Cart'}</span>
                        <span aria-hidden="true">{isAr ? '←' : '→'}</span>
                      </Link>
                    </motion.div>
                  )}
                </div>

                {/* Free Shipping Bundle Upsell CTA */}
                <div className="mt-6 rounded-2xl border border-[#DECDBE] bg-gradient-to-r from-[#F6EDE4] to-[#EFE2D4] p-4 text-center sm:p-5">
                  <div className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#8A7338]">
                    <EightPointStar size={9} />
                    <span>{isAr ? 'عرض الحجم الكامل المزدوج الشامل للشحن' : 'Free Shipping Bundle Upsell'}</span>
                  </div>
                  <h4 className="mt-1 font-serif text-lg sm:text-xl font-medium text-scnt-text">
                    {isAr
                      ? `امتلك جانبي اللحظة: كلا الزجاجتين ١٠٠ مل (${primaryFragrance.name} + ${runnerUpFragrance.name})`
                      : `Own Both Sides of the Moment: Both 100ml Bottles (${primaryFragrance.name} + ${runnerUpFragrance.name})`}
                  </h4>
                  <p className="mt-1 text-xs text-scnt-text-muted">
                    {isAr
                      ? '١,٥٠٠ ج.م فقط مع شحن مجاني لكافة محافظات مصر وتجربة العينات المسبقة.'
                      : 'EGP 1,500 total · Qualifies for Free Shipping across all governorates.'}
                  </p>

                  <div className="mt-4">
                    <Button
                      onClick={handleAddBundleToCart}
                      variant="outline"
                      className="w-full bg-white/80 py-3 text-xs sm:text-sm font-semibold hover:bg-white"
                    >
                      {isAr
                        ? `طلب الزجاجتين ١٠٠ مل معاً — ١,٥٠٠ ج.م + شحن مجاني`
                        : `Own Both 100ml Bottles (${primaryFragrance.name} + ${runnerUpFragrance.name}) — EGP 1,500 + Free Shipping`}
                    </Button>

                    {bundleAddedSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2.5 flex items-center justify-between rounded-xl bg-green-900/10 border border-green-800/30 px-4 py-2 text-xs text-green-950 font-medium"
                      >
                        <span>
                          <span className="inline-flex items-center gap-1.5"><CheckIcon size={14} className="shrink-0 text-emerald-700" /><span>{isAr ? 'تمت إضافة الباقة المزدوجة والشحن مجاني!' : 'Dual bottle bundle added with Free Shipping!'}</span></span>
                        </span>
                        <Link to="/cart" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-black font-semibold">
                          <span>{isAr ? 'إتمام الشراء' : 'Checkout'}</span>
                          <span aria-hidden="true">{isAr ? '←' : '→'}</span>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Physical Packaging Preview Digital Twin (Appears Second) */}
              <CuratedExperienceCard
                primary={primaryFragrance}
                runnerUp={runnerUpFragrance}
                onSwap={handleSwap}
                matchedOutingTitle={activeEvent.title}
                locale={locale}
              />

              {/* Restart / Explore Another Scene */}
              <div className="mx-auto max-w-2xl flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleReset}
                  className="group inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-scnt-text-muted transition hover:text-scnt-text"
                >
                  <span className="transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden="true">
                    {isAr ? '→' : '←'}
                  </span>
                  <span className="underline underline-offset-4 font-medium">
                    {isAr ? 'استكشاف مشهد أو مناسبة أخرى' : 'Try Another Outing'}
                  </span>
                </button>
                <Link
                  to={`/product/${primaryFragranceKey}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-scnt-border/90 bg-scnt-bg/80 px-4 py-2 text-xs font-semibold text-scnt-text shadow-sm transition hover:border-scnt-text/40 hover:bg-scnt-bg-elevated"
                >
                  <span>{isAr ? `معرفة المزيد عن عطر ${primaryFragrance.name}` : `Learn More About ${primaryFragrance.name}`}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true">
                    {isAr ? '←' : '→'}
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
