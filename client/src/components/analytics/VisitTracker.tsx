import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackClientVisit } from '../../services/adminAnalyticsApi'
import { useI18n } from '../../i18n/I18nContext'

function getOrCreateVisitorId(): string {
  try {
    const key = 'scnt_vid'
    let vid = localStorage.getItem(key)
    if (!vid) {
      vid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `vid_${Math.random().toString(36).slice(2)}_${Date.now()}`
      localStorage.setItem(key, vid)
    }
    return vid
  } catch {
    return 'anonymous_visitor'
  }
}

function getOrCreateSessionId(): string {
  try {
    const key = 'scnt_sid'
    let sid = sessionStorage.getItem(key)
    if (!sid) {
      sid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sid_${Math.random().toString(36).slice(2)}_${Date.now()}`
      sessionStorage.setItem(key, sid)
    }
    return sid
  } catch {
    return 'anonymous_session'
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
      })
    }, 150)

    return () => clearTimeout(timer)
  }, [location.pathname, location.search, locale])

  return null
}
