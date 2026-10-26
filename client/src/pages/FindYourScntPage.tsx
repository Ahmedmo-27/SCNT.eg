import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { EightPointStar } from '../components/ui/EightPointStar'
import { useCatalog } from '../context/CatalogContext'
import { EXPRESS_QUESTION_IDS, FIND_YOUR_SCNT_BLUEPRINT } from '../data/findYourScntBlueprint'
import { useI18n } from '../i18n/I18nContext'
import type { CollectionId, CollectionSummary, ProductSummary } from '../types/catalog'

type QuizMode = 'express' | 'full'

type Choice = {
  id: string
  title: string
  subtitle: string
  aura: string
  imageUrl: string
  score: Record<CollectionId, number>
}

type QuizQuestion = {
  id: string
  phase: 'top' | 'heart' | 'base'
  prompt: string
  promptDetail: string
  choices: Choice[]
}

type QuizResult = {
  collection: CollectionSummary
  fragrance: ProductSummary
  characterTitle: string
  characterParagraph: string
  collectionWhy: string
  fragranceWhy: string
}

const initialScores: Record<CollectionId, number> = {
  executive: 0,
  explorer: 0,
  charmer: 0,
  icon: 0,
}

const QUIZ_SESSION_KEY = 'scnt.findYourScnt.quiz.v3'

type QuizSessionV3 = {
  v: 3
  locale: string
  mode: QuizMode
  questions: QuizQuestion[]
  step: number
  selections: Record<string, string>
  quizGender: ProductSummary['gender'] | null
}

