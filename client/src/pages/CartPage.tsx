import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { StarDivider } from '../components/ui/StarDivider'
import { useCartStore } from '../store/cartStore'

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function CartPage() {
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const shipping = items.length > 0 ? 80 : 0
  const total = subtotal + shipping

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">Your cart</h1>
        <p className="mt-3 max-w-2xl text-sm text-scnt-text-muted sm:text-base">
          Review your selection before checkout. Every bottle is prepared with the same care as in store.
        </p>

        <StarDivider className="py-8 sm:py-10" />

        {items.length === 0 ? (
          <section className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-8 sm:p-10">
            <h2 className="font-serif text-2xl text-scnt-text">Your cart is empty</h2>
            <p className="mt-3 max-w-xl text-sm text-scnt-text-muted">
              Discover the full catalogue and add your next signature fragrance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/shop">Shop all fragrances</Button>
              <Button to="/collections" variant="outline">
                Browse collections
              </Button>
            </div>
          </section>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] xl:gap-8">
            <section className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/45 p-5 sm:p-6">
              <div className="flex items-end justify-between gap-4 border-b border-scnt-border/80 pb-4">
                <h2 className="font-serif text-2xl text-scnt-text">Items</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-scnt-text-muted">
                  {items.length} line{items.length === 1 ? '' : 's'}
                </p>
              </div>

              <ul className="mt-5 space-y-4">
                {items.map((i) => (
                  <li
                    key={i.productId}
                    className="rounded-xl border border-scnt-border/75 bg-scnt-bg/55 p-4 backdrop-blur-sm sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <img
                          src={i.image}
                          alt={i.name}
                          className="h-16 w-16 rounded-lg object-cover ring-1 ring-scnt-border sm:h-20 sm:w-20"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-scnt-text sm:text-base">
                            {i.name}
                          </p>
                          <p className="mt-1 text-xs text-scnt-text-muted">
                            {formatEgp(i.price)} each
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-scnt-text sm:text-base">
                        {formatEgp(i.price * i.quantity)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-scnt-border/70 pt-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-scnt-text-muted">
                        Quantity
                      </p>
                      <span className="rounded-full border border-scnt-border/80 bg-scnt-bg-elevated/65 px-3 py-1 text-xs font-medium text-scnt-text">
                        x {i.quantity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="h-fit rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-6 sm:p-7 lg:sticky lg:top-[calc(var(--scnt-header-h,5.5rem)+1.25rem)]">
              <h2 className="font-serif text-2xl text-scnt-text">Order summary</h2>
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

              <p className="mt-5 text-xs text-scnt-text-muted">
                Shipping is calculated as a flat fee and finalized at checkout.
              </p>

              <div className="mt-7 flex flex-col gap-3">
                <Button to="/checkout" className="w-full">
                  Proceed to checkout
                </Button>
                <Button to="/shop" variant="ghost" className="w-full">
                  Continue shopping
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => clear()}>
                  Clear cart
                </Button>
              </div>
              <p className="mt-4 text-center text-xs text-scnt-text-muted">
                Need help choosing?{' '}
                <Link to="/find-your-scnt" className="text-scnt-text underline-offset-4 hover:underline">
                  Find your SCNT
                </Link>
              </p>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}
