import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useWheelSectionLock } from '../../hooks/useWheelSectionLock'

export type SectionScrollerSection = {
  id: string
  node: ReactNode
  ariaLabel?: string
}

type SectionScrollerProps = {
  sections: SectionScrollerSection[]
  className?: string
  /** Optional accessible label for the stepper navigation. */
  stepperLabel?: string
  /** If true, shows 01/02/03 labels alongside dots. */
  showStepNumbers?: boolean
  /** One wheel gesture advances exactly one section (disabled for reduced motion). */
  wheelLock?: boolean
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function SectionScroller({
  sections,
  className,
  stepperLabel = 'Sections',
  showStepNumbers = true,
  wheelLock = false,
}: SectionScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  useWheelSectionLock(scrollerRef, { disabled: !wheelLock })

  useEffect(() => {
    sectionRefs.current = sectionRefs.current.slice(0, sections.length)
    setActiveIndex((x) => clamp(x, 0, Math.max(0, sections.length - 1)))
  }, [sections.length])

  useEffect(() => {
    const root = scrollerRef.current
    if (!root) return

    const items = sectionRefs.current.filter(Boolean) as HTMLElement[]
    if (items.length === 0) return

    const byId = new Map(items.map((el) => [el.dataset.sectionId ?? '', el]))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0]
        const id = (visible?.target as HTMLElement | undefined)?.dataset.sectionId
        if (!id) return
        const idx = sectionIds.indexOf(id)
        if (idx >= 0) setActiveIndex(idx)
      },
      { root, threshold: [0.35, 0.55, 0.75] },
    )

    for (const el of byId.values()) observer.observe(el)
    return () => observer.disconnect()
  }, [sectionIds])

  const scrollToIndex = (idx: number) => {
    const root = scrollerRef.current
    const el = sectionRefs.current[idx]
    if (!root || !el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        ref={scrollerRef}
        tabIndex={0}
        className="relative h-[calc(100svh-var(--scnt-header-h,5.5rem))] overflow-y-auto overscroll-y-contain scroll-smooth focus:outline-none [scroll-snap-type:y_mandatory]"
      >
        {sections.map((s, i) => (
          <section
            key={s.id}
            ref={(el) => {
              sectionRefs.current[i] = el
            }}
            data-section-id={s.id}
            aria-label={s.ariaLabel}
            className="relative [scroll-snap-align:start] [scroll-snap-stop:always]"
          >
            {s.node}
          </section>
        ))}
      </div>

      {sections.length > 1 ? (
        <nav
          aria-label={stepperLabel}
          className="pointer-events-auto absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 sm:block"
        >
          <ol className="flex flex-col items-end gap-4">
            {sections.map((s, i) => {
              const active = i === activeIndex
              const n = String(i + 1).padStart(2, '0')
              return (
                <li key={s.id} className="flex items-center gap-3">
                  {showStepNumbers ? (
                    <span
                      className={`text-[0.65rem] font-medium tracking-[0.36em] transition-opacity ${
                        active ? 'text-scnt-text opacity-90' : 'text-scnt-text-muted opacity-55'
                      }`}
                    >
                      {n}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => scrollToIndex(i)}
                    aria-label={s.ariaLabel ?? `Go to section ${n}`}
                    aria-current={active ? 'step' : undefined}
                    className="group grid h-6 w-6 place-items-center"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full border transition-[transform,background-color,border-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        active
                          ? 'border-scnt-text bg-scnt-text opacity-95'
                          : 'border-scnt-border bg-transparent opacity-70 group-hover:opacity-95'
                      }`}
                    />
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  )
}

