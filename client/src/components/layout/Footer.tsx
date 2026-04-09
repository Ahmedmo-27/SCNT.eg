import { Link } from 'react-router-dom'
import { EightPointStar } from '../ui/EightPointStar'
import { Logo } from '../brand/Logo'

export function Footer() {
  return (
    <footer className="relative mt-28 border-t border-scnt-border/80 bg-gradient-to-b from-scnt-bg-muted/40 via-scnt-bg-muted/55 to-scnt-bg-muted/65">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-4">
          <Logo to="/" />
          <p className="text-sm leading-relaxed text-scnt-text-muted">
            Curated luxury fragrances — four identities, one house. Cairo-born
            sensibility with a calm, global tone.
          </p>
        </div>

        <div className="flex flex-wrap gap-10 text-sm text-scnt-text-muted">
          <div className="space-y-3">
            <p className="font-medium text-scnt-text">Shop</p>
            <ul className="space-y-2">
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/collections">
                  Collections
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/cart">
                  Cart
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-medium text-scnt-text">House</p>
            <ul className="space-y-2">
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-scnt-text" to="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-scnt-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-scnt-text-muted sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} SCNT.eg. All rights reserved.</p>
          <span className="inline-flex items-center gap-2 opacity-60" aria-hidden>
            <EightPointStar size={9} />
          </span>
        </div>
      </div>
    </footer>
  )
}
