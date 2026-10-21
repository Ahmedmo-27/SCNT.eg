import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useCartStore } from '../../store/cartStore'
import { useI18n } from '../../i18n/I18nContext'
import { formatEgp } from '../../lib/formatEgp'

export function ExitIntentModal() {
  const { locale } = useI18n()
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (items.length === 0) return

    const STORAGE_KEY = 'scnt_exit_modal_shown'
    if (sessionStorage.getItem(STORAGE_KEY)) return

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves out of top of browser window (closing or switching tab)
      if (e.clientY <= 10 && !sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, '1')
        setIsOpen(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [items.length])

  if (!isOpen || items.length === 0) return null

  const isAr = locale === 'ar'
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCompleteOrder = () => {
    setIsOpen(false)
    navigate('/checkout')
  }

  const handleDismiss = () => {
    setIsOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-scnt-border bg-scnt-bg p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-8 w-8 rounded-full border border-scnt-border/60 text-scnt-text-muted hover:text-scnt-text flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="space-y-2 text-center sm:text-start">
          <p className="text-[11px] uppercase tracking-[0.2em] text-scnt-text-muted font-medium">
            {isAr ? 'حقيبة التسوق' : 'Reserved Selection'}
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl text-scnt-text">
            {isAr ? 'عطرك المفضل في انتظارك' : 'Your Fragrance Is Waiting'}
          </h3>
          <p className="text-xs sm:text-sm text-scnt-text-muted leading-relaxed">
            {isAr
              ? 'تشكيلتك المختارة لا تزال محفوظة في سلتك. أكمل طلبك الآن قبل نفاد كمية هذه الدفعة الخاصة.'
              : 'Your curated selection remains reserved in your bag. Complete your order before limited artisanal batch quantities are depleted.'}
          </p>
        </div>

        {/* Items Preview */}
        <div className="divide-y divide-scnt-border/40 rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/30 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size || '100ml'}`}
              className="flex items-center justify-between gap-3 p-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-10 w-10 rounded-md object-cover border border-scnt-border/60"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-scnt-bg flex items-center justify-center text-xs">
                    🧴
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <p className="font-semibold text-scnt-text truncate">{item.name}</p>
                  <p className="text-[11px] text-scnt-text-muted">
                    {item.size || '100ml'} · Qty: {item.quantity}
                  </p>
                </div>
              </div>
              <span className="font-mono font-medium text-scnt-text shrink-0">
                {formatEgp(item.price * item.quantity, locale)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm border-t border-scnt-border/40 pt-4">
          <span className="text-scnt-text-muted">{isAr ? 'إجمالي السلة' : 'Subtotal'}</span>
          <span className="font-mono text-base font-bold text-scnt-text">
            {formatEgp(subtotal, locale)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={handleCompleteOrder} className="w-full sm:flex-1 py-3 text-xs sm:text-sm">
            {isAr ? 'إتمام الطلب الآن' : 'Complete My Order'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full sm:w-auto py-3 text-xs text-scnt-text-muted hover:text-scnt-text"
          >
            {isAr ? 'متابعة التصفح' : 'Continue Browsing'}
          </Button>
        </div>
      </div>
    </div>
  )
}
