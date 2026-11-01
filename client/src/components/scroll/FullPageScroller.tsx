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
  if (el.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"], dialog')) return true
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
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  const lockRef = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isReducedMotion = prefersReducedMotion()

  useEffect(() => {
    setActiveIndex((x) => clamp(x, 0, Math.max(0, sections.length - 1)))
  }, [sections.length])

  useEffect(() => {
    onActiveIndexChange?.(activeIndex)
  }, [activeIndex, onActiveIndexChange])

  const requestLock = (customMs?: number) => {
    lockRef.current = true
    window.setTimeout(() => {
      lockRef.current = false
    }, customMs ?? cooldownMs)
  }

  const go = (idx: number) => setActiveIndex(clamp(idx, 0, Math.max(0, sections.length - 1)))
  const next = () => setActiveIndex((cur) => clamp(cur + 1, 0, Math.max(0, sections.length - 1)))
  const prev = () => setActiveIndex((cur) => clamp(cur - 1, 0, Math.max(0, sections.length - 1)))

  const handleNext = () => {
    if (lockRef.current || activeIndex >= sections.length - 1) return
    requestLock(400)
    next()
  }

  const handlePrev = () => {
    if (lockRef.current || activeIndex <= 0) return
    requestLock(400)
    prev()
  }

  const translate = useMemo(() => `translateY(-${activeIndex * 100}%)`, [activeIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (sections.length <= 1) return

    const onWheel = (e: WheelEvent) => {
      if (lockRef.current) return e.preventDefault()
      if (isEditableTarget(e.target)) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      if (Math.abs(e.deltaY) < 6) return
      e.preventDefault()

      if (e.deltaY > 0) {
        if (activeIndexRef.current >= sections.length - 1) return
        requestLock()
        next()
      } else {
        if (activeIndexRef.current <= 0) return
        requestLock()
        prev()
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (isEditableTarget(e.target)) return

      const isDownKey =
        e.key === 'ArrowDown' ||
        e.key === 'Down' ||
        e.key === 'PageDown' ||
        e.code === 'Numpad2' ||
        e.code === 'Numpad3'

      const isUpKey =
        e.key === 'ArrowUp' ||
        e.key === 'Up' ||
        e.key === 'PageUp' ||
        e.code === 'Numpad8' ||
        e.code === 'Numpad9'

      const isHomeKey = e.key === 'Home' || e.code === 'Numpad7'
      const isEndKey = e.key === 'End' || e.code === 'Numpad1'
      const isSpaceKey = e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space'

      if (isDownKey) {
        e.preventDefault()
        if (lockRef.current) return
        if (activeIndexRef.current >= sections.length - 1) return
        requestLock()
        next()
      } else if (isUpKey) {
        e.preventDefault()
        if (lockRef.current) return
        if (activeIndexRef.current <= 0) return
        requestLock()
        prev()
      } else if (isHomeKey) {
        e.preventDefault()
        if (lockRef.current) return
        if (activeIndexRef.current === 0) return
        requestLock()
        go(0)
      } else if (isEndKey) {
        e.preventDefault()
        if (lockRef.current) return
        if (activeIndexRef.current === sections.length - 1) return
        requestLock()
        go(sections.length - 1)
      } else if (isSpaceKey) {
        e.preventDefault()
        if (lockRef.current) return
        if (e.shiftKey) {
          if (activeIndexRef.current <= 0) return
          requestLock()
          prev()
        } else {
          if (activeIndexRef.current >= sections.length - 1) return
          requestLock()
          next()
        }
      }
    }

    let touchStartY = 0
    let touchStartX = 0

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      touchStartY = e.touches[0].clientY
      touchStartX = e.touches[0].clientX
    }

    const onTouchMove = (e: TouchEvent) => {
      if (lockRef.current) {
        e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (lockRef.current) return
      if (isEditableTarget(e.target)) return
      if (e.changedTouches.length !== 1) return

      const touchEndY = e.changedTouches[0].clientY
      const touchEndX = e.changedTouches[0].clientX

      const deltaY = touchStartY - touchEndY
      const deltaX = touchStartX - touchEndX

      // If horizontal swipe is more significant than vertical, ignore it (could be a carousel)
      if (Math.abs(deltaX) > Math.abs(deltaY)) return

      if (Math.abs(deltaY) < 40) return // Swipe threshold

      if (deltaY > 0) {
        if (activeIndexRef.current >= sections.length - 1) return
        requestLock()
        next()
      } else {
        if (activeIndexRef.current <= 0) return
        requestLock()
        prev()
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      container.removeEventListener('wheel', onWheel as EventListener)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [cooldownMs, sections.length])

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div
        tabIndex={0}
        className="relative h-[calc(100svh-var(--scnt-header-h,5.5rem))] overflow-hidden focus:outline-none"
      >
        <div
          className={`h-full w-full ${
            isReducedMotion ? '' : 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]'
          }`}
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
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Previous section"
                className="group grid h-5 w-5 place-items-center rounded-full text-scnt-text/75 transition-all hover:text-scnt-text hover:bg-scnt-text/10 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-scnt-text/75 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-scnt-text"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-disabled:translate-y-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
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
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex >= sections.length - 1}
                aria-label="Next section"
                className="group grid h-5 w-5 place-items-center rounded-full text-scnt-text/75 transition-all hover:text-scnt-text hover:bg-scnt-text/10 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-scnt-text/75 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-scnt-text"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5 group-disabled:translate-y-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <path d="M5 9l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  )
}
