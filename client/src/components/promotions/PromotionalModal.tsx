import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { EightPointStar } from '../ui/EightPointStar'
import { CloseIcon, CheckIcon } from '../icons'
import {
  fetchActivePromotion,
  claimPromotion,
  type ActivePromotion,
  type PromotionTheme,
} from '../../services/promotionsApi'
import { getOrCreateVisitorId } from '../../lib/visitorStorage'

const MODAL_TRIGGER_DELAY_MS = 2500
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export type PromotionalModalProps = {
  /** If provided, renders in preview mode for the Admin Dashboard */
  previewCampaign?: ActivePromotion | null
  onClosePreview?: () => void
}

/**
 * Strips any explicit percentage mentions (e.g. "10%", "20% off", "10% off your first")
 * so the exact discount percentage remains an exclusive mystery until email submission.
 */
function stripPercentage(text?: string): string {
  if (!text) return ''
  return text
    .replace(/\b\d+%\s*(off)?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

type ThemeClasses = {
  container: string
  glow?: { background: string }
  closeButton: string
  starClass: string
  badgeClass: string
  titleClass: string
  subtitleClass: string
  teaserBox: string
  teaserText: string
  descClass: string
  inputLabel: string
  input: string
  submitButton: string
  dismissLink: string
  successCard: string
  successTitle: string
  successDesc: string
  voucherBox: string
  voucherLabel: string
  voucherCode: string
  copyButton: {
    idle: string
    copied: string
  }
  shopButton: string
  closeSuccessButton: string
}

const THEME_STYLES: Record<PromotionTheme, ThemeClasses> = {
  scnt_signature: {
    container: 'bg-scnt-bg text-scnt-text border-scnt-border shadow-2xl',
    closeButton:
      'border-scnt-border/60 text-scnt-text-muted hover:text-scnt-text hover:bg-scnt-bg-elevated',
    starClass: 'text-scnt-text-muted',
    badgeClass: 'text-scnt-text-muted',
    titleClass: 'text-scnt-text',
    subtitleClass: 'text-scnt-text-muted',
    teaserBox: 'border-scnt-border/80 bg-scnt-bg-elevated/70 shadow-sm',
    teaserText: 'text-scnt-text',
    descClass: 'text-scnt-text-muted',
    inputLabel: 'text-scnt-text',
    input:
      'border-scnt-border bg-scnt-bg-elevated text-scnt-text placeholder:text-scnt-text-muted/60 focus:border-scnt-text focus:ring-scnt-text',
    submitButton:
      'bg-scnt-text text-scnt-bg hover:bg-scnt-text/90 shadow-md shadow-scnt-text/10',
    dismissLink: 'text-scnt-text-muted hover:text-scnt-text',
    successCard: 'border-scnt-border bg-scnt-bg-elevated',
    successTitle: 'text-scnt-text',
    successDesc: 'text-scnt-text-muted',
    voucherBox: 'border-2 border-dashed border-scnt-text/25 bg-scnt-bg-elevated',
    voucherLabel: 'text-scnt-text-muted',
    voucherCode: 'text-scnt-text',
    copyButton: {
      idle: 'bg-scnt-text text-scnt-bg hover:bg-scnt-text/90',
      copied: 'bg-emerald-600 text-white',
    },
    shopButton: 'bg-scnt-text text-scnt-bg hover:bg-scnt-text/90 shadow-md',
    closeSuccessButton:
      'border-scnt-border bg-scnt-bg-elevated text-scnt-text hover:bg-scnt-bg',
  },

  black_friday: {
    container:
      'bg-[#0f0e0c] text-[#f6f3ef] border-[#c5a962]/40 shadow-[0_0_50px_rgba(0,0,0,0.85)]',
    glow: {
      background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)',
    },
    closeButton: 'border-white/10 text-white/60 hover:text-white hover:bg-white/10',
    starClass: 'text-[#d4af37]',
    badgeClass: 'text-[#d4af37]',
    titleClass: 'text-white',
    subtitleClass: 'text-zinc-300',
    teaserBox: 'border-[#b59a57]/40 bg-[#1a1815] shadow-inner',
    teaserText: 'text-[#f5dfa0]',
    descClass: 'text-zinc-400',
    inputLabel: 'text-zinc-300',
    input:
      'border-white/20 bg-[#171512] text-white placeholder-zinc-500 focus:border-[#d4af37] focus:ring-[#d4af37]',
    submitButton:
      'bg-gradient-to-r from-[#b59a57] via-[#d4af37] to-[#b59a57] text-[#0f0e0c] font-bold shadow-lg shadow-[#b59a57]/20 hover:brightness-110',
    dismissLink: 'text-zinc-500 hover:text-zinc-400',
    successCard: 'border-[#b59a57]/30 bg-[#181613]',
    successTitle: 'text-[#f5dfa0]',
    successDesc: 'text-zinc-400',
    voucherBox: 'border-2 border-dashed border-[#d4af37] bg-[#1a1714]',
    voucherLabel: 'text-zinc-400',
    voucherCode: 'text-[#f5dfa0]',
    copyButton: {
      idle: 'bg-[#d4af37] text-[#0f0e0c] font-bold hover:bg-[#e6c875]',
      copied: 'bg-emerald-500 text-black font-bold',
    },
    shopButton:
      'bg-gradient-to-r from-[#b59a57] via-[#d4af37] to-[#b59a57] text-[#0f0e0c] font-bold shadow-md hover:brightness-110',
    closeSuccessButton: 'border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10',
  },

  gold_luxury: {
    container:
      'bg-[#fcf9f2] text-[#2c2419] border-[#b89b5e]/50 shadow-[0_20px_50px_-10px_rgba(184,155,94,0.25)]',
    glow: {
      background: 'radial-gradient(circle, rgba(184,155,94,0.18) 0%, transparent 70%)',
    },
    closeButton:
      'border-[#b89b5e]/30 text-[#8c6d32] hover:text-[#2c2419] hover:bg-[#f4ede1]',
    starClass: 'text-[#b89b5e]',
    badgeClass: 'text-[#8c6d32]',
    titleClass: 'text-[#241e15]',
    subtitleClass: 'text-[#6e5d47]',
    teaserBox: 'border-[#b89b5e]/35 bg-[#f4ede1] shadow-sm',
    teaserText: 'text-[#7d5e23]',
    descClass: 'text-[#7d6f5c]',
    inputLabel: 'text-[#2c2419]',
    input:
      'border-[#b89b5e]/35 bg-white text-[#2c2419] placeholder-[#a69986] focus:border-[#8c6d32] focus:ring-[#8c6d32]',
    submitButton:
      'bg-gradient-to-r from-[#8c6d32] to-[#b89b5e] text-[#fcf9f2] font-semibold hover:brightness-105 shadow-md shadow-[#b89b5e]/25',
    dismissLink: 'text-[#8c7b66] hover:text-[#2c2419]',
    successCard: 'border-[#b89b5e]/30 bg-[#f4ede1]',
    successTitle: 'text-[#241e15]',
    successDesc: 'text-[#6e5d47]',
    voucherBox: 'border-2 border-dashed border-[#b89b5e]/50 bg-[#f4ede1]',
    voucherLabel: 'text-[#8c6d32]',
    voucherCode: 'text-[#241e15]',
    copyButton: {
      idle: 'bg-[#8c6d32] text-white hover:bg-[#725725]',
      copied: 'bg-emerald-600 text-white',
    },
    shopButton:
      'bg-gradient-to-r from-[#8c6d32] to-[#b89b5e] text-[#fcf9f2] font-semibold shadow-md hover:brightness-105',
    closeSuccessButton: 'border-[#b89b5e]/30 bg-white text-[#2c2419] hover:bg-[#f4ede1]',
  },

  minimal_dark: {
    container:
      'bg-[#16171a] text-[#f1f3f4] border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.7)]',
    glow: {
      background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
    },
    closeButton: 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/10',
    starClass: 'text-zinc-400',
    badgeClass: 'text-zinc-400',
    titleClass: 'text-white',
    subtitleClass: 'text-zinc-300',
    teaserBox: 'border-white/15 bg-[#212328] shadow-inner',
    teaserText: 'text-[#e8eaed]',
    descClass: 'text-zinc-400',
    inputLabel: 'text-zinc-200',
    input:
      'border-white/15 bg-[#1b1c20] text-white placeholder-zinc-500 focus:border-white focus:ring-white',
    submitButton:
      'bg-white text-[#16171a] hover:bg-zinc-200 font-bold shadow-lg',
    dismissLink: 'text-zinc-500 hover:text-zinc-300',
    successCard: 'border-white/10 bg-[#212328]',
    successTitle: 'text-white',
    successDesc: 'text-zinc-400',
    voucherBox: 'border-2 border-dashed border-white/20 bg-[#212328]',
    voucherLabel: 'text-zinc-400',
    voucherCode: 'text-white',
    copyButton: {
      idle: 'bg-white text-[#16171a] font-bold hover:bg-zinc-200',
      copied: 'bg-emerald-500 text-black font-bold',
    },
    shopButton: 'bg-white text-[#16171a] hover:bg-zinc-200 font-bold shadow-md',
    closeSuccessButton: 'border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10',
  },
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
  const [claimedDiscountValue, setClaimedDiscountValue] = useState<number | null>(null)
  const [claimedDiscountType, setClaimedDiscountType] = useState<string>('PERCENTAGE')
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
      setClaimedDiscountValue(10)
      setClaimedDiscountType('PERCENTAGE')
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
      setClaimedDiscountValue(result.discountValue)
      setClaimedDiscountType(result.discountType)

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

  const isSpecial = campaign.type === 'SPECIAL_EVENT'
  const activeThemeKey: PromotionTheme =
    campaign.theme in THEME_STYLES ? (campaign.theme as PromotionTheme) : 'scnt_signature'
  const themeClasses = THEME_STYLES[activeThemeKey]

  // Localization resolution
  const rawBadge = isAr
    ? campaign.badge?.ar || campaign.badge?.en
    : campaign.badge?.en || campaign.badge?.ar
  const badgeText = stripPercentage(rawBadge) || (isAr ? 'عرض حصري' : 'WELCOME PERK')

  const rawTitle = isAr
    ? campaign.title?.ar || campaign.title?.en
    : campaign.title?.en || campaign.title?.ar
  const titleText =
    stripPercentage(rawTitle) || (isAr ? 'اكتشف عالم SCNT العطري' : 'Experience House of SCNT')

  const rawSubtitle = isAr
    ? campaign.subtitle?.ar || campaign.subtitle?.en
    : campaign.subtitle?.en || campaign.subtitle?.ar
  const subtitleText =
    stripPercentage(rawSubtitle) ||
    (isAr
      ? 'استمتع بخصم ترحيبي حصري على أول طلب لعطورنا المصنوعة بحرفية.'
      : 'Enjoy an exclusive introductory discount on your first artisanal fragrance order.')

  const rawDesc = isAr
    ? campaign.description?.ar || campaign.description?.en
    : campaign.description?.en || campaign.description?.ar
  const descText =
    stripPercentage(rawDesc) ||
    (isAr
      ? 'أدخل بريدك الإلكتروني لاستلام كود الخصم الخاص بك مباشرة عبر البريد.'
      : 'Enter your email to receive your personal discount code directly in your inbox.')

  // Enforce: Never show the percentage before submission!
  const rawHighlight = isAr
    ? campaign.discountHighlight?.ar || campaign.discountHighlight?.en || ''
    : campaign.discountHighlight?.en || campaign.discountHighlight?.ar || ''

  const teaserHighlight = rawHighlight.includes('%')
    ? isSpecial
      ? isAr
        ? 'ميزة حصرية لفترة محدودة'
        : 'EXCLUSIVE EVENT PRIVILEGE'
      : isAr
      ? 'ميزة حصرية على أول طلب'
      : 'EXCLUSIVE FIRST ORDER PRIVILEGE'
    : stripPercentage(rawHighlight) ||
      (isAr ? 'ميزة ترويجية حصرية' : 'EXCLUSIVE PRIVILEGE')

  const rawCta = isAr
    ? campaign.ctaText?.ar || campaign.ctaText?.en
    : campaign.ctaText?.en || campaign.ctaText?.ar
  const ctaButtonText =
    stripPercentage(rawCta) || (isAr ? 'احصل على كود الخصم' : 'Unlock My Discount Code')

  return (
    <AnimatePresence>
      <dialog
        ref={dialogRef}
        aria-labelledby="promo-modal-title"
        aria-describedby="promo-modal-desc"
        onCancel={handleDismiss}
        className="fixed inset-0 m-0 h-full w-full max-h-none max-w-none bg-transparent p-0 border-0 flex items-center justify-center z-[150] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        style={{ overscrollBehavior: 'contain' }}
        onClick={(e) => {
          // Light dismiss on backdrop click
          if (e.target === dialogRef.current) handleDismiss()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 6 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-[92vw] max-w-lg overflow-hidden rounded-3xl border p-6 sm:p-9 shadow-2xl transition-colors duration-300 ${themeClasses.container}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative ambient glow if theme specifies one */}
          {themeClasses.glow ? (
            <div
              className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-30"
              style={themeClasses.glow}
              aria-hidden="true"
            />
          ) : null}

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close promotional offer'}
            className={`absolute top-4 end-4 sm:top-5 sm:end-5 flex h-8 w-8 items-center justify-center rounded-full border transition-colors cursor-pointer ${themeClasses.closeButton}`}
          >
            <CloseIcon size={14} />
          </button>

          {/* Preview Badge if admin preview */}
          {isPreview ? (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-current/5 px-3 py-1 text-[10px] font-semibold opacity-80">
              <EightPointStar size={10} />
              <span>Admin Preview Mode · Theme: {activeThemeKey}</span>
            </div>
          ) : null}

          {/* Header & Badging */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center gap-2">
              <EightPointStar size={11} className={themeClasses.starClass} />
              <span
                className={`text-[11px] font-sans font-medium uppercase tracking-[0.25em] ${themeClasses.badgeClass}`}
              >
                {badgeText}
              </span>
              <EightPointStar size={11} className={themeClasses.starClass} />
            </div>

            <h2
              id="promo-modal-title"
              className={`font-serif text-2xl sm:text-3xl font-normal leading-tight tracking-wide ${themeClasses.titleClass}`}
            >
              {titleText}
            </h2>

            {subtitleText ? (
              <p
                className={`text-xs sm:text-sm leading-relaxed max-w-md mx-auto ${themeClasses.subtitleClass}`}
              >
                {subtitleText}
              </p>
            ) : null}

            {/* Teaser Box (Mystery Privilege - No Percentage Leaked) */}
            {!claimedCode ? (
              <div className="py-1">
                <div
                  className={`inline-block rounded-2xl border px-5 py-2.5 sm:px-6 sm:py-3 transition-colors ${themeClasses.teaserBox}`}
                >
                  <span
                    className={`font-serif text-sm sm:text-base font-medium tracking-[0.15em] uppercase ${themeClasses.teaserText}`}
                  >
                    {teaserHighlight}
                  </span>
                </div>
              </div>
            ) : null}

            {descText && !claimedCode ? (
              <p
                id="promo-modal-desc"
                className={`text-xs leading-relaxed max-w-sm mx-auto ${themeClasses.descClass}`}
              >
                {descText}
              </p>
            ) : null}
          </div>

          {/* Form vs Claimed State */}
          {!claimedCode ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5 text-start">
                <label
                  htmlFor="promo-email-input"
                  className={`block text-xs font-medium ${themeClasses.inputLabel}`}
                >
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  id="promo-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    isAr ? 'أدخل بريدك الإلكتروني لاستلام الكود' : 'name@example.com'
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-1 ${themeClasses.input}`}
                  dir={isAr ? 'rtl' : 'ltr'}
                  autoFocus
                />
              </div>

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 text-center"
                >
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className={`w-full rounded-full py-3.5 px-6 text-xs sm:text-sm font-medium tracking-wider uppercase transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${themeClasses.submitButton}`}
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
                  className={`text-[11px] underline underline-offset-4 transition-colors cursor-pointer ${themeClasses.dismissLink}`}
                >
                  {isAr ? 'لا شكراً، أفضل المتابعة بالسعر الكامل' : 'No thanks, I will pay full price'}
                </button>
              </div>
            </form>
          ) : (
            /* Success & Instant Copy State (Percentage is revealed after email submission) */
            <div className="mt-6 space-y-5 text-center animate-in fade-in duration-300">
              <div
                className={`rounded-2xl border p-4 text-xs sm:text-sm space-y-1 ${themeClasses.successCard}`}
              >
                <p className={`font-semibold flex items-center justify-center gap-1.5 ${themeClasses.successTitle}`}>
                <CheckIcon size={15} className="shrink-0" />
                <span>
                  {isAr
                    ? 'تم إرسال كود الخصم إلى بريدك الإلكتروني بنجاح!'
                    : 'We’ve emailed your exclusive discount code!'}
                </span>
              </p>
                <p className={`text-[11px] ${themeClasses.successDesc}`}>
                  {claimedDiscountValue
                    ? isAr
                      ? `تم تفعيل خصم ${claimedDiscountValue}% على طلبك:`
                      : `Your ${claimedDiscountValue}% OFF discount has been unlocked:`
                    : isAr
                    ? 'يمكنك استخدامه فوراً عند إتمام طلبك:'
                    : 'You can copy and apply it immediately:'}
                </p>
              </div>

              {/* Promo Code Voucher Box */}
              <div
                className={`relative rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 ${themeClasses.voucherBox}`}
              >
                <div className="text-center sm:text-start">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-medium ${themeClasses.voucherLabel}`}
                  >
                    {claimedDiscountValue
                      ? isAr
                        ? `كود خصم (${claimedDiscountType === 'PERCENTAGE' ? `${claimedDiscountValue}%` : `EGP ${claimedDiscountValue}`})`
                        : `Your ${claimedDiscountType === 'PERCENTAGE' ? `${claimedDiscountValue}% OFF` : `EGP ${claimedDiscountValue} OFF`} Code`
                      : isAr
                      ? 'كود الخصم الخاص بك'
                      : 'Your Discount Code'}
                  </span>
                  <p
                    className={`font-mono text-2xl sm:text-3xl font-bold tracking-widest ${themeClasses.voucherCode}`}
                  >
                    {claimedCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`rounded-full px-5 py-2.5 text-xs font-medium tracking-wider uppercase transition-all shadow-sm cursor-pointer ${
                    copied ? themeClasses.copyButton.copied : themeClasses.copyButton.idle
                  }`}
                >
                  {copied ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckIcon size={13} className="shrink-0" />
                      <span>{isAr ? 'تم النسخ' : 'Copied!'}</span>
                    </span>
                  ) : (
                    isAr ? 'نسخ الكود' : 'Copy Code'
                  )}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleShopNow}
                  className={`flex-1 rounded-full py-3.5 px-6 text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors cursor-pointer ${themeClasses.shopButton}`}
                >
                  {isAr ? 'تسوق المجموعات الآن' : 'Explore Collections & Shop'}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className={`rounded-full border px-5 py-3.5 text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer ${themeClasses.closeSuccessButton}`}
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
