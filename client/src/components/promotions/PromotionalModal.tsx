import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { EightPointStar } from '../ui/EightPointStar'
import {
  fetchActivePromotion,
  claimPromotion,
  type ActivePromotion,
} from '../../services/promotionsApi'
import { getOrCreateVisitorId } from '../../lib/visitorStorage'

const MODAL_TRIGGER_DELAY_MS = 2500
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export type PromotionalModalProps = {
  /** If provided, renders in preview mode for the Admin Dashboard */
  previewCampaign?: ActivePromotion | null
  onClosePreview?: () => void
}

export function PromotionalModal({
  previewCampaign,
  onClosePreview,
}: PromotionalModalProps = {}) {
  const { locale } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [campaign, setCampaign] = useState<ActivePromotion | null>(previewCampaign || null)
  const [isOpen, setIsOpen] = useState<boolean>(Boolean(previewCampaign))
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [claimedCode, setClaimedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isAr = locale === 'ar'
  const isPreview = Boolean(previewCampaign)

  // In live storefront mode: fetch active campaign & evaluate frequency capping
  useEffect(() => {
    if (isPreview) {
      setCampaign(previewCampaign || null)
      setIsOpen(Boolean(previewCampaign))
      return
    }

    // Suppress modal on admin, checkout or email verification screens
    const currentPath = location.pathname.toLowerCase()
    if (
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/checkout') ||
      currentPath.startsWith('/verify-email')
    ) {
      setIsOpen(false)
      return
    }

    let isMounted = true
    let delayTimer: number | undefined

    async function checkPromotion() {
      try {
        const active = await fetchActivePromotion()
        if (!isMounted || !active) return

        // 1. Check if user already claimed this specific promotion
        const claimedKey = `scnt_promo_claimed_${active._id}`
        if (localStorage.getItem(claimedKey)) return

        // 2. Check if user dismissed this promotion recently (frequency capping: 24h)
        const dismissedKey = `scnt_promo_dismissed_${active._id}`
        const dismissedAt = localStorage.getItem(dismissedKey)
        if (dismissedAt) {
          const elapsed = Date.now() - Number(dismissedAt)
          if (elapsed < DISMISS_TTL_MS) return
        }

        // Show modal after delay to allow first-visit brand intro transition to finish
        delayTimer = window.setTimeout(() => {
          if (isMounted) {
            setCampaign(active)
            setIsOpen(true)
          }
        }, MODAL_TRIGGER_DELAY_MS)
      } catch (err) {
        console.error('Failed to resolve active promotional campaign:', err)
      }
    }

    void checkPromotion()

    return () => {
      isMounted = false
      if (delayTimer) window.clearTimeout(delayTimer)
    }
  }, [location.pathname, isPreview, previewCampaign])

  // Native dialog open/close synchronization for accessibility
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        try {
          dialog.showModal()
        } catch {
          /* already open or unsupported */
        }
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  const handleDismiss = () => {
    setIsOpen(false)
    if (campaign && !isPreview) {
      try {
        localStorage.setItem(`scnt_promo_dismissed_${campaign._id}`, String(Date.now()))
      } catch {
        /* ignore private storage errors */
      }
    }
    if (onClosePreview) onClosePreview()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!campaign) return

    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage(
        isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please provide a valid email address'
      )
      return
    }

    if (isPreview) {
      setClaimedCode('PREVIEW_CODE')
      return
    }

    setBusy(true)
    setErrorMessage(null)

    try {
      const visitorId = getOrCreateVisitorId()
      const result = await claimPromotion({
        campaignId: campaign._id,
        email: trimmed,
        locale: isAr ? 'ar' : 'en',
        visitorId,
      })

      setClaimedCode(result.promoCode)

      try {
        localStorage.setItem(`scnt_promo_claimed_${campaign._id}`, 'true')
      } catch {
        /* storage full / private mode */
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : isAr
          ? 'حدث خطأ أثناء معالجة الطلب'
          : 'Unable to claim promotional code'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleCopyCode = async () => {
    if (!claimedCode) return
    try {
      await navigator.clipboard.writeText(claimedCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      /* clipboard write denied */
    }
  }

  const handleShopNow = () => {
    handleDismiss()
    navigate('/shop')
  }

  if (!isOpen || !campaign) return null

  // Localization resolution
  const badgeText = isAr
    ? campaign.badge?.ar || campaign.badge?.en || 'عرض حصري'
    : campaign.badge?.en || campaign.badge?.ar || 'EXCLUSIVE ACCESS'

  const titleText = isAr
    ? campaign.title?.ar || campaign.title?.en || 'عروض الجمعة البيضاء'
    : campaign.title?.en || campaign.title?.ar || 'Limited Time SCNT Event'

  const subtitleText = isAr
    ? campaign.subtitle?.ar || campaign.subtitle?.en
    : campaign.subtitle?.en || campaign.subtitle?.ar

  const descText = isAr
    ? campaign.description?.ar || campaign.description?.en
    : campaign.description?.en || campaign.description?.ar

  const discountText = isAr
    ? campaign.discountHighlight?.ar || campaign.discountHighlight?.en || 'خصم مميز'
    : campaign.discountHighlight?.en || campaign.discountHighlight?.ar || 'SPECIAL SAVINGS'

  const ctaButtonText = isAr
    ? campaign.ctaText?.ar || campaign.ctaText?.en || 'احصل على كود الخصم'
    : campaign.ctaText?.en || campaign.ctaText?.ar || 'Get My Exclusive Code'

  // Theme styling variants
  const isBlackFriday = campaign.theme === 'black_friday'
  const isGoldLuxury = campaign.theme === 'gold_luxury'

  return (
    <AnimatePresence>
      <dialog
        ref={dialogRef}
        aria-labelledby="promo-modal-title"
        aria-describedby="promo-modal-desc"
        onCancel={handleDismiss}
        className="fixed inset-0 m-0 h-full w-full max-h-none max-w-none bg-transparent p-0 border-0 flex items-center justify-center z-[150] backdrop:bg-black/75 backdrop:backdrop-blur-md"
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => {
          // Light dismiss on backdrop click
          if (e.target === dialogRef.current) handleDismiss()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-[92vw] max-w-lg overflow-hidden rounded-3xl border p-6 sm:p-9 shadow-2xl ${
            isBlackFriday
              ? 'bg-[#0e0d0b] text-[#f6f3ef] border-[#c5a962]/40 shadow-[0_0_50px_rgba(0,0,0,0.85)]'
              : isGoldLuxury
              ? 'bg-[#141210] text-[#f6f3ef] border-[#d4af37]/50 shadow-[0_0_40px_rgba(212,175,55,0.15)]'
              : 'bg-[#161412] text-[#f6f3ef] border-scnt-border/80'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle decorative luxury ambient glow */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-20"
            style={{
              background: isBlackFriday
                ? 'radial-gradient(circle, #d4af37 0%, transparent 70%)'
                : 'radial-gradient(circle, #e6c875 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close promotional offer'}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>

          {/* Preview Badge if admin preview */}
          {isPreview ? (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-300">
              <EightPointStar size={10} />
              <span>Admin Preview Mode</span>
            </div>
          ) : null}

          {/* Header & Badging */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center gap-2">
              <EightPointStar
                size={12}
                className={isBlackFriday || isGoldLuxury ? 'text-[#d4af37]' : 'text-scnt-text-muted'}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c5a962]">
                {badgeText}
              </span>
              <EightPointStar
                size={12}
                className={isBlackFriday || isGoldLuxury ? 'text-[#d4af37]' : 'text-scnt-text-muted'}
              />
            </div>

            <h2
              id="promo-modal-title"
              className="font-serif text-2xl sm:text-3xl text-white font-bold leading-tight"
            >
              {titleText}
            </h2>

            {subtitleText ? (
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
                {subtitleText}
              </p>
            ) : null}

            {/* Discount Highlight Banner */}
            <div className="py-2">
              <div className="inline-block rounded-xl border border-[#b59a57]/40 bg-[#1c1915] px-4 py-2 sm:px-6 sm:py-2.5 shadow-inner">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-[#e6c875]">
                  {discountText}
                </span>
              </div>
            </div>

            {descText ? (
              <p
                id="promo-modal-desc"
                className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto"
              >
                {descText}
              </p>
            ) : null}
          </div>

          {/* Dynamic Content: Form vs Claimed State */}
          {!claimedCode ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="promo-email-input"
                  className="block text-xs font-medium text-zinc-300"
                >
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <input
                    id="promo-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      isAr ? 'أدخل بريدك الإلكتروني لاستلام الكود' : 'name@example.com'
                    }
                    className="w-full rounded-xl border border-white/20 bg-[#171512] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                    dir={isAr ? 'rtl' : 'ltr'}
                    autoFocus
                  />
                </div>
              </div>

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 text-center"
                >
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-[#b59a57] via-[#c5a962] to-[#b59a57] hover:brightness-110 active:scale-[0.99] px-6 py-3.5 text-sm font-bold text-[#0e0d0b] tracking-wide transition-all shadow-lg shadow-[#b59a57]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <span>{isAr ? 'جاري المعالجة…' : 'Sending Code…'}</span>
                ) : (
                  <span>{ctaButtonText}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[11px] text-zinc-500 hover:text-zinc-400 underline underline-offset-4 transition-colors"
                >
                  {isAr ? 'لا شكراً، أفضل المتابعة بالسعر الكامل' : 'No thanks, I will pay full price'}
                </button>
              </div>
            </form>
          ) : (
            /* Success & Instant Copy State */
            <div className="mt-6 space-y-5 text-center animate-in fade-in duration-300">
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300 text-xs sm:text-sm">
                <p className="font-semibold">
                  {isAr
                    ? '✓ تم إرسال كود الخصم إلى بريدك الإلكتروني بنجاح!'
                    : '✓ We’ve emailed your exclusive discount code!'}
                </p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  {isAr
                    ? 'يمكنك استخدامه فوراً عند إتمام طلبك:'
                    : 'You can also copy and apply it immediately:'}
                </p>
              </div>

              {/* Promo Code Voucher Box */}
              <div className="relative rounded-2xl border-2 border-dashed border-[#d4af37] bg-[#1a1714] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-start">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                    {isAr ? 'كود الخصم الخاص بك' : 'Your Discount Code'}
                  </span>
                  <p className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-[#f5dfa0]">
                    {claimedCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md ${
                    copied
                      ? 'bg-emerald-500 text-black'
                      : 'bg-[#d4af37] hover:bg-[#e6c875] text-[#0e0d0b]'
                  }`}
                >
                  {copied
                    ? isAr
                      ? '✓ تم النسخ'
                      : '✓ Copied!'
                    : isAr
                    ? 'نسخ الكود'
                    : 'Copy Code'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleShopNow}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#b59a57] to-[#c5a962] px-5 py-3 text-sm font-bold text-[#0e0d0b] hover:brightness-110 transition-all"
                >
                  {isAr ? 'تسوق المجموعات الآن' : 'Explore Collections & Shop'}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </dialog>
    </AnimatePresence>
  )
}
