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

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0" />
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
  const [scrolled, setScrolled] = useState(false)
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
  }, [megaOpen, sideOpen, scrolled])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
  const topTransparent = !scrolled && !sideOpen && !megaOpen
  const iconBtnClass = iconBtn
  const navTone = navText

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-0">
      <header
        ref={headerRef}
        className={`relative pointer-events-auto flex w-full max-w-[100vw] flex-col transition-[background-color,border-color,box-shadow,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          topTransparent
            ? 'border-b border-transparent bg-transparent shadow-none'
            : 'border-b border-scnt-border/80 bg-scnt-bg/92 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150'
        }`}
      >
        <div
          className={`relative mx-auto flex w-full max-w-6xl items-center justify-center px-5 transition-[padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 ${
            topTransparent ? 'py-5 sm:py-6' : 'py-3 sm:py-3.5'
          }`}
        >
          <button
            type="button"
            className={`${iconBtnClass} absolute left-5 top-1/2 -translate-y-1/2 lg:hidden sm:left-8`}
            aria-label="Open menu"
            aria-expanded={sideOpen}
            onClick={() => setSideOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div
            className={`flex justify-center transition-[transform,margin] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? 'lg:-translate-x-[40vw]' : ''
            }`}
          >
            <Logo
              tone="default"
              className={`transition-[font-size,letter-spacing,color,text-shadow,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                topTransparent
                  ? 'text-[2.6rem] tracking-[0.11em] sm:text-[3.2rem]'
                  : 'text-[2rem] tracking-[0.12em] sm:text-[2.4rem]'
              }`}
            />
          </div>

          <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center justify-end gap-1 sm:right-8 sm:gap-2">
            <Link to="/contact" className={`${iconBtnClass} !hidden lg:!inline-flex`} aria-label="Contact">
              <IconPhone className="h-5 w-5" />
            </Link>
            <Link to="/profile" className={`${iconBtnClass} !hidden lg:!inline-flex`} aria-label="Profile">
              <IconUser className="h-5 w-5" />
            </Link>
            <Link to="/cart" className={`${iconBtnClass} !hidden lg:!inline-flex`} aria-label="Cart">
              <IconCart className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div
          className={`mx-auto hidden w-full max-w-6xl px-5 transition-[border-color,transform,opacity,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 lg:block ${
            topTransparent
              ? 'border-t border-white/20 py-3 text-white/95'
              : 'border-t border-scnt-border/50 py-2.5'
          }`}
        >
          <nav
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
            aria-label="Primary"
            onMouseLeave={scheduleMegaClose}
          >
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              Shop all
            </NavLink>
            <button
              type="button"
              className={`${navLinkBase} cursor-pointer border-b-2 border-transparent pb-2 ${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'} ${megaOpen ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : ''}`}
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
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              Contact
            </NavLink>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              Create account
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
          className={`fixed inset-y-0 !left-0 !right-auto z-[130] m-0 flex h-svh w-[min(320px,92vw)] flex-col overflow-hidden rounded-none border-r border-scnt-border/80 bg-scnt-bg-elevated shadow-2xl transition-[transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
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
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto bg-scnt-bg-elevated px-4 py-5 text-sm" onClick={() => setSideOpen(false)}>
            <Link to="/" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Home
            </Link>
            <Link to="/shop" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Shop all
            </Link>
            <Link to="/about" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              About
            </Link>
            <Link to="/contact" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Contact
            </Link>
            <Link to="/login" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Login
            </Link>
            <Link to="/register" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Create account
            </Link>
            <Link to="/profile" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Profile
            </Link>
            <Link to="/cart" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Cart
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
