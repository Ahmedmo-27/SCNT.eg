import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo } from '../brand/Logo'
import { collections } from '../../data/collections'
import { products as allProducts } from '../../data/products'

const LANG_KEY = 'scnt-lang'
const MEGA_LEAVE_MS = 28

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h4l2 5-2.5 1.5a11 11 0 006.5 6.5L16 14l5 2v4a2 2 0 01-2.2 2C9.6 20 4 14.4 4 6.2 4 5 5 4 6 4z" />
    </svg>
  )
}

function IconCart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000-2z" />
    </svg>
  )
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

const navLinkBase =
  'text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'

const navText = 'text-scnt-text/90 hover:text-scnt-text'

export function Header() {
  const location = useLocation()
  const headerRef = useRef<HTMLElement>(null)
  const [sideOpen, setSideOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const megaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const overMega = useRef(false)
  const overTrigger = useRef(false)

  const [lang, setLang] = useState<'en' | 'ar'>(() => {
    try {
      const s = localStorage.getItem(LANG_KEY)
      return s === 'ar' ? 'ar' : 'en'
    } catch {
      return 'en'
    }
  })

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--scnt-header-h', `${el.offsetHeight}px`)
    })
    ro.observe(el)
    document.documentElement.style.setProperty('--scnt-header-h', `${el.offsetHeight}px`)
    return () => ro.disconnect()
  }, [megaOpen, sideOpen])

  useEffect(() => {
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en'
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  useEffect(() => {
    setSideOpen(false)
    setMegaOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSideOpen(false)
        setMegaOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const scheduleMegaClose = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current)
    megaTimer.current = setTimeout(() => {
      if (!overMega.current && !overTrigger.current) setMegaOpen(false)
    }, MEGA_LEAVE_MS)
  }

  const collectionImages = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of collections) {
      const p = allProducts.find((x) => x.collection === c.id)
      map[c.id] = p?.galleryImages[0] ?? ''
    }
    return map
  }, [])

  const iconBtn =
    'inline-flex items-center justify-center rounded-full p-2 text-scnt-text-muted transition-colors hover:bg-scnt-border/40 hover:text-scnt-text'

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-0">
      <header
        ref={headerRef}
        className="relative pointer-events-auto flex w-full max-w-[100vw] flex-col border-b border-scnt-border/80 bg-scnt-bg/92 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-5 py-3 sm:px-8">
          <button
            type="button"
            className={`${iconBtn} lg:hidden`}
            aria-label="Open menu"
            aria-expanded={sideOpen}
            onClick={() => setSideOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <Link to="/contact" className={`${iconBtn} hidden lg:inline-flex`} aria-label="Contact">
              <IconPhone className="h-5 w-5" />
            </Link>
            {/* <span className={`${iconBtn} hidden cursor-default opacity-40 lg:inline-flex`} title="Coming soon" aria-hidden>
              <IconUser className="h-5 w-5" />
            </span>
            <span className={`${iconBtn} hidden cursor-default opacity-40 lg:inline-flex`} title="Coming soon" aria-hidden>
              <IconHeart className="h-5 w-5" />
            </span> */}
            <Link to="/cart" className={iconBtn} aria-label="Cart">
              <IconCart className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-6xl border-t border-scnt-border/50 px-5 py-2.5 sm:px-8 lg:block">
          <nav
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
            aria-label="Primary"
            onMouseLeave={scheduleMegaClose}
          >
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? 'border-scnt-text text-scnt-text' : `${navText} hover:border-scnt-text/30`}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? 'border-scnt-text text-scnt-text' : `${navText} hover:border-scnt-text/30`}`
              }
            >
              Shop all
            </NavLink>
            <button
              type="button"
              className={`${navLinkBase} cursor-pointer border-b-2 border-transparent pb-2 ${navText} hover:border-scnt-text/30 ${megaOpen ? 'border-scnt-text text-scnt-text' : ''}`}
              aria-expanded={megaOpen}
              onMouseEnter={() => {
                overTrigger.current = true
                if (megaTimer.current) clearTimeout(megaTimer.current)
                setMegaOpen(true)
              }}
              onMouseLeave={() => {
                overTrigger.current = false
                scheduleMegaClose()
              }}
            >
              Collections
            </button>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? 'border-scnt-text text-scnt-text' : `${navText} hover:border-scnt-text/30`}`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? 'border-scnt-text text-scnt-text' : `${navText} hover:border-scnt-text/30`}`
              }
            >
              Contact
            </NavLink>
          </nav>
        </div>

        {megaOpen ? (
          <div
            className="animate-scnt-mega absolute left-0 right-0 top-full border-t border-scnt-border/70 bg-scnt-bg-elevated/98 shadow-[0_24px_48px_-24px_var(--color-scnt-shadow)] backdrop-blur-xl"
            onMouseEnter={() => {
              overMega.current = true
              if (megaTimer.current) clearTimeout(megaTimer.current)
            }}
            onMouseLeave={() => {
              overMega.current = false
              scheduleMegaClose()
            }}
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:px-8">
              <div className="flex shrink-0 flex-col gap-3 border-scnt-border/60 sm:border-e sm:pe-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scnt-text">Collections</p>
                {collections.map((c) => (
                  <Link
                    key={c.id}
                    to={`/collections/${c.id}`}
                    className="text-sm text-scnt-text-muted transition-colors hover:text-scnt-text"
                    onClick={() => setMegaOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))}
                <Link
                  to="/collections"
                  className="mt-2 text-xs uppercase tracking-wider text-scnt-text/80 underline-offset-4 hover:underline"
                  onClick={() => setMegaOpen(false)}
                >
                  View all
                </Link>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
                {collections.map((c) => (
                  <Link
                    key={c.id}
                    to={`/collections/${c.id}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-scnt-border/60 bg-scnt-bg/40 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    onClick={() => setMegaOpen(false)}
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-scnt-bg-muted/50">
                      {collectionImages[c.id] ? (
                        <img
                          src={collectionImages[c.id]}
                          alt=""
                          className="h-full w-full object-cover transition-[filter,transform] duration-500 group-hover:scale-[1.03] group-hover:brightness-[0.92]"
                        />
                      ) : null}
                    </div>
                    <p className="px-2 py-3 text-center text-[0.65rem] font-medium uppercase tracking-[0.16em] text-scnt-text">
                      {c.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`fixed inset-0 z-[120] bg-scnt-text/25 backdrop-blur-[2px] transition-opacity lg:hidden ${
            sideOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!sideOpen}
          onClick={() => setSideOpen(false)}
        />
        <aside
          className={`fixed left-0 top-0 z-[130] flex h-full w-[min(280px,88vw)] flex-col bg-scnt-bg-elevated shadow-2xl transition-[transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
            sideOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Mobile navigation"
          aria-hidden={!sideOpen}
        >
          <div className="flex items-center justify-between border-b border-scnt-border/60 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">Menu</span>
            <button type="button" className={iconBtn} onClick={() => setSideOpen(false)} aria-label="Close menu">
              <IconX className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 overflow-y-auto px-2 py-4 text-sm" onClick={() => setSideOpen(false)}>
            <Link to="/" className="rounded-md px-3 py-2.5 text-scnt-text hover:bg-scnt-border/30">
              Home
            </Link>
            <Link to="/contact" className="rounded-md px-3 py-2.5 text-scnt-text hover:bg-scnt-border/30">
              Contact
            </Link>
            <span className="cursor-default rounded-md px-3 py-2.5 text-scnt-text-muted/60">Account (soon)</span>
            <span className="cursor-default rounded-md px-3 py-2.5 text-scnt-text-muted/60">Wishlist (soon)</span>
            <Link to="/cart" className="rounded-md px-3 py-2.5 text-scnt-text hover:bg-scnt-border/30">
              Cart
            </Link>
            <Link to="/shop" className="rounded-md px-3 py-2.5 text-scnt-text hover:bg-scnt-border/30">
              Shop all
            </Link>
            <p className="mt-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-scnt-text-muted">
              Collections
            </p>
            {collections.map((c) => (
              <Link
                key={c.id}
                to={`/collections/${c.id}`}
                className="rounded-md px-3 py-2 ps-5 text-scnt-text-muted hover:bg-scnt-border/30 hover:text-scnt-text"
              >
                {c.name}
              </Link>
            ))}
            <Link to="/about" className="mt-2 rounded-md px-3 py-2.5 text-scnt-text hover:bg-scnt-border/30">
              About
            </Link>
            <div className="mt-4 flex items-center gap-2 px-3">
              <span className="text-xs text-scnt-text-muted">Language</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'en' | 'ar')}
                className="rounded border border-scnt-border/60 bg-scnt-bg px-2 py-1 text-xs text-scnt-text"
              >
                <option value="en">EN</option>
                <option value="ar">AR</option>
              </select>
            </div>
          </nav>
        </aside>
      </header>
    </div>
  )
}
