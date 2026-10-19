import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { EightPointStar } from '../components/ui/EightPointStar'
import { useCatalog } from '../context/CatalogContext'
import { FIND_YOUR_SCNT_BLUEPRINT } from '../data/findYourScntBlueprint'
import { useI18n } from '../i18n/I18nContext'
import type { CollectionId, CollectionSummary, ProductSummary } from '../types/catalog'

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

const QUIZ_SESSION_KEY = 'scnt.findYourScnt.quiz.v2'

type QuizSessionV2 = {
  v: 2
  locale: string
  questions: QuizQuestion[]
  step: number
  selections: Record<string, string>
  quizGender: ProductSummary['gender'] | null
}

function blueprintQuestionIds(): string[] {
  return FIND_YOUR_SCNT_BLUEPRINT.map((q) => q.id)
}

function tryRestoreQuizSession(locale: string): QuizSessionV2 | null {
  try {
    const raw = sessionStorage.getItem(QUIZ_SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as QuizSessionV2
    if (data.v !== 2 || data.locale !== locale) return null
    if (!Array.isArray(data.questions) || data.questions.length !== FIND_YOUR_SCNT_BLUEPRINT.length) return null
    const expected = blueprintQuestionIds().join('\0')
    const got = data.questions.map((q) => q?.id).join('\0')
    if (expected !== got) return null
    return data
  } catch {
    return null
  }
}

function persistQuizSession(payload: QuizSessionV2) {
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

function buildQuizQuestions(t: (key: string, vars?: Record<string, string | number>) => string): QuizQuestion[] {
  return FIND_YOUR_SCNT_BLUEPRINT.map((q) => ({
    id: q.id,
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

function pickFragrance(
  collectionId: CollectionId,
  scores: Record<CollectionId, number>,
  products: ProductSummary[],
  gender: ProductSummary['gender'],
): ProductSummary {
  let candidates = products.filter((p) => p.collection === collectionId && p.gender === gender)
  if (candidates.length === 0) {
    candidates = products.filter((p) => p.collection === collectionId)
  }
  const top = candidates[0] ?? products.find((p) => p.gender === gender) ?? products[0]
  if (!top) {
    throw new Error('No products found to match quiz result.')
  }
  if (candidates.length < 2) return top

  const adventurousTilt = scores.explorer + scores.icon
  const intimateTilt = scores.charmer + scores.executive
  return adventurousTilt > intimateTilt ? candidates[1] : candidates[0]
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
  const primary = collections.find((c) => c.id === primaryId) ?? collections[0]
  const secondary = collections.find((c) => c.id === secondaryId) ?? collections[1]
  const fragrance = pickFragrance(primary.id, scores, products, gender)

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
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<CollectionId, number>>(initialScores)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizGender, setQuizGender] = useState<ProductSummary['gender'] | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [matchingStage, setMatchingStage] = useState(0)
  const quizCardRef = useRef<HTMLDivElement | null>(null)

  const templateQuestions = useMemo(() => buildQuizQuestions(t), [t])

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
      setQuizQuestions(restored.questions)
      setStep(Math.min(Math.max(0, restored.step), maxStep))
      setSelections(restored.selections)
      setScores(recomputeScores(restored.selections, restored.questions))
      setQuizGender(restored.quizGender ?? null)
      return
    }
    clearQuizSession()
    setQuizQuestions(buildRandomizedQuestions(templateQuestions))
    setStep(0)
    setScores(initialScores)
    setSelections({})
    setQuizGender(null)
  }, [locale, templateQuestions])

  useEffect(() => {
    if (quizQuestions.length === 0) return
    persistQuizSession({
      v: 2,
      locale,
      questions: quizQuestions,
      step,
      selections,
      quizGender,
    })
  }, [locale, quizQuestions, step, selections, quizGender])

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
    setQuizGender(gender)
    setIsMatching(true)
    setMatchingStage(0)
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
    setQuizQuestions(buildRandomizedQuestions(templateQuestions))
  }

  const stepperChipClass = (active: boolean, done: boolean) =>
    `min-w-9 rounded-full border px-2 py-1.5 text-center text-[0.65rem] font-medium uppercase tracking-wider transition-colors ${active
      ? 'border-scnt-text bg-scnt-text text-scnt-bg'
      : done
        ? 'border-scnt-border/80 bg-scnt-bg/65 text-scnt-text hover:border-scnt-text/25'
        : 'cursor-not-allowed border-scnt-border/50 bg-scnt-bg/30 text-scnt-text-muted opacity-60'
    }`

  return (
    <Layout>
      <section className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:px-8 sm:pt-18">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute start-[8%] top-24 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(122,143,163,0.22),transparent_70%)] blur-2xl" />
          <div className="absolute end-[12%] top-40 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(184,155,94,0.24),transparent_72%)] blur-2xl" />
          <div className="absolute bottom-10 start-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,61,92,0.14),transparent_74%)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">{t('fz.pageKicker')}</p>
            <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-scnt-text sm:text-5xl">
              {t('fz.pageTitle')}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-scnt-text-muted sm:text-base">
              {t('fz.pageSub')}
            </p>
          </div>

          <div ref={quizCardRef} className="mx-auto mt-10 max-w-4.5xl rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/70 p-5 shadow-[0_20px_80px_-52px_rgba(42,38,34,0.35)] sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.24em] text-scnt-text-muted">
                {isMatching
                  ? t('fz.matching.kicker')
                  : isResultStep
                    ? t('fz.resultReady')
                    : isGenderStep
                      ? t('fz.question', { cur: String(fullSteps), total: String(fullSteps) })
                      : t('fz.question', { cur: String(Math.min(step + 1, fullSteps)), total: String(fullSteps) })}
              </p>
              <p className="text-xs text-scnt-text-muted">
                {isMatching
                  ? `${progress}%`
                  : isResultStep
                    ? t('fz.resultReady')
                    : t('fz.answered', { n: String(answeredCount) })}
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-scnt-border/60">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[rgba(122,143,163,0.85)] via-[rgba(139,61,92,0.72)] to-[rgba(184,155,94,0.85)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {!isResultStep && !isMatching && total > 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2" role="navigation" aria-label={t('fz.question')}>
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

            <AnimatePresence mode="wait">
              {total === 0 ? (
                <motion.p
                  key="quiz-init"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-7 text-center text-sm text-scnt-text-muted"
                >
                  {t('fz.loadingQuiz')}
                </motion.p>
              ) : isMatching ? (
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
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-scnt-text-muted">
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
                <motion.div
                  key="fz-gender"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-7"
                >
                  <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{t('fz.genderPrompt')}</h2>
                  <p className="mt-2 text-sm text-scnt-text-muted">{t('fz.genderDetail')}</p>
                  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => pickGender('male')}
                      className="rounded-2xl border border-scnt-border/80 bg-scnt-bg/65 px-4 py-5 text-center text-sm font-medium text-scnt-text transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-scnt-text/20 hover:shadow-[0_22px_56px_-44px_rgba(42,38,34,0.45)]"
                    >
                      {t('shop.male')}
                    </button>
                    <button
                      type="button"
                      onClick={() => pickGender('female')}
                      className="rounded-2xl border border-scnt-border/80 bg-scnt-bg/65 px-4 py-5 text-center text-sm font-medium text-scnt-text transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-scnt-text/20 hover:shadow-[0_22px_56px_-44px_rgba(42,38,34,0.45)]"
                    >
                      {t('shop.female')}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToQuestion(genderStepIndex - 1)}
                    className="mt-6 text-sm text-scnt-text-muted underline-offset-4 transition-colors hover:text-scnt-text hover:underline"
                  >
                    {t('fz.back')}
                  </button>
                </motion.div>
              ) : current ? (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-7"
                >
                  <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{current.prompt}</h2>
                  <p className="mt-2 text-sm text-scnt-text-muted">{current.promptDetail}</p>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {current.choices.map((choice) => {
                      const selected = selections[current.id] === choice.id
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => pickChoice(choice)}
                          className={`rounded-2xl border bg-scnt-bg/70 p-5 text-start transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${selected
                              ? 'border-scnt-text/85 shadow-[0_18px_48px_-36px_rgba(42,38,34,0.45)] ring-2 ring-scnt-text/15'
                              : 'border-scnt-border/80 hover:-translate-y-0.5 hover:border-scnt-text/40 hover:shadow-[0_22px_56px_-44px_rgba(42,38,34,0.45)]'
                            }`}
                        >
                          {/*
                          <picture>
                            <source srcSet={choice.imageUrl} type="image/png" />
                            <img
                              src={choice.imageUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                            />
                          </picture>
                          */}
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-scnt-text-muted">{choice.aura}</p>
                            <p className="mt-2 text-base font-medium text-scnt-text sm:text-lg">{choice.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-scnt-text-muted sm:text-sm">{choice.subtitle}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    {step > 0 ? (
                      <button
                        type="button"
                        onClick={() => goToQuestion(step - 1)}
                        className="text-sm text-scnt-text-muted underline-offset-4 transition-colors hover:text-scnt-text hover:underline"
                      >
                        {t('fz.back')}
                      </button>
                    ) : null}
                    {selections[current.id] ? (
                      <button
                        type="button"
                        onClick={advanceFromCurrentQuestion}
                        className="rounded-full border border-scnt-text bg-scnt-text px-5 py-2 text-sm font-medium text-scnt-bg transition-colors hover:bg-scnt-text/90"
                      >
                        {t('fz.continue')}
                      </button>
                    ) : null}
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
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-7 space-y-5"
                >
                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">{t('fz.yourCharacter')}</p>
                    <h2 className="mt-3 font-serif text-3xl text-scnt-text">{result.characterTitle}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted sm:text-base">
                      {result.characterParagraph}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5 flex flex-col-reverse sm:flex-row gap-6 items-center sm:items-start">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">{t('fz.collectionMatch')}</p>
                      <h3 className="mt-3 font-serif text-2xl text-scnt-text">{result.collection.name}</h3>
                      {result.collection.subTagline ? (
                        <p className="mt-2 text-sm italic text-scnt-text-muted">{result.collection.subTagline}</p>
                      ) : null}
                      <p className="mt-3 text-sm text-scnt-text-muted">{result.collection.tagline}</p>
                      <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted sm:text-base">
                        {result.collectionWhy}
                      </p>
                    </div>
                    {/*
                    {result.collection.coverImage && (
                      <div className="w-full sm:w-1/3 shrink-0">
                        <picture>
                          <source srcSet={result.collection.coverImage} type="image/png" />
                          <img 
                            src={result.collection.coverImage} 
                            alt={result.collection.name} 
                            className="w-full aspect-[4/3] sm:aspect-square object-cover rounded-xl border border-scnt-border/50" 
                          />
                        </picture>
                      </div>
                    )}
                    */}
                  </div>

                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5 flex flex-col-reverse sm:flex-row gap-6 items-center sm:items-start">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">{t('fz.fragranceMatch')}</p>
                      <h3 className="mt-3 font-serif text-2xl text-scnt-text">{result.fragrance.name}</h3>
                      <p className="mt-2 text-sm text-scnt-text-muted">{result.fragrance.vibeSentence}</p>
                      <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted sm:text-base">
                        {result.fragranceWhy}
                      </p>
                    </div>
                    {/*
                    {(result.fragrance.clearBackground_Image || result.fragrance.galleryImages?.[0]) && (
                      <div className="w-full sm:w-1/3 shrink-0 flex items-center justify-center bg-scnt-bg/50 rounded-xl border border-scnt-border/50 aspect-[4/3] sm:aspect-square p-4">
                        <picture>
                          <source srcSet={result.fragrance.clearBackground_Image || result.fragrance.galleryImages[0]} type="image/png" />
                          <img 
                            src={result.fragrance.clearBackground_Image || result.fragrance.galleryImages[0]} 
                            alt={result.fragrance.name} 
                            className="w-full h-full object-contain" 
                          />
                        </picture>
                      </div>
                    )}
                    */}
                  </div>

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <Button to={`/collections/${result.collection.id}`} className="w-full sm:w-auto">
                      {t('fz.explore', { name: result.collection.name })}
                    </Button>
                    <Button to={`/product/${result.fragrance.id}`} variant="outline" className="w-full sm:w-auto">
                      {t('fz.open', { name: result.fragrance.name })}
                    </Button>
                    <Button onClick={restart} variant="ghost" className="w-full sm:w-auto">
                      {t('fz.retake')}
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </Layout>
  )
}
