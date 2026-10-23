import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { getStoredAuthToken } from '../lib/authStorage'
import { fetchProfile, type AuthUser } from '../services/authApi'
import {
  createAdminCollection,
  createAdminProduct,
  createAdminPromo,
  deleteAdminCollection,
  deleteAdminProduct,
  deleteAdminPromo,
  deleteAdminUser,
  fetchAdminCollections,
  fetchAdminDashboard,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminPromoCodes,
  fetchAdminUsers,
  sendPromotionalMail,
  updateAdminCollection,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminPromo,
  updateAdminUserRole,
  type AdminCollection,
  type AdminDashboard,
  type AdminOrder,
  type AdminProduct,
  type AdminPromo,
  type AdminUser,
  type PromotionalMailResult,
} from '../services/adminApi'
import { AnalyticsTab } from '../components/admin/AnalyticsTab'
import { LogsTab } from '../components/admin/LogsTab'
import { JourneysTab } from '../components/admin/JourneysTab'
import { ActiveCartsTab } from '../components/admin/ActiveCartsTab'
import { ExpensesTab } from '../components/admin/ExpensesTab'
import {
  fetchAnalyticsOverview,
  fetchAdminLogStats,
  fetchCouponAnalytics,
  type AnalyticsOverview,
  type LogStats,
  type CouponAnalyticsResponse,
  type CouponPerformance,
} from '../services/adminAnalyticsApi'

type TabKey =
  | 'overview'
  | 'journeys'
  | 'carts'
  | 'analytics'
  | 'logs'
  | 'products'
  | 'collections'
  | 'orders'
  | 'expenses'
  | 'promos'
  | 'reviews'
  | 'users'
  | 'mailing'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'journeys', label: 'Funnel & Journeys' },
  { key: 'carts', label: 'Active Carts' },
  { key: 'analytics', label: 'Visits & Traffic' },
  { key: 'logs', label: 'System Logs' },
  { key: 'products', label: 'Products' },
  { key: 'collections', label: 'Collections' },
  { key: 'orders', label: 'Orders' },
  { key: 'expenses', label: 'Spendings & COGS' },
  { key: 'promos', label: 'Promo codes & Usage' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'users', label: 'Users' },
  { key: 'mailing', label: 'Mailing' },
]


function toCsvList(input: string): string[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value || 0)
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

type ProductForm = {
  name: string
  slug: string
  inspired_from: string
  gender: 'male' | 'female'
  collection: string
  price: string
  size: string
  stock: string
  images: string
  coverImage: string
  topNotes: string
  heartNotes: string
  baseNotes: string
  description: string
}

const emptyProductForm: ProductForm = {
  name: '',
  slug: '',
  inspired_from: '',
  gender: 'male',
  collection: '',
  price: '',
  size: '100ml',
  stock: '0',
  images: '',
  coverImage: '',
  topNotes: '',
  heartNotes: '',
  baseNotes: '',
  description: '',
}

type CollectionForm = Omit<AdminCollection, '_id'>
const emptyCollectionForm: CollectionForm = {
  name: '',
  slug: '',
  coverImage: '',
  clearBackground_Image: '',
  themeColor: '',
  tagline: '',
  sub_tagline: '',
  description: '',
}

type PromoForm = {
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: string
  minSubtotal: string
  maxDiscount: string
  isActive: boolean
  startsAt: string
  expiresAt: string
}
const emptyPromoForm: PromoForm = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '0',
  minSubtotal: '0',
  maxDiscount: '',
  isActive: true,
  startsAt: '',
  expiresAt: '',
}

type PromoMailForm = {
  subject: string
  preheader: string
  contentHtml: string
  onlyVerified: boolean
}

const emptyPromoMailForm: PromoMailForm = {
  subject: '',
  preheader: '',
  contentHtml: `<p>Discover this week’s curated SCNT picks.</p>
<ul>
  <li>Limited promo code for members</li>
  <li>Fresh fragrance drops</li>
  <li>Exclusive checkout offers</li>
</ul>
<p><a href="https://scnt.eg/shop">Shop now</a></p>`,
  onlyVerified: true,
}

