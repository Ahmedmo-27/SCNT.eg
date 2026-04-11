import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { StarDivider } from '../components/ui/StarDivider'
import { useI18n } from '../i18n/I18nContext'
import { formatEgp } from '../lib/formatEgp'
import { getStoredAuthToken } from '../lib/authStorage'
import { fetchServerCart } from '../services/cartApi'
import { useCartStore } from '../store/cartStore'

export function CartPage() {
  const { t, locale } = useI18n()
  const items = useCartStore((s) => s.items)
  const promo = useCartStore((s) => s.promo)
  const summary = useCartStore((s) => s.summary)
  const hydrateFromServer = useCartStore((s) => s.hydrateFromServer)
  const applyPromo = useCartStore((s) => s.applyPromo)
  const removePromo = useCartStore((s) => s.removePromo)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoMessage, setPromoMessage] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  useEffect(() => {
    if (!getStoredAuthToken()) return

    let cancelled = false
    ;(async () => {
      try {
        const serverCart = await fetchServerCart()
        if (cancelled) return

        const mapped =
          serverCart.lines?.map((line) => ({
            productId: line.productId,
            name: line.name,
            price: Number(line.unitPrice || 0),
            quantity: Number(line.quantity || 0),
            image: line.image || '',
          })) ?? []

        hydrateFromServer({
          items: mapped,
          promo: serverCart.appliedPromo,
          summary: serverCart.summary ?? null,
        })
      } catch {
        /* keep local state if server sync fails */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hydrateFromServer])

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const discount = useMemo(() => {
    if (
      summary &&
      Math.abs(Number(summary.subtotal || 0) - subtotal) < 0.001 &&
      Number.isFinite(Number(summary.discount))
    ) {
      return Math.min(subtotal, Math.max(0, Number(summary.discount)))
    }
    if (!promo || subtotal <= 0) return 0
    const serverDiscount = Number(promo.discountAmount)
    if (Number.isFinite(serverDiscount) && serverDiscount > 0) {
      return Math.min(subtotal, Math.max(0, serverDiscount))
    }
    if (promo.discountType === 'PERCENTAGE') {
      const percentageValue = (subtotal * promo.discountValue) / 100
      const capped =
        promo.maxDiscount != null ? Math.min(percentageValue, promo.maxDiscount) : percentageValue
      return Math.min(subtotal, Math.max(0, capped))
    }
    return Math.min(subtotal, Math.max(0, promo.discountValue))
  }, [promo, subtotal, summary])
  const shipping = items.length > 0 ? 80 : 0
  const discountPerProduct = items.length > 0 ? discount / items.length : 0
  const total =
    summary && Math.abs(Number(summary.subtotal || 0) - subtotal) < 0.001
      ? Math.max(0, Number(summary.total || 0))
      : Math.max(0, subtotal + shipping - discount)

  const onApplyPromo = async () => {
    setPromoError(null)
    setPromoMessage(null)
    if (!getStoredAuthToken()) {
      setPromoError(t('cart.promoLogin'))
      return
    }

    const code = promoInput.trim()
    if (!code) {
      setPromoError(t('cart.promoEnter'))
      return
    }

    setPromoLoading(true)
    try {
      await applyPromo(code)
      setPromoInput('')
      setPromoMessage(t('cart.promoOk'))
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : t('cart.promoApplyFail'))
    } finally {
      setPromoLoading(false)
    }
  }

  const onRemovePromo = async () => {
    setPromoError(null)
    setPromoMessage(null)
    setPromoLoading(true)
    try {
      await removePromo()
      setPromoMessage(t('cart.promoRmOk'))
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : t('cart.promoRmFail'))
    } finally {
      setPromoLoading(false)
    }
  }

  const linesLabel = items.length === 1 ? t('cart.lineOne') : t('cart.linesMany', { n: String(items.length) })

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{t('cart.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm text-scnt-text-muted sm:text-base">{t('cart.sub')}</p>

        <StarDivider className="py-8 sm:py-10" />

        {items.length === 0 ? (
          <section className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-8 sm:p-10">
            <h2 className="font-serif text-2xl text-scnt-text">{t('cart.emptyTitle')}</h2>
            <p className="mt-3 max-w-xl text-sm text-scnt-text-muted">{t('cart.emptySub')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/shop">{t('cart.shopFragrances')}</Button>
              <Button to="/collections" variant="outline">
                {t('cart.browseCol')}
              </Button>
            </div>
          </section>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] xl:gap-8">
            <section className="rounded-2xl border border-scnt-border bg-scnt-bg-elevated/45 p-5 sm:p-6">
              <div className="flex items-end justify-between gap-4 border-b border-scnt-border/80 pb-4">
                <h2 className="font-serif text-2xl text-scnt-text">{t('cart.items')}</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-scnt-text-muted">{linesLabel}</p>
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
                          {discount > 0 ? (
                            <div className="mt-1 text-xs">
                              <p className="text-scnt-text-muted line-through">
                                {t('cart.each', { price: formatEgp(i.price, locale) })}
                              </p>
                              <p className="font-medium text-green-700">
                                {t('cart.each', {
                                  price: formatEgp(Math.max(0, i.price - discountPerProduct), locale),
                                })}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-scnt-text-muted">
                              {t('cart.each', { price: formatEgp(i.price, locale) })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-end">
                          {discount > 0 ? (
                            <>
                              <p className="text-xs text-scnt-text-muted line-through">
                                {formatEgp(i.price * i.quantity, locale)}
                              </p>
                              <p className="text-sm font-medium text-green-700 sm:text-base">
                                {formatEgp(Math.max(0, i.price - discountPerProduct) * i.quantity, locale)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-medium text-scnt-text sm:text-base">
                              {formatEgp(i.price * i.quantity, locale)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeItem(i.productId)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-scnt-border/80 text-scnt-text-muted transition hover:border-scnt-text/40 hover:text-scnt-text"
                          aria-label={t('pc.rmCart', { name: i.name })}
                          title={t('pc.rmItem')}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-scnt-border/70 pt-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-scnt-text-muted">{t('cart.qty')}</p>
                      <span className="rounded-full border border-scnt-border/80 bg-scnt-bg-elevated/65 px-3 py-1 text-xs font-medium text-scnt-text">
                        × {i.quantity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="h-fit rounded-2xl border border-scnt-border bg-scnt-bg-elevated/55 p-6 sm:p-7 lg:sticky lg:top-[calc(var(--scnt-header-h,5.5rem)+1.25rem)]">
              <h2 className="font-serif text-2xl text-scnt-text">{t('cart.summary')}</h2>
              <div className="mt-5 rounded-xl border border-scnt-border/80 bg-scnt-bg/45 p-3.5">
                <p className="text-xs uppercase tracking-[0.14em] text-scnt-text-muted">{t('cart.promo')}</p>
                {promo ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-scnt-text">{promo.code}</p>
                      <p className="text-xs text-scnt-text-muted">
                        {promo.discountType === 'PERCENTAGE'
                          ? t('cart.pctOff', { n: String(promo.discountValue) })
                          : t('cart.amtOff', { price: formatEgp(promo.discountValue, locale) })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3 py-2 text-xs"
                      onClick={onRemovePromo}
                      disabled={promoLoading}
                    >
                      {t('cart.remove')}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder={t('cart.enterCode')}
                      className="w-full rounded-lg border border-scnt-border bg-scnt-bg px-3 py-2 text-sm text-scnt-text outline-none placeholder:text-scnt-text-muted/70 focus:border-scnt-text/30"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="whitespace-nowrap px-3 py-2"
                      onClick={onApplyPromo}
                      disabled={promoLoading}
                    >
                      {t('cart.apply')}
                    </Button>
                  </div>
                )}
                {promoError ? <p className="mt-2 text-xs text-red-700">{promoError}</p> : null}
                {promoMessage ? <p className="mt-2 text-xs text-green-700">{promoMessage}</p> : null}
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between text-scnt-text-muted">
                  <dt>{t('cart.subtotal')}</dt>
                  <dd>{formatEgp(subtotal, locale)}</dd>
                </div>
                <div className="flex items-center justify-between text-scnt-text-muted">
                  <dt>{t('cart.shipping')}</dt>
                  <dd>{formatEgp(shipping, locale)}</dd>
                </div>
                {discount > 0 ? (
                  <div className="flex items-center justify-between text-green-700">
                    <dt>{t('cart.discount')}</dt>
                    <dd>-{formatEgp(discount, locale)}</dd>
                  </div>
                ) : null}
                {discount > 0 ? (
                  <div className="flex items-center justify-between text-scnt-text-muted">
                    <dt>{t('cart.oldTotal')}</dt>
                    <dd className="line-through">{formatEgp(subtotal + shipping, locale)}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-scnt-border pt-3 font-medium text-scnt-text">
                  <dt>{discount > 0 ? t('cart.newTotal') : t('cart.total')}</dt>
                  <dd>{formatEgp(total, locale)}</dd>
                </div>
              </dl>

              <p className="mt-5 text-xs text-scnt-text-muted">{t('cart.shipNote')}</p>

              <div className="mt-7 flex flex-col gap-3">
                <Button to="/checkout" className="w-full">
                  {t('cart.checkout')}
                </Button>
                <Button to="/shop" variant="ghost" className="w-full">
                  {t('cart.continue')}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => clear()}>
                  {t('cart.clear')}
                </Button>
              </div>
              <p className="mt-4 text-center text-xs text-scnt-text-muted">
                {t('cart.help')}{' '}
                <Link to="/find-your-scnt" className="text-scnt-text underline-offset-4 hover:underline">
                  {t('cart.findScnt')}
                </Link>
              </p>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  )
}
