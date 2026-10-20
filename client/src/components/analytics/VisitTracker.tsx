import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackClientVisit } from '../../services/adminAnalyticsApi'
import { useI18n } from '../../i18n/I18nContext'
import { getOrCreateVisitorId, getOrCreateSessionId } from '../../lib/visitorStorage'

export function inferFunnelStage(pathname: string): 'browse' | 'product_view' | 'cart_view' | 'checkout_start' | 'order_placed' {
  if (pathname.startsWith('/order-confirmation') || pathname.startsWith('/checkout/success')) {
    return 'order_placed'
  }
  if (pathname.startsWith('/checkout')) {
    return 'checkout_start'
  }
  if (pathname.startsWith('/cart')) {
    return 'cart_view'
  }
  if (pathname.startsWith('/product/')) {
    return 'product_view'
  }
  return 'browse'
}

/**
 * Fire-and-forget event tracking for buying funnel milestones.
 */
export function trackFunnelAction(
  action: string,
  stage?: 'browse' | 'product_view' | 'cart_view' | 'checkout_start' | 'order_placed',
  metadata: Record<string, unknown> = {}
) {
  try {
    const visitorId = getOrCreateVisitorId()
    const sessionId = getOrCreateSessionId()
    const path = typeof window !== 'undefined' ? window.location.pathname : '/'
    const determinedStage = stage || inferFunnelStage(path)

    void trackClientVisit({
      visitorId,
      sessionId,
      path,
      title: typeof document !== 'undefined' ? document.title || 'SCNT.eg' : '',
      action,
      stage: determinedStage,
      metadata,
    }).catch(() => {})
  } catch {
    // Non-blocking
  }
}

export function VisitTracker() {
  const location = useLocation()
  const { locale } = useI18n()
  const lastTrackedPathRef = useRef<string | null>(null)

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`

    // Avoid duplicate immediate hits on same route
    if (lastTrackedPathRef.current === currentPath) {
      return
    }
    lastTrackedPathRef.current = currentPath

    const timer = setTimeout(() => {
      const visitorId = getOrCreateVisitorId()
      const sessionId = getOrCreateSessionId()
      const stage = inferFunnelStage(location.pathname)

      trackClientVisit({
        visitorId,
        sessionId,
        path: currentPath,
        title: document.title || 'SCNT.eg',
        referrer: document.referrer || '',
        screenResolution:
          typeof window !== 'undefined' && window.screen
            ? `${window.screen.width}x${window.screen.height}`
            : undefined,
        locale,
        stage,
        action: 'pageview',
      })
    }, 150)

    return () => clearTimeout(timer)
  }, [location.pathname, location.search, locale])

  return null
}
