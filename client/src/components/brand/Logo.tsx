import { Link } from 'react-router-dom'

type LogoProps = {
  className?: string
  to?: string
  /** Softer contrast for transparent / hero-overlaid header bars */
  tone?: 'default' | 'soft' | 'light'
}

/**
 * Compass-style 8-point sparkle: long N/E/S/W tips, shorter diagonals (~64%),
 * deep inner valleys — filled path, superscript after “g”.
 */
function LockupStar() {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 100 100"
      className="ms-[0.05em] inline-block h-[0.52em] w-[0.52em] shrink-0 align-super text-current"
      role="presentation"
      aria-hidden={true}
    >
      <path
        fill="currentColor"
        d="M50,6 L52.679,43.533 L69.799,30.201 L56.467,47.321 L94,50 L56.467,52.679 L69.799,69.799 L52.679,56.467 L50,94 L47.321,56.467 L30.201,69.799 L43.533,52.679 L6,50 L43.533,47.321 L30.201,30.201 L47.321,43.533 Z"
      />
    </svg>
  )
}

export function Logo({ className = '', to = '/', tone = 'default' }: LogoProps) {
  const text =
    tone === 'soft'
      ? 'text-scnt-text/90 sm:text-scnt-text'
      : tone === 'light'
        ? 'text-white/95'
        : 'text-scnt-text'
  const muted =
    tone === 'soft'
      ? 'text-scnt-text-muted/85 sm:text-scnt-text-muted'
      : tone === 'light'
        ? 'text-white/70'
        : 'text-scnt-text-muted'

  const inner = (
    <span
      dir="ltr"
      className={`inline-flex flex-col items-stretch gap-y-[0.14em] font-serif text-2xl tracking-[0.12em] leading-none sm:text-3xl ${text} ${className}`.trim()}
    >
      <span className="self-center whitespace-nowrap">
        SCNT<span className={muted}>.</span>
        <span className={`whitespace-nowrap ${muted}`}>
          eg
          <LockupStar />
        </span>
      </span>
      <span
        className={`block w-full text-center text-[0.28em] font-light uppercase leading-none tracking-[0.6em] -translate-x-[0.6em] ${text}`}
      >
        FRAGRANCES
      </span>
    </span>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/25 focus-visible:ring-offset-2 focus-visible:ring-offset-scnt-bg"
      >
        {inner}
      </Link>
    )
  }

  return inner
}
