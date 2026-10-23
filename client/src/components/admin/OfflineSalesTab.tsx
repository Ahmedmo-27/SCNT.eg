import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  fetchOfflineSales,
  fetchOfflineSalesSummary,
  createOfflineSale,
  deleteOfflineSale,
  type AdminProduct,
  type OfflineSale,
  type OfflineSalesSummary,
} from '../../services/adminApi'

interface OfflineSalesTabProps {
  products: AdminProduct[]
  onSaleCreated?: () => void
}

type BasketLine = {
  product: AdminProduct
  size: string
  quantity: number
  unitPrice: number
}

function formatEgp(val: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(val || 0)
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

function toLocalDatetimeString(d: Date): string {
  const tzOffset = d.getTimezoneOffset() * 60000
  const localTime = new Date(d.getTime() - tzOffset)
  return localTime.toISOString().slice(0, 16)
}

const PAYMENT_LABELS: Record<string, { label: string; badgeCls: string; icon: string }> = {
  CASH: { label: 'Cash', badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: '💵' },
  INSTAPAY: { label: 'InstaPay', badgeCls: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30', icon: '⚡' },
  CARD: { label: 'Credit/Debit Card', badgeCls: 'bg-blue-500/15 text-blue-300 border-blue-500/30', icon: '💳' },
  VODAFONE_CASH: { label: 'Vodafone Cash', badgeCls: 'bg-red-500/15 text-red-300 border-red-500/30', icon: '📱' },
  BANK_TRANSFER: { label: 'Bank Transfer', badgeCls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', icon: '🏦' },
  OTHER: { label: 'Other', badgeCls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: '🪙' },
}

const CHANNEL_LABELS: Record<string, { label: string; icon: string }> = {
  WALK_IN: { label: 'Walk-in / Showroom', icon: '🏪' },
  BAZAAR: { label: 'Bazaar Event', icon: '🎪' },
  POPUP_BOOTH: { label: 'Pop-up Booth', icon: '⛺' },
  WHATSAPP: { label: 'WhatsApp / DM', icon: '💬' },
  PHONE: { label: 'Phone Order', icon: '📞' },
  INSTAGRAM: { label: 'Instagram', icon: '📸' },
  EXHIBITION: { label: 'Exhibition', icon: '🏛️' },
  OTHER: { label: 'Direct Sale', icon: '🏷️' },
}

export function OfflineSalesTab({ products, onSaleCreated }: OfflineSalesTabProps) {
  const [sales, setSales] = useState<OfflineSale[]>([])
  const [summary, setSummary] = useState<OfflineSalesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filter states
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Drawer / Form State
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Line item picker
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('100ml')
  const [itemSoldPrice, setItemSoldPrice] = useState<string>('')
  const [itemQuantity, setItemQuantity] = useState<number>(1)
  const [productSearch, setProductSearch] = useState('')

  // Basket of items
  const [basket, setBasket] = useState<BasketLine[]>([])

  // Order Details
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [channel, setChannel] = useState<
    'WALK_IN' | 'BAZAAR' | 'POPUP_BOOTH' | 'WHATSAPP' | 'PHONE' | 'INSTAGRAM' | 'EXHIBITION' | 'OTHER'
  >('WALK_IN')
  const [locationName, setLocationName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'INSTAPAY' | 'CARD' | 'VODAFONE_CASH' | 'BANK_TRANSFER' | 'OTHER'
  >('CASH')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIALLY_PAID' | 'PENDING'>('PAID')
  const [saleDate, setSaleDate] = useState<string>(toLocalDatetimeString(new Date()))
  const [orderDiscount, setOrderDiscount] = useState<string>('0')
  const [deductStock, setDeductStock] = useState<boolean>(true)
  const [orderNotes, setOrderNotes] = useState('')

  // Modals
  const [receiptSale, setReceiptSale] = useState<OfflineSale | null>(null)
  const [deletingSale, setDeletingSale] = useState<OfflineSale | null>(null)
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState(true)

  // Ensure selectedProductId is initialized when products prop loads or changes
  useEffect(() => {
    if (products.length > 0) {
      const exists = products.some((p) => (p._id || (p as any).id) === selectedProductId)
      if (!exists || !selectedProductId) {
        const firstId = products[0]._id || (products[0] as any).id
        setSelectedProductId(firstId)
      }
    }
  }, [products, selectedProductId])

  // Currently selected product object
  const currentProduct = useMemo(() => {
    if (!products || products.length === 0) return null
    return (
      products.find((p) => (p._id || (p as any).id) === selectedProductId) ||
      products[0] ||
      null
    )
  }, [products, selectedProductId])

  // Helper to select a product and auto-fill price
  const handleSelectProduct = useCallback(
    (product: AdminProduct) => {
      const id = product._id || (product as any).id
      setSelectedProductId(id)
      const sizeOpt = product.sizes?.find((s) => s.size === selectedSize)
      const defaultPrice = sizeOpt ? sizeOpt.price : product.price || 750
      setItemSoldPrice(String(defaultPrice))
    },
    [selectedSize]
  )

  // Update unit sold price when selected product or size changes
  useEffect(() => {
    if (!currentProduct) return
    const sizeOpt = currentProduct.sizes?.find((s) => s.size === selectedSize)
    const defaultPrice = sizeOpt ? sizeOpt.price : currentProduct.price || 750
    setItemSoldPrice(String(defaultPrice))
  }, [currentProduct, selectedSize])

  // Filtered products list for product search dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products
    const term = productSearch.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.inspired_from && p.inspired_from.toLowerCase().includes(term))
    )
  }, [products, productSearch])

  // Calculate Basket Totals
  const basketSubtotal = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }, [basket])

  const parsedDiscount = Math.max(0, parseFloat(orderDiscount) || 0)
  const basketTotal = Math.max(0, basketSubtotal - parsedDiscount)

  // Load Offline Sales & Summary
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const dateParams: { startDate?: string; endDate?: string } = {}
      const now = new Date()

      if (dateFilter === 'TODAY') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateParams.startDate = startOfDay.toISOString()
      } else if (dateFilter === '7DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateParams.startDate = sevenDaysAgo.toISOString()
      } else if (dateFilter === '30DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateParams.startDate = thirtyDaysAgo.toISOString()
      }

      const [salesRes, summaryRes] = await Promise.all([
        fetchOfflineSales({
          page,
          limit: 20,
          search: search.trim() || undefined,
          paymentMethod: paymentFilter !== 'ALL' ? paymentFilter : undefined,
          channel: channelFilter !== 'ALL' ? channelFilter : undefined,
          ...dateParams,
        }),
        fetchOfflineSalesSummary(),
      ])

      setSales(salesRes.sales)
      setTotalPages(salesRes.pagination.pages)
      setSummary(summaryRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offline purchases')
    } finally {
      setLoading(false)
    }
  }, [page, search, paymentFilter, channelFilter, dateFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Add Item to Sale Basket
  const handleAddToBasket = () => {
    if (!currentProduct) return
    const price = parseFloat(itemSoldPrice)
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid sold price')
      return
    }
    if (itemQuantity <= 0) {
      alert('Please enter a quantity greater than zero')
      return
    }

    // Check if same product & size is already in basket
    const existingIndex = basket.findIndex(
      (b) => b.product._id === currentProduct._id && b.size === selectedSize
    )

    if (existingIndex >= 0) {
      const updated = [...basket]
      updated[existingIndex].quantity += itemQuantity
      updated[existingIndex].unitPrice = price // update to latest custom price
      setBasket(updated)
    } else {
      setBasket((prev) => [
        ...prev,
        {
          product: currentProduct,
          size: selectedSize,
          quantity: itemQuantity,
          unitPrice: price,
        },
      ])
    }

    // Reset item quantity
    setItemQuantity(1)
  }

  // Remove Line from Basket
  const handleRemoveFromBasket = (index: number) => {
    setBasket((prev) => prev.filter((_, i) => i !== index))
  }

  // Update Line Unit Price
  const handleUpdateLinePrice = (index: number, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return
    setBasket((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: newPrice } : item))
    )
  }

  // Update Line Quantity
  const handleUpdateLineQuantity = (index: number, delta: number) => {
    setBasket((prev) =>
      prev
        .map((item, i) => {
          if (i === index) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        })
        .filter(Boolean) as BasketLine[]
    )
  }

  // Record Offline Purchase
  const handleSubmitOfflineSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (basket.length === 0) {
      setError('Please add at least one product to the sale')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const payload = {
        items: basket.map((item) => ({
          product: item.product._id,
          productName: item.product.name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discount: parsedDiscount,
        paymentMethod,
        paymentStatus,
        channel,
        location: locationName.trim(),
        customer: {
          fullName: customerName.trim() || 'Walk-in Customer',
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
        },
        notes: orderNotes.trim(),
        saleDate: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
        deductStock,
      }

      const created = await createOfflineSale(payload)

      setSuccessMsg(
        `Offline sale recorded successfully! Receipt: #${created.receiptNumber} (${formatEgp(
          created.total
        )})`
      )

      // Reset form
      setBasket([])
      setCustomerName('Walk-in Customer')
      setCustomerPhone('')
      setCustomerEmail('')
      setLocationName('')
      setOrderDiscount('0')
      setOrderNotes('')
      setSaleDate(toLocalDatetimeString(new Date()))
      setIsNewSaleOpen(false)

      // Reload
      await loadData()
      if (onSaleCreated) {
        onSaleCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record offline sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete / Void Offline Sale
  const handleConfirmDelete = async () => {
    if (!deletingSale) return
    setIsSubmitting(true)
    setError(null)
    try {
      await deleteOfflineSale(deletingSale._id, restoreStockOnDelete)
      setSuccessMsg(`Sale #${deletingSale.receiptNumber} voided successfully.`)
      setDeletingSale(null)
      await loadData()
      if (onSaleCreated) onSaleCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete offline sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy receipt summary text
  const copyReceiptText = (sale: OfflineSale) => {
    const lines = [
      `✦ SCNT.eg Fragrances - Sales Receipt ✦`,
      `Receipt: #${sale.receiptNumber}`,
      `Date: ${new Date(sale.saleDate).toLocaleString('en-EG')}`,
      `Customer: ${sale.customer?.fullName || 'Walk-in Customer'}`,
      sale.customer?.phone ? `Phone: ${sale.customer.phone}` : null,
      `Channel: ${CHANNEL_LABELS[sale.channel]?.label || sale.channel}`,
      sale.location ? `Location: ${sale.location}` : null,
      `Payment: ${PAYMENT_LABELS[sale.paymentMethod]?.label || sale.paymentMethod} (${sale.paymentStatus})`,
      `---------------------------------`,
      `ITEMS:`,
      ...sale.items.map(
        (i) => `• ${i.quantity}x ${i.productName} (${i.size}) @ ${formatEgp(i.unitPrice)} = ${formatEgp(i.subtotal)}`
      ),
      `---------------------------------`,
      `Subtotal: ${formatEgp(sale.subtotal)}`,
      sale.discount > 0 ? `Discount: -${formatEgp(sale.discount)}` : null,
      `TOTAL: ${formatEgp(sale.total)}`,
      sale.notes ? `Notes: ${sale.notes}` : null,
      `Thank you for choosing SCNT!`,
    ]
      .filter(Boolean)
      .join('\n')

    navigator.clipboard.writeText(lines)
    alert('Receipt summary copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">
          <span>{error}</span>
          <button
            type="button"
            className="text-xs text-red-400 hover:text-red-300"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">
          <span>{successMsg}</span>
          <button
            type="button"
            className="text-xs text-emerald-400 hover:text-emerald-300"
            onClick={() => setSuccessMsg(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card asMotion={false} className="p-4 border border-scnt-border/60">
            <span className="text-xs font-medium uppercase tracking-wider text-scnt-text-muted">
              Total Offline Revenue
            </span>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
              {formatEgp(summary.totalRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-scnt-text-muted">Direct in-person & event sales</p>
          </Card>

          <Card asMotion={false} className="p-4 border border-scnt-border/60">
            <span className="text-xs font-medium uppercase tracking-wider text-scnt-text-muted">
              Offline Purchases
            </span>
            <p className="mt-1 font-mono text-2xl font-bold text-scnt-text">
              {summary.totalOrders} <span className="text-xs font-normal text-scnt-text-muted">orders</span>
            </p>
            <p className="mt-1 text-[11px] text-scnt-text-muted">
              Avg {formatEgp(summary.avgOrderValue)} per sale
            </p>
          </Card>

          <Card asMotion={false} className="p-4 border border-scnt-border/60">
            <span className="text-xs font-medium uppercase tracking-wider text-scnt-text-muted">
              Bottles / Units Sold
            </span>
            <p className="mt-1 font-mono text-2xl font-bold text-amber-400">
              {summary.totalUnitsSold} <span className="text-xs font-normal text-scnt-text-muted">units</span>
            </p>
            <p className="mt-1 text-[11px] text-scnt-text-muted">Across all offline channels</p>
          </Card>

          <Card asMotion={false} className="p-4 border border-scnt-border/60">
            <span className="text-xs font-medium uppercase tracking-wider text-scnt-text-muted">
              Payment Breakdown
            </span>
            <div className="mt-2 space-y-1 text-xs">
              {summary.paymentMethods.slice(0, 3).map((pm) => (
                <div key={pm.method} className="flex justify-between items-center text-[11px]">
                  <span className="text-scnt-text-muted">
                    {PAYMENT_LABELS[pm.method]?.icon} {PAYMENT_LABELS[pm.method]?.label || pm.method}
                  </span>
                  <span className="font-mono font-medium text-scnt-text">{formatEgp(pm.total)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Primary Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-scnt-text">Offline Purchases & POS Recorder</h2>
          <p className="text-xs text-scnt-text-muted">
            Record direct in-person purchases, bazaar sales, and custom-priced sold products.
          </p>
        </div>

        <Button
          onClick={() => setIsNewSaleOpen((v) => !v)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium shadow-lg shadow-amber-900/20"
        >
          {isNewSaleOpen ? '✕ Close Recorder' : '+ Record Offline Purchase'}
        </Button>
      </div>

      {/* NEW OFFLINE SALE DRAWER / FORM */}
      {isNewSaleOpen && (
        <Card asMotion={false} className="p-6 border border-amber-500/30 bg-scnt-bg-elevated/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
          
          <h3 className="text-base font-semibold text-scnt-text mb-4 flex items-center gap-2">
            <span>🏷️</span> Record Direct / Offline Sale
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Product Selection & Pricing (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-xl border border-scnt-border/60 bg-scnt-bg/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Step 1: Choose Sold Product & Set Custom Price
                  </h4>
                  <span className="text-[11px] text-scnt-text-muted">
                    Catalog: {products.length} perfumes
                  </span>
                </div>

                {/* Product Search & Select */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-scnt-text">Select Fragrance</label>
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch('')}
                        className="text-[11px] text-amber-400 hover:text-amber-300"
                      >
                        Clear filter ✕
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Search by perfume name or inspiration (e.g. Explorer, Sauvage, Noir...)"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm text-scnt-text placeholder-scnt-text-muted/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />

                  {/* Dropdown Selector */}
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const id = e.target.value
                      const found = products.find((p) => (p._id || (p as any).id) === id)
                      if (found) {
                        handleSelectProduct(found)
                      } else {
                        setSelectedProductId(id)
                      }
                    }}
                    className="w-full rounded-lg border border-amber-500/50 bg-scnt-bg px-3 py-2 text-sm text-scnt-text focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    {filteredProducts.map((p) => {
                      const id = p._id || (p as any).id
                      return (
                        <option key={id} value={id}>
                          {p.name} {p.inspired_from ? `(Inspired by ${p.inspired_from})` : ''} - Stock: {p.stock ?? 0}
                        </option>
                      )
                    })}
                  </select>

                  {/* Search Matches Quick-Pick (shows when searching) */}
                  {productSearch.trim().length > 0 && (
                    <div className="space-y-1 rounded-lg border border-scnt-border/60 bg-scnt-bg/95 p-2 max-h-48 overflow-y-auto">
                      <span className="text-[10px] uppercase font-semibold text-scnt-text-muted px-1 block">
                        Matching Fragrances ({filteredProducts.length}) - Click to Pick
                      </span>
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-scnt-text-muted p-2">
                          No fragrances matching &quot;{productSearch}&quot;
                        </p>
                      ) : (
                        filteredProducts.slice(0, 10).map((p) => {
                          const id = p._id || (p as any).id
                          const isSelected = (currentProduct?._id || (currentProduct as any)?.id) === id
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                handleSelectProduct(p)
                                setProductSearch('')
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-md text-left text-xs transition ${
                                isSelected
                                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 font-semibold'
                                  : 'hover:bg-scnt-bg-elevated text-scnt-text'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <span className="block truncate font-medium">{p.name}</span>
                                {p.inspired_from && (
                                  <span className="text-[10px] text-scnt-text-muted truncate block">
                                    {p.inspired_from}
                                  </span>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <span className="text-[11px] font-mono text-emerald-400">
                                  {formatEgp(p.price || 750)}
                                </span>
                                <span className="text-[10px] text-scnt-text-muted block">
                                  Stock: {p.stock}
                                </span>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}

                  {/* Active Selected Product Badge */}
                  {currentProduct && (
                    <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
                      {currentProduct.coverImage || currentProduct.clearBackground_Image ? (
                        <img
                          src={currentProduct.coverImage || currentProduct.clearBackground_Image}
                          alt={currentProduct.name}
                          className="w-11 h-11 object-contain rounded-lg bg-black/40 p-1 border border-amber-500/20 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base shrink-0">
                          🧴
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-amber-200 truncate">
                            {currentProduct.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-scnt-text-muted truncate">
                          {currentProduct.inspired_from ? `Inspired by ${currentProduct.inspired_from}` : ''}
                        </p>
                        <p className="text-[11px] text-scnt-text-muted mt-0.5">
                          Catalog Price: <span className="font-mono text-emerald-400">{formatEgp(currentProduct.price || 750)}</span> · Stock: <span className="text-scnt-text">{currentProduct.stock} bottles</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Size, Price sold for, Quantity */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-scnt-text-muted">Size / Variant</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => {
                        const newSize = e.target.value
                        setSelectedSize(newSize)
                        if (currentProduct) {
                          const sizeOpt = currentProduct.sizes?.find((s) => s.size === newSize)
                          const defaultPrice = sizeOpt ? sizeOpt.price : currentProduct.price || 750
                          setItemSoldPrice(String(defaultPrice))
                        }
                      }}
                      className="w-full mt-1 rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm text-scnt-text"
                    >
                      <option value="100ml">100ml</option>
                      <option value="50ml">50ml</option>
                      <option value="10ml Decant">10ml Decant</option>
                      <option value="Sample 2ml">Sample 2ml</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-amber-300 font-medium">
                      Sold For (EGP / unit) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={itemSoldPrice}
                      onChange={(e) => setItemSoldPrice(e.target.value)}
                      placeholder="e.g. 750"
                      className="w-full mt-1 rounded-lg border border-amber-500/50 bg-scnt-bg px-3 py-2 text-sm font-mono font-semibold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-scnt-text-muted">Quantity</label>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                        className="w-8 h-9 rounded-lg border border-scnt-border bg-scnt-bg hover:bg-scnt-bg-elevated flex items-center justify-center text-sm font-bold text-scnt-text"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-2 py-2 text-center text-sm font-mono text-scnt-text"
                      />
                      <button
                        type="button"
                        onClick={() => setItemQuantity((q) => q + 1)}
                        className="w-8 h-9 rounded-lg border border-scnt-border bg-scnt-bg hover:bg-scnt-bg-elevated flex items-center justify-center text-sm font-bold text-scnt-text"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddToBasket}
                  disabled={!currentProduct}
                  className="w-full flex items-center justify-center gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                >
                  + Add to Sold Items
                </Button>
              </div>

              {/* Basket list of sold products */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-scnt-text-muted px-1">
                  <span>Items in This Sale ({basket.length})</span>
                  <span>Line Total</span>
                </div>

                {basket.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-scnt-border/60 p-6 text-center text-xs text-scnt-text-muted">
                    No products added yet. Select a fragrance above and click &quot;Add to Sold Items&quot;.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {basket.map((item, idx) => (
                      <div
                        key={`${item.product._id}-${item.size}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-scnt-border/60 bg-scnt-bg/80 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-scnt-text truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-scnt-text-muted">
                            Size: <span className="text-scnt-text">{item.size}</span>
                          </p>
                        </div>

                        {/* Inline price adjustment */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] text-scnt-text-muted block">Sold Price</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateLinePrice(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 rounded border border-scnt-border/70 bg-scnt-bg px-1.5 py-0.5 text-right font-mono text-xs text-emerald-400"
                            />
                          </div>

                          {/* Inline quantity adjuster */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQuantity(idx, -1)}
                              className="w-5 h-6 rounded bg-scnt-bg border border-scnt-border flex items-center justify-center text-xs text-scnt-text"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs px-1 text-scnt-text">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateLineQuantity(idx, 1)}
                              className="w-5 h-6 rounded bg-scnt-bg border border-scnt-border flex items-center justify-center text-xs text-scnt-text"
                            >
                              +
                            </button>
                          </div>

                          <div className="w-20 text-right">
                            <span className="font-mono font-semibold text-xs text-scnt-text block">
                              {formatEgp(item.quantity * item.unitPrice)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromBasket(idx)}
                            className="text-red-400 hover:text-red-300 text-xs px-1"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Customer, Channel, Payment & Total (5 Cols) */}
            <form onSubmit={handleSubmitOfflineSale} className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl border border-scnt-border/60 bg-scnt-bg/60 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Step 2: Sale & Customer Details
                </h4>

                {/* Customer Details */}
                <div className="space-y-2">
                  <label className="text-xs text-scnt-text-muted">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-scnt-text-muted">Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-scnt-text-muted">Email (Optional)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="client@mail.com"
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    />
                  </div>
                </div>

                {/* Sales Channel & Location */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-scnt-text-muted">Channel</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as any)}
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                    >
                      {Object.entries(CHANNEL_LABELS).map(([k, meta]) => (
                        <option key={k} value={k}>
                          {meta.icon} {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-scnt-text-muted">Location / Event</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Mall of Arabia"
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                    />
                  </div>
                </div>

                {/* Payment Method & Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-scnt-text-muted">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text font-medium"
                    >
                      {Object.entries(PAYMENT_LABELS).map(([k, meta]) => (
                        <option key={k} value={k}>
                          {meta.icon} {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-scnt-text-muted">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-2.5 py-1.5 text-xs text-scnt-text"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PARTIALLY_PAID">Partially Paid</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Sale Date & Overall Discount */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-scnt-text-muted">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-2 py-1.5 text-xs text-scnt-text"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-scnt-text-muted">Discount (EGP)</label>
                    <input
                      type="number"
                      min="0"
                      value={orderDiscount}
                      onChange={(e) => setOrderDiscount(e.target.value)}
                      className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text font-mono"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-scnt-text-muted">Notes / Reference</label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Paid 300 cash, 450 InstaPay. Promotional bundle."
                    className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
                  />
                </div>

                {/* Deduct Stock Switch */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={deductStock}
                    onChange={(e) => setDeductStock(e.target.checked)}
                    className="rounded border-scnt-border/80 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs text-scnt-text">
                    Deduct items from product inventory stock
                  </span>
                </label>
              </div>

              {/* Grand Total Summary Box */}
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-2">
                <div className="flex justify-between text-xs text-scnt-text-muted">
                  <span>Subtotal:</span>
                  <span className="font-mono text-scnt-text">{formatEgp(basketSubtotal)}</span>
                </div>
                {parsedDiscount > 0 && (
                  <div className="flex justify-between text-xs text-red-300">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatEgp(parsedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-scnt-text pt-2 border-t border-scnt-border/60">
                  <span>Final Total:</span>
                  <span className="font-mono text-emerald-400">{formatEgp(basketTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || basket.length === 0}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2.5"
                >
                  {isSubmitting ? 'Recording Sale...' : `Record Sale (${formatEgp(basketTotal)})`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewSaleOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* FILTER CONTROLS */}
      <Card asMotion={false} className="p-4 border border-scnt-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by receipt #, customer name, phone, or product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text placeholder-scnt-text-muted/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
          >
            <option value="ALL">All Payments</option>
            {Object.entries(PAYMENT_LABELS).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.icon} {meta.label}
              </option>
            ))}
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-1.5 text-xs text-scnt-text"
          >
            <option value="ALL">All Channels</option>
            {Object.entries(CHANNEL_LABELS).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.icon} {meta.label}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-scnt-bg rounded-lg border border-scnt-border/80 p-0.5 text-xs">
            {(['ALL', 'TODAY', '7DAYS', '30DAYS'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setDateFilter(range)
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  dateFilter === range
                    ? 'bg-amber-600 text-white'
                    : 'text-scnt-text-muted hover:text-scnt-text'
                }`}
              >
                {range === 'ALL'
                  ? 'All Time'
                  : range === 'TODAY'
                  ? 'Today'
                  : range === '7DAYS'
                  ? 'Last 7d'
                  : 'Last 30d'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* SALES LIST TABLE */}
      <Card asMotion={false} className="p-0 border border-scnt-border/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-scnt-text-muted">
            Loading offline purchases...
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-sm text-scnt-text-muted">
            No offline purchases recorded yet. Click &quot;+ Record Offline Purchase&quot; above to log your first in-person or direct sale!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-scnt-bg-elevated/80 border-b border-scnt-border/60 text-scnt-text-muted">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    Receipt # / Date
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    Customer & Channel
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    Products Sold & Custom Price
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">
                    Payment
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                    Total
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-scnt-border/40">
                {sales.map((sale) => {
                  const payMeta = PAYMENT_LABELS[sale.paymentMethod] || PAYMENT_LABELS.OTHER
                  const chanMeta = CHANNEL_LABELS[sale.channel] || CHANNEL_LABELS.OTHER

                  return (
                    <tr key={sale._id} className="hover:bg-scnt-bg-elevated/40 transition">
                      {/* Receipt & Date */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-300 block">
                          #{sale.receiptNumber}
                        </span>
                        <span className="text-[11px] text-scnt-text-muted block mt-0.5">
                          {new Date(sale.saleDate).toLocaleDateString('en-EG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          · {timeAgo(sale.saleDate)}
                        </span>
                      </td>

                      {/* Customer & Channel */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-scnt-text block">
                          {sale.customer?.fullName || 'Walk-in Customer'}
                        </span>
                        {sale.customer?.phone && (
                          <span className="text-[11px] text-scnt-text-muted block">
                            📞 {sale.customer.phone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {chanMeta.icon} {chanMeta.label}
                          {sale.location ? ` (${sale.location})` : ''}
                        </span>
                      </td>

                      {/* Products Sold */}
                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="space-y-1">
                          {sale.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-scnt-text truncate">
                                <strong className="text-amber-400">{it.quantity}x</strong> {it.productName}{' '}
                                <span className="text-scnt-text-muted">({it.size})</span>
                              </span>
                              <span className="font-mono text-scnt-text-muted shrink-0">
                                @ {formatEgp(it.unitPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold border ${payMeta.badgeCls}`}
                        >
                          {payMeta.icon} {payMeta.label}
                        </span>
                        <span className="block mt-1 text-[10px] text-scnt-text-muted">
                          Status: <strong className="text-scnt-text">{sale.paymentStatus}</strong>
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-sm text-emerald-400 block">
                          {formatEgp(sale.total)}
                        </span>
                        {sale.discount > 0 && (
                          <span className="text-[10px] text-red-300 block">
                            Disc: -{formatEgp(sale.discount)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReceiptSale(sale)}
                            className="px-2 py-1 rounded bg-scnt-bg-elevated hover:bg-scnt-bg border border-scnt-border/60 text-[11px] text-scnt-text transition"
                            title="View Receipt"
                          >
                            🧾 Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingSale(sale)
                              setRestoreStockOnDelete(sale.deductedStock)
                            }}
                            className="px-2 py-1 rounded bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 text-[11px] text-red-300 transition"
                            title="Void / Delete Sale"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-scnt-border/60 flex items-center justify-between text-xs text-scnt-text-muted">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="px-2.5 py-1 text-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                className="px-2.5 py-1 text-xs"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* RECEIPT / INVOICE MODAL */}
      {receiptSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-scnt-border bg-scnt-bg-elevated p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-scnt-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-scnt-text tracking-wider">SCNT.EG</h3>
                <p className="text-[11px] text-scnt-text-muted">Official Sales Receipt</p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptSale(null)}
                className="text-scnt-text-muted hover:text-scnt-text text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-scnt-text-muted">Receipt Number:</span>
                <span className="font-mono font-bold text-amber-400">#{receiptSale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-scnt-text-muted">Date:</span>
                <span className="text-scnt-text">
                  {new Date(receiptSale.saleDate).toLocaleString('en-EG')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-scnt-text-muted">Customer:</span>
                <span className="text-scnt-text">
                  {receiptSale.customer?.fullName || 'Walk-in Customer'}
                </span>
              </div>
              {receiptSale.customer?.phone && (
                <div className="flex justify-between">
                  <span className="text-scnt-text-muted">Phone:</span>
                  <span className="text-scnt-text">{receiptSale.customer.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-scnt-text-muted">Channel / Location:</span>
                <span className="text-scnt-text">
                  {CHANNEL_LABELS[receiptSale.channel]?.label || receiptSale.channel}
                  {receiptSale.location ? ` - ${receiptSale.location}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-scnt-text-muted">Payment:</span>
                <span className="text-scnt-text font-medium">
                  {PAYMENT_LABELS[receiptSale.paymentMethod]?.label || receiptSale.paymentMethod} (
                  {receiptSale.paymentStatus})
                </span>
              </div>
            </div>

            <div className="border-t border-b border-scnt-border/60 py-2 space-y-1.5 text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-scnt-text-muted block">
                Purchased Products
              </span>
              {receiptSale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-medium text-scnt-text">
                      {it.quantity}x {it.productName}
                    </span>
                    <span className="text-[10px] text-scnt-text-muted block">Size: {it.size}</span>
                  </div>
                  <span className="font-mono text-emerald-400">{formatEgp(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-scnt-text-muted">
                <span>Subtotal:</span>
                <span className="font-mono text-scnt-text">{formatEgp(receiptSale.subtotal)}</span>
              </div>
              {receiptSale.discount > 0 && (
                <div className="flex justify-between text-red-300">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatEgp(receiptSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-scnt-text pt-1 border-t border-scnt-border/40">
                <span>Total Paid:</span>
                <span className="font-mono text-emerald-400">{formatEgp(receiptSale.total)}</span>
              </div>
            </div>

            {receiptSale.notes && (
              <div className="rounded-lg bg-scnt-bg/60 p-2 text-[11px] text-scnt-text-muted">
                <strong>Notes:</strong> {receiptSale.notes}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => copyReceiptText(receiptSale)}
                className="flex-1 text-xs"
              >
                📋 Copy Text
              </Button>
              <Button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                🖨️ Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / VOID CONFIRMATION MODAL */}
      {deletingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-scnt-bg-elevated p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-red-300">Void / Delete Offline Sale</h3>
            <p className="text-xs text-scnt-text-muted">
              Are you sure you want to void sale{' '}
              <strong className="text-scnt-text">#{deletingSale.receiptNumber}</strong> (
              {formatEgp(deletingSale.total)})?
            </p>

            {deletingSale.deductedStock && (
              <label className="flex items-center gap-2 cursor-pointer rounded-lg bg-scnt-bg/60 p-3 border border-scnt-border/60">
                <input
                  type="checkbox"
                  checked={restoreStockOnDelete}
                  onChange={(e) => setRestoreStockOnDelete(e.target.checked)}
                  className="rounded border-scnt-border/80 text-amber-500"
                />
                <span className="text-xs text-scnt-text">
                  Restore inventory stock for these {deletingSale.items.length} product(s)
                </span>
              </label>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingSale(null)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                {isSubmitting ? 'Voiding...' : 'Confirm Void'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
