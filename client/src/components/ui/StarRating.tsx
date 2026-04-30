import { memo } from 'react'

interface StarRatingProps {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export const StarRating = memo(function StarRating({
  rating,
  count,
  size = 'md',
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  const displayRating = Math.round(rating * 2) / 2
  const fullStars = Math.floor(displayRating)
  const hasHalfStar = displayRating % 1 !== 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= fullStars
          const isHalf = star === fullStars + 1 && hasHalfStar

          return (
            <button
              key={star}
              onClick={() => interactive && onRatingChange?.(star)}
              disabled={!interactive}
              className={`${sizeClasses[size]} transition-colors ${
                interactive ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
              }`}
            >
              {isFilled ? (
                <span className="text-scnt-accent">★</span>
              ) : isHalf ? (
                <span className="relative inline-block">
                  <span className="text-scnt-border/50">★</span>
                  <span
                    className="absolute top-0 left-0 overflow-hidden w-1/2 text-scnt-accent"
                    style={{ overflow: 'hidden' }}
                  >
                    ★
                  </span>
                </span>
              ) : (
                <span className="text-scnt-border/50">★</span>
              )}
            </button>
          )
        })}
      </div>
      {count !== undefined && (
        <span className="text-sm text-scnt-text/70">
          {displayRating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
      {count === undefined && displayRating > 0 && (
        <span className="text-sm text-scnt-text/70">{displayRating.toFixed(1)}</span>
      )}
    </div>
  )
})
