import { useEffect, useMemo, useRef } from 'react'

type Options = {
  cooldownMs?: number
  behavior?: ScrollBehavior
  /** Disable the lock (still allows scroll-snap). */
  disabled?: boolean
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
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

function getSnapItems(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>('[data-section-id]')
  return Array.from(nodes)
}

function getClosestIndex(root: HTMLElement, items: HTMLElement[]): number {
  const top = root.scrollTop
  let best = 0
  let bestDist = Number.POSITIVE_INFINITY
  for (let i = 0; i < items.length; i++) {
    const dist = Math.abs(items[i]!.offsetTop - top)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

export function useWheelSectionLock(
  scrollerRef: React.RefObject<HTMLElement | null>,
  opts?: Options,
) {
  const options = useMemo(
    () => ({
      cooldownMs: opts?.cooldownMs ?? 800,
      behavior: opts?.behavior ?? 'smooth',
      disabled: opts?.disabled ?? false,
    }),
    [opts?.behavior, opts?.cooldownMs, opts?.disabled],
  )

  const lockRef = useRef(false)

  useEffect(() => {
    const root = scrollerRef.current
    if (!root) return
    if (options.disabled) return
    if (prefersReducedMotion()) return

    const scrollToIndex = (idx: number) => {
      const items = getSnapItems(root)
      if (items.length === 0) return
      const current = getClosestIndex(root, items)
      const next = clamp(idx, 0, items.length - 1)
      if (next === current) return
      items[next]?.scrollIntoView({ behavior: options.behavior, block: 'start' })
    }

    const advance = (dir: 1 | -1) => {
      const items = getSnapItems(root)
      if (items.length === 0) return
      const current = getClosestIndex(root, items)
      scrollToIndex(current + dir)
    }

    const requestLock = () => {
      lockRef.current = true
      window.setTimeout(() => {
        lockRef.current = false
      }, options.cooldownMs)
    }

    const onWheel = (e: WheelEvent) => {
      if (lockRef.current) {
        e.preventDefault()
        return
      }
      if (isEditableTarget(e.target)) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      const dy = e.deltaY
      if (Math.abs(dy) < 6) return
      e.preventDefault()
      requestLock()
      advance(dy > 0 ? 1 : -1)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (lockRef.current) return
      if (isEditableTarget(e.target)) return

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        requestLock()
        advance(1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        requestLock()
        advance(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        requestLock()
        scrollToIndex(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        requestLock()
        const items = getSnapItems(root)
        scrollToIndex(items.length - 1)
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        requestLock()
        advance(e.shiftKey ? -1 : 1)
      }
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('wheel', onWheel as EventListener)
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [options.behavior, options.cooldownMs, options.disabled, scrollerRef])
}

