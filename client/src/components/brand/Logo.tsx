import { Link } from 'react-router-dom'

type LogoProps = {
  className?: string
  to?: string
  /** Softer contrast for transparent / hero-overlaid header bars */
  tone?: 'default' | 'soft' | 'light'
}

/**
 * Wordmark placeholder — replace `src/assets/logo.svg` when the official
 * lockup is available; background beige should match `--color-scnt-bg`.
 */
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
      className={`font-serif text-2xl tracking-[0.12em] ${text} sm:text-3xl ${className}`.trim()}
    >
      SCNT<span className={muted}>.eg</span>
    </span>
  )

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-scnt-text/25 focus-visible:ring-offset-2 focus-visible:ring-offset-scnt-bg">
        {inner}
      </Link>
    )
  }

  return inner
}
