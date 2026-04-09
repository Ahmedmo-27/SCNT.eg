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
} from '../services/adminApi'

type TabKey = 'overview' | 'products' | 'collections' | 'orders' | 'promos' | 'users'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'collections', label: 'Collections' },
  { key: 'orders', label: 'Orders' },
  { key: 'promos', label: 'Promo codes' },
  { key: 'users', label: 'Users' },
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
  topNotes: '',
  heartNotes: '',
  baseNotes: '',
  description: '',
}

type CollectionForm = Omit<AdminCollection, '_id'>
const emptyCollectionForm: CollectionForm = {
  name: '',
  slug: '',
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
        stock: Number(productForm.stock || 0),
        images: toCsvList(productForm.images),
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Users</p><p className="mt-2 text-3xl">{dashboard?.usersCount ?? '—'}</p></Card>
            <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Products</p><p className="mt-2 text-3xl">{dashboard?.productsCount ?? '—'}</p></Card>
            <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Collections</p><p className="mt-2 text-3xl">{dashboard?.collectionsCount ?? '—'}</p></Card>
            <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Orders</p><p className="mt-2 text-3xl">{dashboard?.ordersCount ?? '—'}</p></Card>
            <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Pending orders</p><p className="mt-2 text-3xl">{dashboard?.pendingOrders ?? '—'}</p></Card>
            <Card asMotion={false} className="p-5"><p className="text-xs uppercase text-scnt-text-muted">Revenue</p><p className="mt-2 text-3xl">{dashboard ? formatMoney(dashboard.totalRevenue) : '—'}</p></Card>
          </div>
        ) : null}

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
          <div className="space-y-4">
            <Card asMotion={false} className="p-5">
              <form className="grid gap-3 md:grid-cols-2" onSubmit={submitPromo}>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" placeholder="Code" value={promoForm.code} onChange={(e) => setPromoForm((s) => ({ ...s, code: e.target.value }))} required />
                <select className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" value={promoForm.discountType} onChange={(e) => setPromoForm((s) => ({ ...s, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' }))}><option value="PERCENTAGE">PERCENTAGE</option><option value="FIXED">FIXED</option></select>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" type="number" placeholder="Discount value" value={promoForm.discountValue} onChange={(e) => setPromoForm((s) => ({ ...s, discountValue: e.target.value }))} required />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" type="number" placeholder="Min subtotal" value={promoForm.minSubtotal} onChange={(e) => setPromoForm((s) => ({ ...s, minSubtotal: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" type="number" placeholder="Max discount (optional)" value={promoForm.maxDiscount} onChange={(e) => setPromoForm((s) => ({ ...s, maxDiscount: e.target.value }))} />
                <label className="flex items-center gap-2 rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2 text-sm"><input type="checkbox" checked={promoForm.isActive} onChange={(e) => setPromoForm((s) => ({ ...s, isActive: e.target.checked }))} />Active</label>
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" type="datetime-local" value={promoForm.startsAt || ''} onChange={(e) => setPromoForm((s) => ({ ...s, startsAt: e.target.value }))} />
                <input className="rounded-lg border border-scnt-border/80 bg-scnt-bg px-3 py-2" type="datetime-local" value={promoForm.expiresAt || ''} onChange={(e) => setPromoForm((s) => ({ ...s, expiresAt: e.target.value }))} />
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" disabled={busy}>{editingPromoId ? 'Update promo' : 'Create promo'}</Button>
                  {editingPromoId ? <Button variant="outline" onClick={() => { setEditingPromoId(null); setPromoForm(emptyPromoForm) }}>Cancel edit</Button> : null}
                </div>
              </form>
            </Card>
            <Card asMotion={false} className="p-5">
              <ul className="space-y-2">
                {promos.map((item) => (
                  <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-scnt-border/60 px-3 py-2">
                    <div><p className="text-sm">{item.code} · {item.discountType} {item.discountValue}</p><p className="text-xs text-scnt-text-muted">{item.isActive ? 'Active' : 'Inactive'}</p></div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => startEditPromo(item)} disabled={busy}>Edit</Button>
                      <Button variant="outline" onClick={() => void removePromo(item._id)} disabled={busy}>Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
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
      </div>
    </Layout>
  )
}
