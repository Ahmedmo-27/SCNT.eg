import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { useCatalog } from '../context/CatalogContext'
import { FIND_YOUR_SCNT_BLUEPRINT } from '../data/findYourScntBlueprint'
import { useI18n } from '../i18n/I18nContext'
import type { CollectionId, CollectionSummary, ProductSummary } from '../types/catalog'

type Choice = {
  id: string
  title: string
  subtitle: string
  aura: string
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
): ProductSummary {
  const candidates = products.filter((p) => p.collection === collectionId)
  const top = candidates[0] ?? products[0]
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
): QuizResult | null {
  if (collections.length === 0 || products.length === 0) return null
  const [primaryId, secondaryId] = strongestIds(scores)
  const primary = collections.find((c) => c.id === primaryId) ?? collections[0]
  const secondary = collections.find((c) => c.id === secondaryId) ?? collections[1]
  const fragrance = pickFragrance(primary.id, scores, products)

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

  const templateQuestions = useMemo(() => buildQuizQuestions(t), [t])

  useEffect(() => {
    setQuizQuestions(buildRandomizedQuestions(templateQuestions))
    setStep(0)
    setScores(initialScores)
    setSelections({})
  }, [locale, templateQuestions])

  const total = quizQuestions.length
  const progress = total > 0 ? Math.round((Math.min(step, total) / total) * 100) : 0
  const isDone = total > 0 && step >= total
  const current = quizQuestions[Math.min(step, Math.max(total - 1, 0))]

  const result = useMemo(
    () => (isDone ? calculateResult(scores, collections, products, t) : null),
    [isDone, scores, collections, products, t],
  )

  const answeredCount = Object.keys(selections).length

  function pickChoice(choice: Choice) {
    if (!current) return
    if (selections[current.id]) return

    setSelections((prev) => ({ ...prev, [current.id]: choice.id }))
    setScores((prev) => ({
      executive: prev.executive + choice.score.executive,
      explorer: prev.explorer + choice.score.explorer,
      charmer: prev.charmer + choice.score.charmer,
      icon: prev.icon + choice.score.icon,
    }))
    setStep((prev) => prev + 1)
  }

  function restart() {
    setStep(0)
    setScores(initialScores)
    setSelections({})
    setQuizQuestions(buildRandomizedQuestions(templateQuestions))
  }

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

          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/70 p-5 shadow-[0_20px_80px_-52px_rgba(42,38,34,0.35)] sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.24em] text-scnt-text-muted">
                {isDone
                  ? t('fz.resultReady')
                  : t('fz.question', { cur: String(Math.min(step + 1, total)), total: String(total) })}
              </p>
              <p className="text-xs text-scnt-text-muted">{t('fz.answered', { n: String(answeredCount) })}</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-scnt-border/60">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[rgba(122,143,163,0.85)] via-[rgba(139,61,92,0.72)] to-[rgba(184,155,94,0.85)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

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
              ) : !isDone && current ? (
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
                    {current.choices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => pickChoice(choice)}
                        className="group relative overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg/65 px-4 py-4 text-start transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-scnt-text/20 hover:shadow-[0_22px_56px_-44px_rgba(42,38,34,0.45)]"
                      >
                        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">{choice.aura}</p>
                        <p className="mt-2 text-sm font-medium text-scnt-text sm:text-base">{choice.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-scnt-text-muted sm:text-sm">{choice.subtitle}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : isDone && (loading || !result) ? (
                <motion.div
                  key="result-pending"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-7 text-center text-sm text-scnt-text-muted"
                >
                  {loading ? t('fz.preparing') : t('fz.catalogErr')}
                </motion.div>
              ) : isDone && result ? (
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

                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5">
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

                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">{t('fz.fragranceMatch')}</p>
                    <h3 className="mt-3 font-serif text-2xl text-scnt-text">{result.fragrance.name}</h3>
                    <p className="mt-2 text-sm text-scnt-text-muted">{result.fragrance.vibeSentence}</p>
                    <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted sm:text-base">
                      {result.fragranceWhy}
                    </p>
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
