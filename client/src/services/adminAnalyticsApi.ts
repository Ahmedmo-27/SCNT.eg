import { apiDeleteDataAuthed, apiGetDataAuthed, API_BASE } from './api'
import { getStoredAuthToken } from '../lib/authStorage'


export type AnalyticsOverview = {
  totalPageviews: number
  uniqueVisitors: number
  todayPageviews: number
  todayUniqueVisitors: number
  yesterdayPageviews: number
  yesterdayUniqueVisitors: number
  activeNow: number
  avgPagesPerSession: number
  growth: {
    pageviewsGrowth: number
    visitorsGrowth: number
  }
  range: string
}

export type TrendPoint = {
  date: string
  pageviews: number
  uniqueVisitors: number
}

export type TopPage = {
  path: string
  title?: string
  pageviews: number
  uniqueVisitors: number
  lastVisited: string
}

export type TopReferrer = {
  domain: string
  visits: number
  uniqueVisitors: number
}

export type BreakdownItem = {
  name: string
  count: number
}

export type DeviceBreakdown = {
  devices: BreakdownItem[]
  browsers: BreakdownItem[]
  os: BreakdownItem[]
}

export type RealtimeVisit = {
  _id: string
  path: string
  title?: string
  device: 'mobile' | 'tablet' | 'desktop'
  browser: string
  os: string
  ip?: string
  visitorId: string
  userId?: { _id: string; full_name?: string; email?: string }
  isAdmin?: boolean
  createdAt: string
}

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'audit'

export type LogEntry = {
  _id: string
  level: LogLevel
  message: string
  context: string
  reqId?: string
  method?: string
  url?: string
  statusCode?: number
  responseTime?: number
  ip?: string
  userId?: {
    _id: string
    full_name?: string
    email?: string
    role?: string
  }
  metadata?: Record<string, unknown>
  createdAt: string
}

export type LogStats = {
  errorsToday: number
  warningsToday: number
  auditToday: number
  totalLogs: number
}

export type LogsEnvelope = {
  items: LogEntry[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export type TrackVisitPayload = {
  visitorId: string
  sessionId: string
  path: string
  title?: string
  referrer?: string
  screenResolution?: string
  locale?: string
}

/**
 * Public client visit tracking beacon / POST
 */
export async function trackClientVisit(payload: TrackVisitPayload): Promise<void> {
  try {
    const token = getStoredAuthToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    await fetch(`${API_BASE}/analytics/visit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // Fail silently on analytics send
  }
}

/**
 * Admin: Fetch overview analytics
 */
export function fetchAnalyticsOverview(range = '7d', excludeAdmin = true): Promise<AnalyticsOverview> {
  return apiGetDataAuthed<AnalyticsOverview>(
    `/admin/analytics/overview?range=${encodeURIComponent(range)}&excludeAdmin=${excludeAdmin}`
  )
}

/**
 * Admin: Fetch trend timeline
 */
export function fetchAnalyticsTrend(range = '7d', excludeAdmin = true): Promise<TrendPoint[]> {
  return apiGetDataAuthed<TrendPoint[]>(
    `/admin/analytics/trend?range=${encodeURIComponent(range)}&excludeAdmin=${excludeAdmin}`
  )
}

/**
 * Admin: Fetch top visited pages
 */
export function fetchTopPages(range = '7d', excludeAdmin = true): Promise<TopPage[]> {
  return apiGetDataAuthed<TopPage[]>(
    `/admin/analytics/top-pages?range=${encodeURIComponent(range)}&excludeAdmin=${excludeAdmin}`
  )
}

/**
 * Admin: Fetch top referrers
 */
export function fetchTopReferrers(range = '7d', excludeAdmin = true): Promise<TopReferrer[]> {
  return apiGetDataAuthed<TopReferrer[]>(
    `/admin/analytics/referrers?range=${encodeURIComponent(range)}&excludeAdmin=${excludeAdmin}`
  )
}

/**
 * Admin: Fetch device & browser breakdown
 */
export function fetchDeviceBreakdown(range = '7d', excludeAdmin = true): Promise<DeviceBreakdown> {
  return apiGetDataAuthed<DeviceBreakdown>(
    `/admin/analytics/devices?range=${encodeURIComponent(range)}&excludeAdmin=${excludeAdmin}`
  )
}

/**
 * Admin: Fetch real-time recent visits
 */
export function fetchRealtimeVisits(excludeAdmin = true): Promise<RealtimeVisit[]> {
  return apiGetDataAuthed<RealtimeVisit[]>(
    `/admin/analytics/realtime?excludeAdmin=${excludeAdmin}`
  )
}

/**
 * Admin: Fetch logs
 */
export function fetchAdminLogs(params: {
  page?: number
  limit?: number
  level?: string
  context?: string
  search?: string
}): Promise<LogsEnvelope> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.level && params.level !== 'all') query.set('level', params.level)
  if (params.context && params.context !== 'all') query.set('context', params.context)
  if (params.search) query.set('search', params.search)

  return apiGetDataAuthed<LogsEnvelope>(`/admin/logs?${query.toString()}`)
}

/**
 * Admin: Fetch log summary counters
 */
export function fetchAdminLogStats(): Promise<LogStats> {
  return apiGetDataAuthed<LogStats>('/admin/logs/stats')
}

/**
 * Admin: Export logs as JSON file download
 */
export async function downloadAdminLogsExport(level?: string, context?: string): Promise<void> {
  const token = getStoredAuthToken()
  if (!token) throw new Error('Not signed in')

  const query = new URLSearchParams()
  if (level && level !== 'all') query.set('level', level)
  if (context && context !== 'all') query.set('context', context)

  const res = await fetch(`${API_BASE}/admin/logs/export?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Failed to export logs')

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scnt-system-logs-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  a.remove()
}

/**
 * Admin: Clear older logs
 */
export function clearOldLogs(olderThanDays: number): Promise<{ deletedCount: number }> {
  return apiDeleteDataAuthed<{ deletedCount: number }>(`/admin/logs/clear?olderThanDays=${olderThanDays}`)
}

