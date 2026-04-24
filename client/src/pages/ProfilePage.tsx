import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { clearStoredAuthToken, getStoredAuthToken } from '../lib/authStorage'
import { fetchProfile, updateProfile, type AuthUser } from '../services/authApi'
import { fetchMyOrders, type OrderLine, type UserOrder } from '../services/ordersApi'
import { Card } from '../components/ui/Card'
import { EightPointStar } from '../components/ui/EightPointStar'
import { EGYPT_GOVERNORATES, getCitiesForGovernorate } from '../data/egyptLocations'
import { useI18n } from '../i18n/I18nContext'
import type { Locale } from '../i18n/types'
import { formatEgp } from '../lib/formatEgp'

const fieldClass =
  'w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none transition-colors focus:border-scnt-text/60'
const locationSelectClass =
  'w-full rounded-xl border border-scnt-border/70 bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none transition-colors focus:border-scnt-text/60 disabled:cursor-not-allowed disabled:opacity-50'
const labelClass = 'mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted'

function formatJoinedDate(createdAt: string | undefined, locale: Locale): string | null {
  if (!createdAt) return null
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDeliveryAddress(addr: AuthUser['address']): string | null {
  if (!addr) return null
  const parts = [addr.addressLine1, addr.city, addr.addressLine2, addr.postalCode].filter(
    (p): p is string => Boolean(p && String(p).trim()),
  )
  return parts.length > 0 ? parts.join(', ') : null
}

function inferGovernorate(profile: AuthUser): string {
  const g = profile.address?.addressLine2?.trim()
  if (g && (EGYPT_GOVERNORATES as readonly string[]).includes(g)) return g
  return ''
}

function formatOrderDate(iso: string, locale: Locale, dash: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return dash
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function orderRef(id: string): string {
  const tail = id.replace(/[^a-f0-9]/gi, '').slice(-8).toUpperCase()
  return tail.length > 0 ? `#${tail}` : `#${id.slice(0, 8)}`
}

function lineProductName(line: OrderLine, itemFallback: string): string {
  const p = line.product
  if (p && typeof p === 'object' && 'name' in p && typeof p.name === 'string') return p.name
  return itemFallback
}

function lineProductImage(line: OrderLine): string | null {
  const p = line.product
  if (
    p &&
    typeof p === 'object' &&
    'images' in p &&
    Array.isArray(p.images) &&
    typeof p.images[0] === 'string' &&
    p.images[0].trim()
  ) {
    return p.images[0]
  }
  return null
}

function orderItemsSummary(order: UserOrder, noLines: string, itemFallback: string): string {
  if (!order.items?.length) return noLines
  return order.items.map((line) => `${lineProductName(line, itemFallback)} ×${line.quantity}`).join(', ')
}

function orderAddressSummary(order: UserOrder): string | null {
  if (!order.address) return null
  const parts = [
    order.address.fullName,
    order.address.phone,
    order.address.addressLine1,
    order.address.city,
    order.address.addressLine2,
    order.address.postalCode,
  ].filter((p): p is string => Boolean(p && String(p).trim()))
  return parts.length > 0 ? parts.join(', ') : null
}

function orderStatusClass(status: UserOrder['status']): string {
  switch (status) {
    case 'PENDING':
      return 'bg-scnt-bg-muted/75 text-scnt-text ring-1 ring-scnt-border/90'
    case 'CONFIRMED':
      return 'bg-scnt-bg-muted/70 text-scnt-text ring-1 ring-scnt-text/10'
    case 'PAID':
      return 'bg-scnt-bg-muted/60 text-scnt-text'
    case 'SHIPPED':
      return 'bg-scnt-bg-muted/75 text-scnt-text ring-1 ring-scnt-text/12'
    default:
      return 'bg-scnt-bg-muted/70 text-scnt-text'
  }
}

export function ProfilePage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [draftLine1, setDraftLine1] = useState('')
  const [draftGovernorate, setDraftGovernorate] = useState('')
  const [draftCity, setDraftCity] = useState('')
  const [draftPostal, setDraftPostal] = useState('')

  const [orders, setOrders] = useState<UserOrder[]>([])
  const [ordersStatus, setOrdersStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([])

  const cityOptions = useMemo(() => getCitiesForGovernorate(draftGovernorate), [draftGovernorate])

  const syncDraftFromProfile = useCallback((p: AuthUser) => {
    setDraftName(p.full_name)
    setDraftEmail(p.email)
    setDraftPhone(p.address?.phone?.trim() ?? '')
    setDraftLine1(p.address?.addressLine1?.trim() ?? '')
    setDraftGovernorate(inferGovernorate(p))
    setDraftCity(p.address?.city?.trim() ?? '')
    setDraftPostal(p.address?.postalCode?.trim() ?? '')
  }, [])

  const loadProfile = useCallback(async () => {
    if (!getStoredAuthToken()) return
    setLoadStatus('loading')
    try {
      const user = await fetchProfile()
      setProfile(user)
      setLoadStatus('ready')
    } catch {
      setLoadStatus('error')
      if (!getStoredAuthToken()) {
        navigate('/login', { replace: true })
      }
    }
  }, [navigate])

  const loadOrders = useCallback(async () => {
    if (!getStoredAuthToken()) return
    setOrdersStatus('loading')
    try {
      const list = await fetchMyOrders()
      setOrders(list)
      setOrdersStatus('ready')
    } catch {
      setOrdersStatus('error')
      if (!getStoredAuthToken()) {
        navigate('/login', { replace: true })
      }
    }
  }, [navigate])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    if (profile && !editing) {
      syncDraftFromProfile(profile)
    }
  }, [profile, editing, syncDraftFromProfile])

  const logout = () => {
    clearStoredAuthToken()
    navigate('/', { replace: true })
  }

  const startEdit = () => {
    if (profile) syncDraftFromProfile(profile)
    setSaveError(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    if (profile) syncDraftFromProfile(profile)
    setSaveError(null)
    setEditing(false)
  }

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateProfile({
        full_name: draftName.trim(),
        email: draftEmail.trim(),
        address: {
          fullName: draftName.trim(),
          phone: draftPhone.trim(),
          addressLine1: draftLine1.trim(),
          city: draftCity.trim(),
          addressLine2: draftGovernorate.trim(),
          postalCode: draftPostal.trim(),
        },
      })
      setProfile(updated)
      syncDraftFromProfile(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('profile.saveFail'))
    } finally {
      setSaving(false)
    }
  }

  if (!getStoredAuthToken()) {
    return <Navigate to="/login" replace />
  }

  const deliveryLine = profile ? formatDeliveryAddress(profile.address) : null
  const phone = profile?.address?.phone?.trim()
  const joined = profile ? formatJoinedDate(profile.createdAt, locale) : null

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <header className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
              <EightPointStar size={9} className="opacity-45" />
              {t('profile.kicker')}
            </p>
            <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('profile.title')}</h1>
            <p className="mt-4 text-scnt-text-muted">{t('profile.sub')}</p>
          </header>
          <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={logout}>
            {t('profile.logout')}
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card asMotion={false} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scnt-text-muted">{t('profile.details')}</p>

            {loadStatus === 'loading' ? (
              <p className="mt-4 text-sm text-scnt-text-muted">{t('profile.loading')}</p>
            ) : loadStatus === 'error' && !profile ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-scnt-text-muted">{t('profile.loadErr')}</p>
                <button
                  type="button"
                  onClick={() => void loadProfile()}
                  className="w-full rounded-full border border-scnt-border/80 px-4 py-2.5 text-sm text-scnt-text transition-colors hover:bg-scnt-bg-muted/60"
                >
                  {t('profile.retry')}
                </button>
              </div>
            ) : profile && editing ? (
              <form className="mt-4 space-y-4" onSubmit={handleSave}>
                <div>
                  <label htmlFor="profile-name" className={labelClass}>
                    {t('reg.fullName')}
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className={labelClass}>
                    {t('profile.email')}
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="profile-phone" className={labelClass}>
                    {t('profile.phone')}
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    className={fieldClass}
                    placeholder={t('reg.phPhone')}
                  />
                </div>
                <div>
                  <label htmlFor="profile-line1" className={labelClass}>
                    {t('reg.addrLine')}
                  </label>
                  <input
                    id="profile-line1"
                    type="text"
                    value={draftLine1}
                    onChange={(e) => setDraftLine1(e.target.value)}
                    className={fieldClass}
                    placeholder={t('profile.phAddr')}
                  />
                </div>
                <div>
                  <label htmlFor="profile-governorate" className={labelClass}>
                    {t('profile.gov')}
                  </label>
                  <select
                    id="profile-governorate"
                    value={draftGovernorate}
                    onChange={(e) => {
                      setDraftGovernorate(e.target.value)
                      setDraftCity('')
                    }}
                    className={locationSelectClass}
                  >
                    <option value="">{t('reg.selGov')}</option>
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-city" className={labelClass}>
                    {t('profile.city')}
                  </label>
                  <select
                    id="profile-city"
                    value={draftCity}
                    onChange={(e) => setDraftCity(e.target.value)}
                    disabled={!draftGovernorate}
                    className={locationSelectClass}
                  >
                    <option value="">{draftGovernorate ? t('reg.selCity') : t('reg.selGovFirst')}</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-postal" className={labelClass}>
                    {t('profile.postal')}
                  </label>
                  <input
                    id="profile-postal"
                    type="text"
                    value={draftPostal}
                    onChange={(e) => setDraftPostal(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                {saveError ? (
                  <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-scnt-text" role="alert">
                    {saveError}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button type="submit" className="w-full sm:flex-1" disabled={saving}>
                    {saving ? t('profile.saving') : t('profile.save')}
                  </Button>
                  <Button type="button" variant="outline" className="w-full sm:flex-1" disabled={saving} onClick={cancelEdit}>
                    {t('profile.cancel')}
                  </Button>
                </div>
              </form>
            ) : profile ? (
              <>
                <div className="mt-4 space-y-3 text-sm text-scnt-text-muted">
                  <p>
                    <span className="text-scnt-text">{t('profile.viewName')}</span> {profile.full_name}
                  </p>
                  <p>
                    <span className="text-scnt-text">{t('profile.viewEmail')}</span> {profile.email}
                  </p>
                  <p>
                    <span className="text-scnt-text">{t('profile.viewPhone')}</span> {phone || t('profile.dash')}
                  </p>
                  {deliveryLine ? (
                    <p>
                      <span className="text-scnt-text">{t('profile.viewAddr')}</span> {deliveryLine}
                    </p>
                  ) : null}
                  {joined ? (
                    <p>
                      <span className="text-scnt-text">{t('profile.member')}</span> {joined}
                    </p>
                  ) : null}
                  {profile.role === 'admin' ? (
                    <p className="text-xs uppercase tracking-[0.15em] text-scnt-text">{t('profile.admin')}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="mt-6 w-full rounded-full border border-scnt-border/80 px-4 py-2.5 text-sm text-scnt-text transition-colors hover:bg-scnt-bg-muted/60"
                  onClick={startEdit}
                >
                  {t('profile.edit')}
                </button>
                {profile.role === 'admin' ? (
                  <Link
                    to="/admin"
                    className="mt-3 block w-full rounded-full border border-scnt-text/70 px-4 py-2.5 text-center text-xs uppercase tracking-[0.14em] text-scnt-text transition-colors hover:bg-scnt-bg-muted/60"
                  >
                    {t('profile.openAdmin')}
                  </Link>
                ) : null}
              </>
            ) : null}
          </Card>

          <Card asMotion={false} className="p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scnt-text-muted">{t('profile.yourOrders')}</p>
              <Link to="/shop" className="text-xs uppercase tracking-[0.15em] text-scnt-text underline-offset-4 hover:underline">
                {t('profile.shopAgain')}
              </Link>
            </div>

            {ordersStatus === 'loading' ? (
              <p className="mt-6 text-sm text-scnt-text-muted">{t('profile.ordersLoading')}</p>
            ) : ordersStatus === 'error' ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-scnt-text-muted">{t('profile.ordersErr')}</p>
                <button
                  type="button"
                  onClick={() => void loadOrders()}
                  className="rounded-full border border-scnt-border/80 px-4 py-2 text-sm text-scnt-text transition-colors hover:bg-scnt-bg-muted/60"
                >
                  {t('profile.retry')}
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-scnt-border/80 bg-scnt-bg-muted/25 px-5 py-10 text-center">
                <p className="text-sm text-scnt-text-muted">{t('profile.noOrdersSub')}</p>
                <Link
                  to="/shop"
                  className="mt-4 inline-block text-sm font-medium text-scnt-text underline-offset-4 hover:underline"
                >
                  {t('profile.browseFrag')}
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {orders.map((order) => (
                  <li
                    key={order._id}
                    className="rounded-xl border border-scnt-border/70 bg-scnt-bg-elevated/35 px-4 py-4 sm:px-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-mono text-sm font-semibold text-scnt-text">{orderRef(order._id)}</span>
                        <span className="text-sm text-scnt-text-muted">
                          {formatOrderDate(order.createdAt, locale, t('profile.dash'))}
                        </span>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${orderStatusClass(order.status)}`}
                      >
                        {t(`profile.status.${order.status}`)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-scnt-text-muted">
                      {orderItemsSummary(order, t('profile.noLines'), t('profile.item'))}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-scnt-text">{formatEgp(order.total, locale)}</p>
                      <button
                        type="button"
                        onClick={() => toggleOrderDetails(order._id)}
                        className="rounded-full border border-scnt-border/80 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-scnt-text transition-colors hover:bg-scnt-bg-muted/60"
                        aria-expanded={expandedOrderIds.includes(order._id)}
                      >
                        {expandedOrderIds.includes(order._id) ? t('profile.hideDetails') : t('profile.viewDetails')}
                      </button>
                    </div>
                    {expandedOrderIds.includes(order._id) ? (
                      <div className="mt-3 rounded-lg border border-scnt-border/60 bg-scnt-bg-muted/25 p-3">
                        <ul className="space-y-2">
                          {order.items.map((line, idx) => (
                            <li
                              key={`${order._id}-${typeof line.product === 'string' ? line.product : idx}-${idx}`}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {lineProductImage(line) ? (
                                  <picture>
                                    <source srcSet={lineProductImage(line) ?? ''} type="image/png" />
                                    <img
                                      src={lineProductImage(line) ?? ''}
                                      alt={lineProductName(line, t('profile.item'))}
                                      className="h-12 w-12 shrink-0 rounded-md border border-scnt-border/70 object-cover"
                                      loading="lazy"
                                    />
                                  </picture>
                                ) : (
                                  <div className="h-12 w-12 shrink-0 rounded-md border border-scnt-border/70 bg-scnt-bg-muted/40" />
                                )}
                                <span className="truncate text-scnt-text-muted">
                                  {lineProductName(line, t('profile.item'))} ×{line.quantity}
                                </span>
                              </div>
                              <span className="font-medium text-scnt-text">
                                {formatEgp(line.price * line.quantity, locale)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {orderAddressSummary(order) ? (
                          <p className="mt-3 border-t border-scnt-border/50 pt-3 text-sm text-scnt-text-muted">
                            <span className="text-scnt-text">{t('profile.orderAddr')}:</span> {orderAddressSummary(order)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}
