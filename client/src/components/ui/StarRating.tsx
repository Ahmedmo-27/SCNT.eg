import { memo } from 'react'
import { StarIcon } from '../icons'

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
  const pixelSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  }

  const iconSize = pixelSizes[size]
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
              type="button"
              onClick={() => interactive && onRatingChange?.(star)}
              disabled={!interactive}
              className={`inline-flex items-center justify-center transition-transform ${
                interactive ? 'cursor-pointer hover:scale-115 active:scale-95' : 'cursor-default'
              }`}
            >
              {isFilled ? (
                <StarIcon size={iconSize} filled className="text-scnt-accent" />
              ) : isHalf ? (
                <StarIcon size={iconSize} half className="text-scnt-accent" />
              ) : (
                <StarIcon size={iconSize} filled={false} className="text-scnt-border/60" />
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
