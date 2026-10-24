import { useEffect, useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { AdminOrder, AdminOrderItem } from '../../services/adminApi'

type Props = {
  orders: AdminOrder[]
  onStatusChange: (id: string, status: AdminOrder['status']) => Promise<void>
  busy: boolean
  onRefresh?: () => Promise<void>
}

function formatMoney(value?: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function orderRef(id: string): string {
  const tail = id.replace(/[^a-f0-9]/gi, '').slice(-8).toUpperCase()
  return tail.length > 0 ? `#${tail}` : `#${id.slice(0, 8)}`
}

function getProductName(item: AdminOrderItem): string {
  if (!item.product) return 'Unknown Fragrance'
  if (typeof item.product === 'string') return `Product (${item.product.slice(-6)})`
  return item.product.name || 'Unnamed Fragrance'
}

function getProductImage(item: AdminOrderItem): string | null {
  if (!item.product || typeof item.product === 'string') return null
  return item.product.images?.[0] || null
}

const statusBadgeStyles: Record<AdminOrder['status'], { badge: string; dot: string; label: string }> = {
  PENDING: {
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
    label: 'Pending',
  },
  CONFIRMED: {
    badge: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    dot: 'bg-sky-400',
    label: 'Confirmed',
  },
  PAID: {
    badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
    dot: 'bg-indigo-400',
    label: 'Paid',
  },
  SHIPPED: {
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
    label: 'Shipped',
  },
}

export function OnlineOrdersTab({ orders, onStatusChange, busy, onRefresh }: Props) {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminOrder['status']>('ALL')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Keep selectedOrder in sync when orders list is updated (e.g. status changed)
  useEffect(() => {
    if (!selectedOrder) return
    const updated = orders.find((o) => o._id === selectedOrder._id)
    if (updated) setSelectedOrder(updated)
  }, [orders, selectedOrder])

  // ESC key closes modal
  useEffect(() => {
    if (!selectedOrder) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrder(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedOrder])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      /* ignore */
    }
  }

  // Filter orders
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false
      }

      if (!q) return true

      const ref = orderRef(order._id).toLowerCase()
      const mongoId = order._id.toLowerCase()
      const customerName = (
        order.address?.fullName ||
        order.user?.full_name ||
        ''
      ).toLowerCase()
      const email = (order.customerEmail || order.user?.email || '').toLowerCase()
      const phone = (order.customerPhone || order.address?.phone || '').toLowerCase()
      const city = (order.address?.city || '').toLowerCase()
      const gov = (order.address?.addressLine2 || '').toLowerCase()
      const promo = (order.promoCode || '').toLowerCase()

      const itemMatches = order.items?.some((i) =>
        getProductName(i).toLowerCase().includes(q)
      )

      return (
        ref.includes(q) ||
        mongoId.includes(q) ||
        customerName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        city.includes(q) ||
        gov.includes(q) ||
        promo.includes(q) ||
        Boolean(itemMatches)
      )
    })
  }, [orders, search, statusFilter])

  // Counts
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === 'PENDING').length,
      CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
      PAID: orders.filter((o) => o.status === 'PAID').length,
      SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length,
    }
  }, [orders])

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  }, [filteredOrders])

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <Card asMotion={false} className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'PENDING', 'CONFIRMED', 'PAID', 'SHIPPED'] as const).map((st) => {
              const active = statusFilter === st
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-scnt-text bg-scnt-text text-scnt-bg font-semibold'
                      : 'border-scnt-border/80 bg-scnt-bg-elevated/40 text-scnt-text-muted hover:bg-scnt-bg-muted/50 hover:text-scnt-text'
                  }`}
                >
                  <span>{st === 'ALL' ? 'All Orders' : st}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active
                        ? 'bg-scnt-bg text-scnt-text font-bold'
                        : 'bg-scnt-border/60 text-scnt-text-muted'
                    }`}
                  >
                    {counts[st]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px] flex-1 sm:w-72">
              <input
                type="text"
                placeholder="Search order ref, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-scnt-border/80 bg-scnt-bg px-3.5 py-2 text-xs text-scnt-text outline-none ring-0 placeholder:text-scnt-text-muted/60 focus:border-scnt-text/40"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-scnt-text-muted hover:text-scnt-text"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {onRefresh ? (
              <Button
                variant="outline"
                onClick={() => void onRefresh()}
                disabled={busy}
                className="text-xs py-2 px-3.5 shrink-0"
              >
                Refresh
              </Button>
            ) : null}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-scnt-border/40 pt-3 text-xs text-scnt-text-muted">
          <p>
            Showing <strong className="text-scnt-text">{filteredOrders.length}</strong> of{' '}
            {orders.length} online orders
          </p>
          <p>
            Filtered Volume:{' '}
            <strong className="font-mono text-emerald-400 font-medium">
              {formatMoney(totalRevenue)}
            </strong>
          </p>
        </div>
      </Card>

      {/* Orders List Table / Card View */}
      {filteredOrders.length === 0 ? (
        <Card asMotion={false} className="p-12 text-center">
          <p className="text-sm text-scnt-text-muted">
            {search || statusFilter !== 'ALL'
              ? 'No orders match your filter criteria.'
              : 'No online orders placed yet.'}
          </p>
          {(search || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
              }}
              className="mt-3 text-xs text-scnt-text underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const itemCount =
              order.items?.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0) ||
              order.items?.length ||
              0
            const statusStyle = statusBadgeStyles[order.status] || statusBadgeStyles.PENDING
            const customerName =
              order.address?.fullName || order.user?.full_name || 'Customer'
            const contact =
              order.address?.phone ||
              order.customerPhone ||
              order.user?.email ||
              order.customerEmail ||
              '—'
            const city = order.address?.city || '—'

            return (
              <Card
                key={order._id}
                asMotion={false}
                className="p-4 sm:p-5 transition-colors hover:border-scnt-border"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Column: Reference & Customer info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-mono text-base font-bold text-scnt-text">
                        {orderRef(order._id)}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${statusStyle.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {order.status}
                      </span>

                      {order.promoCode ? (
                        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-purple-300">
                          {order.promoCode}
                        </span>
                      ) : null}

                      <span className="text-xs text-scnt-text-muted">
                        {new Date(order.createdAt).toLocaleString('en-EG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Customer & Location */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-scnt-text-muted">
                      <p>
                        <strong className="font-medium text-scnt-text">{customerName}</strong>
                        {order.user?.email && order.user.email !== customerName ? (
                          <span className="ml-1 opacity-80">({order.user.email})</span>
                        ) : null}
                      </p>
                      <span>•</span>
                      <p>{contact}</p>
                      <span>•</span>
                      <p>
                        {city}
                        {order.address?.addressLine2 ? `, ${order.address.addressLine2}` : ''}
                      </p>
                    </div>

                    {/* Items preview snippet */}
                    {order.items && order.items.length > 0 ? (
                      <p className="text-xs text-scnt-text-muted/80 truncate max-w-xl">
                        <span className="font-medium text-scnt-text">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}:
                        </span>{' '}
                        {order.items
                          .map((i) => `${getProductName(i)} (${i.size || '100ml'}) ×${i.quantity}`)
                          .join(', ')}
                      </p>
                    ) : null}
                  </div>

                  {/* Right Column: Amount, Status Dropdown, Details Button */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t border-scnt-border/30 lg:border-t-0 justify-between lg:justify-end">
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-scnt-text">
                        {formatMoney(order.total)}
                      </p>
                      <p className="text-[11px] text-scnt-text-muted">
                        COD · {itemCount} {itemCount === 1 ? 'bottle' : 'bottles'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Change status for order ${orderRef(order._id)}`}
                        className="rounded-xl border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-xs font-medium text-scnt-text outline-none transition-colors focus:border-scnt-text/40 disabled:cursor-not-allowed disabled:opacity-50"
                        value={order.status}
                        onChange={(e) =>
                          void onStatusChange(
                            order._id,
                            e.target.value as AdminOrder['status']
                          )
                        }
                        disabled={busy}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PAID">PAID</option>
                        <option value="SHIPPED">SHIPPED</option>
                      </select>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs py-2 px-3.5 font-medium whitespace-nowrap"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrder ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-3 sm:p-5 md:p-6 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null)
          }}
        >
          <div className="relative flex flex-col max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-2xl border border-scnt-border bg-scnt-bg shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-scnt-border/60 p-4 sm:p-6 bg-scnt-bg-elevated/40">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-scnt-text">
                    Order {orderRef(selectedOrder._id)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedOrder._id, selectedOrder._id)}
                    className="rounded-lg border border-scnt-border/60 bg-scnt-bg px-2 py-0.5 font-mono text-[11px] text-scnt-text-muted hover:text-scnt-text"
                    title="Copy full Mongo ID"
                  >
                    {copiedId === selectedOrder._id ? 'Copied ID!' : selectedOrder._id.slice(-8)}
                  </button>
                  {(() => {
                    const style =
                      statusBadgeStyles[selectedOrder.status] || statusBadgeStyles.PENDING
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${style.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {selectedOrder.status}
                      </span>
                    )
                  })()}
                </div>
                <p className="text-xs text-scnt-text-muted">
                  Placed on{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString('en-EG', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-scnt-text-muted hover:bg-scnt-bg-elevated hover:text-scnt-text transition-colors"
                aria-label="Close order details modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Quick Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-scnt-border/70 bg-scnt-bg-elevated/30 p-3 sm:p-4">
                <div className="text-xs">
                  <span className="text-scnt-text-muted">Current Order Status: </span>
                  <strong className="text-scnt-text">{selectedOrder.status}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-scnt-text-muted">Update Status:</span>
                  <select
                    className="rounded-xl border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs font-semibold text-scnt-text outline-none focus:border-scnt-text/50 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedOrder.status}
                    onChange={(e) =>
                      void onStatusChange(
                        selectedOrder._id,
                        e.target.value as AdminOrder['status']
                      )
                    }
                    disabled={busy}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PAID">PAID</option>
                    <option value="SHIPPED">SHIPPED</option>
                  </select>
                </div>
              </div>

              {/* Customer & Shipping 2-Col Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Customer Details */}
                <div className="rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/20 p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                    Customer Account
                  </h4>
                  <div className="text-xs space-y-1.5 pt-1">
                    <p className="text-sm font-semibold text-scnt-text">
                      {selectedOrder.address?.fullName ||
                        selectedOrder.user?.full_name ||
                        'Customer'}
                    </p>
                    <p className="text-scnt-text-muted">
                      Email:{' '}
                      <span className="text-scnt-text">
                        {selectedOrder.customerEmail || selectedOrder.user?.email || '—'}
                      </span>
                    </p>
                    <p className="text-scnt-text-muted">
                      Phone:{' '}
                      <span className="text-scnt-text">
                        {selectedOrder.customerPhone || selectedOrder.address?.phone || '—'}
                      </span>
                    </p>
                    <p className="text-scnt-text-muted pt-1">
                      Account Type:{' '}
                      {selectedOrder.user ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Registered User
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-scnt-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-scnt-text-muted" />
                          Guest Order
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/20 p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                    Delivery Address
                  </h4>
                  {selectedOrder.address ? (
                    <div className="text-xs space-y-1.5 pt-1">
                      <p className="text-sm font-medium text-scnt-text">
                        {selectedOrder.address.fullName}
                      </p>
                      <p className="text-scnt-text-muted">
                        Phone:{' '}
                        <span className="text-scnt-text font-mono">
                          {selectedOrder.address.phone}
                        </span>
                      </p>
                      <p className="text-scnt-text whitespace-pre-line">
                        {selectedOrder.address.addressLine1}
                      </p>
                      <p className="text-scnt-text-muted">
                        City / Gov:{' '}
                        <span className="text-scnt-text">
                          {selectedOrder.address.city}
                          {selectedOrder.address.addressLine2
                            ? `, ${selectedOrder.address.addressLine2}`
                            : ''}
                        </span>
                      </p>
                      <p className="text-scnt-text-muted">
                        Postal Code:{' '}
                        <span className="text-scnt-text font-mono">
                          {selectedOrder.address.postalCode}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-scnt-text-muted pt-1">No address specified.</p>
                  )}
                </div>
              </div>

              {/* Ordered Items Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>

                <div className="overflow-x-auto rounded-xl border border-scnt-border/50">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-scnt-border/50 bg-scnt-bg-elevated/50 text-scnt-text-muted">
                      <tr>
                        <th className="py-2.5 px-3 font-medium">Product</th>
                        <th className="py-2.5 px-3 font-medium">Size</th>
                        <th className="py-2.5 px-3 font-medium text-right">Unit Price</th>
                        <th className="py-2.5 px-3 font-medium text-center">Qty</th>
                        <th className="py-2.5 px-3 font-medium text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-scnt-border/30 text-scnt-text">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((line, idx) => {
                          const img = getProductImage(line)
                          const name = getProductName(line)
                          const lineTotal = (line.price || 0) * (line.quantity || 1)

                          return (
                            <tr key={idx} className="hover:bg-scnt-bg-elevated/20">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-3">
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={name}
                                      className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-scnt-border"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 shrink-0 rounded-lg border border-scnt-border bg-scnt-bg-elevated/60 flex items-center justify-center text-[10px] text-scnt-text-muted">
                                      SCNT
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-scnt-text">{name}</p>
                                    {typeof line.product === 'object' && line.product?.slug ? (
                                      <p className="text-[11px] text-scnt-text-muted">
                                        {line.product.slug}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono text-scnt-text-muted">
                                <span className="rounded bg-scnt-bg-elevated px-2 py-0.5 text-[11px]">
                                  {line.size || '100ml'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-scnt-text-muted">
                                {formatMoney(line.price)}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-medium">
                                ×{line.quantity}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-scnt-text">
                                {formatMoney(lineTotal)}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-scnt-text-muted">
                            No items recorded for this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary & Breakdown */}
              <div className="rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/20 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted mb-3">
                  Financial Breakdown
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-scnt-text-muted">
                    <span>Subtotal:</span>
                    <span className="font-mono text-scnt-text">
                      {formatMoney(
                        selectedOrder.subtotal ??
                          selectedOrder.items?.reduce(
                            (acc, i) => acc + (i.price || 0) * (i.quantity || 1),
                            0
                          )
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-scnt-text-muted">
                    <span>Shipping Fee (Flat COD):</span>
                    <span className="font-mono text-scnt-text">
                      {formatMoney(selectedOrder.shipping ?? 80)}
                    </span>
                  </div>

                  {selectedOrder.discount && selectedOrder.discount > 0 ? (
                    <div className="flex justify-between text-purple-400">
                      <span className="flex items-center gap-1.5">
                        <span>Coupon Discount:</span>
                        {selectedOrder.promoCode ? (
                          <span className="rounded bg-purple-500/20 px-1.5 py-0.2 font-mono text-[10px] uppercase text-purple-300">
                            {selectedOrder.promoCode}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono font-semibold">
                        -{formatMoney(selectedOrder.discount)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-between border-t border-scnt-border/50 pt-2 text-sm font-bold text-scnt-text">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-400">
                      {formatMoney(selectedOrder.total)}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-scnt-text-muted border-t border-scnt-border/30">
                    <span>Payment Method:</span>
                    <span className="font-medium text-scnt-text">Cash on Delivery (COD)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-scnt-border/60 p-4 sm:p-5 bg-scnt-bg">
              <span className="text-xs text-scnt-text-muted">
                Order Ref: <strong className="font-mono text-scnt-text">{orderRef(selectedOrder._id)}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs py-2 px-3.5"
                >
                  Print
                </Button>
                <Button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs py-2 px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
