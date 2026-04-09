import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { collections, type CollectionId, type CollectionSummary } from '../data/collections'
import { products, type ProductSummary } from '../data/products'

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

const questions: QuizQuestion[] = [
  {
    id: 'entrance',
    prompt: 'Your entrance in a room feels like...',
    promptDetail: 'Pick the energy that sounds most like you.',
    choices: [
      {
        id: 'q1-1',
        title: 'A sharp, clean statement',
        subtitle: 'Minimal words, maximum presence.',
        aura: 'Precision',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q1-2',
        title: 'Fresh wind through an open window',
        subtitle: 'Free, cool, and naturally magnetic.',
        aura: 'Freedom',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q1-3',
        title: 'Soft warmth people move toward',
        subtitle: 'Intimate and inviting, never loud.',
        aura: 'Warmth',
        score: { executive: 0, explorer: 1, charmer: 3, icon: 1 },
      },
      {
        id: 'q1-4',
        title: 'An unforgettable golden glow',
        subtitle: 'Elegant, bold, and iconic.',
        aura: 'Legacy',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'schedule',
    prompt: 'Your ideal day rhythm is...',
    promptDetail: 'Think about how you naturally move through time.',
    choices: [
      {
        id: 'q2-1',
        title: 'Structured plans and clear priorities',
        subtitle: 'You perform best with focus and flow.',
        aura: 'Discipline',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q2-2',
        title: 'Flexible and spontaneous',
        subtitle: 'You follow momentum and curiosity.',
        aura: 'Motion',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 1 },
      },
      {
        id: 'q2-3',
        title: 'A smooth blend of work and social',
        subtitle: 'You thrive in meaningful interactions.',
        aura: 'Connection',
        score: { executive: 1, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q2-4',
        title: 'High-impact moments all day',
        subtitle: 'You treat every appearance as a statement.',
        aura: 'Presence',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'vacation',
    prompt: 'Your perfect escape is...',
    promptDetail: 'Where do you feel most alive?',
    choices: [
      {
        id: 'q3-1',
        title: 'A luxury city break',
        subtitle: 'Fine dining, architecture, and polished style.',
        aura: 'Refined',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 2 },
      },
      {
        id: 'q3-2',
        title: 'A coastal road trip',
        subtitle: 'Salt air, sunlight, and no strict route.',
        aura: 'Open-air',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 0 },
      },
      {
        id: 'q3-3',
        title: 'A boutique getaway with candlelit nights',
        subtitle: 'Mood, conversation, and slow luxury.',
        aura: 'Seductive',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q3-4',
        title: 'A private villa for grand celebrations',
        subtitle: 'Drama, elegance, and memorable experiences.',
        aura: 'Grand',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'fabric',
    prompt: 'The texture that best represents you...',
    promptDetail: 'Style can be felt before it is seen.',
    choices: [
      {
        id: 'q4-1',
        title: 'Crisp tailored cotton',
        subtitle: 'Clean lines and intentional choices.',
        aura: 'Tailored',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 0 },
      },
      {
        id: 'q4-2',
        title: 'Linen in ocean breeze',
        subtitle: 'Relaxed, breathable, and naturally cool.',
        aura: 'Breezy',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q4-3',
        title: 'Velvet at midnight',
        subtitle: 'Depth, intimacy, and soft drama.',
        aura: 'Nocturne',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q4-4',
        title: 'Silk with gold detail',
        subtitle: 'Timeless and impossible to ignore.',
        aura: 'Regal',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'social',
    prompt: 'In your circle, you are usually...',
    promptDetail: 'Your role says a lot about your scent identity.',
    choices: [
      {
        id: 'q5-1',
        title: 'The strategist',
        subtitle: 'Calm, decisive, and trusted.',
        aura: 'Leader',
        score: { executive: 3, explorer: 0, charmer: 0, icon: 1 },
      },
      {
        id: 'q5-2',
        title: 'The explorer',
        subtitle: 'Curious, lively, and always discovering.',
        aura: 'Adventurer',
        score: { executive: 0, explorer: 3, charmer: 1, icon: 0 },
      },
      {
        id: 'q5-3',
        title: 'The storyteller',
        subtitle: 'Warm, expressive, and unforgettable.',
        aura: 'Magnetism',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q5-4',
        title: 'The icon',
        subtitle: 'Confident, polished, and trend-defining.',
        aura: 'Star power',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'night',
    prompt: 'Your ideal evening vibe?',
    promptDetail: 'From low-key to high-impact.',
    choices: [
      {
        id: 'q6-1',
        title: 'Exclusive rooftop dinner',
        subtitle: 'Elegant atmosphere and focused conversations.',
        aura: 'Polished',
        score: { executive: 3, explorer: 0, charmer: 1, icon: 1 },
      },
      {
        id: 'q6-2',
        title: 'Sunset by the shore',
        subtitle: 'Relaxed mood with open skies.',
        aura: 'Airy',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q6-3',
        title: 'Jazz lounge and dim lights',
        subtitle: 'Depth, chemistry, and quiet sensuality.',
        aura: 'Velvet',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q6-4',
        title: 'Gala with a dramatic entrance',
        subtitle: 'A moment people remember.',
        aura: 'Spotlight',
        score: { executive: 1, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'notes',
    prompt: 'Which note family draws you most?',
    promptDetail: 'Your instinctive preference guides the match.',
    choices: [
      {
        id: 'q7-1',
        title: 'Citrus, woods, and clean musk',
        subtitle: 'Fresh with modern structure.',
        aura: 'Crisp',
        score: { executive: 3, explorer: 1, charmer: 0, icon: 0 },
      },
      {
        id: 'q7-2',
        title: 'Marine accords and green fig',
        subtitle: 'Transparent freshness with movement.',
        aura: 'Aqua',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 0 },
      },
      {
        id: 'q7-3',
        title: 'Amber, florals, and patchouli',
        subtitle: 'Warm and close to the skin.',
        aura: 'Intense',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q7-4',
        title: 'Rose, oud, and golden resins',
        subtitle: 'Bold depth with heritage.',
        aura: 'Opulent',
        score: { executive: 0, explorer: 0, charmer: 1, icon: 3 },
      },
    ],
  },
  {
    id: 'signature',
    prompt: 'How do you want people to remember you?',
    promptDetail: 'Choose the legacy your scent leaves behind.',
    choices: [
      {
        id: 'q8-1',
        title: 'Composed and trustworthy',
        subtitle: 'Quiet confidence that earns respect.',
        aura: 'Authority',
        score: { executive: 3, explorer: 0, charmer: 0, icon: 1 },
      },
      {
        id: 'q8-2',
        title: 'Free-spirited and refreshing',
        subtitle: 'Light, open, and naturally cool.',
        aura: 'Escape',
        score: { executive: 0, explorer: 3, charmer: 0, icon: 1 },
      },
      {
        id: 'q8-3',
        title: 'Warm and magnetic',
        subtitle: 'An intimate trail people lean toward.',
        aura: 'Chemistry',
        score: { executive: 0, explorer: 0, charmer: 3, icon: 1 },
      },
      {
        id: 'q8-4',
        title: 'Powerful and iconic',
        subtitle: 'A statement that lasts after you leave.',
        aura: 'Prestige',
        score: { executive: 1, explorer: 0, charmer: 0, icon: 3 },
      },
    ],
  },
]

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

function formatCharacterTitle(id: CollectionId): string {
  if (id === 'executive') return 'The Quiet Strategist'
  if (id === 'explorer') return 'The Modern Voyager'
  if (id === 'charmer') return 'The Velvet Magnet'
  return 'The Golden Signature'
}

function strongestIds(scores: Record<CollectionId, number>): [CollectionId, CollectionId] {
  const ranked = (Object.keys(scores) as CollectionId[]).sort((a, b) => scores[b] - scores[a])
  return [ranked[0], ranked[1]]
}

function buildCharacterParagraph(primary: CollectionSummary, secondary: CollectionSummary): string {
  return `You move with ${primary.identityLine.toLowerCase()} Your style blends ${primary.mood.toLowerCase()} with subtle notes of ${secondary.mood.toLowerCase()}, so your presence feels intentional, memorable, and naturally confident in both everyday moments and big entrances.`
}

function buildCollectionWhy(primary: CollectionSummary, secondary: CollectionSummary): string {
  return `${primary.name} fits you best because your answers consistently favored ${primary.tagline.toLowerCase()} We also picked up a secondary influence from ${secondary.name}, which adds extra dimension to your profile and keeps your scent identity unique rather than one-dimensional.`
}

function pickFragrance(collectionId: CollectionId, scores: Record<CollectionId, number>): ProductSummary {
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

function buildFragranceWhy(fragrance: ProductSummary, primary: CollectionSummary): string {
  const top = fragrance.topNotes.slice(0, 2).join(' + ')
  const base = fragrance.baseNotes.slice(0, 2).join(' + ')
  return `${fragrance.name} is your strongest match because it opens with ${top}, then settles into ${base}. This mirrors your ${primary.mood.toLowerCase()} profile: noticeable at first impression, then deeply personal as it lingers.`
}

function calculateResult(scores: Record<CollectionId, number>): QuizResult {
  const [primaryId, secondaryId] = strongestIds(scores)
  const primary = collections.find((c) => c.id === primaryId) ?? collections[0]
  const secondary = collections.find((c) => c.id === secondaryId) ?? collections[1]
  const fragrance = pickFragrance(primary.id, scores)

  return {
    collection: primary,
    fragrance,
    characterTitle: formatCharacterTitle(primary.id),
    characterParagraph: buildCharacterParagraph(primary, secondary),
    collectionWhy: buildCollectionWhy(primary, secondary),
    fragranceWhy: buildFragranceWhy(fragrance, primary),
  }
}

export function FindYourScntPage() {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<CollectionId, number>>(initialScores)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => buildRandomizedQuestions(questions))

  const total = quizQuestions.length
  const progress = Math.round((Math.min(step, total) / total) * 100)
  const isDone = step >= total
  const current = quizQuestions[Math.min(step, total - 1)]

  const result = useMemo(() => calculateResult(scores), [scores])

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
    setQuizQuestions(buildRandomizedQuestions(questions))
  }

  return (
    <Layout>
      <section className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:px-8 sm:pt-18">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-24 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(122,143,163,0.22),transparent_70%)] blur-2xl" />
          <div className="absolute right-[12%] top-40 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(184,155,94,0.24),transparent_72%)] blur-2xl" />
          <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,61,92,0.14),transparent_74%)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">Find your SCNT</p>
            <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-scnt-text sm:text-5xl">
              A deeper fragrance identity quiz
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-scnt-text-muted sm:text-base">
              Eight immersive questions designed to decode your personality. At the end, you get a custom character profile, your ideal collection, and one fragrance that fits your story with a clear reason why.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-scnt-border/90 bg-scnt-bg-elevated/70 p-5 shadow-[0_20px_80px_-52px_rgba(42,38,34,0.35)] sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.24em] text-scnt-text-muted">
                {isDone ? 'Result ready' : `Question ${Math.min(step + 1, total)} / ${total}`}
              </p>
              <p className="text-xs text-scnt-text-muted">{answeredCount} answered</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-scnt-border/60">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[rgba(122,143,163,0.85)] via-[rgba(139,61,92,0.72)] to-[rgba(184,155,94,0.85)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <AnimatePresence mode="wait">
              {!isDone ? (
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
                        className="group relative overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg/65 px-4 py-4 text-left transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-scnt-text/20 hover:shadow-[0_22px_56px_-44px_rgba(42,38,34,0.45)]"
                      >
                        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">{choice.aura}</p>
                        <p className="mt-2 text-sm font-medium text-scnt-text sm:text-base">{choice.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-scnt-text-muted sm:text-sm">{choice.subtitle}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-7 space-y-5"
                >
                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">Your character</p>
                    <h2 className="mt-3 font-serif text-3xl text-scnt-text">{result.characterTitle}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted sm:text-base">
                      {result.characterParagraph}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">Collection match</p>
                    <h3 className="mt-3 font-serif text-2xl text-scnt-text">{result.collection.name}</h3>
                    <p className="mt-2 text-sm text-scnt-text-muted">{result.collection.identityLine}</p>
                    <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted sm:text-base">{result.collectionWhy}</p>
                  </div>

                  <div className="rounded-2xl border border-scnt-border/70 bg-scnt-bg/70 p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-scnt-text-muted">Fragrance match</p>
                    <h3 className="mt-3 font-serif text-2xl text-scnt-text">{result.fragrance.name}</h3>
                    <p className="mt-2 text-sm text-scnt-text-muted">{result.fragrance.vibeSentence}</p>
                    <p className="mt-3 text-sm leading-relaxed text-scnt-text-muted sm:text-base">{result.fragranceWhy}</p>
                  </div>

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <Button to={`/collections/${result.collection.id}`} className="w-full sm:w-auto">
                      Explore {result.collection.name}
                    </Button>
                    <Button to={`/product/${result.fragrance.id}`} variant="outline" className="w-full sm:w-auto">
                      Open {result.fragrance.name}
                    </Button>
                    <Button onClick={restart} variant="ghost" className="w-full sm:w-auto">
                      Retake quiz
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </Layout>
  )
}
