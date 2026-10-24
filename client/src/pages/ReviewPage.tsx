import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import type { ProductSummary } from '../types/catalog'
import { Button } from '../components/ui/Button'
import { Seo } from '../components/seo/Seo'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarRating } from '../components/ui/StarRating'
import { submitReviewAsGuest } from '../services/api'
import { fetchProfile } from '../services/authApi'
import { getStoredAuthToken } from '../lib/authStorage'
import { InstagramIcon } from '../components/icons/InstagramIcon'
import { openInstagramProfile, INSTAGRAM_HANDLE } from '../utils/socialDeepLinks'

export function ReviewPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const initialSlugOrId = searchParams.get('product') || searchParams.get('productId')
  const { products: catalogProducts } = useCatalog()
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [guestName, setGuestName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-select product from URL if provided
  useEffect(() => {
    if (!selectedProduct && initialSlugOrId && catalogProducts.length > 0) {
      const match = catalogProducts.find(
        (p) =>
          p.id.toLowerCase() === initialSlugOrId.toLowerCase() ||
          p.apiId === initialSlugOrId,
      )
      if (match) {
        setSelectedProduct(match)
      }
    }
  }, [catalogProducts, initialSlugOrId, selectedProduct])

  // Pre-fill name if user is logged in
  useEffect(() => {
    const token = getStoredAuthToken()
    if (token) {
      fetchProfile()
        .then((profile) => {
          if (profile?.full_name && !guestName) {
            setGuestName(profile.full_name)
          }
        })
        .catch(() => {
          // Ignore auth fetch error in guest review flow
        })
    }
  }, [])

  const handleSubmitReview = async () => {
    if (!selectedProduct) {
      setError(t('review.selectProduct'))
      return
    }
    if (guestName.trim().length === 0) {
      setError(t('review.enterName'))
      return
    }
    if (rating === 0) {
      setError(t('review.selectRating'))
      return
    }
    if (review.trim().length === 0) {
      setError(t('review.enterReview'))
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await submitReviewAsGuest(selectedProduct.apiId, {
        rating,
        review: review.trim(),
        guestName: guestName.trim(),
      })
      // Store promo code in sessionStorage
      sessionStorage.setItem('appliedPromoCode', 'REVIEW20')
      setShowThankYou(true)
      // Reset form fields immediately
      setRating(0)
      setReview('')
      setGuestName('')
      setSelectedProduct(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('review.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!showThankYou) return
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowThankYou(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = orig
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showThankYou])

  const cardShell =
    'rounded-2xl bg-scnt-bg-elevated/65 p-6 ring-1 ring-scnt-border/90 backdrop-blur-md'

  return (
    <Layout>
      <Seo
        title={t('review.title')}
        description={t('review.description')}
        path="/review"
      />

      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Decant Card Discovery Gateway */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-scnt-border/90 bg-gradient-to-br from-scnt-bg-elevated/90 via-scnt-bg-elevated/60 to-scnt-bg-base/80 p-6 shadow-xl backdrop-blur-md sm:p-7">
          <div className="flex items-center justify-between gap-2 border-b border-scnt-border/60 pb-3">
            <div className="flex items-center gap-2">
              <EightPointStar size={14} className="text-scnt-accent" />
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-scnt-accent">
                {t('review.decantBadge')}
              </span>
            </div>
            <span className="text-xs font-serif font-medium text-scnt-text-muted">@{INSTAGRAM_HANDLE}</span>
          </div>

          <div className="mt-4 mb-6">
            <h2 className="font-serif text-2xl font-bold text-scnt-text sm:text-3xl">
              {t('review.decantHubTitle')}
            </h2>
            <p className="mt-1.5 text-xs text-scnt-text-muted sm:text-sm leading-relaxed">
              {t('review.decantHubSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action 1: Instagram Channel */}
            <div className="flex flex-col justify-between rounded-xl border border-scnt-accent/35 bg-scnt-accent/10 p-5 transition-all hover:border-scnt-accent/60 hover:bg-scnt-accent/15">
              <div>
                <div className="flex items-center gap-2 text-scnt-accent mb-2">
                  <InstagramIcon size={20} />
                  <h3 className="font-serif font-bold text-base text-scnt-text">
                    {t('review.followIgTitle')}
                  </h3>
                </div>
                <p className="text-xs text-scnt-text-muted leading-relaxed mb-5">
                  {t('review.followIgDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={openInstagramProfile}
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-transform hover:opacity-95 active:scale-[0.98]"
              >
                <InstagramIcon size={16} />
                <span>{t('review.followIgBtn')}</span>
              </button>
            </div>

            {/* Action 2: Review Fragrance */}
            <div className="flex flex-col justify-between rounded-xl border border-scnt-border/80 bg-scnt-bg-base/60 p-5 transition-all hover:border-scnt-accent/50">
              <div>
                <div className="flex items-center gap-2 text-scnt-accent mb-2">
                  <span className="text-lg leading-none">★</span>
                  <h3 className="font-serif font-bold text-base text-scnt-text">
                    {t('review.writeReviewTitle')}
                  </h3>
                </div>
                <p className="text-xs text-scnt-text-muted leading-relaxed mb-5">
                  {t('review.writeReviewDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById('review-form-section')
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-scnt-accent/60 bg-scnt-bg-elevated px-4 py-2.5 text-xs font-bold text-scnt-accent shadow-sm transition-all hover:bg-scnt-accent hover:text-black active:scale-[0.98]"
              >
                <span>{t('review.writeReviewBtn')}</span>
                <span aria-hidden="true">↓</span>
              </button>
            </div>
          </div>
        </div>

        <div id="review-form-section" className="scroll-mt-8">
          <h1 className="text-center font-serif text-3xl sm:text-4xl font-bold mb-2 text-scnt-text">
            {t('review.title')}
          </h1>
          <p className="text-center text-scnt-text/70 mb-10 text-sm">
            {t('review.subtitle')}
          </p>
        </div>

        {error && (
          <div className={`${cardShell} mb-8 bg-red-900/30 border-red-500/30 text-red-400`}>
            {error}
          </div>
        )}

        {!showThankYou && (
          <>
            {/* If product is selected, display prominent banner showing inspiration */}
            {selectedProduct ? (
              <div className="mb-8 rounded-2xl border-2 border-scnt-accent/60 bg-scnt-accent/15 p-5 shadow-lg backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedProduct.galleryImages[0] ? (
                      <img
                        src={selectedProduct.galleryImages[0]}
                        alt={selectedProduct.name}
                        className="h-20 w-20 flex-shrink-0 rounded-xl object-cover ring-1 ring-scnt-border/80 shadow-md"
                      />
                    ) : (
                      <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-scnt-bg-base/70 flex items-center justify-center text-scnt-text-muted">
                        <EightPointStar size={24} />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scnt-accent">
                        {t('review.selectedProductLabel')}
                      </p>
                      <h3 className="font-serif text-2xl font-bold text-scnt-text">
                        {selectedProduct.name}
                      </h3>
                      {/* Clearly show what fragrance this product is inspired from */}
                      <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-lg border border-scnt-accent/40 bg-scnt-bg-base/80 px-3 py-1.5 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-scnt-accent">
                          {t('product.inspiredBy')}:
                        </span>
                        <span className="font-serif text-sm font-semibold text-scnt-text">
                          {selectedProduct.inspiredBy}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="self-start sm:self-center text-xs font-semibold text-scnt-accent underline underline-offset-4 transition-colors hover:text-scnt-text"
                  >
                    {t('review.changeProduct')}
                  </button>
                </div>
              </div>
            ) : (
              /* Product Selection Grid */
              <div className={`${cardShell} mb-8`}>
                <h2 className="text-xl font-semibold mb-2">{t('review.step1')}</h2>
                <p className="text-xs text-scnt-text-muted mb-4">
                  {t('review.selectProduct')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                  {catalogProducts.map((product: ProductSummary) => {
                    return (
                      <button
                        key={product.apiId}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product)
                          setError(null)
                        }}
                        className="p-4 rounded-xl border-2 border-scnt-border/80 bg-scnt-bg-base/40 transition-all text-left group hover:border-scnt-accent/60 hover:bg-scnt-bg-base/70 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          {product.galleryImages[0] && (
                            <img
                              src={product.galleryImages[0]}
                              alt={product.name}
                              className="h-12 w-12 flex-shrink-0 rounded-lg object-cover ring-1 ring-scnt-border/60"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-serif font-bold text-scnt-text truncate text-base">
                              {product.name}
                            </div>
                            {/* Clearly show fragrance inspiration */}
                            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-scnt-accent">
                                {t('product.inspiredBy')}:
                              </span>
                              <span className="font-serif text-xs font-medium text-scnt-text/90">
                                {product.inspiredBy}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* When a product is selected, display the review form */}
            {selectedProduct && (
              <>
                {/* Guest Name Input - NOT optional */}
                <div className={`${cardShell} mb-8`}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{t('review.step1b')}</h2>
                    <span className="rounded-full border border-scnt-accent/40 bg-scnt-accent/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-scnt-accent">
                      {t('review.nameRequiredBadge')}
                    </span>
                  </div>
                  <p className="text-xs text-scnt-text-muted mb-4">
                    {t('review.nameRequiredNote')}
                  </p>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder={t('review.namePlaceholder')}
                    className="w-full p-3.5 rounded-xl bg-scnt-bg-base/60 border border-scnt-border/80 text-scnt-text placeholder-scnt-text/50 focus:outline-none focus:border-scnt-accent focus:ring-1 focus:ring-scnt-accent transition-all"
                  />
                </div>

                {/* Rating Selection */}
                <div className={`${cardShell} mb-8`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">{t('review.step2')}</h2>
                    <span className="rounded-full border border-scnt-accent/40 bg-scnt-accent/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-scnt-accent">
                      {t('review.nameRequiredBadge')}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star)
                          if (error) setError(null)
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 active:scale-95 p-1"
                        aria-label={`${star} ${t('review.stars')}`}
                      >
                        <span
                          className={`text-4xl transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'text-scnt-accent'
                              : 'text-scnt-border/50'
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="text-center text-sm font-medium text-scnt-text/80">
                    {rating > 0
                      ? `${rating} / 5 ${t('review.stars')}`
                      : t('review.selectRating')}
                  </div>
                </div>

                {/* Review Text */}
                <div className={`${cardShell} mb-8`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">{t('review.step3')}</h2>
                    <span className="rounded-full border border-scnt-accent/40 bg-scnt-accent/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-scnt-accent">
                      {t('review.nameRequiredBadge')}
                    </span>
                  </div>
                  <textarea
                    required
                    value={review}
                    onChange={(e) => {
                      setReview(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder={t('review.placeholder')}
                    className="w-full h-32 p-3.5 rounded-xl bg-scnt-bg-base/60 border border-scnt-border/80 text-scnt-text placeholder-scnt-text/50 focus:outline-none focus:border-scnt-accent focus:ring-1 focus:ring-scnt-accent transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="text-center mb-12">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                    className="px-10 py-3 text-base shadow-lg"
                  >
                    {isSubmitting ? t('review.submitting') : t('review.submit')}
                  </Button>
                </div>

                {/* Existing community reviews for the selected product */}
                {selectedProduct.reviews && selectedProduct.reviews.length > 0 && (
                  <div className={`${cardShell} mt-8`}>
                    <div className="flex items-center justify-between border-b border-scnt-border/80 pb-4 mb-4">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-scnt-text">
                          {t('review.recentReviews')}
                        </h3>
                        <p className="text-xs text-scnt-text-muted mt-0.5">
                          {selectedProduct.name} · {t('product.inspiredBy')} {selectedProduct.inspiredBy}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={selectedProduct.rating ?? 0} size="sm" />
                        <span className="text-xs font-semibold text-scnt-text">
                          {(selectedProduct.rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {selectedProduct.reviews.map((rev) => (
                        <div
                          key={rev._id}
                          className="rounded-xl border border-scnt-border/60 bg-scnt-bg-base/40 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-scnt-text">
                              {rev.guestName || t('review.guest')}
                            </span>
                            <StarRating rating={rev.rating} size="sm" />
                          </div>
                          <p className="text-sm italic text-scnt-text/85">
                            "{rev.review}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Community Instagram Section */}
        <div className="mt-16 rounded-2xl border border-scnt-border/80 bg-scnt-bg-elevated/40 p-6 sm:p-8 text-center backdrop-blur-sm">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-scnt-accent/15 text-scnt-accent">
            <InstagramIcon size={24} />
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-scnt-text">
            {t('review.communityTitle')}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-scnt-text-muted leading-relaxed">
            {t('review.communitySub')}
          </p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={openInstagramProfile}
              className="inline-flex items-center gap-2 rounded-xl border border-scnt-border/90 bg-scnt-bg-base/80 px-6 py-2.5 text-xs font-semibold text-scnt-text shadow-sm transition-all hover:border-scnt-accent/60 hover:text-scnt-accent active:scale-[0.98]"
            >
              <InstagramIcon size={16} />
              <span>@{INSTAGRAM_HANDLE}</span>
            </button>
          </div>
        </div>

        {/* Thank You Modal */}
        {showThankYou && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowThankYou(false)
            }}
          >
            <div className="relative flex flex-col max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-scnt-border/80 bg-scnt-bg p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setShowThankYou(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-scnt-text-muted hover:bg-scnt-bg-elevated hover:text-scnt-text transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-3 text-scnt-text">
                {t('review.thankYouTitle')}
              </h2>
              <p className="text-scnt-text/80 text-sm mb-5 leading-relaxed">
                {t('review.thankYouMessage')}
              </p>
              <div className="bg-scnt-bg-elevated border border-scnt-border/60 rounded-xl p-5 mb-5 shadow-inner">
                <div className="text-xs uppercase tracking-wider text-scnt-text-muted mb-1.5 font-medium">
                  {t('review.promoCodeLabel')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-scnt-text font-mono tracking-widest mb-1.5">
                  REVIEW20
                </div>
                <div className="text-xs text-scnt-text-muted">
                  {t('review.promoCodeDesc')}
                </div>
              </div>

              {/* Instagram CTA inside Thank You Modal */}
              <div className="mb-5 rounded-xl border border-scnt-border/70 bg-scnt-bg-elevated/70 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2.5 text-scnt-accent">
                  <InstagramIcon size={18} />
                  <span className="text-xs font-semibold text-scnt-text">
                    {t('review.thankYouIgPrompt')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openInstagramProfile}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-transform hover:opacity-95 active:scale-[0.98]"
                >
                  <InstagramIcon size={16} />
                  <span>{t('review.thankYouIgBtn')}</span>
                </button>
              </div>

              <Button
                onClick={() => {
                  setShowThankYou(false)
                  window.location.href = '/shop'
                }}
                className="w-full text-sm py-2.5"
              >
                {t('review.closeModal')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
