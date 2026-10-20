import { useCallback, useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  fetchFunnelMetrics,
  fetchCustomerJourneys,
  fetchSessionJourneyTimeline,
  type FunnelMetrics,
  type CustomerJourneySession,
  type SessionJourneyDetails,
} from '../../services/adminAnalyticsApi'

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${Math.max(1, sec)}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const remSec = seconds % 60
  if (mins < 60) return `${mins}m ${remSec}s`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m`
}

function formatEgp(val: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(val || 0)
}

const STAGE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  converted: {
    label: 'Order Placed',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  abandoned_checkout: {
    label: 'Abandoned Checkout',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  abandoned_cart: {
    label: 'Abandoned Cart',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  product_interest: {
    label: 'Product Viewed',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  browsing: {
    label: 'Browsing Store',
    badgeClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  },
}

export function JourneysTab() {
  const [range, setRange] = useState<'today' | '7d' | '30d' | '90d'>('7d')
  const [stageFilter, setStageFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [excludeAdmin, setExcludeAdmin] = useState(true)

  const [funnel, setFunnel] = useState<FunnelMetrics | null>(null)
  const [sessions, setSessions] = useState<CustomerJourneySession[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Journey details modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [timelineDetails, setTimelineDetails] = useState<SessionJourneyDetails | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)

  const loadFunnel = useCallback(async () => {
    try {
      const data = await fetchFunnelMetrics(range, excludeAdmin)
      setFunnel(data)
    } catch {
      // ignore
    }
  }, [range, excludeAdmin])

  const loadSessions = useCallback(
    async (currentPage = page) => {
      try {
        setSessionsLoading(true)
        setError(null)
        const res = await fetchCustomerJourneys({
          page: currentPage,
          limit: 20,
          range,
          stage: stageFilter,
          type: typeFilter,
          search,
          excludeAdmin,
        })
        setSessions(res.items)
        setPagination(res.pagination)
        setPage(currentPage)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load journeys')
      } finally {
        setSessionsLoading(false)
      }
    },
    [page, range, stageFilter, typeFilter, search, excludeAdmin]
  )

  useEffect(() => {
    setLoading(true)
    Promise.all([loadFunnel(), loadSessions(1)]).finally(() => setLoading(false))
  }, [loadFunnel, loadSessions])

  const openSessionTimeline = async (sessionId: string) => {
    try {
      setSelectedSessionId(sessionId)
      setTimelineLoading(true)
      const data = await fetchSessionJourneyTimeline(sessionId)
      setTimelineDetails(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load timeline')
      setSelectedSessionId(null)
    } finally {
      setTimelineLoading(false)
    }
  }

  const closeTimeline = () => {
    setSelectedSessionId(null)
    setTimelineDetails(null)
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-scnt-text">Buying Funnel & Customer Journeys</h2>
          <p className="mt-1 text-xs text-scnt-text-muted">
            Track where each account and guest reached in their buying session, active carts, and drop-off points.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range Picker */}
          <div className="flex rounded-lg border border-scnt-border/60 bg-scnt-bg-elevated/40 p-1 text-xs">
            {(['today', '7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded px-3 py-1 font-medium transition-colors ${
                  range === r
                    ? 'bg-scnt-text text-scnt-bg'
                    : 'text-scnt-text-muted hover:text-scnt-text'
                }`}
              >
                {r === 'today' ? 'Today' : r}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-scnt-border/60 bg-scnt-bg-elevated/40 px-3 py-1.5 text-xs text-scnt-text-muted">
            <input
              type="checkbox"
              checked={excludeAdmin}
              onChange={(e) => setExcludeAdmin(e.target.checked)}
              className="accent-scnt-text"
            />
            Exclude Admin
          </label>
        </div>
      </div>

      {/* Visual Funnel Progression Pipeline */}
      {funnel ? (
        <Card asMotion={false} className="p-5">
          <div className="flex items-center justify-between border-b border-scnt-border/40 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                Buying Funnel Conversion ({range})
              </span>
              <p className="mt-0.5 text-xs text-scnt-text-muted/80">
                Overall Store Conversion Rate:{' '}
                <span className="font-bold text-emerald-400">{funnel.conversionRate}%</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-scnt-text-muted">Verified Revenue</span>
              <p className="text-sm font-semibold text-scnt-text">{formatEgp(funnel.totalRevenue)}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {funnel.stages.map((stg, idx) => (
              <div
                key={stg.id}
                className="relative rounded-xl border border-scnt-border/60 bg-scnt-bg/50 p-4 transition-all hover:border-scnt-border"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-scnt-text-muted">
                    Step {idx + 1}
                  </span>
                  <span className="rounded-full bg-scnt-bg-elevated/80 px-2 py-0.5 text-[10px] font-semibold text-scnt-text">
                    {stg.percentageOfTotal}%
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-scnt-text">{stg.name}</h3>
                <p className="mt-1 font-mono text-2xl font-bold text-scnt-text">
                  {new Intl.NumberFormat('en-US').format(stg.count)}
                </p>

                {stg.dropOffCount > 0 ? (
                  <div className="mt-3 flex items-center justify-between border-t border-scnt-border/40 pt-2 text-[11px]">
                    <span className="text-rose-400/90">
                      -{stg.dropOffRate}% drop-off
                    </span>
                    <span className="text-scnt-text-muted">
                      ({stg.dropOffCount} dropped)
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-scnt-border/40 pt-2 text-[11px] text-emerald-400">
                    Final Goal Reached
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Filter & Search Bar */}
      <Card asMotion={false} className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-[11px] font-medium text-scnt-text-muted">Funnel Stage</label>
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value)
                setPage(1)
              }}
              className="mt-1 w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-xs text-scnt-text outline-none"
            >
              <option value="all">All Stages</option>
              <option value="converted">Order Placed (Converted)</option>
              <option value="abandoned_checkout">Abandoned Checkout</option>
              <option value="abandoned_cart">Abandoned Cart (Has Items)</option>
              <option value="product_interest">Product Viewed (No Cart)</option>
              <option value="browsing">Browsing Store</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-scnt-text-muted">Account Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="mt-1 w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-xs text-scnt-text outline-none"
            >
              <option value="all">All Customers & Guests</option>
              <option value="registered">Registered Accounts Only</option>
              <option value="guest">Guest Visitors Only</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-medium text-scnt-text-muted">Search</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                placeholder="Search by name, email, phone, or visitor ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1)
                    void loadSessions(1)
                  }
                }}
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-xs text-scnt-text placeholder:text-scnt-text-muted/60 outline-none"
              />
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => {
                  setPage(1)
                  void loadSessions(1)
                }}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Sessions Table */}
      <Card asMotion={false} className="overflow-hidden p-0">
        <div className="border-b border-scnt-border/60 px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
            Customer Sessions ({pagination.total})
          </span>
          {sessionsLoading ? (
            <span className="text-xs text-scnt-text-muted animate-pulse">Loading sessions...</span>
          ) : null}
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-rose-400">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-scnt-text-muted">
            {loading ? 'Loading sessions...' : 'No customer sessions match the selected filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-scnt-border/40 bg-scnt-bg-elevated/40 text-scnt-text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">Customer / Visitor</th>
                  <th className="py-3 px-4 font-medium">Device & IP</th>
                  <th className="py-3 px-4 font-medium">Buying Stage</th>
                  <th className="py-3 px-4 font-medium">Cart Status</th>
                  <th className="py-3 px-4 font-medium">Coupon</th>
                  <th className="py-3 px-4 font-medium">Last Active</th>
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scnt-border/30 text-scnt-text">
                {sessions.map((sess) => {
                  const stageMeta = STAGE_LABELS[sess.outcomeStatus] || {
                    label: sess.outcomeStatus,
                    badgeClass: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
                  }

                  return (
                    <tr key={sess.sessionId} className="hover:bg-scnt-bg-elevated/25 transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        {sess.user ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-scnt-text">{sess.user.fullName}</span>
                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                                Account
                              </span>
                            </div>
                            <p className="text-[11px] text-scnt-text-muted">{sess.user.email}</p>
                            {sess.user.phone ? (
                              <p className="text-[10px] text-scnt-text-muted/70">{sess.user.phone}</p>
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-scnt-text font-medium">
                                Guest #{sess.visitorId.slice(0, 8)}
                              </span>
                              <span className="rounded bg-zinc-500/10 px-1.5 py-0.5 text-[10px] text-zinc-400 border border-zinc-500/20">
                                Guest
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-scnt-text-muted/70">
                              vid: {sess.visitorId.slice(0, 18)}...
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Device & IP */}
                      <td className="py-3.5 px-4">
                        <p className="capitalize text-scnt-text">
                          {sess.device} · {sess.browser}
                        </p>
                        <p className="text-[11px] text-scnt-text-muted">{sess.os}</p>
                        {sess.ip ? (
                          <p className="text-[10px] font-mono text-scnt-text-muted/70">{sess.ip}</p>
                        ) : null}
                      </td>

                      {/* Funnel Stage Reached */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-medium ${stageMeta.badgeClass}`}
                        >
                          {stageMeta.label}
                        </span>
                        <p className="mt-1 text-[10px] text-scnt-text-muted">
                          {sess.eventCount} actions ({formatDuration(sess.durationSeconds)})
                        </p>
                      </td>

                      {/* Cart Status */}
                      <td className="py-3.5 px-4">
                        {sess.cart.hasItems ? (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-300 border border-sky-500/30">
                            🛒 {sess.cart.itemCount} items
                          </span>
                        ) : (
                          <span className="text-scnt-text-muted text-[11px]">Empty</span>
                        )}
                      </td>

                      {/* Coupon */}
                      <td className="py-3.5 px-4">
                        {sess.cart.promoCode ? (
                          <span className="inline-block rounded bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-semibold text-amber-300 border border-amber-500/30">
                            🏷️ {sess.cart.promoCode}
                          </span>
                        ) : (
                          <span className="text-scnt-text-muted text-[11px]">—</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 text-scnt-text-muted whitespace-nowrap">
                        <p className="text-xs text-scnt-text">{timeAgo(sess.lastActiveAt)}</p>
                        <p className="text-[10px] text-scnt-text-muted/70">
                          {new Date(sess.lastActiveAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          className="text-xs py-1 px-2.5"
                          onClick={() => openSessionTimeline(sess.sessionId)}
                        >
                          View Journey
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 ? (
          <div className="flex items-center justify-between border-t border-scnt-border/40 px-5 py-3 text-xs text-scnt-text-muted">
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total} sessions)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-xs py-1 px-3"
                disabled={page <= 1 || sessionsLoading}
                onClick={() => loadSessions(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="text-xs py-1 px-3"
                disabled={page >= pagination.pages || sessionsLoading}
                onClick={() => loadSessions(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Modal: Interactive Session Journey Timeline */}
      {selectedSessionId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-scnt-border bg-scnt-bg p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-scnt-border/40 pb-4">
              <div>
                <h3 className="font-serif text-xl text-scnt-text">Customer Journey Timeline</h3>
                <p className="mt-0.5 text-xs text-scnt-text-muted">
                  Session ID: <span className="font-mono">{selectedSessionId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeTimeline}
                className="rounded-lg p-2 text-scnt-text-muted hover:bg-scnt-bg-elevated hover:text-scnt-text"
              >
                ✕
              </button>
            </div>

            {timelineLoading || !timelineDetails ? (
              <div className="py-12 text-center text-sm text-scnt-text-muted">
                Loading session timeline...
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {/* Session Meta Card */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-scnt-border/50 bg-scnt-bg-elevated/30 p-3.5 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-scnt-text-muted">Identity:</span>
                    <p className="font-semibold text-scnt-text">
                      {timelineDetails.user?.full_name || `Guest (${timelineDetails.visitorId.slice(0, 8)})`}
                    </p>
                  </div>
                  <div>
                    <span className="text-scnt-text-muted">Device:</span>
                    <p className="font-semibold text-scnt-text capitalize">
                      {timelineDetails.device} · {timelineDetails.browser}
                    </p>
                  </div>
                  <div>
                    <span className="text-scnt-text-muted">IP Address:</span>
                    <p className="font-mono text-scnt-text">{timelineDetails.ip || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-scnt-text-muted">Events:</span>
                    <p className="font-semibold text-scnt-text">{timelineDetails.totalEvents} actions</p>
                  </div>
                </div>

                {/* Timeline list */}
                <div className="relative border-l border-scnt-border/60 pl-6 space-y-6">
                  {timelineDetails.timeline.map((step, idx) => {
                    let dotColor = 'bg-zinc-500'
                    if (step.action === 'order_placed' || step.stage === 'order_placed')
                      dotColor = 'bg-emerald-400 ring-4 ring-emerald-500/20'
                    else if (step.action === 'checkout_start' || step.stage === 'checkout_start')
                      dotColor = 'bg-amber-400 ring-4 ring-amber-500/20'
                    else if (step.action === 'add_to_cart' || step.stage === 'cart_view')
                      dotColor = 'bg-sky-400 ring-4 ring-sky-500/20'
                    else if (step.stage === 'product_view')
                      dotColor = 'bg-purple-400 ring-4 ring-purple-500/20'

                    return (
                      <div key={step._id || idx} className="relative">
                        {/* Dot */}
                        <div
                          className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ${dotColor}`}
                        />

                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-xs font-semibold text-scnt-text">
                            {step.actionLabel}
                          </span>
                          <span className="text-[11px] text-scnt-text-muted">
                            {new Date(step.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-scnt-text-muted">
                          {step.title && step.title !== step.path ? (
                            <span>{step.title} · </span>
                          ) : null}
                          <span className="font-mono text-[11px] text-scnt-text-muted/80">
                            {step.path}
                          </span>
                        </p>

                        {/* Metadata if present */}
                        {step.metadata && Object.keys(step.metadata).length > 0 ? (
                          <div className="mt-2 rounded-lg border border-scnt-border/40 bg-scnt-bg-elevated/20 p-2 text-[11px] font-mono text-scnt-text-muted">
                            {Object.entries(step.metadata).map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <span className="text-scnt-text-muted/70">{k}:</span>
                                <span className="text-scnt-text font-medium">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end border-t border-scnt-border/40 pt-4">
              <Button variant="outline" onClick={closeTimeline} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
