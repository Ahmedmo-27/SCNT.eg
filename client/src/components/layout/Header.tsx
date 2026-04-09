import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '../brand/Logo'
import { EightPointStar } from '../ui/EightPointStar'

const nav = [
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative text-sm font-normal tracking-wide text-scnt-text-muted transition-colors duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    isActive ? 'text-scnt-text' : 'hover:text-scnt-text',
  ].join(' ')

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-scnt-border/90 bg-scnt-bg/80 shadow-[inset_0_-1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-10 md:flex" aria-label="Main">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-star"
                      className="pointer-events-none absolute -bottom-2 left-1/2 flex -translate-x-1/2 text-scnt-text/35"
                      aria-hidden
                    >
                      <EightPointStar size={10} />
                    </motion.span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            className="group relative flex items-center gap-2 text-sm text-scnt-text-muted transition-colors duration-[650ms] hover:text-scnt-text"
          >
            <span className="hidden sm:inline">Cart</span>
            <span className="text-scnt-text/40 transition-opacity duration-[650ms] group-hover:opacity-100">
              <EightPointStar size={12} />
            </span>
          </Link>
        </div>
      </div>

      <nav
        className="flex border-t border-scnt-border/60 px-5 py-3 md:hidden"
        aria-label="Mobile main"
      >
        <div className="flex w-full justify-between gap-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="text-xs tracking-wide text-scnt-text-muted"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
