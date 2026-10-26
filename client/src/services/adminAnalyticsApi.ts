import { apiDeleteDataAuthed, apiGetDataAuthed, apiPostDataAuthed, API_BASE } from './api'
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

export type RealtimeVisitsEnvelope = {
  items: RealtimeVisit[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export type RealtimeVisitsParams = {
  page?: number
  limit?: number
  excludeAdmin?: boolean
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
  stage?: 'browse' | 'product_view' | 'cart_view' | 'checkout_start' | 'order_placed'
  action?: string
  metadata?: Record<string, unknown>
}

export type FunnelStage = {
  id: string
  name: string
  count: number
  percentageOfTotal: number
  dropOffCount: number
  dropOffRate: number
}

export type FunnelMetrics = {
  stages: FunnelStage[]
  conversionRate: number
  totalVisitors: number
  totalOrders: number
  totalRevenue: number
  range: string
}

export type CustomerJourneySession = {
  sessionId: string
  visitorId: string
  isGuest: boolean
  user: {
    _id: string
    fullName: string
    email: string
    phone?: string
    city?: string
  } | null
  device: string
  browser: string
  os: string
  ip?: string
  highestStage: 'browse' | 'product_view' | 'cart_view' | 'checkout_start' | 'order_placed'
  outcomeStatus: 'converted' | 'abandoned_checkout' | 'abandoned_cart' | 'product_interest' | 'browsing'
  cart: {
    hasItems: boolean
    itemCount: number
    promoCode: string
  }
  startedAt: string
  lastActiveAt: string
  durationSeconds: number
  eventCount: number
}

export type CustomerJourneysResponse = {
  items: CustomerJourneySession[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export type CustomerJourneysParams = {
  page?: number
  limit?: number
  range?: string
  stage?: string
  type?: string
  search?: string
  excludeAdmin?: boolean
}

export type TimelineStep = {
  _id: string
  timestamp: string
  stage: string
  action: string
  actionLabel: string
  path: string
  title: string
  metadata: Record<string, unknown>
}

export type SessionJourneyDetails = {
  sessionId: string
  visitorId: string
  user?: { _id: string; full_name?: string; email?: string }
  device: string
  browser: string
  os: string
  ip?: string
  startedAt: string
  lastActiveAt: string
  totalEvents: number
  timeline: TimelineStep[]
}

export type AdminCartLine = {
  productId: string
  name: string
  slug?: string
  size?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  image?: string
  stock: number
}

export type OrderProgressStep = {
  id: string
  label: string
  status: 'completed' | 'partial' | 'missing' | 'skipped'
  detail: string
}

export type MissingOrderField = {
  field: string
  severity: 'critical' | 'high' | 'medium'
  message: string
}

export type OrderProgress = {
  stageKey: string
  stageLabel: string
  stageProgress: number
  hasVisitedCheckout: boolean
  contactInfo: {
    fullName: string
    phone: string
    email: string
    governorate: string
    city: string
    address: string
  }
  steps: OrderProgressStep[]
  missingFields: MissingOrderField[]
  recentVisits: Array<{
    path: string
    stage: string
    action: string
    time: string
  }>
}

export type AdminCartItem = {
  _id: string
  isGuest: boolean
  user: {
    _id?: string | null
    fullName: string
    email: string
    phone?: string
    city?: string
    isRegistered?: boolean
    isCapturedLead?: boolean
  } | null
  contact?: {
    fullName?: string
    phone?: string
    email?: string
    governorate?: string
    city?: string
    address?: string
  } | null
  visitorId?: string
  visitorMeta?: {
    device?: string
    browser?: string
    os?: string
    ip?: string
    referrerDomain?: string
  }
  items: AdminCartLine[]
  itemCount: number
  subtotal: number
  discount?: number
  total?: number
  promoCode: string
  recoverySentAt?: string | null
  recoveryCount?: number
  lastActiveAt: string
  isAbandoned: boolean
  orderProgress?: OrderProgress
}

export type ActiveCartsResponse = {
  carts: AdminCartItem[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export type ActiveCartsParams = {
  status?: string
  type?: string
  search?: string
  page?: number
  limit?: number
}

export type CouponRedemption = {
  orderId: string
  orderRef: string
  orderDate: string
  orderTotal: number
  discountAmount: number
  orderStatus: string
  customer: {
    _id?: string
    fullName: string
    email: string
    phone?: string
  }
}

export type CouponHolder = {
  cartId: string
  isGuest: boolean
  customerName: string
  customerEmail: string
  visitorId?: string
  itemCount: number
  lastActiveAt: string
}

export type CouponPerformance = {
  _id: string
  code: string
  discountType: 'PERCENTAGE' | 'FIXED' | 'CUSTOM'
  discountValue: number
  discountScope?: 'CERTAIN_PRODUCTS' | 'WHOLE_CART'
  applicableSizes?: string[]
  minSubtotal: number
  maxDiscount: number | null
  isActive: boolean
  startsAt?: string | null
  expiresAt?: string | null
  applicableProducts?: Array<{
    product: string | { _id: string; name: string; price?: number; slug?: string }
    maxCount?: number | null
    sizes?: string[]
  }>
  totalRedemptions: number
  totalRevenueDriven: number
  totalDiscountGiven: number
  activeCartsCount: number
  redemptions: CouponRedemption[]
  activeCartHolders: CouponHolder[]
}

export type CouponAnalyticsResponse = {
  summary: {
    totalCoupons: number
    totalRedemptions: number
    totalRevenueDriven: number
    totalDiscountGiven: number
    totalActiveCartHolders: number
  }
  coupons: CouponPerformance[]
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
 * Admin: Fetch real-time recent visits with pagination
 */
export async function fetchRealtimeVisits(
  paramsOrExcludeAdmin: boolean | RealtimeVisitsParams = true
): Promise<RealtimeVisitsEnvelope> {
  let page = 1
  let limit = 20
  let excludeAdmin = true

  if (typeof paramsOrExcludeAdmin === 'boolean') {
    excludeAdmin = paramsOrExcludeAdmin
  } else if (paramsOrExcludeAdmin && typeof paramsOrExcludeAdmin === 'object') {
    if (paramsOrExcludeAdmin.page !== undefined) page = paramsOrExcludeAdmin.page
    if (paramsOrExcludeAdmin.limit !== undefined) limit = paramsOrExcludeAdmin.limit
    if (paramsOrExcludeAdmin.excludeAdmin !== undefined) excludeAdmin = paramsOrExcludeAdmin.excludeAdmin
  }

  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('limit', String(limit))
  query.set('excludeAdmin', String(excludeAdmin))

  const raw = await apiGetDataAuthed<RealtimeVisitsEnvelope | RealtimeVisit[]>(
    `/admin/analytics/realtime?${query.toString()}`
  )

  if (Array.isArray(raw)) {
    return {
      items: raw,
      pagination: {
        total: raw.length,
        page: 1,
        pages: 1,
        limit: raw.length,
      },
    }
  }

  return raw
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

/**
 * Admin: Fetch Funnel Metrics & Conversion Rates
 */
export function fetchFunnelMetrics(range = '7d', excludeAdmin = true): Promise<FunnelMetrics> {
  const query = new URLSearchParams({
    range,
    excludeAdmin: String(excludeAdmin),
  })
  return apiGetDataAuthed<FunnelMetrics>(`/admin/analytics/funnel?${query.toString()}`)
}

/**
 * Admin: Fetch Customer & Guest Journeys with Stage Progress
 */
export function fetchCustomerJourneys(params: CustomerJourneysParams = {}): Promise<CustomerJourneysResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.range) query.set('range', params.range)
  if (params.stage && params.stage !== 'all') query.set('stage', params.stage)
  if (params.type && params.type !== 'all') query.set('type', params.type)
  if (params.search) query.set('search', params.search)
  if (params.excludeAdmin !== undefined) query.set('excludeAdmin', String(params.excludeAdmin))

  return apiGetDataAuthed<CustomerJourneysResponse>(`/admin/analytics/journeys?${query.toString()}`)
}

/**
 * Admin: Fetch Chronological Timeline Breadcrumbs for a Session
 */
export function fetchSessionJourneyTimeline(sessionId: string): Promise<SessionJourneyDetails> {
  return apiGetDataAuthed<SessionJourneyDetails>(`/admin/analytics/journeys/${encodeURIComponent(sessionId)}`)
}

/**
 * Admin: Fetch All Active & Abandoned Carts with Products
 */
export function fetchActiveCarts(params: ActiveCartsParams = {}): Promise<ActiveCartsResponse> {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.type && params.type !== 'all') query.set('type', params.type)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))

  return apiGetDataAuthed<ActiveCartsResponse>(`/admin/analytics/carts?${query.toString()}`)
}

/**
 * Admin: Trigger luxury abandoned cart recovery email to customer
 */
export function sendCartRecoveryEmail(cartId: string): Promise<{ success: boolean; email: string }> {
  return apiPostDataAuthed<{ success: boolean; email: string }>(
    `/admin/analytics/carts/${encodeURIComponent(cartId)}/recovery-email`,
    {}
  )
}

/**
 * Admin: Fetch Comprehensive Coupon Analytics, Revenue & Customer Redemptions
 */
export function fetchCouponAnalytics(): Promise<CouponAnalyticsResponse> {
  return apiGetDataAuthed<CouponAnalyticsResponse>('/admin/analytics/coupons')
}

