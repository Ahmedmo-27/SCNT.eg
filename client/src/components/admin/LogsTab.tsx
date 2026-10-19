import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  fetchAdminLogs,
  fetchAdminLogStats,
  downloadAdminLogsExport,
  clearOldLogs,
  type LogEntry,
  type LogLevel,
  type LogStats,
} from '../../services/adminAnalyticsApi'

function getLevelBadgeClass(level: LogLevel): string {
  switch (level) {
    case 'error':
      return 'bg-red-500/15 text-red-600 border-red-500/30'
    case 'warn':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30'
    case 'audit':
      return 'bg-purple-500/15 text-purple-700 border-purple-500/30'
    case 'http':
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
    default:
      return 'bg-blue-500/15 text-blue-700 border-blue-500/30'
  }
}

export function LogsTab() {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'audit'>('all')
  const [level, setLevel] = useState<string>('all')
  const [context, setContext] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LogStats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 50 })
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [clearing, setClearing] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadStats = async () => {
    try {
      const data = await fetchAdminLogStats()
      setStats(data)
    } catch {
      // Ignore
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const targetLevel = activeSubTab === 'audit' ? 'audit' : level
      const res = await fetchAdminLogs({
        page,
        limit: 40,
        level: targetLevel,
        context,
        search,
      })
      setLogs(res.items)
      setPagination(res.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [page, level, context, activeSubTab])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadLogs()
  }

  const handleExport = async () => {
    try {
      const targetLevel = activeSubTab === 'audit' ? 'audit' : level
      await downloadAdminLogsExport(targetLevel, context)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const handleClearOldLogs = async () => {
    const days = prompt('Enter retention cutoff in days to purge non-audit logs older than (e.g. 7 or 14):', '7')
    if (!days) return
    const numDays = parseInt(days, 10)
    if (isNaN(numDays) || numDays < 1) {
      alert('Please enter a valid positive number of days.')
      return
    }

    if (!confirm(`Are you sure you want to permanently delete non-audit logs older than ${numDays} days?`)) {
      return
    }

    try {
      setClearing(true)
      const res = await clearOldLogs(numDays)
      alert(`Successfully deleted ${res.deletedCount} old log records.`)
      loadStats()
      loadLogs()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear logs')
    } finally {
      setClearing(false)
    }
  }

  const copyMetadata = (log: LogEntry) => {
    const text = JSON.stringify(log, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card asMotion={false} className="p-5 border-l-4 border-l-red-500">
          <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Errors Today</p>
          <p className="mt-2 text-3xl font-light text-red-600">{stats ? stats.errorsToday : '—'}</p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Critical & API 5xx issues</p>
        </Card>

        <Card asMotion={false} className="p-5 border-l-4 border-l-amber-500">
          <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Warnings Today</p>
          <p className="mt-2 text-3xl font-light text-amber-600">{stats ? stats.warningsToday : '—'}</p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Slow requests & client errors</p>
        </Card>

        <Card asMotion={false} className="p-5 border-l-4 border-l-purple-500">
          <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Audit Actions Today</p>
          <p className="mt-2 text-3xl font-light text-purple-600">{stats ? stats.auditToday : '—'}</p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Admin mutation events</p>
        </Card>

        <Card asMotion={false} className="p-5 border-l-4 border-l-scnt-text">
          <p className="text-xs uppercase tracking-wider text-scnt-text-muted">Total Stored Logs</p>
          <p className="mt-2 text-3xl font-light">{stats ? stats.totalLogs : '—'}</p>
          <p className="mt-1 text-[11px] text-scnt-text-muted">Within 30-day retention window</p>
        </Card>
      </div>

      {/* Control Header & Filters */}
      <div className="space-y-4 rounded-xl border border-scnt-border/80 bg-scnt-bg-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-scnt-border/60 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveSubTab('all')
                setPage(1)
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeSubTab === 'all'
                  ? 'bg-scnt-text text-scnt-bg shadow-sm'
                  : 'bg-scnt-bg text-scnt-text hover:bg-scnt-bg-muted'
              }`}
            >
              All System Logs
            </button>
            <button
              onClick={() => {
                setActiveSubTab('audit')
                setPage(1)
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeSubTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-scnt-bg text-scnt-text hover:bg-scnt-bg-muted'
              }`}
            >
              Admin Audit Trail
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleExport} className="text-xs">
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={handleClearOldLogs}
              disabled={clearing}
              className="text-xs text-red-600 hover:bg-red-50"
            >
              {clearing ? 'Clearing...' : 'Clear Old Logs'}
            </Button>
            <Button variant="outline" onClick={loadLogs} disabled={loading} className="text-xs">
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Filter controls */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 text-xs">
          {activeSubTab === 'all' ? (
            <div className="flex items-center gap-1.5">
              <label className="text-scnt-text-muted">Level:</label>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value)
                  setPage(1)
                }}
                className="rounded-lg border border-scnt-border bg-scnt-bg px-2.5 py-1.5"
              >
                <option value="all">All Levels</option>
                <option value="error">ERROR</option>
                <option value="warn">WARN</option>
                <option value="audit">AUDIT</option>
                <option value="info">INFO</option>
                <option value="http">HTTP</option>
              </select>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5">
            <label className="text-scnt-text-muted">Context:</label>
            <select
              value={context}
              onChange={(e) => {
                setContext(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-scnt-border bg-scnt-bg px-2.5 py-1.5"
            >
              <option value="all">All Contexts</option>
              <option value="system">system</option>
              <option value="auth">auth</option>
              <option value="order">order</option>
              <option value="product">product</option>
              <option value="collection">collection</option>
              <option value="promo">promo</option>
              <option value="admin">admin</option>
              <option value="audit">audit</option>
              <option value="http">http</option>
            </select>
          </div>

          <div className="flex flex-1 items-center gap-2 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by message, path, IP, or Request ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-scnt-border bg-scnt-bg px-3 py-1.5"
            />
            <Button type="submit" className="text-xs py-1.5">
              Search
            </Button>
          </div>
        </form>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* Logs Table */}
      <Card asMotion={false} className="p-5">
        <div className="mb-4 flex items-center justify-between text-xs text-scnt-text-muted">
          <span>
            Showing {logs.length} of {pagination.total} records
          </span>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-scnt-text-muted">
            {loading ? 'Loading logs...' : 'No logs match the current filters'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-scnt-border/60 text-scnt-text-muted">
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Level</th>
                  <th className="pb-2 font-medium">Context</th>
                  <th className="pb-2 font-medium">Method / Endpoint</th>
                  <th className="pb-2 font-medium">Message</th>
                  <th className="pb-2 font-medium">Latency</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scnt-border/40 font-mono">
                {logs.map((item) => (
                  <tr key={item._id} className="hover:bg-scnt-bg-muted/30">
                    <td className="py-2.5 text-scnt-text-muted whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                      })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${getLevelBadgeClass(
                          item.level
                        )}`}
                      >
                        {item.level}
                      </span>
                    </td>
                    <td className="py-2.5 text-scnt-text font-medium">{item.context}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      {item.method ? (
                        <span className="font-semibold text-scnt-text mr-1">{item.method}</span>
                      ) : null}
                      <span className="text-scnt-text-muted truncate max-w-[200px] inline-block align-bottom">
                        {item.url || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 font-sans text-scnt-text max-w-[320px] truncate">
                      {item.message}
                    </td>
                    <td className="py-2.5 text-scnt-text-muted">
                      {item.responseTime ? `${item.responseTime}ms` : '—'}
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(item)}
                        className="rounded border border-scnt-border bg-scnt-bg px-2.5 py-1 text-[11px] font-medium text-scnt-text hover:bg-scnt-bg-muted transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination.pages > 1 ? (
          <div className="mt-4 flex items-center justify-between border-t border-scnt-border/60 pt-3 text-xs">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="py-1"
            >
              Previous
            </Button>
            <span className="text-scnt-text-muted">
              Page {page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pagination.pages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="py-1"
            >
              Next
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Log Inspection Detail Modal */}
      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-scnt-border bg-scnt-bg p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-scnt-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded border px-2.5 py-1 text-xs font-semibold uppercase ${getLevelBadgeClass(
                    selectedLog.level
                  )}`}
                >
                  {selectedLog.level}
                </span>
                <span className="font-semibold text-sm">Log Entry Details</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-scnt-text-muted hover:bg-scnt-bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-sans">
              <div className="rounded-lg border border-scnt-border/80 bg-scnt-bg-elevated p-3">
                <p className="font-semibold text-sm text-scnt-text">{selectedLog.message}</p>
                <p className="mt-1 font-mono text-[11px] text-scnt-text-muted">
                  Recorded at: {new Date(selectedLog.createdAt).toISOString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
                <div className="rounded-lg border border-scnt-border/60 p-2.5">
                  <span className="text-[10px] text-scnt-text-muted block font-sans">Context</span>
                  <span className="font-medium text-scnt-text">{selectedLog.context}</span>
                </div>
                <div className="rounded-lg border border-scnt-border/60 p-2.5">
                  <span className="text-[10px] text-scnt-text-muted block font-sans">Status Code</span>
                  <span className="font-medium text-scnt-text">{selectedLog.statusCode || 'N/A'}</span>
                </div>
                <div className="rounded-lg border border-scnt-border/60 p-2.5">
                  <span className="text-[10px] text-scnt-text-muted block font-sans">Latency</span>
                  <span className="font-medium text-scnt-text">{selectedLog.responseTime ? `${selectedLog.responseTime}ms` : 'N/A'}</span>
                </div>
                <div className="rounded-lg border border-scnt-border/60 p-2.5">
                  <span className="text-[10px] text-scnt-text-muted block font-sans">Client IP</span>
                  <span className="font-medium text-scnt-text">{selectedLog.ip || 'N/A'}</span>
                </div>
              </div>

              {selectedLog.reqId ? (
                <div className="rounded-lg border border-scnt-border/60 p-2.5 font-mono">
                  <span className="text-[10px] text-scnt-text-muted block font-sans">Request Correlation ID</span>
                  <span className="font-medium text-scnt-text">{selectedLog.reqId}</span>
                </div>
              ) : null}

              {selectedLog.userId ? (
                <div className="rounded-lg border border-scnt-border/60 p-2.5">
                  <span className="text-[10px] text-scnt-text-muted block">Acting User</span>
                  <span className="font-medium text-scnt-text">
                    {selectedLog.userId.full_name} ({selectedLog.userId.email}) [Role: {selectedLog.userId.role}]
                  </span>
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                    Metadata & Payload
                  </span>
                  <button
                    onClick={() => copyMetadata(selectedLog)}
                    className="text-[11px] text-scnt-text underline hover:text-scnt-text-muted"
                  >
                    {copied ? 'Copied to clipboard!' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="max-h-72 overflow-auto rounded-lg border border-scnt-border/80 bg-scnt-text p-3 font-mono text-[11px] text-scnt-bg">
                  {JSON.stringify(selectedLog.metadata || selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedLog(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
