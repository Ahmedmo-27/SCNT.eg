import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
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
  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <h1 className="font-serif text-4xl text-scnt-text">Cart</h1>
        {items.length === 0 ? (
          <p className="mt-8 text-scnt-text-muted">
            Your cart is empty.{' '}
            <Link to="/shop" className="text-scnt-text underline-offset-4 hover:underline">
              Shop all fragrances
            </Link>
            .
          </p>
        ) : (
          <>
            <ul className="mt-10 space-y-6 border-t border-scnt-border pt-8">
              {items.map((i) => (
                <li
                  key={i.productId}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={i.image}
                      alt={i.name}
                      className="h-14 w-14 rounded-lg object-cover ring-1 ring-scnt-border"
                      loading="lazy"
                    />
                    <div>
                      <p className="font-medium text-scnt-text">{i.name}</p>
                      <p className="text-scnt-text-muted">
                      × {i.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-scnt-text">
                    {formatEgp(i.price * i.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-4 border-t border-scnt-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-serif text-xl text-scnt-text">
                {formatEgp(total)}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="ghost" onClick={() => clear()}>
                  Clear
                </Button>
                <Button to="/checkout">Checkout</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
