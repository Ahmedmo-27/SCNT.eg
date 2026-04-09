import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { useCartStore } from '../store/cartStore'

type CheckoutFormState = {
  fullName: string
  phone: string
  city: string
  address: string
  notes: string
}

const initialForm: CheckoutFormState = {
  fullName: '',
  phone: '',
  city: '',
  address: '',
  notes: '',
}

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)

  const [form, setForm] = useState<CheckoutFormState>(initialForm)
  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod')
  const [error, setError] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    [items],
  )
  const shipping = items.length > 0 ? 80 : 0
  const total = subtotal + shipping

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.city.trim() ||
      !form.address.trim()
    ) {
      setError('Please complete all required fields.')
      return
    }

    setError(null)
    setSubmitting(true)

    // Simulate checkout confirmation while backend APIs are being finalized.
    await new Promise((resolve) => setTimeout(resolve, 450))

    clear()
    setSubmitting(false)
    setOrderPlaced(true)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <h1 className="font-serif text-4xl text-scnt-text">Checkout</h1>
        <p className="mt-3 max-w-2xl text-sm text-scnt-text-muted">
          Complete your delivery details and confirm your order. For now, only
          cash on delivery is available.
        </p>

        {orderPlaced ? (
          <div className="mt-10 rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-8">
            <h2 className="font-serif text-3xl text-scnt-text">
              Order placed successfully
            </h2>
            <p className="mt-3 max-w-xl text-scnt-text-muted">
              Thank you for your order. Our team will contact you soon to
              confirm delivery details.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/shop">Continue shopping</Button>
              <Button to="/" variant="ghost">
                Back to home
              </Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-scnt-border bg-scnt-bg-elevated/50 p-8">
            <p className="text-scnt-text-muted">
              Your cart is empty. Add fragrances before checkout.
            </p>
            <div className="mt-6 flex gap-3">
              <Button to="/shop">Shop all fragrances</Button>
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
              <h2 className="font-serif text-2xl text-scnt-text">
                Delivery information
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">Full name *</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
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
                    className="w-full rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="01xxxxxxxxx"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-scnt-text">City *</span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="Cairo"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">Address *</span>
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    rows={4}
                    className="w-full resize-y rounded-xl border border-scnt-border bg-scnt-bg px-4 py-3 text-sm text-scnt-text outline-none ring-0 transition-colors placeholder:text-scnt-text-muted/65 focus:border-scnt-text/30"
                    placeholder="Street, building, floor, apartment"
                  />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-scnt-text">
                    Delivery notes (optional)
                  </span>
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
                <p className="text-sm font-medium text-scnt-text">
                  Payment method
                </p>
                <label className="mt-3 flex items-start gap-3 rounded-lg border border-scnt-border/70 bg-scnt-bg-elevated/60 p-3">
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm text-scnt-text">
                      Cash on Delivery
                    </span>
                    <span className="block text-xs text-scnt-text-muted">
                      Pay in cash when your order arrives.
                    </span>
                  </span>
                </label>
              </div>

              {error ? (
                <p className="mt-4 text-sm text-red-700">{error}</p>
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
              <h2 className="font-serif text-2xl text-scnt-text">
                Order summary
              </h2>
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
                      <p className="truncate text-sm text-scnt-text">
                        {i.name}
                      </p>
                      <p className="text-xs text-scnt-text-muted">
                        {i.quantity} × {formatEgp(i.price)}
                      </p>
                    </div>
                    <p className="text-sm text-scnt-text">
                      {formatEgp(i.quantity * i.price)}
                    </p>
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
