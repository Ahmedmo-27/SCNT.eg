import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import type { ProductSummary } from '../types/catalog'
import { Button } from '../components/ui/Button'
import { Seo } from '../components/seo/Seo'
import { submitReviewAsGuest } from '../services/api'

export function ReviewPage() {
  const { t } = useI18n()
  const { products: catalogProducts } = useCatalog()
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [guestName, setGuestName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmitReview = async () => {
    if (!selectedProduct) {
      setError(t('review.selectProduct'))
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
    if (guestName.trim().length === 0) {
      setError(t('review.enterName'))
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
      // Reset form after a delay
      setTimeout(() => {
        setRating(0)
        setReview('')
        setGuestName('')
        setSelectedProduct(null)
        setShowThankYou(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('review.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <h1 className="text-center text-4xl font-bold mb-2">{t('review.title')}</h1>
        <p className="text-center text-scnt-text/70 mb-12">
          {t('review.subtitle')}
        </p>

        {error && (
          <div className={`${cardShell} mb-8 bg-red-900/30 border-red-500/30 text-red-400`}>
            {error}
          </div>
        )}

        {!showThankYou && (
          <>
            {/* Product Selection */}
            <div className={`${cardShell} mb-8`}>
              <h2 className="text-xl font-semibold mb-4">{t('review.step1')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {catalogProducts.map((product: ProductSummary) => {
                  const isSelected = selectedProduct?.apiId === product.apiId

                  return (
                    <button
                      key={product.apiId}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 rounded-lg border-2 transition-colors text-left ${
                        isSelected
                          ? 'border-scnt-accent bg-scnt-accent/10'
                          : 'border-scnt-border hover:border-scnt-accent/50'
                      }`}
                    >
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-scnt-text/70">{product.inspiredBy}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Guest Name Input */}
            {selectedProduct && (
              <div className={`${cardShell} mb-8`}>
                <h2 className="text-xl font-semibold mb-4">{t('review.step1b')}</h2>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t('review.namePlaceholder')}
                  className="w-full p-3 rounded-lg bg-scnt-bg-base/50 border border-scnt-border/50 text-scnt-text placeholder-scnt-text/50 focus:outline-none focus:border-scnt-accent"
                />
              </div>
            )}

            {/* Rating Selection */}
            {selectedProduct && guestName.trim().length > 0 && (
              <div className={`${cardShell} mb-8`}>
                <h2 className="text-xl font-semibold mb-4">{t('review.step2')}</h2>
                <div className="flex gap-2 justify-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all"
                    >
                      <span
                        className={`text-4xl ${
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
                <div className="text-center text-scnt-text/70">
                  {rating > 0 && `${rating} / 5 ${t('review.stars')}`}
                </div>
              </div>
            )}

            {/* Review Text */}
            {selectedProduct && guestName.trim().length > 0 && rating > 0 && (
              <div className={`${cardShell} mb-8`}>
                <h2 className="text-xl font-semibold mb-4">{t('review.step3')}</h2>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder={t('review.placeholder')}
                  className="w-full h-32 p-3 rounded-lg bg-scnt-bg-base/50 border border-scnt-border/50 text-scnt-text placeholder-scnt-text/50 focus:outline-none focus:border-scnt-accent"
                />
              </div>
            )}

            {/* Submit Button */}
            {selectedProduct && guestName.trim().length > 0 && rating > 0 && review.trim().length > 0 && (
              <div className="text-center">
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? t('review.submitting') : t('review.submit')}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Thank You Modal */}
        {showThankYou && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className={`${cardShell} max-w-md mx-auto text-center`}>
              <h2 className="text-3xl font-bold mb-4 text-scnt-accent">
                {t('review.thankYouTitle')}
              </h2>
              <p className="text-scnt-text/80 mb-6">
                {t('review.thankYouMessage')}
              </p>
              <div className="bg-scnt-accent/10 border border-scnt-accent/30 rounded-xl p-6 mb-6">
                <div className="text-sm text-scnt-text/60 mb-2">
                  {t('review.promoCodeLabel')}
                </div>
                <div className="text-3xl font-bold text-scnt-accent font-mono mb-2">
                  REVIEW20
                </div>
                <div className="text-sm text-scnt-text/70">
                  {t('review.promoCodeDesc')}
                </div>
              </div>
              <p className="text-sm text-scnt-text/60 mb-6">
                Redirecting to shop in a moment...
              </p>
              <Button
                onClick={() => {
                  setShowThankYou(false)
                  window.location.href = '/shop'
                }}
                className="w-full"
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
