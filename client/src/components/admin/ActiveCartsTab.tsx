import { useCallback, useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  fetchActiveCarts,
  sendCartRecoveryEmail,
  type AdminCartItem,
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

function formatEgp(val: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(val || 0)
}

export function ActiveCartsTab() {
  const [status, setStatus] = useState<'all' | 'active' | 'abandoned'>('all')
  const [type, setType] = useState<'all' | 'registered' | 'guest'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [carts, setCarts] = useState<AdminCartItem[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({})
  const [sendingEmailCartId, setSendingEmailCartId] = useState<string | null>(null)
  const [expandedCartIds, setExpandedCartIds] = useState<Record<string, boolean>>({})

  const toggleDetails = (cartId: string) => {
    setExpandedCartIds((prev) => ({
      ...prev,
      [cartId]: !prev[cartId],
    }))
  }

  const getWhatsAppUrl = (phone: string, cartId: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const intlPhone = cleanPhone.startsWith('0') ? `20${cleanPhone.slice(1)}` : cleanPhone.replace(/^\+/, '')
    const cartUrl = `${window.location.origin}/cart?restore=${cartId}`
    const msg = encodeURIComponent(`Hello! We noticed you left some items in your SCNT cart. You can complete your order here: ${cartUrl}`)
    return `https://wa.me/${intlPhone}?text=${msg}`
  }

  const handleCopyRecoveryLink = async (cartId: string) => {
    try {
      const url = `${window.location.origin}/cart?restore=${cartId}`
      await navigator.clipboard.writeText(url)
      setActionFeedback((prev) => ({ ...prev, [cartId]: 'Link Copied!' }))
      setTimeout(() => {
        setActionFeedback((prev) => {
          const next = { ...prev }
          delete next[cartId]
          return next
        })
      }, 2500)
    } catch {
      setActionFeedback((prev) => ({ ...prev, [cartId]: 'Copy failed' }))
    }
  }

  const handleSendRecoveryEmail = async (cartId: string) => {
    try {
      setSendingEmailCartId(cartId)
      const res = await sendCartRecoveryEmail(cartId)
      setActionFeedback((prev) => ({ ...prev, [cartId]: `Email sent to ${res.email}` }))
      setCarts((prev) =>
        prev.map((c) =>
          c._id === cartId
            ? { ...c, recoverySentAt: new Date().toISOString(), recoveryCount: (c.recoveryCount || 0) + 1 }
            : c
        )
      )
      setTimeout(() => {
        setActionFeedback((prev) => {
          const next = { ...prev }
          delete next[cartId]
          return next
        })
      }, 4000)
    } catch (err) {
      setActionFeedback((prev) => ({
        ...prev,
        [cartId]: err instanceof Error ? err.message : 'Failed to send email',
      }))
    } finally {
      setSendingEmailCartId(null)
    }
  }

  const loadCarts = useCallback(
    async (currentPage = page) => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetchActiveCarts({
          status,
          type,
          search,
          page: currentPage,
          limit: 20,
        })
        setCarts(res.carts)
        setPagination(res.pagination)
        setPage(currentPage)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load active carts')
      } finally {
        setLoading(false)
      }
    },
    [page, status, type, search]
  )

  useEffect(() => {
    void loadCarts(1)
  }, [loadCarts])

  // Aggregate summary values
  const totalCartValue = carts.reduce((sum, c) => sum + c.subtotal, 0)
  const abandonedCount = carts.filter((c) => c.isAbandoned).length
  const activeCount = carts.filter((c) => !c.isAbandoned).length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-scnt-text">Active & Abandoned Carts</h2>
          <p className="mt-1 text-xs text-scnt-text-muted">
            Real-time view of customer and guest carts with products, quantities, applied coupons, and abandoned status.
          </p>
        </div>

        <Button
          variant="outline"
          className="text-xs"
          onClick={() => void loadCarts(page)}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Carts'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card asMotion={false} className="p-4">
          <span className="text-xs font-medium text-scnt-text-muted">Total Open Carts</span>
          <p className="mt-1 text-2xl font-bold font-mono text-scnt-text">{pagination.total}</p>
        </Card>

        <Card asMotion={false} className="p-4">
          <span className="text-xs font-medium text-scnt-text-muted">Active Carts (&lt;2h)</span>
          <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{activeCount}</p>
        </Card>

        <Card asMotion={false} className="p-4">
          <span className="text-xs font-medium text-scnt-text-muted">Abandoned Carts (&gt;2h)</span>
          <p className="mt-1 text-2xl font-bold font-mono text-amber-400">{abandonedCount}</p>
        </Card>

        <Card asMotion={false} className="p-4">
          <span className="text-xs font-medium text-scnt-text-muted">Current Page Cart Value</span>
          <p className="mt-1 text-2xl font-bold font-mono text-scnt-text">
            {formatEgp(totalCartValue)}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card asMotion={false} className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-[11px] font-medium text-scnt-text-muted">Status</label>
            <div className="mt-1 flex rounded-lg border border-scnt-border/60 bg-scnt-bg-elevated/40 p-1 text-xs">
              {(['all', 'active', 'abandoned'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={`flex-1 rounded py-1.5 font-medium capitalize transition-colors ${
                    status === s
                      ? 'bg-scnt-text text-scnt-bg'
                      : 'text-scnt-text-muted hover:text-scnt-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-scnt-text-muted">Account Type</label>
            <div className="mt-1 flex rounded-lg border border-scnt-border/60 bg-scnt-bg-elevated/40 p-1 text-xs">
              {(['all', 'registered', 'guest'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    setPage(1)
                  }}
                  className={`flex-1 rounded py-1.5 font-medium capitalize transition-colors ${
                    type === t
                      ? 'bg-scnt-text text-scnt-bg'
                      : 'text-scnt-text-muted hover:text-scnt-text'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'registered' ? 'Registered' : 'Guests'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-scnt-text-muted">Search Carts</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                placeholder="Name, email, phone, or visitor ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1)
                    void loadCarts(1)
                  }
                }}
                className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text placeholder:text-scnt-text-muted/60 outline-none"
              />
              <Button
                variant="outline"
                className="text-xs"
                onClick={() => {
                  setPage(1)
                  void loadCarts(1)
                }}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Carts List */}
      <Card asMotion={false} className="overflow-hidden p-0">
        <div className="border-b border-scnt-border/60 px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
            All Open Carts ({pagination.total})
          </span>
          {loading ? (
            <span className="text-xs text-scnt-text-muted animate-pulse">Loading carts...</span>
          ) : null}
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-rose-400">{error}</div>
        ) : carts.length === 0 ? (
          <div className="p-8 text-center text-sm text-scnt-text-muted">
            {loading ? 'Loading carts...' : 'No open carts found with items.'}
          </div>
        ) : (
          <div className="divide-y divide-scnt-border/30">
            {carts.map((cart) => (
              <div
                key={cart._id}
                className="p-5 hover:bg-scnt-bg-elevated/20 transition-colors space-y-4"
              >
                {/* Header: Identity, Status, Total */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {cart.user?.isRegistered ? (
                        <>
                          <span className="font-semibold text-sm text-scnt-text">
                            {cart.user.fullName}
                          </span>
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                            Registered Customer
                          </span>
                        </>
                      ) : cart.user?.isCapturedLead ? (
                        <>
                          <span className="font-semibold text-sm text-scnt-text">
                            {cart.user.fullName}
                          </span>
                          <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-300 border border-sky-500/30">
                            Captured Lead
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-sm font-semibold text-scnt-text">
                            Guest #{cart.visitorId?.slice(0, 8) || 'Unknown'}
                          </span>
                          <span className="rounded bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-500/20">
                            Anonymous Guest
                          </span>
                        </>
                      )}

                      {/* Abandoned vs Active Badge */}
                      {cart.isAbandoned ? (
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/30">
                          Abandoned (&gt;2h)
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                          Active Now
                        </span>
                      )}

                      {/* Promo Code badge */}
                      {cart.promoCode ? (
                        <span className="rounded bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300 border border-purple-500/30">
                          Coupon: {cart.promoCode}
                        </span>
                      ) : null}

                      {/* Recovery status */}
                      {cart.recoverySentAt ? (
                        <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30">
                          Recovery sent: {timeAgo(cart.recoverySentAt)} ({cart.recoveryCount || 1}x)
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-scnt-text-muted">
                      {cart.user?.email ? <span>{cart.user.email}</span> : null}
                      {cart.user?.phone ? <span>Phone: {cart.user.phone}</span> : null}
                      {cart.user?.city ? <span>City: {cart.user.city}</span> : null}
                      {cart.visitorMeta?.device ? (
                        <span className="capitalize">
                          {cart.visitorMeta.device} · {cart.visitorMeta.browser} ({cart.visitorMeta.os})
                        </span>
                      ) : null}
                      {cart.visitorMeta?.ip ? (
                        <span className="font-mono">{cart.visitorMeta.ip}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-scnt-text">
                      {formatEgp(cart.total != null && cart.discount ? cart.total : cart.subtotal)}
                    </p>
                    {cart.discount ? (
                      <p className="text-[11px] text-emerald-400 font-mono">
                        Coupon discount: -{formatEgp(cart.discount)}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-scnt-text-muted">
                      Last active: {timeAgo(cart.lastActiveAt)}
                    </p>
                  </div>
                </div>

                {/* Items in Cart */}
                <div className="rounded-xl border border-scnt-border/40 bg-scnt-bg/60 p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-scnt-text-muted">
                    Cart Items ({cart.itemCount})
                  </span>
                  <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {cart.items.map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-lg border border-scnt-border/40 bg-scnt-bg-elevated/30 p-2 text-xs"
                      >
                        {line.image ? (
                          <img
                            src={line.image}
                            alt={line.name}
                            className="h-12 w-12 rounded-md object-cover border border-scnt-border/60"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-scnt-bg-elevated flex items-center justify-center text-scnt-text-muted">
                            🧴
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-scnt-text">{line.name}</p>
                          <p className="text-[11px] text-scnt-text-muted">
                            Size: {line.size || '100ml'} · Qty: {line.quantity}
                          </p>
                          <p className="font-mono font-medium text-scnt-text mt-0.5">
                            {formatEgp(line.lineTotal)} ({formatEgp(line.unitPrice)} each)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded Order Progress & Diagnostic Details */}
                {expandedCartIds[cart._id] ? (
                  <div className="rounded-xl border border-scnt-border/70 bg-scnt-bg-elevated/40 p-4 space-y-4 animate-in fade-in duration-200">
                    {/* Stage Header with Progress Bar */}
                    <div className="rounded-lg border border-scnt-border/60 bg-scnt-bg/80 p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-scnt-text-muted">
                            Current Order Funnel Stage
                          </span>
                          <h4 className="text-sm font-semibold text-scnt-text mt-0.5">
                            {cart.orderProgress?.stageLabel || (cart.isAbandoned ? 'Abandoned in Cart' : 'Active Cart')}
                          </h4>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border ${
                            (cart.orderProgress?.stageProgress || 0) >= 80
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : (cart.orderProgress?.stageProgress || 0) >= 50
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {cart.orderProgress?.stageProgress || 20}% Reached
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full rounded-full bg-scnt-bg-elevated overflow-hidden border border-scnt-border/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            (cart.orderProgress?.stageProgress || 0) >= 80
                              ? 'bg-emerald-500'
                              : (cart.orderProgress?.stageProgress || 0) >= 50
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${cart.orderProgress?.stageProgress || 20}%` }}
                        />
                      </div>
                    </div>

                    {/* What's Still Missing Alert Box */}
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                          What's Still Missing to Complete Order ({cart.orderProgress?.missingFields?.length || 0} items)
                        </h4>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {cart.orderProgress?.missingFields?.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-rose-500/20 bg-scnt-bg/70 p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-rose-300">❌ {item.field}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  item.severity === 'critical'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {item.severity}
                              </span>
                            </div>
                            <p className="text-[11px] text-scnt-text-muted leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Funnel Stage Checklist */}
                    <div className="rounded-lg border border-scnt-border/50 bg-scnt-bg/60 p-3.5 space-y-2.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                        Stage Milestones & Requirements Checklist
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {cart.orderProgress?.steps?.map((step) => (
                          <div
                            key={step.id}
                            className="rounded-lg border border-scnt-border/40 bg-scnt-bg-elevated/20 p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-scnt-text">{step.label}</span>
                              {step.status === 'completed' ? (
                                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                                  ✓ Done
                                </span>
                              ) : step.status === 'partial' ? (
                                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/30">
                                  ⏳ Partial
                                </span>
                              ) : step.status === 'skipped' ? (
                                <span className="rounded bg-zinc-500/15 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-500/30">
                                  — Optional
                                </span>
                              ) : (
                                <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-300 border border-rose-500/30">
                                  ✗ Missing
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-scnt-text-muted truncate" title={step.detail}>
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Captured Customer & Delivery Details */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-scnt-border/50 bg-scnt-bg/60 p-3 space-y-2 text-xs">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-scnt-text-muted">
                          Customer Contact Details
                        </span>
                        <div className="space-y-1.5">
                          <p>
                            <span className="text-scnt-text-muted">Name:</span>{' '}
                            <span className="font-medium text-scnt-text">
                              {cart.orderProgress?.contactInfo.fullName || (
                                <span className="text-rose-400/80 italic font-normal">Not entered</span>
                              )}
                            </span>
                          </p>
                          <div className="flex items-center justify-between">
                            <p>
                              <span className="text-scnt-text-muted">Phone:</span>{' '}
                              <span className="font-mono font-medium text-scnt-text">
                                {cart.orderProgress?.contactInfo.phone || (
                                  <span className="text-rose-400/80 italic font-normal">Not entered</span>
                                )}
                              </span>
                            </p>
                            {cart.orderProgress?.contactInfo.phone ? (
                              <div className="flex gap-1.5">
                                <a
                                  href={`tel:${cart.orderProgress.contactInfo.phone}`}
                                  className="rounded border border-scnt-border/60 bg-scnt-bg-elevated px-2 py-0.5 text-[10px] text-scnt-text hover:border-scnt-text/40"
                                >
                                  📞 Call
                                </a>
                                <a
                                  href={getWhatsAppUrl(cart.orderProgress.contactInfo.phone, cart._id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/20"
                                >
                                  💬 WhatsApp
                                </a>
                              </div>
                            ) : null}
                          </div>
                          <p>
                            <span className="text-scnt-text-muted">Email:</span>{' '}
                            <span className="font-mono font-medium text-scnt-text">
                              {cart.orderProgress?.contactInfo.email || (
                                <span className="text-rose-400/80 italic font-normal">Not entered</span>
                              )}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-scnt-border/50 bg-scnt-bg/60 p-3 space-y-2 text-xs">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-scnt-text-muted">
                          Shipping & Delivery Address
                        </span>
                        <div className="space-y-1.5">
                          <p>
                            <span className="text-scnt-text-muted">Governorate:</span>{' '}
                            <span className="font-medium text-scnt-text">
                              {cart.orderProgress?.contactInfo.governorate || (
                                <span className="text-rose-400/80 italic font-normal">Not selected</span>
                              )}
                            </span>
                          </p>
                          <p>
                            <span className="text-scnt-text-muted">City:</span>{' '}
                            <span className="font-medium text-scnt-text">
                              {cart.orderProgress?.contactInfo.city || (
                                <span className="text-rose-400/80 italic font-normal">Not selected</span>
                              )}
                            </span>
                          </p>
                          <p>
                            <span className="text-scnt-text-muted">Street Address:</span>{' '}
                            <span className="font-medium text-scnt-text">
                              {cart.orderProgress?.contactInfo.address || (
                                <span className="text-rose-400/80 italic font-normal">Not provided</span>
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Visitor Session Activity Timeline */}
                    {cart.orderProgress?.recentVisits && cart.orderProgress.recentVisits.length > 0 ? (
                      <div className="rounded-lg border border-scnt-border/50 bg-scnt-bg/60 p-3 space-y-2 text-xs">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-scnt-text-muted">
                          Activity Trail Before Leaving
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cart.orderProgress.recentVisits.slice(0, 8).map((visit, vIdx) => (
                            <span
                              key={vIdx}
                              className="inline-flex items-center gap-1 rounded border border-scnt-border/40 bg-scnt-bg-elevated/40 px-2 py-1 text-[11px] text-scnt-text-muted"
                            >
                              <span className="font-mono text-scnt-text">{visit.path || '/'}</span>
                              <span className="text-[10px] text-scnt-text-muted/70">({timeAgo(visit.time)})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Recovery Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-scnt-border/30 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="text-[11px] py-1 px-3 border-scnt-border/80 text-scnt-text hover:bg-scnt-bg-elevated"
                      onClick={() => toggleDetails(cart._id)}
                    >
                      👁️ {expandedCartIds[cart._id] ? 'Hide Details' : 'Show Details'}
                    </Button>

                    <Button
                      variant="outline"
                      className="text-[11px] py-1 px-3"
                      onClick={() => void handleCopyRecoveryLink(cart._id)}
                    >
                      🔗 {actionFeedback[cart._id] === 'Link Copied!' ? 'Link Copied!' : 'Copy Cart Link'}
                    </Button>

                    {cart.user?.email || cart.contact?.email ? (
                      <Button
                        variant="outline"
                        className="text-[11px] py-1 px-3"
                        disabled={sendingEmailCartId === cart._id}
                        onClick={() => void handleSendRecoveryEmail(cart._id)}
                      >
                        ✉️ {sendingEmailCartId === cart._id ? 'Sending...' : 'Send Recovery Email'}
                      </Button>
                    ) : null}

                    {cart.orderProgress?.contactInfo?.phone ? (
                      <a
                        href={getWhatsAppUrl(cart.orderProgress.contactInfo.phone, cart._id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        💬 WhatsApp
                      </a>
                    ) : null}
                  </div>

                  {actionFeedback[cart._id] ? (
                    <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
                      {actionFeedback[cart._id]}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 ? (
          <div className="flex items-center justify-between border-t border-scnt-border/40 px-5 py-3 text-xs text-scnt-text-muted">
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total} carts)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-xs py-1 px-3"
                disabled={page <= 1 || loading}
                onClick={() => loadCarts(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="text-xs py-1 px-3"
                disabled={page >= pagination.pages || loading}
                onClick={() => loadCarts(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
