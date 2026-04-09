import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { EGYPT_GOVERNORATES, getCitiesForGovernorate } from '../data/egyptLocations'
import { getStoredAuthToken } from '../lib/authStorage'
import { fetchProfile, type AuthUser } from '../services/authApi'
import { replaceServerCart } from '../services/cartApi'
import { createOrder } from '../services/ordersApi'
import { useCartStore } from '../store/cartStore'

type CheckoutFormState = {
  fullName: string
  phone: string
  postalCode: string
  governorate: string
  city: string
  address: string
  notes: string
}

function inferGovernorate(profile: AuthUser): string {
  const g = profile.address?.addressLine2?.trim()
  if (g && (EGYPT_GOVERNORATES as readonly string[]).includes(g)) return g
  return ''
}

function formFromProfile(p: AuthUser): CheckoutFormState {
  const governorate = inferGovernorate(p)
  const cityRaw = p.address?.city?.trim() ?? ''
  const cities = governorate ? getCitiesForGovernorate(governorate) : []
  const city = governorate && cityRaw && cities.includes(cityRaw) ? cityRaw : ''

  return {
    fullName: (p.address?.fullName?.trim() || p.full_name || '').trim(),
    phone: p.address?.phone?.trim() ?? '',
    postalCode: p.address?.postalCode?.trim() ?? '',
    governorate,
    city,
    address: p.address?.addressLine1?.trim() ?? '',
    notes: '',
  }
}

function isInitialCheckoutForm(f: CheckoutFormState): boolean {
  return (
    f.fullName === '' &&
    f.phone === '' &&
    f.postalCode === '' &&
    f.governorate === '' &&
    f.city === '' &&
    f.address === '' &&
    f.notes === ''
  )
}

const initialForm: CheckoutFormState = {
  fullName: '',
  phone: '',
  postalCode: '',
  governorate: '',
  city: '',
  address: '',
  notes: '',
}

const checkoutSelectClass =
  'w-full rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30 disabled:cursor-not-allowed disabled:opacity-50'

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

