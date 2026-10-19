import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  fetchAnalyticsOverview,
  fetchAnalyticsTrend,
  fetchTopPages,
  fetchTopReferrers,
  fetchDeviceBreakdown,
  fetchRealtimeVisits,
  type AnalyticsOverview,
  type TrendPoint,
  type TopPage,
  type TopReferrer,
  type DeviceBreakdown,
  type RealtimeVisit,
} from '../../services/adminAnalyticsApi'

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num || 0)
}

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

export function AnalyticsTab() {
  const [range, setRange] = useState<'today' | '7d' | '30d' | '90d'>('7d')
  const [excludeAdmin, setExcludeAdmin] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [referrers, setReferrers] = useState<TopReferrer[]>([])
  const [devices, setDevices] = useState<DeviceBreakdown | null>(null)
  const [realtime, setRealtime] = useState<RealtimeVisit[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null)

  const loadAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const [ovData, trendData, pagesData, refData, devData, rtData] = await Promise.all([
        fetchAnalyticsOverview(range, excludeAdmin),
        fetchAnalyticsTrend(range, excludeAdmin),
        fetchTopPages(range, excludeAdmin),
        fetchTopReferrers(range, excludeAdmin),
        fetchDeviceBreakdown(range, excludeAdmin),
        fetchRealtimeVisits(excludeAdmin),
      ])

      setOverview(ovData)
      setTrend(trendData)
      setTopPages(pagesData)
      setReferrers(refData)
      setDevices(devData)
      setRealtime(rtData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [range, excludeAdmin])

  // Periodic polling for real-time visits
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeVisits(excludeAdmin).then(setRealtime).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [excludeAdmin])

  // Trend chart calculations
  const maxPageviews = Math.max(...trend.map((p) => p.pageviews), 10)
  const chartHeight = 160
  const chartWidth = 600

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-scnt-border/80 bg-scnt-bg-elevated p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">Timeframe:</span>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                range === item.id
                  ? 'bg-scnt-text text-scnt-bg shadow-sm'
                  : 'bg-scnt-bg text-scnt-text hover:bg-scnt-bg-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-scnt-text">
            <input
              type="checkbox"
              checked={excludeAdmin}
              onChange={(e) => setExcludeAdmin(e.target.checked)}
              className="rounded border-scnt-border"
            />
            <span>Exclude Admin Visits</span>
          </label>

          <Button variant="outline" onClick={loadAll} disabled={loading} className="text-xs">
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card asMotion={false} className="p-5">
          <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Total Pageviews</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-light">{overview ? formatNumber(overview.totalPageviews) : '—'}</p>
            {overview?.growth ? (
              <span
                className={`text-xs font-medium ${
                  overview.growth.pageviewsGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {overview.growth.pageviewsGrowth >= 0 ? '+' : ''}
                {overview.growth.pageviewsGrowth}% vs yest.
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Today: {overview ? formatNumber(overview.todayPageviews) : '—'}</p>
        </Card>

        <Card asMotion={false} className="p-5">
          <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Unique Visitors</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-light">{overview ? formatNumber(overview.uniqueVisitors) : '—'}</p>
            {overview?.growth ? (
              <span
                className={`text-xs font-medium ${
                  overview.growth.visitorsGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {overview.growth.visitorsGrowth >= 0 ? '+' : ''}
                {overview.growth.visitorsGrowth}% vs yest.
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Today: {overview ? formatNumber(overview.todayUniqueVisitors) : '—'}</p>
        </Card>

        <Card asMotion={false} className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Active Now (15m)</p>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <p className="mt-2 text-3xl font-light">{overview ? overview.activeNow : '—'}</p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Browsing right now</p>
        </Card>

        <Card asMotion={false} className="p-5">
          <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Pages per Session</p>
          <p className="mt-2 text-3xl font-light">{overview ? overview.avgPagesPerSession : '—'}</p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Average engagement depth</p>
        </Card>
      </div>

      {/* Traffic Trend Chart */}
      <Card asMotion={false} className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Traffic Trend Over Time</h3>
            <p className="text-xs text-scnt-text-muted">Pageviews and unique visitors over selected timeframe</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-scnt-text"></span>
              <span>Pageviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
              <span>Unique Visitors</span>
            </div>
          </div>
        </div>

        {trend.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-xs text-scnt-text-muted">
            {loading ? 'Loading chart data...' : 'No visit data recorded yet in this timeframe'}
          </div>
        ) : (
          <div className="relative">
            {hoveredPoint ? (
              <div className="absolute top-0 right-0 rounded-lg border border-scnt-border/80 bg-scnt-bg-elevated px-3 py-1.5 text-xs shadow-sm">
                <span className="font-semibold text-scnt-text">{hoveredPoint.date}</span>: {hoveredPoint.pageviews} views, {hoveredPoint.uniqueVisitors} visitors
              </div>
            ) : null}

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-44 w-full overflow-visible">
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - ratio * (chartHeight - 20) - 10
                return (
                  <line
                    key={ratio}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="currentColor"
                    className="text-scnt-border/40"
                    strokeDasharray="3 3"
                  />
                )
              })}

              {/* Pageviews Line & Area */}
              {trend.length > 1 ? (
                <>
                  <path
                    d={`M 0,${chartHeight - 10} ` + trend
                      .map((p, i) => {
                        const x = (i / (trend.length - 1)) * chartWidth
                        const y = chartHeight - (p.pageviews / maxPageviews) * (chartHeight - 20) - 10
                        return `L ${x},${y}`
                      })
                      .join(' ') + ` L ${chartWidth},${chartHeight - 10} Z`}
                    fill="currentColor"
                    className="text-scnt-text/10"
                  />
                  <path
                    d={trend
                      .map((p, i) => {
                        const x = (i / (trend.length - 1)) * chartWidth
                        const y = chartHeight - (p.pageviews / maxPageviews) * (chartHeight - 20) - 10
                        return `${i === 0 ? 'M' : 'L'} ${x},${y}`
                      })
                      .join(' ')}
                    fill="none"
                    stroke="currentColor"
                    className="text-scnt-text"
                    strokeWidth={2}
                  />

                  {/* Unique Visitors Line */}
                  <path
                    d={trend
                      .map((p, i) => {
                        const x = (i / (trend.length - 1)) * chartWidth
                        const y = chartHeight - (p.uniqueVisitors / maxPageviews) * (chartHeight - 20) - 10
                        return `${i === 0 ? 'M' : 'L'} ${x},${y}`
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#059669"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                </>
              ) : null}

              {/* Interactive Hover Dots */}
              {trend.map((p, i) => {
                const x = trend.length > 1 ? (i / (trend.length - 1)) * chartWidth : chartWidth / 2
                const y = chartHeight - (p.pageviews / maxPageviews) * (chartHeight - 20) - 10
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={hoveredPoint === p ? 5 : 3}
                    className="cursor-pointer fill-scnt-text transition-all"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                )
              })}
            </svg>

            {/* X-axis labels */}
            <div className="mt-2 flex justify-between text-[10px] text-scnt-text-muted">
              <span>{trend[0]?.date || ''}</span>
              {trend.length > 2 ? <span>{trend[Math.floor(trend.length / 2)]?.date || ''}</span> : null}
              <span>{trend[trend.length - 1]?.date || ''}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Breakdown: Top Pages & Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Visited Pages */}
        <Card asMotion={false} className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Top Visited Pages</h3>
          <p className="mb-4 text-xs text-scnt-text-muted">Most popular URLs across the platform</p>

          {topPages.length === 0 ? (
            <p className="py-8 text-center text-xs text-scnt-text-muted">No pageviews recorded yet</p>
          ) : (
            <div className="space-y-3">
              {topPages.slice(0, 10).map((page, i) => {
                const total = overview?.totalPageviews || 1
                const pct = Math.min(100, Math.round((page.pageviews / total) * 100))
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-scnt-text truncate max-w-[260px]">{page.path}</span>
                      <span className="text-scnt-text-muted font-medium">
                        {formatNumber(page.pageviews)} views <span className="text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-scnt-bg-muted">
                      <div className="h-full rounded-full bg-scnt-text/70" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Traffic Sources & Referrers */}
        <Card asMotion={false} className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Traffic Sources / Referrers</h3>
          <p className="mb-4 text-xs text-scnt-text-muted">Where your visitors are arriving from</p>

          {referrers.length === 0 ? (
            <p className="py-8 text-center text-xs text-scnt-text-muted">No referrer data recorded yet</p>
          ) : (
            <div className="space-y-3">
              {referrers.slice(0, 10).map((ref, i) => {
                const total = overview?.totalPageviews || 1
                const pct = Math.min(100, Math.round((ref.visits / total) * 100))
                const domainLabel = ref.domain === 'direct' ? 'Direct / Bookmarks' : ref.domain === 'internal' ? 'Internal Navigation' : ref.domain

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-scnt-text">{domainLabel}</span>
                      <span className="text-scnt-text-muted font-medium">
                        {formatNumber(ref.visits)} visits <span className="text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-scnt-bg-muted">
                      <div className="h-full rounded-full bg-emerald-600/70" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Tech & Device Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card asMotion={false} className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Devices</h3>
          <p className="mb-3 text-xs text-scnt-text-muted">Screen type distribution</p>
          {devices?.devices?.length ? (
            <div className="space-y-2">
              {devices.devices.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{d.name}</span>
                  <span className="font-mono font-medium">{formatNumber(d.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-scnt-text-muted">No device data</p>
          )}
        </Card>

        <Card asMotion={false} className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Top Browsers</h3>
          <p className="mb-3 text-xs text-scnt-text-muted">Visitor browser software</p>
          {devices?.browsers?.length ? (
            <div className="space-y-2">
              {devices.browsers.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>{b.name}</span>
                  <span className="font-mono font-medium">{formatNumber(b.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-scnt-text-muted">No browser data</p>
          )}
        </Card>

        <Card asMotion={false} className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Operating Systems</h3>
          <p className="mb-3 text-xs text-scnt-text-muted">Platform environment</p>
          {devices?.os?.length ? (
            <div className="space-y-2">
              {devices.os.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>{o.name}</span>
                  <span className="font-mono font-medium">{formatNumber(o.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-scnt-text-muted">No OS data</p>
          )}
        </Card>
      </div>

      {/* Real-time Live Visitors Feed */}
      <Card asMotion={false} className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Real-Time Visits Feed</h3>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                Live (Updates every 15s)
              </span>
            </div>
            <p className="text-xs text-scnt-text-muted">Latest 50 route transitions across the store</p>
          </div>
        </div>

        {realtime.length === 0 ? (
          <p className="py-8 text-center text-xs text-scnt-text-muted">No live visits recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-scnt-border/60 text-scnt-text-muted">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Path</th>
                  <th className="pb-2 font-medium">Device & Browser</th>
                  <th className="pb-2 font-medium">User Status</th>
                  <th className="pb-2 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scnt-border/40">
                {realtime.map((v) => (
                  <tr key={v._id} className="hover:bg-scnt-bg-muted/30">
                    <td className="py-2.5 font-mono text-scnt-text-muted">{timeAgo(v.createdAt)}</td>
                    <td className="py-2.5 font-mono font-medium text-scnt-text">{v.path}</td>
                    <td className="py-2.5">
                      <span className="capitalize">{v.device}</span> · {v.browser} ({v.os})
                    </td>
                    <td className="py-2.5">
                      {v.userId ? (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {v.userId.full_name || v.userId.email}
                        </span>
                      ) : (
                        <span className="rounded-full bg-scnt-border px-2 py-0.5 text-[10px] text-scnt-text-muted">
                          Guest
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 font-mono text-scnt-text-muted">{v.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
