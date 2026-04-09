import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collections, type CollectionId } from '../../data/collections'
import { products } from '../../data/products'
import { Button } from '../ui/Button'
import { EightPointStar } from '../ui/EightPointStar'

type Step = 0 | 1 | 2

const questions: {
  prompt: string
  options: { label: string; collection: CollectionId }[]
}[] = [
  {
    prompt: 'When you walk into a room, what should linger?',
    options: [
      { label: 'Quiet authority — linen, steel, calm', collection: 'executive' },
      { label: 'Salt air and open sky', collection: 'explorer' },
      { label: 'Warmth people lean toward', collection: 'charmer' },
      { label: 'Gold and gravity — unforgettable', collection: 'icon' },
    ],
  },
  {
    prompt: 'Your ideal evening looks like…',
    options: [
      { label: 'Early night, clear head, one perfect drink', collection: 'executive' },
      { label: 'Somewhere new — windows open', collection: 'explorer' },
      { label: 'Low light, long table, slow time', collection: 'charmer' },
      { label: 'The kind of night that becomes a story', collection: 'icon' },
    ],
  },
]

function pickSpotlight(collection: CollectionId) {
  const line = products.filter((p) => p.collection === collection)
  return line[0] ?? products[0]
}

export function FindYourScent() {
  const [step, setStep] = useState<Step>(0)
  const [scores, setScores] = useState<Record<CollectionId, number>>({
    executive: 0,
    explorer: 0,
    charmer: 0,
    icon: 0,
  })

  const result = useMemo(() => {
    let best: CollectionId = 'executive'
    let max = -1
    ;(Object.keys(scores) as CollectionId[]).forEach((k) => {
      if (scores[k] > max) {
        max = scores[k]
        best = k
      }
    })
    return { collectionId: best, product: pickSpotlight(best) }
  }, [scores])

  const col = collections.find((c) => c.id === result.collectionId)

  function choose(collection: CollectionId) {
    setScores((s) => ({ ...s, [collection]: s[collection] + 1 }))
    if (step === 0) setStep(1)
    else setStep(2)
  }

  function reset() {
    setStep(0)
    setScores({
      executive: 0,
      explorer: 0,
      charmer: 0,
      icon: 0,
    })
  }

  return (
    <section
      id="find-your-scent"
      className="relative scroll-mt-24 border-t border-scnt-border/80 bg-gradient-to-b from-scnt-bg-muted/20 via-transparent to-scnt-bg px-5 py-24 sm:px-8 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-scnt-border/80 to-transparent" />

      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
          <EightPointStar size={9} className="opacity-45" />
          Find your scent
        </p>
        <h2 className="font-serif text-3xl font-medium text-scnt-text sm:text-4xl">
          Three questions. No wrong answers.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-scnt-text-muted">
          A gentle nudge toward a line that fits — not a test, a mirror.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-lg">
        <AnimatePresence mode="wait">
          {step < 2 ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <p className="text-center font-serif text-xl text-scnt-text">
                {questions[step].prompt}
              </p>
              <ul className="flex flex-col gap-3">
                {questions[step].options.map((o) => (
                  <li key={o.label}>
                    <button
                      type="button"
                      onClick={() => choose(o.collection)}
                      className="w-full rounded-2xl border border-scnt-border bg-scnt-bg-elevated/45 px-5 py-4 text-left text-sm text-scnt-text transition-[transform,box-shadow,background-color] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-scnt-bg-elevated/80 hover:shadow-[0_20px_50px_-32px_rgba(42,38,34,0.12)]"
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-scnt-bg-elevated/55 p-8 ring-1 ring-scnt-border/90"
            >
              {col ? (
                <>
                  <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
                    We’d start you here
                  </p>
                  <h3 className="mt-3 font-serif text-2xl text-scnt-text">{col.name}</h3>
                  <p className="mt-2 text-sm italic text-scnt-text-muted">{col.identityLine}</p>
                  <p className="mt-4 text-sm leading-relaxed text-scnt-text-muted">
                    {col.tagline}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button to="/find-your-scnt" variant="ghost">
                    Take the full quiz
                  </Button>
                    <Button to={`/collections/${col.id}`}>Explore the line</Button>
                    <Button
                      to={`/product/${result.product.id}`}
                      variant="outline"
                    >
                      Open {result.product.name}
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-8 w-full text-center text-xs text-scnt-text-muted underline-offset-4 transition-colors hover:text-scnt-text"
                  >
                    Start again
                  </button>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