function orderRef(id: string): string {
  const tail = id.replace(/[^a-f0-9]/gi, '').slice(-8).toUpperCase()
  return tail.length > 0 ? `#${tail}` : `#${id.slice(0, 8)}`
}

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const promo = useCartStore((s) => s.promo)
  const clear = useCartStore((s) => s.clear)

  const [form, setForm] = useState<CheckoutFormState>(initialForm)
  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod')
  const [error, setError] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<{ id: string; total: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const authed = Boolean(getStoredAuthToken())

  useEffect(() => {
    if (!authed || items.length === 0 || placedOrder) return

    let cancelled = false
    ;(async () => {
      try {
        const profile = await fetchProfile()
        if (cancelled) return
        setForm((prev) => (isInitialCheckoutForm(prev) ? formFromProfile(profile) : prev))
      } catch {
        /* keep empty form; submit still validates token */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authed, items.length, placedOrder])

  const cityOptions = useMemo(
    () => getCitiesForGovernorate(form.governorate),
    [form.governorate],
  )

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    [items],
  )
  const discount = useMemo(() => {
    if (!promo || subtotal <= 0) return 0
    if (promo.discountType === 'PERCENTAGE') {
      const percentageValue = (subtotal * promo.discountValue) / 100
      const capped =
        promo.maxDiscount != null ? Math.min(percentageValue, promo.maxDiscount) : percentageValue
      return Math.min(subtotal, Math.max(0, capped))
    }
    return Math.min(subtotal, Math.max(0, promo.discountValue))
  }, [promo, subtotal])
  const shipping = items.length > 0 ? 80 : 0
  const total = Math.max(0, subtotal + shipping - discount)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    if (!getStoredAuthToken()) {
      setError('Please log in or create an account to make an order.')
      return
    }

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.postalCode.trim() ||
      !form.governorate.trim() ||
      !form.city.trim() ||
      !form.address.trim()
    ) {
      setError('Please complete all required fields.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await replaceServerCart(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))

      const addressLine1 = form.notes.trim()
        ? `${form.address.trim()}\n\nNote: ${form.notes.trim()}`
        : form.address.trim()

      const order = await createOrder({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        addressLine1,
        addressLine2: form.governorate.trim(),
        postalCode: form.postalCode.trim(),
      })

      clear()
      setPlacedOrder({
        id: String(order._id),
        total: order.total,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <h1 className="font-serif text-4xl text-scnt-text">Checkout</h1>
        <p className="mt-3 max-w-2xl text-sm text-scnt-text-muted">
          Complete your delivery details and confirm your order. Cash on delivery only.
        </p>

        {placedOrder ? (
          <div className="mt-10 rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-8">
            <h2 className="font-serif text-3xl text-scnt-text">Order placed successfully</h2>
            <p className="mt-3 max-w-xl text-scnt-text-muted">
              Thank you for your order. Our team will contact you soon to confirm delivery details.
            </p>
            <p className="mt-4 text-sm text-scnt-text">
              <span className="text-scnt-text-muted">Reference </span>
              <span className="font-mono font-semibold">{orderRef(placedOrder.id)}</span>
            </p>
            <p className="mt-1 text-sm text-scnt-text">
              <span className="text-scnt-text-muted">Total charged </span>
              <span className="font-medium">{formatEgp(placedOrder.total)}</span>
              <span className="text-scnt-text-muted"> (includes shipping)</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/profile">View your orders</Button>
              <Button to="/shop">Continue shopping</Button>
              <Button to="/" variant="ghost">
                Back to home
              </Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-scnt-border bg-scnt-bg-elevated/50 p-8">
            <p className="text-scnt-text-muted">Your cart is empty. Add fragrances before checkout.</p>
            <div className="mt-6 flex gap-3">
              <Button to="/shop">Shop all fragrances</Button>
              <Button to="/cart" variant="ghost">
                Back to cart
              </Button>
            </div>
          </div>
        ) : !authed ? (
          <div className="mt-10 rounded-2xl border border-scnt-border bg-scnt-bg-elevated/50 p-8 sm:p-10">
            <h2 className="font-serif text-2xl text-scnt-text">Account required</h2>
            <p className="mt-3 max-w-xl text-sm text-scnt-text-muted">
              Please log in or create an account to make an order. Your cart will stay as it is until you do.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/login" linkState={{ from: '/checkout' }}>
                Log in
              </Button>
              <Button to="/register" variant="outline">
                Create account
              </Button>
              <Button to="/cart" variant="ghost">
                Back to cart
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/50 p-6 sm:p-8"
            >
              <h2 className="font-serif text-2xl text-scnt-text">Delivery information</h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">Full name *</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="Ahmed Mohamed"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-scnt-text">Phone number *</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    required
                    autoComplete="tel"
                    className="w-full rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="01xxxxxxxxx"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-scnt-text">Postal code *</span>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, postalCode: e.target.value }))
                    }
                    required
                    autoComplete="postal-code"
                    className="w-full rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="Postal code"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">Governorate *</span>
                  <select
                    value={form.governorate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        governorate: e.target.value,
                        city: '',
                      }))
                    }
                    required
                    className={checkoutSelectClass}
                  >
                    <option value="">Select governorate</option>
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">City *</span>
                  <select
                    value={form.city}
                    disabled={!form.governorate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    required
                    className={checkoutSelectClass}
                  >
                    <option value="">
                      {form.governorate ? 'Select city' : 'Select governorate first'}
                    </option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">Address *</span>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    required
                    rows={4}
                    className="w-full resize-y rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="Street, building, floor, apartment"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">Delivery notes (optional)</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    className="w-full resize-y rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="Landmark or preferred delivery time"
                  />
                </label>
              </div>

              <div className="mt-8 rounded-xl border border-scnt-border/80 bg-scnt-bg p-4">
                <p className="text-sm font-medium text-scnt-text">Payment method</p>
                <label className="mt-3 flex items-start gap-3 rounded-lg border border-scnt-border/70 bg-scnt-bg-elevated/60 p-3">
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm text-scnt-text">Cash on Delivery</span>
                    <span className="block text-xs text-scnt-text-muted">
                      Pay in cash when your order arrives.
                    </span>
                  </span>
                </label>
              </div>

              {error ? (
                <p className="mt-4 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Placing order...' : 'Place order'}
                </Button>
                <Link
                  to="/cart"
                  className="text-sm text-scnt-text underline-offset-4 hover:underline"
                >
                  Back to cart
                </Link>
              </div>
            </form>

            <aside className="h-fit rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-6 sm:p-8">
              <h2 className="font-serif text-2xl text-scnt-text">Order summary</h2>
              <ul className="mt-6 space-y-4 border-b border-scnt-border pb-6">
                {items.map((i) => (
                  <li key={i.productId} className="flex items-center gap-3">
                    <img
                      src={i.image}
                      alt={i.name}
                      className="h-12 w-12 rounded-md object-cover ring-1 ring-scnt-border"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-scnt-text">{i.name}</p>
                      <p className="text-xs text-scnt-text-muted">
                        {i.quantity} × {formatEgp(i.price)}
                      </p>
                    </div>
                    <p className="text-sm text-scnt-text">{formatEgp(i.quantity * i.price)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between text-scnt-text-muted">
                  <dt>Subtotal</dt>
                  <dd>{formatEgp(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between text-scnt-text-muted">
                  <dt>Shipping</dt>
                  <dd>{formatEgp(shipping)}</dd>
                </div>
                {discount > 0 ? (
                  <div className="flex items-center justify-between text-green-700">
                    <dt>Discount {promo ? `(${promo.code})` : ''}</dt>
                    <dd>-{formatEgp(discount)}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-scnt-border pt-3 font-medium text-scnt-text">
                  <dt>Total</dt>
                  <dd>{formatEgp(total)}</dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}