export function AdminPage() {
  const token = getStoredAuthToken()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [authStatus, setAuthStatus] = useState<'checking' | 'ready' | 'denied'>('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [promos, setPromos] = useState<AdminPromo[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])

  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(emptyCollectionForm)
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)
  const [promoForm, setPromoForm] = useState<PromoForm>(emptyPromoForm)
  const [promoMailForm, setPromoMailForm] = useState<PromoMailForm>(emptyPromoMailForm)
  const [promoMailResult, setPromoMailResult] = useState<PromotionalMailResult | null>(null)
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null)
  const [logStats, setLogStats] = useState<LogStats | null>(null)
  const [couponAnalytics, setCouponAnalytics] = useState<CouponAnalyticsResponse | null>(null)
  const [selectedPromoUsage, setSelectedPromoUsage] = useState<CouponPerformance | null>(null)
  const [loadingCoupons, setLoadingCoupons] = useState(false)

  const loadAll = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const [dash, p, c, o, pr, u] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminProducts(),
        fetchAdminCollections(),
        fetchAdminOrders(),
        fetchAdminPromoCodes(),
        fetchAdminUsers(),
      ])
      setDashboard(dash)
      setProducts(p)
      setCollections(c)
      setOrders(o)
      setPromos(pr)
      setUsers(u)

      // Parallel secondary metrics for overview
      fetchAnalyticsOverview('today', true).then(setAnalyticsOverview).catch(() => {})
      fetchAdminLogStats().then(setLogStats).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data')
    } finally {
      setBusy(false)
    }
  }, [])


  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetchProfile()
        if (cancelled) return
        setProfile(p)
        if (p.role !== 'admin') {
          setAuthStatus('denied')
          return
        }
        setAuthStatus('ready')
        void loadAll()
      } catch {
        if (!cancelled) setAuthStatus('denied')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, loadAll])

  useEffect(() => {
    if (activeTab === 'promos') {
      setLoadingCoupons(true)
      fetchCouponAnalytics()
        .then(setCouponAnalytics)
        .catch(() => {})
        .finally(() => setLoadingCoupons(false))
    }
  }, [activeTab])

  useEffect(() => {
    if (!selectedPromoUsage) return
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPromoUsage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = orig
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPromoUsage])

  const collectionOptions = useMemo(() => collections.map((c) => ({ id: c._id, label: c.name })), [collections])

  if (!token) return <Navigate to="/login" replace />
  if (authStatus === 'denied') return <Navigate to="/profile" replace />

  const startEditProduct = (item: AdminProduct) => {
    setEditingProductId(item._id)
    const collectionId = typeof item.collection === 'string' ? item.collection : item.collection?._id ?? ''
    setProductForm({
      name: item.name,
      slug: item.slug,
      inspired_from: item.inspired_from,
      gender: item.gender,
      collection: collectionId,
      price: String(item.price ?? 0),
      size: item.size ?? '100ml',
      stock: String(item.stock ?? 0),
      images: '',
      coverImage: item.coverImage || '',
      topNotes: '',
      heartNotes: '',
      baseNotes: '',
      description: item.description ?? '',
    })
  }

  const resetProductForm = () => {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
  }

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = {
        name: productForm.name.trim(),
        slug: productForm.slug.trim(),
        inspired_from: productForm.inspired_from.trim(),
        gender: productForm.gender,
        collection: productForm.collection,
        price: Number(productForm.price || 0),
        size: productForm.size.trim(),
        sizes: [
          { size: '50ml', price: 500 },
          { size: '100ml', price: Number(productForm.price || 750) },
        ],
        stock: Number(productForm.stock || 0),
        images: toCsvList(productForm.images),
        coverImage: productForm.coverImage.trim(),
        topNotes: toCsvList(productForm.topNotes),
        heartNotes: toCsvList(productForm.heartNotes),
        baseNotes: toCsvList(productForm.baseNotes),
        description: productForm.description.trim(),
      }
      if (editingProductId) {
        await updateAdminProduct(editingProductId, payload)
      } else {
        await createAdminProduct(payload)
      }
      resetProductForm()
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Product save failed')
    } finally {
      setBusy(false)
    }
  }

  const removeProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteAdminProduct(id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Product delete failed')
      setBusy(false)
    }
  }

  const startEditCollection = (item: AdminCollection) => {
    setEditingCollectionId(item._id)
    setCollectionForm({
      name: item.name,
      slug: item.slug,
      coverImage: item.coverImage || '',
      clearBackground_Image: item.clearBackground_Image || '',
      themeColor: item.themeColor || '',
      tagline: item.tagline || '',
      sub_tagline: item.sub_tagline || '',
      description: item.description || '',
    })
  }

  const submitCollection = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = {
        name: collectionForm.name.trim(),
        slug: collectionForm.slug.trim(),
        coverImage: collectionForm.coverImage?.trim() || '',
        clearBackground_Image: collectionForm.clearBackground_Image?.trim() || '',
        themeColor: collectionForm.themeColor?.trim() || '',
        tagline: collectionForm.tagline?.trim() || '',
        sub_tagline: collectionForm.sub_tagline?.trim() || '',
        description: collectionForm.description?.trim() || '',
      }
      if (editingCollectionId) {
        await updateAdminCollection(editingCollectionId, payload)
      } else {
        await createAdminCollection(payload)
      }
      setEditingCollectionId(null)
      setCollectionForm(emptyCollectionForm)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collection save failed')
    } finally {
      setBusy(false)
    }
  }

  const removeCollection = async (id: string) => {
    if (!window.confirm('Delete this collection?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteAdminCollection(id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collection delete failed')
      setBusy(false)
    }
  }

  const startEditPromo = (item: AdminPromo) => {
    setEditingPromoId(item._id)
    setPromoForm({
      code: item.code,
      discountType: item.discountType,
      discountValue: String(item.discountValue),
      minSubtotal: String(item.minSubtotal ?? 0),
      maxDiscount: item.maxDiscount == null ? '' : String(item.maxDiscount),
      isActive: Boolean(item.isActive),
      startsAt: item.startsAt || '',
      expiresAt: item.expiresAt || '',
    })
  }

  const submitPromo = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = {
        code: promoForm.code.trim().toUpperCase(),
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue || 0),
        minSubtotal: Number(promoForm.minSubtotal || 0),
        maxDiscount: promoForm.maxDiscount.trim() ? Number(promoForm.maxDiscount) : null,
        isActive: promoForm.isActive,
        startsAt: promoForm.startsAt || null,
        expiresAt: promoForm.expiresAt || null,
      }
      if (editingPromoId) {
        await updateAdminPromo(editingPromoId, payload)
      } else {
        await createAdminPromo(payload)
      }
      setEditingPromoId(null)
      setPromoForm(emptyPromoForm)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promo save failed')
    } finally {
      setBusy(false)
    }
  }

  const removePromo = async (id: string) => {
    if (!window.confirm('Delete this promo?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteAdminPromo(id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promo delete failed')
      setBusy(false)
    }
  }

  const changeOrderStatus = async (id: string, status: AdminOrder['status']) => {
    setBusy(true)
    setError(null)
    try {
      await updateAdminOrderStatus(id, status)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order update failed')
      setBusy(false)
    }
  }

  const changeUserRole = async (id: string, role: 'user' | 'admin') => {
    setBusy(true)
    setError(null)
    try {
      await updateAdminUserRole(id, role)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role update failed')
      setBusy(false)
    }
  }

  const removeUser = async (id: string) => {
    if (!window.confirm('Delete this user account?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteAdminUser(id)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User delete failed')
      setBusy(false)
    }
  }

  const submitPromotionalMail = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setPromoMailResult(null)
    try {
      const result = await sendPromotionalMail({
        subject: promoMailForm.subject.trim(),
        preheader: promoMailForm.preheader.trim(),
        contentHtml: promoMailForm.contentHtml.trim(),
        onlyVerified: promoMailForm.onlyVerified,
      })
      setPromoMailResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotional email send failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-18">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-scnt-text-muted">Admin</p>
            <h1 className="font-serif text-4xl text-scnt-text">Control Panel</h1>
            <p className="mt-2 text-sm text-scnt-text-muted">Signed in as {profile?.email || 'admin'}.</p>
          </div>
          <Button variant="outline" onClick={() => void loadAll()} disabled={busy || authStatus !== 'ready'}>
            Refresh data
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.12em] transition-colors ${
                activeTab === tab.key
                  ? 'border-scnt-text bg-scnt-text text-scnt-bg'
                  : 'border-scnt-border/80 bg-scnt-bg-elevated/35 text-scnt-text hover:bg-scnt-bg-muted/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm">{error}</p> : null}

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Users</p><p className="mt-2 text-3xl">{dashboard?.usersCount ?? '—'}</p></Card>
              <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Products</p><p className="mt-2 text-3xl">{dashboard?.productsCount ?? '—'}</p></Card>
              <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Collections</p><p className="mt-2 text-3xl">{dashboard?.collectionsCount ?? '—'}</p></Card>
              <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Orders</p><p className="mt-2 text-3xl">{dashboard?.ordersCount ?? '—'}</p></Card>
              <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Pending orders</p><p className="mt-2 text-3xl">{dashboard?.pendingOrders ?? '—'}</p></Card>
              <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Revenue</p><p className="mt-2 text-3xl">{dashboard ? formatMoney(dashboard.totalRevenue) : '—'}</p></Card>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-scnt-text-muted">
                Live Platform Telemetry
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card
                  asMotion={false}
                  className="p-5 cursor-pointer hover:border-scnt-text/40 transition-colors"
                  onClick={() => setActiveTab('analytics')}
                >
                  <p className="text-xs uppercase text-scnt-text-muted">Unique Visitors (Today)</p>
                  <p className="mt-2 text-3xl">{analyticsOverview ? analyticsOverview.todayUniqueVisitors : '—'}</p>
                  <span className="mt-1 inline-block text-[11px] text-scnt-text underline">View Traffic Analytics →</span>
                </Card>

                <Card
                  asMotion={false}
                  className="p-5 cursor-pointer hover:border-scnt-text/40 transition-colors"
                  onClick={() => setActiveTab('analytics')}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase text-scnt-text-muted">Active Browsing Now</p>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="mt-2 text-3xl">{analyticsOverview ? analyticsOverview.activeNow : '—'}</p>
                  <span className="mt-1 inline-block text-[11px] text-emerald-700">Real-time (last 15m) →</span>
                </Card>

                <Card
                  asMotion={false}
                  className="p-5 cursor-pointer hover:border-scnt-text/40 transition-colors"
                  onClick={() => setActiveTab('logs')}
                >
                  <p className="text-xs uppercase text-scnt-text-muted">System Errors Today</p>
                  <p className={`mt-2 text-3xl font-light ${logStats && logStats.errorsToday > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {logStats ? logStats.errorsToday : '—'}
                  </p>
                  <span className="mt-1 inline-block text-[11px] text-scnt-text underline">View System Logs →</span>
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'journeys' ? <JourneysTab /> : null}
        {activeTab === 'carts' ? <ActiveCartsTab /> : null}
        {activeTab === 'analytics' ? <AnalyticsTab /> : null}
        {activeTab === 'logs' ? <LogsTab /> : null}
        {activeTab === 'expenses' ? <ExpensesTab /> : null}


        {activeTab === 'products' ? (
          <div className="space-y-4">
            <Card asMotion={false} className="p-5">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={submitProduct}>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm((s) => ({ ...s, name: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Slug" value={productForm.slug} onChange={(e) => setProductForm((s) => ({ ...s, slug: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Inspired from" value={productForm.inspired_from} onChange={(e) => setProductForm((s) => ({ ...s, inspired_from: e.target.value }))} required />
                <select className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" value={productForm.collection} onChange={(e) => setProductForm((s) => ({ ...s, collection: e.target.value }))} required>
                  <option value="">Select collection</option>
                  {collectionOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" value={productForm.gender} onChange={(e) => setProductForm((s) => ({ ...s, gender: e.target.value as 'male' | 'female' }))}><option value="male">Male</option><option value="female">Female</option></select>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Price" type="number" value={productForm.price} onChange={(e) => setProductForm((s) => ({ ...s, price: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Stock" type="number" value={productForm.stock} onChange={(e) => setProductForm((s) => ({ ...s, stock: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Size (e.g. 100ml)" value={productForm.size} onChange={(e) => setProductForm((s) => ({ ...s, size: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Image URLs (comma separated)" value={productForm.images} onChange={(e) => setProductForm((s) => ({ ...s, images: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Cover image URL or path (optional)" value={productForm.coverImage} onChange={(e) => setProductForm((s) => ({ ...s, coverImage: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Top notes (comma separated)" value={productForm.topNotes} onChange={(e) => setProductForm((s) => ({ ...s, topNotes: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Heart notes (comma separated)" value={productForm.heartNotes} onChange={(e) => setProductForm((s) => ({ ...s, heartNotes: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Base notes (comma separated)" value={productForm.baseNotes} onChange={(e) => setProductForm((s) => ({ ...s, baseNotes: e.target.value }))} />
                <textarea className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm((s) => ({ ...s, description: e.target.value }))} rows={3} />
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={busy}>{editingProductId ? 'Update product' : 'Create product'}</Button>
                  {editingProductId ? <Button variant="outline" onClick={resetProductForm} disabled={busy}>Cancel edit</Button> : null}
                </div>
              </form>
            </Card>
            <Card asMotion={false} className="p-5">
              <ul className="space-y-2">
                {products.map((item) => (
                  <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-scnt-border/60 px-3 py-2">
                    <div>
                      <p className="text-sm">{item.name}</p>
                      <p className="text-xs text-scnt-text-muted">{item.slug} · {formatMoney(item.price)} · stock {item.stock}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => startEditProduct(item)} disabled={busy}>Edit</Button>
                      <Button variant="outline" onClick={() => void removeProduct(item._id)} disabled={busy}>Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : null}

        {activeTab === 'collections' ? (
          <div className="space-y-4">
            <Card asMotion={false} className="p-5">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={submitCollection}>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Name" value={collectionForm.name} onChange={(e) => setCollectionForm((s) => ({ ...s, name: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Slug" value={collectionForm.slug} onChange={(e) => setCollectionForm((s) => ({ ...s, slug: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Cover image URL or path (e.g. /collections/covers/The%20Explorer.png)" value={collectionForm.coverImage || ''} onChange={(e) => setCollectionForm((s) => ({ ...s, coverImage: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Clear background image URL or path (e.g. /Products/The%20Executive%20Collection%20Bottle%20Mockup%20(Front).png)" value={collectionForm.clearBackground_Image || ''} onChange={(e) => setCollectionForm((s) => ({ ...s, clearBackground_Image: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Theme color" value={collectionForm.themeColor || ''} onChange={(e) => setCollectionForm((s) => ({ ...s, themeColor: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Tagline" value={collectionForm.tagline || ''} onChange={(e) => setCollectionForm((s) => ({ ...s, tagline: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Sub tagline" value={collectionForm.sub_tagline || ''} onChange={(e) => setCollectionForm((s) => ({ ...s, sub_tagline: e.target.value }))} />
                <textarea className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 md:col-span-2" placeholder="Description" rows={3} value={collectionForm.description || ''} onChange={(e) => setCollectionForm((s) => ({ ...s, description: e.target.value }))} />
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={busy}>{editingCollectionId ? 'Update collection' : 'Create collection'}</Button>
                  {editingCollectionId ? <Button variant="outline" onClick={() => { setEditingCollectionId(null); setCollectionForm(emptyCollectionForm) }}>Cancel edit</Button> : null}
                </div>
              </form>
            </Card>
            <Card asMotion={false} className="p-5">
              <ul className="space-y-2">
                {collections.map((item) => (
                  <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-scnt-border/60 px-3 py-2">
                    <div><p className="text-sm">{item.name}</p><p className="text-xs text-scnt-text-muted">{item.slug}</p></div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => startEditCollection(item)} disabled={busy}>Edit</Button>
                      <Button variant="outline" onClick={() => void removeCollection(item._id)} disabled={busy}>Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : null}

        {activeTab === 'orders' ? (
          <Card asMotion={false} className="p-5">
            <ul className="space-y-2">
              {orders.map((item) => (
                <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-scnt-border/60 px-3 py-2">
                  <div>
                    <p className="text-sm">{item.user?.full_name || item.user?.email || 'User'} · {formatMoney(item.total)}</p>
                    <p className="text-xs text-scnt-text-muted">{new Date(item.createdAt).toLocaleString('en-EG')} · {item.promoCode || 'No promo'}</p>
                  </div>
                  <select className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" value={item.status} onChange={(e) => void changeOrderStatus(item._id, e.target.value as AdminOrder['status'])} disabled={busy}>
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PAID">PAID</option>
                    <option value="SHIPPED">SHIPPED</option>
                  </select>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {activeTab === 'promos' ? (
          <div className="space-y-6">
            {/* Coupon Analytics KPI Summary */}
            {couponAnalytics ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card asMotion={false} className="p-4">
                  <span className="text-xs font-medium text-scnt-text-muted">Total Redemptions</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                    {couponAnalytics.summary.totalRedemptions} orders
                  </p>
                </Card>
                <Card asMotion={false} className="p-4">
                  <span className="text-xs font-medium text-scnt-text-muted">Total Customer Savings</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-scnt-text">
                    {formatMoney(couponAnalytics.summary.totalDiscountGiven)}
                  </p>
                </Card>
                <Card asMotion={false} className="p-4">
                  <span className="text-xs font-medium text-scnt-text-muted">Revenue Generated</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-scnt-text">
                    {formatMoney(couponAnalytics.summary.totalRevenueDriven)}
                  </p>
                </Card>
                <Card asMotion={false} className="p-4">
                  <span className="text-xs font-medium text-scnt-text-muted">Active Carts With Coupons</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-purple-400">
                    {couponAnalytics.summary.totalActiveCartHolders} carts
                  </p>
                </Card>
              </div>
            ) : loadingCoupons ? (
              <p className="text-xs text-scnt-text-muted animate-pulse">Loading coupon analytics...</p>
            ) : null}

            {/* Create / Edit Promo Form */}
            <Card asMotion={false} className="p-5">
              <h3 className="mb-3 font-serif text-lg text-scnt-text">
                {editingPromoId ? 'Edit Promo Code' : 'Create New Promo Code'}
              </h3>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={submitPromo}>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" placeholder="Code" value={promoForm.code} onChange={(e) => setPromoForm((s) => ({ ...s, code: e.target.value }))} required />
                <select className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" value={promoForm.discountType} onChange={(e) => setPromoForm((s) => ({ ...s, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' }))}>
                  <option value="PERCENTAGE">PERCENTAGE (%)</option>
                  <option value="FIXED">FIXED (EGP)</option>
                </select>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" type="number" placeholder="Discount value" value={promoForm.discountValue} onChange={(e) => setPromoForm((s) => ({ ...s, discountValue: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" type="number" placeholder="Min subtotal (EGP)" value={promoForm.minSubtotal} onChange={(e) => setPromoForm((s) => ({ ...s, minSubtotal: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" type="number" placeholder="Max discount (optional)" value={promoForm.maxDiscount} onChange={(e) => setPromoForm((s) => ({ ...s, maxDiscount: e.target.value }))} />
                <label className="flex items-center gap-2 rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm"><input type="checkbox" checked={promoForm.isActive} onChange={(e) => setPromoForm((s) => ({ ...s, isActive: e.target.checked }))} />Active</label>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" type="datetime-local" value={promoForm.startsAt || ''} onChange={(e) => setPromoForm((s) => ({ ...s, startsAt: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" type="datetime-local" value={promoForm.expiresAt || ''} onChange={(e) => setPromoForm((s) => ({ ...s, expiresAt: e.target.value }))} />
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={busy}>{editingPromoId ? 'Update promo' : 'Create promo'}</Button>
                  {editingPromoId ? <Button variant="outline" onClick={() => { setEditingPromoId(null); setPromoForm(emptyPromoForm) }}>Cancel edit</Button> : null}
                </div>
              </form>
            </Card>

            {/* Promo Codes List with Performance Insights */}
            <Card asMotion={false} className="p-5">
              <h3 className="mb-3 font-serif text-lg text-scnt-text">Existing Promo Codes & Usage</h3>
              <ul className="space-y-3">
                {promos.map((item) => {
                  const perf = couponAnalytics?.coupons.find(
                    (c) => c.code.toUpperCase() === item.code.toUpperCase()
                  )
                  const redemptionsCount = perf ? perf.totalRedemptions : 0
                  const revenueDriven = perf ? perf.totalRevenueDriven : 0
                  const discountGiven = perf ? perf.totalDiscountGiven : 0
                  const liveCartsCount = perf ? perf.activeCartsCount : 0

                  return (
                    <li
                      key={item._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-scnt-border/60 bg-scnt-bg/50 p-4 transition-colors hover:border-scnt-border"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-scnt-text">{item.code}</span>
                          <span className="rounded bg-scnt-bg-elevated px-2 py-0.5 text-xs text-scnt-text-muted">
                            {item.discountType === 'PERCENTAGE' ? `${item.discountValue}% OFF` : `EGP ${item.discountValue} OFF`}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Usage Metrics */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-scnt-text-muted">
                          <span>
                            Redemptions: <strong className="text-scnt-text">{redemptionsCount} orders</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Revenue Driven: <strong className="text-emerald-400">{formatMoney(revenueDriven)}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Discount Given: <strong className="text-scnt-text">{formatMoney(discountGiven)}</strong>
                          </span>
                          {liveCartsCount > 0 ? (
                            <>
                              <span>·</span>
                              <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-purple-300 border border-purple-500/30">
                                In {liveCartsCount} live cart{liveCartsCount > 1 ? 's' : ''}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {perf ? (
                          <Button
                            variant="outline"
                            className="text-xs py-1 px-3"
                            onClick={() => setSelectedPromoUsage(perf)}
                          >
                            View Redemptions ({redemptionsCount})
                          </Button>
                        ) : null}
                        <Button variant="outline" className="text-xs py-1 px-2.5" onClick={() => startEditPromo(item)} disabled={busy}>
                          Edit
                        </Button>
                        <Button variant="outline" className="text-xs py-1 px-2.5" onClick={() => void removePromo(item._id)} disabled={busy}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>

            {/* Modal: Who used this coupon & which ones they've used */}
            {selectedPromoUsage ? (
              <div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-3 sm:p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedPromoUsage(null)
                }}
              >
                <div className="relative flex flex-col max-h-[90dvh] w-full max-w-3xl overflow-hidden rounded-2xl border border-scnt-border/80 bg-scnt-bg shadow-2xl">
                  {/* Fixed Header */}
                  <div className="flex-shrink-0 flex items-center justify-between border-b border-scnt-border/40 p-4 sm:p-5 bg-scnt-bg">
                    <div className="min-w-0 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-xl sm:text-2xl text-scnt-text font-bold">
                          {selectedPromoUsage.code}
                        </h3>
                        <span className="rounded bg-scnt-bg-elevated px-2 py-0.5 text-xs text-scnt-text-muted">
                          {selectedPromoUsage.discountType === 'PERCENTAGE'
                            ? `${selectedPromoUsage.discountValue}% OFF`
                            : `EGP ${selectedPromoUsage.discountValue} OFF`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-scnt-text-muted truncate">
                        Total {selectedPromoUsage.totalRedemptions} orders · Revenue {formatMoney(selectedPromoUsage.totalRevenueDriven)} · Discount Given {formatMoney(selectedPromoUsage.totalDiscountGiven)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPromoUsage(null)}
                      className="flex-shrink-0 rounded-lg p-2 text-scnt-text-muted hover:bg-scnt-bg-elevated hover:text-scnt-text transition-colors"
                      aria-label="Close coupon usage modal"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Scrollable Body */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
                    {/* Active Cart Holders for this promo */}
                    {selectedPromoUsage.activeCartHolders.length > 0 ? (
                      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                          Currently In Open Carts ({selectedPromoUsage.activeCartHolders.length})
                        </span>
                        <div className="mt-2.5 divide-y divide-purple-500/20">
                          {selectedPromoUsage.activeCartHolders.map((holder, idx) => (
                            <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-scnt-text">
                              <div className="min-w-0">
                                <span className="font-semibold">{holder.customerName}</span>
                                {holder.customerEmail ? (
                                  <span className="text-scnt-text-muted ml-2 break-all">({holder.customerEmail})</span>
                                ) : holder.visitorId ? (
                                  <span className="text-scnt-text-muted font-mono text-[10px] ml-2">
                                    (Guest #{holder.visitorId.slice(0, 8)})
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-left sm:text-right text-scnt-text-muted text-[11px] shrink-0">
                                <span>{holder.itemCount} items in cart</span>
                                <span className="ml-2">· {timeAgo(holder.lastActiveAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Redemptions List */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-scnt-text-muted mb-3">
                        Completed Orders Using This Coupon ({selectedPromoUsage.redemptions.length})
                      </h4>

                      {selectedPromoUsage.redemptions.length === 0 ? (
                        <div className="rounded-xl border border-scnt-border/40 p-6 text-center text-xs text-scnt-text-muted">
                          No orders have redeemed this promo code yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-scnt-border/40">
                          <table className="w-full text-left text-xs min-w-[520px]">
                            <thead className="bg-scnt-bg-elevated/40 text-scnt-text-muted border-b border-scnt-border/40">
                              <tr>
                                <th className="py-2.5 px-3 font-medium">Customer</th>
                                <th className="py-2.5 px-3 font-medium">Order Ref</th>
                                <th className="py-2.5 px-3 font-medium">Discount Saved</th>
                                <th className="py-2.5 px-3 font-medium">Order Total</th>
                                <th className="py-2.5 px-3 font-medium">Date</th>
                                <th className="py-2.5 px-3 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-scnt-border/30 text-scnt-text">
                              {selectedPromoUsage.redemptions.map((red) => (
                                <tr key={red.orderId} className="hover:bg-scnt-bg-elevated/20">
                                  <td className="py-2.5 px-3">
                                    <p className="font-semibold">{red.customer.fullName}</p>
                                    <p className="text-[11px] text-scnt-text-muted break-all">{red.customer.email}</p>
                                    {red.customer.phone ? (
                                      <p className="text-[10px] text-scnt-text-muted/70">{red.customer.phone}</p>
                                    ) : null}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-medium text-scnt-text">
                                    {red.orderRef}
                                  </td>
                                  <td className="py-2.5 px-3 text-emerald-400 font-mono font-semibold">
                                    -{formatMoney(red.discountAmount)}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-medium">
                                    {formatMoney(red.orderTotal)}
                                  </td>
                                  <td className="py-2.5 px-3 text-scnt-text-muted whitespace-nowrap">
                                    {new Date(red.orderDate).toLocaleDateString('en-EG', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="rounded bg-scnt-bg-elevated px-2 py-0.5 text-[10px] font-semibold text-scnt-text">
                                      {red.orderStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="flex-shrink-0 flex items-center justify-end border-t border-scnt-border/40 p-3 sm:p-4 bg-scnt-bg">
                    <Button variant="outline" onClick={() => setSelectedPromoUsage(null)} className="text-xs py-1.5 px-4">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'users' ? (
          <Card asMotion={false} className="p-5">
            <ul className="space-y-2">
              {users.map((item) => (
                <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-scnt-border/60 px-3 py-2">
                  <div><p className="text-sm">{item.full_name}</p><p className="text-xs text-scnt-text-muted">{item.email}</p></div>
                  <div className="flex gap-2">
                    <select className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm" value={item.role} onChange={(e) => void changeUserRole(item._id, e.target.value as 'user' | 'admin')} disabled={busy}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <Button variant="outline" onClick={() => void removeUser(item._id)} disabled={busy}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {activeTab === 'reviews' ? (
          <Card asMotion={false} className="p-5">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-4">Product Reviews</h2>
                {products.filter(p => p.reviews && p.reviews.length > 0).length === 0 ? (
                  <p className="text-sm text-scnt-text-muted">No reviews yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {products.filter(p => p.reviews && p.reviews.length > 0).map((product) => (
                      <li key={product._id} className="rounded-lg border border-scnt-border/60 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-xs text-scnt-text-muted">SKU: {product.slug}</p>
                          </div>
                        </div>
                        {product.reviews && product.reviews.length > 0 && (
                          <div className="space-y-2 border-t border-scnt-border/30 pt-2 mt-2">
                            {product.reviews.map((review) => (
                              <div key={review._id} className="bg-scnt-bg-base/30 rounded p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">{'★'.repeat(Math.floor(review.rating))}{review.rating % 1 !== 0 ? '✭' : ''}{'☆'.repeat(5 - Math.ceil(review.rating))}</span>
                                    <span className="text-xs text-scnt-text-muted">{review.rating.toFixed(1)}/5</span>
                                  </div>
                                </div>
                                <p className="text-sm italic text-scnt-text/80 break-words mb-1">"{review.review}"</p>
                                <p className="text-xs text-scnt-text-muted">By: {review.guestName || 'Guest'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        {activeTab === 'mailing' ? (
          <div className="space-y-4">
            <Card asMotion={false} className="p-5">
              <form className="grid gap-3" onSubmit={submitPromotionalMail}>
                <input
                  className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2"
                  placeholder="Email subject"
                  value={promoMailForm.subject}
                  onChange={(e) => setPromoMailForm((s) => ({ ...s, subject: e.target.value }))}
                  required
                />
                <input
                  className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2"
                  placeholder="Preheader (short intro text)"
                  value={promoMailForm.preheader}
                  onChange={(e) => setPromoMailForm((s) => ({ ...s, preheader: e.target.value }))}
                />
                <textarea
                  className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 font-mono text-xs"
                  placeholder="Campaign HTML body"
                  value={promoMailForm.contentHtml}
                  onChange={(e) => setPromoMailForm((s) => ({ ...s, contentHtml: e.target.value }))}
                  rows={14}
                  required
                />
                <label className="flex items-center gap-2 rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={promoMailForm.onlyVerified}
                    onChange={(e) => setPromoMailForm((s) => ({ ...s, onlyVerified: e.target.checked }))}
                  />
                  Send to verified users only
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy}>Send campaign</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPromoMailForm(emptyPromoMailForm)
                      setPromoMailResult(null)
                    }}
                    disabled={busy}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Card>

            {promoMailResult ? (
              <Card asMotion={false} className="p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-scnt-text-muted">Campaign result</p>
                <p className="mt-1 text-xs text-scnt-text-muted">
                  Audience: {promoMailResult.onlyVerified ? 'Verified users only' : 'All users'} · Processing time:{' '}
                  {promoMailResult.processingMs} ms
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Users</p>
                    <p className="text-lg">{promoMailResult.totalUsers}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Targeted / attempted</p>
                    <p className="text-lg">{promoMailResult.targetedRecipients}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Processed</p>
                    <p className="text-lg">{promoMailResult.processedCount}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Sent</p>
                    <p className="text-lg">{promoMailResult.sentCount}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Skipped</p>
                    <p className="text-lg">{promoMailResult.skippedCount}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Failed</p>
                    <p className="text-lg">{promoMailResult.failedCount}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Omitted total</p>
                    <p className="text-lg">{promoMailResult.omittedCount}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Missing email</p>
                    <p className="text-lg">{promoMailResult.omittedBreakdown.missingEmailCount}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Invalid email</p>
                    <p className="text-lg">{promoMailResult.omittedBreakdown.invalidEmailCount}</p>
                  </div>
                  <div className="rounded-lg border border-scnt-border/70 px-3 py-2">
                    <p className="text-xs text-scnt-text-muted">Duplicates</p>
                    <p className="text-lg">{promoMailResult.omittedBreakdown.duplicateEmailCount}</p>
                  </div>
                </div>
                {Object.keys(promoMailResult.skippedBreakdown || {}).length > 0 ? (
                  <div className="mt-4 rounded-lg border border-scnt-border/70 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-scnt-text-muted">Skipped reasons</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {Object.entries(promoMailResult.skippedBreakdown).map(([reason, count]) => (
                        <li key={reason} className="flex items-center justify-between gap-3">
                          <span className="text-scnt-text-muted">{reason}</span>
                          <span>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {promoMailResult.failureSamples?.length ? (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-scnt-text-muted">Failure samples (up to 5)</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {promoMailResult.failureSamples.map((sample, index) => (
                        <li key={`${sample.email}-${index}`} className="text-scnt-text-muted">
                          {sample.email}: {sample.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
