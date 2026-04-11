import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { StarDivider } from '../components/ui/StarDivider'
import { useI18n } from '../i18n/I18nContext'
import { formatEgp } from '../lib/formatEgp'
import { useCartStore } from '../store/cartStore'
import { useWishlistStore } from '../store/wishlistStore'

export function WishlistPage() {
  const { t, locale } = useI18n()
  const items = useWishlistStore((s) => s.items)
  const removeItem = useWishlistStore((s) => s.removeItem)
  const clear = useWishlistStore((s) => s.clear)
  const addToCart = useCartStore((s) => s.addItem)

  const itemsLabel =
    items.length === 1 ? t('wish.itemsOne') : t('wish.itemsMany', { n: items.length })

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('wish.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm text-scnt-text-muted sm:text-base">{t('wish.sub')}</p>

        <StarDivider className="py-8 sm:py-10" />

        {items.length === 0 ? (
          <section className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-8 sm:p-10">
            <h2 className="font-serif text-2xl text-scnt-text">{t('wish.emptyTitle')}</h2>
            <p className="mt-3 max-w-xl text-sm text-scnt-text-muted">{t('wish.emptySub')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/shop">{t('wish.shop')}</Button>
              <Button to="/collections" variant="outline">
                {t('wish.browse')}
              </Button>
            </div>
          </section>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-scnt-text-muted">{itemsLabel}</p>
              <Button type="button" variant="outline" className="px-5 py-2 text-xs" onClick={() => clear()}>
                {t('wish.clear')}
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
                        {t('wish.inspired', { name: item.inspiredBy })}
                      </p>
                      <p className="mt-2 text-sm text-scnt-text-muted">{formatEgp(item.price, locale)}</p>
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
                      {t('wish.addCart')}
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-scnt-text-muted transition-colors hover:text-scnt-text"
                      onClick={() => removeItem(item.productId)}
                    >
                      {t('wish.remove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-scnt-text-muted">
          {t('wish.help')}{' '}
          <Link to="/find-your-scnt" className="text-scnt-text underline-offset-4 hover:underline">
            {t('wish.find')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