function tryRestoreQuizSession(locale: string): QuizSessionV3 | null {
  try {
    const raw = sessionStorage.getItem(QUIZ_SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as QuizSessionV3
    if (data.v !== 3 || data.locale !== locale) return null
    if (!Array.isArray(data.questions) || data.questions.length === 0) return null
    if (data.mode !== 'express' && data.mode !== 'full') return null
    return data
  } catch {
    return null
  }
}

function persistQuizSession(payload: QuizSessionV3) {
  try {
    sessionStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

function clearQuizSession() {
  try {
    sessionStorage.removeItem(QUIZ_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(12)
    } catch {
      /* ignore */
    }
  }
}

function buildQuizQuestions(
  t: (key: string, vars?: Record<string, string | number>) => string,
  mode: QuizMode,
): QuizQuestion[] {
  const source =
    mode === 'express'
      ? FIND_YOUR_SCNT_BLUEPRINT.filter((q) => EXPRESS_QUESTION_IDS.includes(q.id))
      : FIND_YOUR_SCNT_BLUEPRINT

  return source.map((q) => ({
    id: q.id,
    phase: q.phase,
    prompt: t(q.promptKey),
    promptDetail: t(q.detailKey),
    choices: q.choices.map((c) => ({
      id: c.id,
      title: t(c.titleKey),
      subtitle: t(c.subtitleKey),
      aura: t(c.auraKey),
      imageUrl: c.imageUrl,
      score: c.score,
    })),
  }))
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

function buildRandomizedQuestions(source: QuizQuestion[]): QuizQuestion[] {
  return source.map((q) => ({
    ...q,
    choices: shuffleArray(q.choices),
  }))
}

function recomputeScores(sels: Record<string, string>, questions: QuizQuestion[]): Record<CollectionId, number> {
  const next: Record<CollectionId, number> = { executive: 0, explorer: 0, charmer: 0, icon: 0 }
  for (const q of questions) {
    const choiceId = sels[q.id]
    if (!choiceId) continue
    const choice = q.choices.find((c) => c.id === choiceId)
    if (!choice) continue
    next.executive += choice.score.executive
    next.explorer += choice.score.explorer
    next.charmer += choice.score.charmer
    next.icon += choice.score.icon
  }
  return next
}

function strongestIds(scores: Record<CollectionId, number>): [CollectionId, CollectionId] {
  const ranked = (Object.keys(scores) as CollectionId[]).sort((a, b) => scores[b] - scores[a])
  return [ranked[0], ranked[1]]
}

function leadLine(c: CollectionSummary): string {
  return (c.subTagline || c.tagline).trim()
}

function findBestFragranceForGender(
  primaryCollectionId: CollectionId,
  scores: Record<CollectionId, number>,
  products: ProductSummary[],
  gender: ProductSummary['gender'],
): { fragrance: ProductSummary; collectionId: CollectionId } {
  // 1. Strictly filter products by the chosen gender
  const genderMatchedProducts = products.filter((p) => p.gender === gender)
  const pool = genderMatchedProducts.length > 0 ? genderMatchedProducts : products

  // 2. Rank all collections by personality score descending
  const rankedCollectionIds = (Object.keys(scores) as CollectionId[]).sort((a, b) => scores[b] - scores[a])

  // 3. Prefer user's highest scored collection if it has products for this gender
  let targetCollectionId = primaryCollectionId
  let candidates = pool.filter((p) => p.collection === targetCollectionId && (genderMatchedProducts.length === 0 || p.gender === gender))

  // 4. If primary collection has no candidates for this gender, pick the closest collection by score that DOES
  if (candidates.length === 0) {
    for (const id of rankedCollectionIds) {
      const match = pool.filter((p) => p.collection === id && (genderMatchedProducts.length === 0 || p.gender === gender))
      if (match.length > 0) {
        targetCollectionId = id
        candidates = match
        break
      }
    }
  }

  // 5. Fallback safety
  if (candidates.length === 0) {
    candidates = pool
    targetCollectionId = candidates[0].collection
  }

  if (candidates.length === 1) {
    return { fragrance: candidates[0], collectionId: targetCollectionId }
  }

  // 6. Within the chosen collection, pick based on adventurous vs intimate tilt
  const adventurousTilt = scores.explorer + scores.icon
  const intimateTilt = scores.charmer + scores.executive
  const chosen = adventurousTilt > intimateTilt ? (candidates[1] ?? candidates[0]) : candidates[0]
  return { fragrance: chosen, collectionId: targetCollectionId }
}

function calculateResult(
  scores: Record<CollectionId, number>,
  collections: CollectionSummary[],
  products: ProductSummary[],
  t: (key: string, vars?: Record<string, string | number>) => string,
  gender: ProductSummary['gender'],
): QuizResult | null {
  if (collections.length === 0 || products.length === 0) return null
  const [primaryId, secondaryId] = strongestIds(scores)

  const { fragrance, collectionId: matchedCollectionId } = findBestFragranceForGender(
    primaryId,
    scores,
    products,
    gender,
  )

  const primary = collections.find((c) => c.id === matchedCollectionId) ?? collections[0]
  const effectiveSecondaryId = matchedCollectionId !== primaryId ? primaryId : secondaryId
  const secondary = collections.find((c) => c.id === effectiveSecondaryId) ?? collections[1] ?? primary

  const pLead = leadLine(primary).toLowerCase()
  const pMood = primary.mood.toLowerCase()
  const sMood = secondary.mood.toLowerCase()
  const top = fragrance.topNotes.slice(0, 2).join(' + ')
  const base = fragrance.baseNotes.slice(0, 2).join(' + ')

  return {
    collection: primary,
    fragrance,
    characterTitle: t(`fz.char.${primary.id}`),
    characterParagraph: t('fz.para', { pLead, pMood, sMood }),
    collectionWhy: t('fz.colWhy', {
      pName: primary.name,
      pLead,
      sName: secondary.name,
    }),
    fragranceWhy: t('fz.fragWhy', {
      fname: fragrance.name,
      top,
      base,
      mood: pMood,
    }),
  }
}

export function FindYourScntPage() {
  const { t, locale } = useI18n()
  const { collections, products, loading } = useCatalog()
  const [mode, setMode] = useState<QuizMode | null>(null)
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<CollectionId, number>>(initialScores)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizGender, setQuizGender] = useState<ProductSummary['gender'] | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [matchingStage, setMatchingStage] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  const quizCardRef = useRef<HTMLDivElement | null>(null)

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
    const restored = tryRestoreQuizSession(locale)
    if (restored) {
      const maxStep = restored.questions.length + 1
      setMode(restored.mode)
      setQuizQuestions(restored.questions)
      setStep(Math.min(Math.max(0, restored.step), maxStep))
      setSelections(restored.selections)
      setScores(recomputeScores(restored.selections, restored.questions))
      setQuizGender(restored.quizGender ?? null)
      return
    }
    clearQuizSession()
    setMode(null)
    setQuizQuestions([])
    setStep(0)
    setScores(initialScores)
    setSelections({})
    setQuizGender(null)
  }, [locale])

  function selectMode(chosenMode: QuizMode) {
    clearQuizSession()
    const built = buildQuizQuestions(t, chosenMode)
    const randomized = buildRandomizedQuestions(built)
    setMode(chosenMode)
    setQuizQuestions(randomized)
    setStep(0)
    setScores(initialScores)
    setSelections({})
    setQuizGender(null)
    setIsMatching(false)
    quizCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!mode || quizQuestions.length === 0) return
    persistQuizSession({
      v: 3,
      locale,
      mode,
      questions: quizQuestions,
      step,
      selections,
      quizGender,
    })
  }, [locale, mode, quizQuestions, step, selections, quizGender])

  const total = quizQuestions.length
  const genderStepIndex = total
  const doneStepIndex = total + 1
  const isGenderStep = !isMatching && total > 0 && step === genderStepIndex
  const isResultStep = !isMatching && total > 0 && step >= doneStepIndex
  const fullSteps = total + 1
  const answeredCount = Object.keys(selections).length
  const progressPhase = isResultStep
    ? fullSteps
    : Math.max(
        Math.min(step, doneStepIndex),
        Math.min(answeredCount, total),
        isGenderStep ? genderStepIndex : 0,
      )
  const baseProgress = fullSteps > 0 ? Math.round((Math.min(progressPhase, fullSteps) / fullSteps) * 100) : 0
  const progress = isMatching
    ? Math.min(99, Math.round(86 + ((matchingStage + 1) / matchingStages.length) * 13))
    : baseProgress
  const current = step < total ? quizQuestions[step] ?? null : null

  // Live Scent Aura derivation
  const dominantAura = useMemo(() => {
    const totalScore = scores.executive + scores.explorer + scores.charmer + scores.icon
    if (totalScore === 0) return null
    const [primaryId, secondaryId] = strongestIds(scores)
    const pct = Math.round((scores[primaryId] / totalScore) * 100)
    return {
      id: primaryId,
      secondaryId,
      score: scores[primaryId],
      total: totalScore,
      percentage: pct,
    }
  }, [scores])

  // Can offer early reveal if in full mode, at least 4 questions answered, and clear dominant collection
  const canOfferEarlyReveal = useMemo(() => {
    if (mode !== 'full') return false
    if (step < 3 || isGenderStep || isResultStep || isMatching) return false
    return dominantAura !== null && dominantAura.total >= 8 && dominantAura.percentage >= 44
  }, [mode, step, isGenderStep, isResultStep, isMatching, dominantAura])

  const result = useMemo(
    () =>
      (isResultStep || isMatching) && quizGender ? calculateResult(scores, collections, products, t, quizGender) : null,
    [isResultStep, isMatching, quizGender, scores, collections, products, t],
  )

  useEffect(() => {
    if (!isMatching) return

    setMatchingStage(0)
    const t1 = setTimeout(() => setMatchingStage(1), 1250)
    const t2 = setTimeout(() => setMatchingStage(2), 2500)
    const t3 = setTimeout(() => setMatchingStage(3), 3750)
    const t4 = setTimeout(() => {
      setIsMatching(false)
      setStep(doneStepIndex)
    }, 4900)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [isMatching, doneStepIndex])

  function goToQuestion(targetStep: number) {
    if (total === 0 || isMatching) return
    if (targetStep < 0 || targetStep > genderStepIndex) return
    if (targetStep < total) {
      const q = quizQuestions[targetStep]
      if (targetStep !== step && !selections[q.id]) return
    } else if (answeredCount < total) {
      return
    }
    if (targetStep < genderStepIndex) setQuizGender(null)
    setStep(targetStep)
  }

  function advanceFromCurrentQuestion() {
    setStep((s) => {
      if (s < total - 1) return s + 1
      if (s === total - 1) return genderStepIndex
      return s
    })
  }

  function pickChoice(choice: Choice) {
    triggerHaptic()
    if (!current) return
    const prior = selections[current.id]
    if (prior === choice.id) {
      advanceFromCurrentQuestion()
      return
    }
    if (prior) {
      const trimmed: Record<string, string> = {}
      for (let i = 0; i <= step; i++) {
        const q = quizQuestions[i]
        if (i === step) trimmed[q.id] = choice.id
        else if (selections[q.id]) trimmed[q.id] = selections[q.id]
      }
      setSelections(trimmed)
      setScores(recomputeScores(trimmed, quizQuestions))
      return
    }
    const nextSelections = { ...selections, [current.id]: choice.id }
    setSelections(nextSelections)
    setScores(recomputeScores(nextSelections, quizQuestions))
    advanceFromCurrentQuestion()
  }

  function pickGender(gender: ProductSummary['gender']) {
    triggerHaptic()
    setQuizGender(gender)
    setIsMatching(true)
    setMatchingStage(0)
    quizCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function triggerEarlyReveal() {
    triggerHaptic()
    setStep(genderStepIndex)
    quizCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function restart() {
    clearQuizSession()
    setIsMatching(false)
    setMatchingStage(0)
    setStep(0)
    setScores(initialScores)
    setSelections({})
    setQuizGender(null)
    setMode(null)
    setQuizQuestions([])
  }

  function sharePersona() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: 'SCNT — Find Your Scent',
        text: result ? `My signature fragrance match is ${result.fragrance.name} from ${result.collection.name}!` : 'Discover your signature scent!',
        url,
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2400)
      })
    }
  }

  const stepperChipClass = (active: boolean, done: boolean) =>
    `min-w-8 sm:min-w-9 rounded-full border px-2 py-1 text-center text-[0.62rem] sm:text-[0.65rem] font-medium uppercase tracking-wider transition-colors ${
      active
        ? 'border-scnt-text bg-scnt-text text-scnt-bg shadow-sm'
        : done
          ? 'border-scnt-border/80 bg-scnt-bg/65 text-scnt-text hover:border-scnt-text/40'
          : 'cursor-not-allowed border-scnt-border/40 bg-scnt-bg/25 text-scnt-text-muted opacity-50'
    }`

  const auraColorClass = useMemo(() => {
    if (!dominantAura) return 'from-[rgba(184,155,94,0.15)] to-transparent'
    switch (dominantAura.id) {
      case 'executive':
        return 'from-[rgba(99,133,170,0.28)] to-[rgba(30,41,59,0.1)]'
      case 'explorer':
        return 'from-[rgba(52,172,150,0.28)] to-[rgba(15,76,70,0.1)]'
      case 'charmer':
        return 'from-[rgba(180,60,90,0.28)] to-[rgba(76,20,40,0.1)]'
      case 'icon':
        return 'from-[rgba(212,160,60,0.32)] to-[rgba(120,80,20,0.1)]'
      default:
        return 'from-[rgba(184,155,94,0.15)] to-transparent'
    }
  }, [dominantAura])

  return (
    <Layout>
      <section className="relative isolate overflow-hidden px-4 pb-20 pt-12 sm:px-8 sm:pt-16">
        {/* Dynamic ambient backdrop reflecting the user's emerging scent aura */}
        <div className="pointer-events-none absolute inset-0 -z-10 transition-colors duration-1000">
          <motion.div
            className={`absolute start-[8%] top-20 h-64 w-64 rounded-full bg-gradient-to-br ${auraColorClass} blur-3xl`}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute end-[10%] top-40 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(184,155,94,0.2),transparent_72%)] blur-2xl" />
          <div className="absolute bottom-10 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,61,92,0.12),transparent_75%)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl">
          {/* Header & Kicker */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-scnt-border/80 bg-scnt-bg-elevated/70 px-3.5 py-1 text-xs uppercase tracking-[0.26em] text-scnt-text-muted backdrop-blur-md">
              <EightPointStar size={11} className="text-scnt-text" />
              <span>{t('fz.pageKicker')}</span>
            </div>
            <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-scnt-text sm:text-5xl">
              {t('fz.pageTitle')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
              {t('fz.pageSub')}
            </p>
          </div>

          {/* Main Quiz Container */}
          <div
            ref={quizCardRef}
            className="relative mx-auto mt-8 sm:mt-10 max-w-4.5xl rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/75 p-5 shadow-[0_20px_80px_-40px_rgba(42,38,34,0.4)] backdrop-blur-md sm:p-8"
          >
            {/* INITIAL SCREEN: Mode Selector */}
            {!mode && !isMatching && !isResultStep ? (
              <div className="py-4">
                <div className="text-center">
                  <h2 className="font-serif text-2xl font-medium text-scnt-text sm:text-3xl">
                    {t('fz.mode.choose')}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-scnt-text-muted">
                    {locale === 'ar'
                      ? 'اختر بين الاكتشاف السريع في نصف دقيقة أو التجربة الاستشارية الشاملة'
                      : 'Choose between a 30-second rapid discovery or the full luxury consultation'}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Express Match Option */}
                  <div
                    onClick={() => selectMode('express')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && selectMode('express')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg/60 p-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-scnt-text/40 hover:shadow-[0_22px_56px_-36px_rgba(42,38,34,0.5)] focus:outline-none focus:ring-2 focus:ring-scnt-text/30"
                  >
                    <div className="absolute -end-12 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(184,155,94,0.18),transparent_70%)] blur-xl transition-all duration-700 group-hover:scale-125" />
                    <div className="relative">
                      <span className="inline-block rounded-full border border-scnt-border/70 bg-scnt-bg/80 px-2.5 py-1 text-[0.68rem] font-medium tracking-wide text-scnt-text">
                        {t('fz.mode.expressBadge')}
                      </span>
                      <h3 className="mt-4 font-serif text-xl sm:text-2xl text-scnt-text group-hover:text-scnt-text">
                        {t('fz.mode.expressTitle')}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                        {t('fz.mode.expressDesc')}
                      </p>
                      <div className="mt-6 flex items-center justify-between pt-2 border-t border-scnt-border/40">
                        <span className="text-xs uppercase tracking-wider text-scnt-text-muted font-medium">
                          {locale === 'ar' ? '٣ أسئلة جوهرية' : '3 High-Impact Steps'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-scnt-text transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                          {t('fz.mode.expressBtn')} &rarr;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bespoke Full Journey Option */}
                  <div
                    onClick={() => selectMode('full')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && selectMode('full')}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg/60 p-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-scnt-text/40 hover:shadow-[0_22px_56px_-36px_rgba(42,38,34,0.5)] focus:outline-none focus:ring-2 focus:ring-scnt-text/30"
                  >
                    <div className="absolute -end-12 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(122,143,163,0.22),transparent_70%)] blur-xl transition-all duration-700 group-hover:scale-125" />
                    <div className="relative">
                      <span className="inline-block rounded-full border border-scnt-border/70 bg-scnt-bg/80 px-2.5 py-1 text-[0.68rem] font-medium tracking-wide text-scnt-text">
                        {t('fz.mode.fullBadge')}
                      </span>
                      <h3 className="mt-4 font-serif text-xl sm:text-2xl text-scnt-text">
                        {t('fz.mode.fullTitle')}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                        {t('fz.mode.fullDesc')}
                      </p>
                      <div className="mt-6 flex items-center justify-between pt-2 border-t border-scnt-border/40">
                        <span className="text-xs uppercase tracking-wider text-scnt-text-muted font-medium">
                          {locale === 'ar' ? 'هرم عطري كامل (٨ خطوات)' : 'Full Olfactory Pyramid (8 Steps)'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-scnt-text transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                          {t('fz.mode.fullBtn')} &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ACTIVE QUIZ EXPERIENCE */}
            {mode && (
              <>
                {/* Header HUD: Mode Tag, Stage, Progress, and Live Aura Reactor */}
                <div className="mb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-scnt-border/80 bg-scnt-bg/80 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-wider text-scnt-text-muted">
                        {mode === 'express' ? t('fz.mode.tagExpress') : t('fz.mode.tagFull')}
                      </span>
                      {!isMatching && !isResultStep ? (
                        <button
                          type="button"
                          onClick={restart}
                          className="text-[0.68rem] text-scnt-text-muted underline-offset-4 hover:text-scnt-text hover:underline"
                        >
                          {t('fz.mode.switch')}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      {dominantAura && !isMatching && !isResultStep ? (
                        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-scnt-border/70 bg-scnt-bg/60 px-3 py-1 text-[0.68rem] text-scnt-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-scnt-text animate-pulse" />
                          <span>{t(`fz.aura.${dominantAura.id}`)}</span>
                        </div>
                      ) : null}
                      <p className="text-xs text-scnt-text-muted font-medium">
                        {isMatching
                          ? `${progress}%`
                          : isResultStep
                            ? t('fz.resultReady')
                            : t('fz.answered', { n: String(answeredCount) })}
                      </p>
                    </div>
                  </div>

                  {/* Perfumery Pyramid Stage Banner (if in questions mode) */}
                  {!isMatching && !isResultStep && current ? (
                    <div className="flex items-center justify-between text-xs text-scnt-text-muted pt-1">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-scnt-text">
                          {current.phase === 'top'
                            ? t('fz.stage.top')
                            : current.phase === 'heart'
                              ? t('fz.stage.heart')
                              : t('fz.stage.base')}
                        </span>
                        <span className="opacity-40">•</span>
                        <span>
                          {t('fz.question', {
                            cur: String(Math.min(step + 1, fullSteps)),
                            total: String(fullSteps),
                          })}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Gradient Progress Bar */}
                  <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-scnt-border/60">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[rgba(122,143,163,0.9)] via-[rgba(184,155,94,0.9)] to-[rgba(139,61,92,0.9)]"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>

                  {/* Stepper Chips */}
                  {!isResultStep && !isMatching && total > 0 ? (
                    <div
                      className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
                      role="navigation"
                      aria-label={t('fz.question')}
                    >
                      {quizQuestions.map((q, i) => {
                        const answeredHere = Boolean(selections[q.id])
                        const chipEnabled = answeredHere || i === step
                        return (
                          <button
                            key={q.id}
                            type="button"
                            disabled={!chipEnabled}
                            onClick={() => goToQuestion(i)}
                            className={stepperChipClass(step === i, answeredHere)}
                          >
                            {i + 1}
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        disabled={answeredCount < total}
                        onClick={() => goToQuestion(genderStepIndex)}
                        className={stepperChipClass(isGenderStep, false)}
                      >
                        {t('fz.genderStepLabel')}
                      </button>
                    </div>
                  ) : null}
                </div>

                <AnimatePresence mode="wait">
                  {/* MATCHING ANIMATION */}
                  {isMatching ? (
                    <motion.div
                      key="quiz-matching"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-4 py-4 sm:py-6"
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
                              {(locale === 'ar'
                                ? ['الطاقة والحضور', 'إيقاع اليوم', 'ملمس الأسلوب', 'الأجواء والغموض']
                                : ['Aura & Energy', 'Lifestyle Rhythm', 'Style Texture', 'Atmosphere']
                              ).map((trait, i) => (
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
                              {(['executive', 'explorer', 'charmer', 'icon'] as CollectionId[]).map((colId) => {
                                const col = collections.find((c) => c.id === colId)
                                const colName = col?.name ?? colId
                                const scoreVal = scores[colId] || 0
                                const maxScore = Math.max(1, ...Object.values(scores))
                                const pct = Math.round((scoreVal / maxScore) * 100)
                                return (
                                  <div key={colId} className="rounded-xl border border-scnt-border/70 bg-scnt-bg/50 p-2.5 text-center">
                                    <p className="truncate text-[0.68rem] font-medium uppercase tracking-wider text-scnt-text-muted">
                                      {colName}
                                    </p>
                                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-scnt-border/50">
                                      <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-[rgba(122,143,163,0.85)] to-[rgba(184,155,94,0.9)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(25, pct)}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
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
                                  tier: locale === 'ar' ? 'النوتات الافتتاحية' : 'Top Notes',
                                  detail: result?.fragrance.topNotes.slice(0, 2).join(' · ') || (locale === 'ar' ? 'نفحات منعشة' : 'Fresh Accords'),
                                },
                                {
                                  tier: locale === 'ar' ? 'قلب العطر' : 'Heart Notes',
                                  detail: result?.fragrance.heartNotes?.slice(0, 2).join(' · ') || (locale === 'ar' ? 'عطري متوازن' : 'Harmonic Accords'),
                                },
                                {
                                  tier: locale === 'ar' ? 'القاعدة العطرية' : 'Base Notes',
                                  detail: result?.fragrance.baseNotes.slice(0, 2).join(' · ') || (locale === 'ar' ? 'أخشاب وعنبر' : 'Deep Woods & Amber'),
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
                                <span>{locale === 'ar' ? 'تم العثور على التطابق المثالي' : 'Perfect Fragrance Match Found'}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 4-step progress tracker */}
                      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {matchingStages.map((stg, idx) => {
                          const isDone = matchingStage > idx
                          const isCurrent = matchingStage === idx
                          return (
                            <div
                              key={stg.stepLabel}
                              className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs transition-all duration-300 ${
                                isCurrent
                                  ? 'border-scnt-text/70 bg-scnt-text/5 text-scnt-text shadow-sm'
                                  : isDone
                                    ? 'border-scnt-border/80 bg-scnt-bg/50 text-scnt-text-muted'
                                    : 'border-scnt-border/40 bg-scnt-bg/20 text-scnt-text-muted/60'
                              }`}
                            >
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                                  isDone
                                    ? 'bg-scnt-text text-scnt-bg'
                                    : isCurrent
                                      ? 'border border-scnt-text font-bold text-scnt-text'
                                      : 'border border-scnt-border/60 text-scnt-text-muted/60'
                                }`}
                              >
                                {isDone ? (
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>
                              <span className="truncate font-medium">{stg.stepLabel}</span>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  ) : isGenderStep ? (
                    /* GENDER / PROFILE LINE SELECTION STEP */
                    <motion.div
                      key="fz-gender"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-6"
                    >
                      <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{t('fz.genderPrompt')}</h2>
                      <p className="mt-2 text-xs sm:text-sm text-scnt-text-muted">{t('fz.genderDetail')}</p>
                      
                      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => pickGender('male')}
                          className="group relative overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg/65 p-6 text-center text-sm font-medium text-scnt-text transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-scnt-text/40 hover:shadow-[0_22px_56px_-44px_rgba(42,38,34,0.45)]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(122,143,163,0.15)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="relative">
                            <span className="text-2xl mb-2 block">👔</span>
                            <span className="text-base sm:text-lg font-serif">{t('shop.male')}</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => pickGender('female')}
                          className="group relative overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg/65 p-6 text-center text-sm font-medium text-scnt-text transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-scnt-text/40 hover:shadow-[0_22px_56px_-44px_rgba(42,38,34,0.45)]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(180,60,90,0.15)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="relative">
                            <span className="text-2xl mb-2 block">✨</span>
                            <span className="text-base sm:text-lg font-serif">{t('shop.female')}</span>
                          </div>
                        </button>
                      </div>

                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => goToQuestion(genderStepIndex - 1)}
                          className="text-xs sm:text-sm text-scnt-text-muted underline-offset-4 transition-colors hover:text-scnt-text hover:underline"
                        >
                          {t('fz.back')}
                        </button>
                      </div>
                    </motion.div>
                  ) : current ? (
                    /* QUESTION STEP WITH RICH VISUAL MOOD CARDS */
                    <motion.div
                      key={current.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-6"
                    >
                      <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{current.prompt}</h2>
                      <p className="mt-2 text-xs sm:text-sm text-scnt-text-muted">{current.promptDetail}</p>

                      {/* Visual Choice Cards */}
                      <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {current.choices.map((choice) => {
                          const selected = selections[current.id] === choice.id
                          return (
                            <button
                              key={choice.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => pickChoice(choice)}
                              className={`group relative overflow-hidden rounded-2xl border p-5 text-start transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                selected
                                  ? 'border-scnt-text/90 bg-scnt-bg-elevated shadow-[0_18px_48px_-32px_rgba(42,38,34,0.5)] ring-2 ring-scnt-text/20 scale-[1.01]'
                                  : 'border-scnt-border/80 bg-scnt-bg/70 hover:-translate-y-0.5 hover:border-scnt-text/40 hover:shadow-[0_20px_50px_-40px_rgba(42,38,34,0.4)]'
                              }`}
                            >
                              {/* Background Photography with Luxury Vignette */}
                              {choice.imageUrl && (
                                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                                  <img
                                    src={choice.imageUrl}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover opacity-20 filter grayscale contrast-125 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:opacity-35"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-scnt-bg via-scnt-bg/85 to-scnt-bg/60" />
                                </div>
                              )}

                              <div className="relative z-10">
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center rounded-full border border-scnt-border/80 bg-scnt-bg/80 px-2.5 py-0.5 text-[0.62rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-scnt-text-muted backdrop-blur-sm">
                                    {choice.aura}
                                  </span>
                                  {selected && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-scnt-text text-scnt-bg shadow-sm">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <p className="mt-3 text-base font-medium text-scnt-text sm:text-lg">{choice.title}</p>
                                <p className="mt-1 text-xs leading-relaxed text-scnt-text-muted sm:text-sm">{choice.subtitle}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Navigation Controls */}
                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {step > 0 ? (
                            <button
                              type="button"
                              onClick={() => goToQuestion(step - 1)}
                              className="text-xs sm:text-sm text-scnt-text-muted underline-offset-4 transition-colors hover:text-scnt-text hover:underline"
                            >
                              {t('fz.back')}
                            </button>
                          ) : null}
                          {selections[current.id] ? (
                            <button
                              type="button"
                              onClick={advanceFromCurrentQuestion}
                              className="rounded-full border border-scnt-text bg-scnt-text px-5 py-2 text-xs sm:text-sm font-medium text-scnt-bg transition-colors hover:bg-scnt-text/90"
                            >
                              {t('fz.continue')}
                            </button>
                          ) : null}
                        </div>

                        {/* Early Reveal Shortcut Banner (In Full Mode) */}
                        {canOfferEarlyReveal && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 rounded-full border border-[rgba(184,155,94,0.45)] bg-[rgba(184,155,94,0.1)] px-3.5 py-1.5 text-xs"
                          >
                            <span className="hidden sm:inline text-scnt-text font-medium">
                              {t('fz.earlyReveal.badge')}
                            </span>
                            <button
                              type="button"
                              onClick={triggerEarlyReveal}
                              className="font-medium text-scnt-text underline decoration-[rgba(184,155,94,0.8)] underline-offset-4 hover:opacity-80"
                            >
                              {t('fz.earlyReveal.action')} &rarr;
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ) : isResultStep && (loading || !result) ? (
                    <motion.div
                      key="result-pending"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-7 text-center text-sm text-scnt-text-muted"
                    >
                      {loading ? t('fz.preparing') : t('fz.catalogErr')}
                    </motion.div>
                  ) : isResultStep && result ? (
                    /* BESPOKE FINAL REVEAL SECTION */
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-6 space-y-6"
                    >
                      {/* Character Persona Summary Card */}
                      <div className="relative overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg/80 p-6 sm:p-7 shadow-sm">
                        <div className="absolute -end-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(184,155,94,0.18),transparent_70%)] blur-2xl" />
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-[0.24em] text-scnt-text-muted font-medium">
                              {t('fz.yourCharacter')}
                            </p>
                            <button
                              type="button"
                              onClick={sharePersona}
                              className="inline-flex items-center gap-1.5 rounded-full border border-scnt-border/80 bg-scnt-bg/60 px-3 py-1 text-xs text-scnt-text-muted transition-colors hover:border-scnt-text hover:text-scnt-text"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              <span>{copiedLink ? t('fz.shareCopied') : t('fz.shareResult')}</span>
                            </button>
                          </div>
                          <h2 className="mt-3 font-serif text-2xl sm:text-3xl text-scnt-text font-medium">{result.characterTitle}</h2>
                          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                            {result.characterParagraph}
                          </p>
                        </div>
                      </div>

                      {/* Collection Match Card (with Cover Artwork) */}
                      <div className="rounded-2xl border border-scnt-border/80 bg-scnt-bg/80 p-6 flex flex-col-reverse sm:flex-row gap-6 items-center sm:items-start">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.24em] text-scnt-text-muted font-medium">{t('fz.collectionMatch')}</p>
                          <h3 className="mt-2 font-serif text-2xl text-scnt-text font-medium">{result.collection.name}</h3>
                          {result.collection.subTagline ? (
                            <p className="mt-1 text-xs sm:text-sm italic text-scnt-text-muted">{result.collection.subTagline}</p>
                          ) : null}
                          <p className="mt-2.5 text-xs sm:text-sm text-scnt-text-muted">{result.collection.tagline}</p>
                          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                            {result.collectionWhy}
                          </p>
                        </div>
                        {(result.collection.mainImage || result.collection.coverImage) ? (
                          <div className="w-full sm:w-1/3 shrink-0">
                            <img 
                              src={
                                result.collection.mainImage ||
                                `/collections/covers/The ${
                                  result.collection.id === 'icon'
                                    ? 'Icon'
                                    : result.collection.id === 'charmer'
                                      ? 'Charmer'
                                      : result.collection.id === 'explorer'
                                        ? 'Explorer'
                                        : 'Executive'
                                }.png`
                              } 
                              alt={result.collection.name} 
                              className="w-full aspect-[4/3] sm:aspect-square object-cover rounded-xl border border-scnt-border/60 shadow-sm" 
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Fragrance Match Card (with Bottle Mockup & Notes) */}
                      <div className="rounded-2xl border border-scnt-border/80 bg-scnt-bg/80 p-6 flex flex-col-reverse sm:flex-row gap-6 items-center sm:items-start">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.24em] text-scnt-text-muted font-medium">{t('fz.fragranceMatch')}</p>
                          <h3 className="mt-2 font-serif text-2xl text-scnt-text font-medium">{result.fragrance.name}</h3>
                          <p className="mt-1 text-xs sm:text-sm text-scnt-text-muted">{result.fragrance.vibeSentence}</p>
                          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-scnt-text-muted">
                            {result.fragranceWhy}
                          </p>

                          {/* Olfactory pyramid pills */}
                          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-scnt-border/50">
                            <span className="rounded-full border border-scnt-border/70 bg-scnt-bg/60 px-2.5 py-1 text-[0.68rem] text-scnt-text-muted">
                              <strong>Top:</strong> {result.fragrance.topNotes.slice(0, 2).join(', ')}
                            </span>
                            <span className="rounded-full border border-scnt-border/70 bg-scnt-bg/60 px-2.5 py-1 text-[0.68rem] text-scnt-text-muted">
                              <strong>Base:</strong> {result.fragrance.baseNotes.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        </div>

                        {/* High-res perfume bottle visual */}
                        {(result.fragrance.clearBackground_Image || result.fragrance.coverImage || result.fragrance.galleryImages?.[0]) ? (
                          <div className="w-full sm:w-1/3 shrink-0 flex items-center justify-center bg-scnt-bg/50 rounded-xl border border-scnt-border/60 aspect-[4/3] sm:aspect-square p-4">
                            <img 
                              src={result.fragrance.clearBackground_Image || result.fragrance.coverImage || result.fragrance.galleryImages[0]} 
                              alt={result.fragrance.name} 
                              className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]" 
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Primary Actions */}
                      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        <Button to={`/product/${result.fragrance.id}`} className="w-full sm:w-auto">
                          {t('fz.open', { name: result.fragrance.name })}
                        </Button>
                        <Button to={`/collections/${result.collection.id}`} variant="outline" className="w-full sm:w-auto">
                          {t('fz.explore', { name: result.collection.name })}
                        </Button>
                        <Button onClick={restart} variant="ghost" className="w-full sm:w-auto">
                          {t('fz.retake')}
                        </Button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}
