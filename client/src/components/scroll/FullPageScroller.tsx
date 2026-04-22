import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

export type FullPageSection = {
  id: string
  node: ReactNode
  ariaLabel?: string
}

type Props = {
  sections: FullPageSection[]
  className?: string
  stepperLabel?: string
  showStepNumbers?: boolean
  cooldownMs?: number
  onActiveIndexChange?: (index: number) => void
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (!tag) return false
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true
  return false
}

export function FullPageScroller({
  sections,
  className,
  stepperLabel = 'Sections',
  showStepNumbers = true,
  cooldownMs = 850,
  onActiveIndexChange,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const lockRef = useRef(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setActiveIndex((x) => clamp(x, 0, Math.max(0, sections.length - 1)))
  }, [sections.length])
useEffect(() => {
    onActiveIndexChange?.(activeIndex)
  }, [activeIndex, onActiveIndexChange])

  
  const go = (idx: number) => setActiveIndex(clamp(idx, 0, Math.max(0, sections.length - 1)))
  const next = () => setActiveIndex((cur) => clamp(cur + 1, 0, Math.max(0, sections.length - 1)))
  const prev = () => setActiveIndex((cur) => clamp(cur - 1, 0, Math.max(0, sections.length - 1)))

  const translate = useMemo(() => `translateY(-${activeIndex * 100}%)`, [activeIndex])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (sections.length <= 1) return
    if (prefersReducedMotion()) return

    const requestLock = () => {
      lockRef.current = true
      window.setTimeout(() => {
        lockRef.current = false
      }, cooldownMs)
    }

    const onWheel = (e: WheelEvent) => {
      if (lockRef.current) return e.preventDefault()
      if (isEditableTarget(e.target)) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      if (Math.abs(e.deltaY) < 6) return
      e.preventDefault()
      requestLock()
      e.deltaY > 0 ? next() : prev()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (lockRef.current) return
      if (isEditableTarget(e.target)) return

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        requestLock()
        next()
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        requestLock()
        prev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        requestLock()
        go(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        requestLock()
        go(sections.length - 1)
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        requestLock()
        e.shiftKey ? prev() : next()
      }
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('wheel', onWheel as EventListener)
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [cooldownMs, sections.length])

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        ref={rootRef}
        tabIndex={0}
        className="relative h-[calc(100svh-var(--scnt-header-h,5.5rem))] overflow-hidden focus:outline-none"
      >
        <div
          className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: translate }}
        >
          {sections.map((s) => (
            <section
              key={s.id}
              aria-label={s.ariaLabel}
              className="h-[calc(100svh-var(--scnt-header-h,5.5rem))]"
            >
              {s.node}
            </section>
          ))}
        </div>
      </div>

      {sections.length > 1 ? (
        <nav
          aria-label={stepperLabel}
          className="pointer-events-auto absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 sm:block"
        >
          <div className="rounded-[2rem] border border-scnt-text/20 bg-scnt-bg/72 px-3 py-4 shadow-[0_12px_26px_rgba(42,38,34,0.14)] backdrop-blur-sm">
            <div className="mb-3 flex justify-end pe-[0.05rem]">
              <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-scnt-text/75" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>

            <div className="relative pe-[0.05rem]">
              <div className="pointer-events-none absolute right-[0.56rem] top-2 h-[calc(100%-1rem)] w-px bg-scnt-text/38" aria-hidden />
              <ol className="relative z-10 flex flex-col items-end gap-[1.35rem]">
              {sections.map((s, i) => {
                const active = i === activeIndex
                const n = String(i + 1).padStart(2, '0')
                return (
                  <li key={s.id} className="flex items-center gap-2.5">
                    {showStepNumbers ? (
                      <span
                        className={`text-[0.72rem] tracking-[0.32em] transition-colors ${
                          active ? 'text-scnt-text' : 'text-scnt-text/55'
                        }`}
                      >
                        {n}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-label={s.ariaLabel ?? `Go to section ${n}`}
                      aria-current={active ? 'step' : undefined}
                      className="group grid h-5 w-5 place-items-center"
                    >
                      <span
                        className={`rounded-full border transition-[transform,background-color,border-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          active
                            ? 'h-3.5 w-3.5 scale-105 border-scnt-text bg-scnt-text opacity-100'
                            : 'h-2.5 w-2.5 border-scnt-text/35 bg-scnt-bg-elevated opacity-100 group-hover:border-scnt-text/60'
                        }`}
                      />
                    </button>
                  </li>
                )
              })}
              </ol>
            </div>

            <div className="mt-3 flex justify-end pe-[0.05rem]">
              <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-scnt-text/75" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M5 9l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  )
}

