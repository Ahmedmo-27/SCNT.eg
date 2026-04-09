import { Link } from 'react-router-dom'

type LogoProps = {
  className?: string
  to?: string
}

/**
 * Wordmark placeholder — replace `src/assets/logo.svg` when the official
 * lockup is available; background beige should match `--color-scnt-bg`.
 */
export function Logo({ className = '', to = '/' }: LogoProps) {
  const inner = (
    <span
      className={`font-serif text-2xl tracking-[0.12em] text-scnt-text sm:text-3xl ${className}`.trim()}
    >
      SCNT<span className="text-scnt-text-muted">.eg</span>
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
