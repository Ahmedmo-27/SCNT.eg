import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { StarDivider } from '../components/ui/StarDivider'
import { useCartStore } from '../store/cartStore'
import { useWishlistStore } from '../store/wishlistStore'

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function WishlistPage() {
  const items = useWishlistStore((s) => s.items)
  const removeItem = useWishlistStore((s) => s.removeItem)
  const clear = useWishlistStore((s) => s.clear)
  const addToCart = useCartStore((s) => s.addItem)

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">My wishlist</h1>
        <p className="mt-3 max-w-2xl text-sm text-scnt-text-muted sm:text-base">
          Save the fragrances you love and move them to your cart when you are ready.
        </p>

        <StarDivider className="py-8 sm:py-10" />

        {items.length === 0 ? (
          <section className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-8 sm:p-10">
            <h2 className="font-serif text-2xl text-scnt-text">Your wishlist is empty</h2>
            <p className="mt-3 max-w-xl text-sm text-scnt-text-muted">
              Start exploring and tap the heart on any product card to save it here.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/shop">Shop all fragrances</Button>
              <Button to="/collections" variant="outline">
                Browse collections
              </Button>
            </div>
          </section>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-scnt-text-muted">
                {items.length} item{items.length === 1 ? '' : 's'}
              </p>
              <Button type="button" variant="outline" className="px-5 py-2 text-xs" onClick={() => clear()}>
                Clear wishlist
              </Button>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/45 p-4 backdrop-blur-sm sm:p-5"
                >
                  <Link to={`/product/${item.slug}`} className="block">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-52 w-full rounded-xl object-cover ring-1 ring-scnt-border/80"
                      loading="lazy"
                    />
                    <div className="mt-4">
                      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-scnt-text-muted">
                        {item.collection}
                      </p>
                      <h3 className="mt-1 font-serif text-xl text-scnt-text">{item.name}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-scnt-text-muted">
                        Inspired by {item.inspiredBy}
                      </p>
                      <p className="mt-2 text-sm text-scnt-text-muted">{formatEgp(item.price)}</p>
                    </div>
                  </Link>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-scnt-border/75 pt-4">
                    <Button
                      type="button"
                      className="px-4 py-2 text-xs"
                      onClick={() =>
                        addToCart({
                          productId: item.productId,
                          name: item.name,
                          price: item.price,
                          quantity: 1,
                          image: item.image,
                        })
                      }
                    >
                      Add to cart
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-scnt-text-muted transition-colors hover:text-scnt-text"
                      onClick={() => removeItem(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-scnt-text-muted">
          Need a hand deciding?{' '}
          <Link to="/find-your-scnt" className="text-scnt-text underline-offset-4 hover:underline">
            Find your SCNT
          </Link>
        </p>
      </div>
    </Layout>
  )
}
