import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getStoredAuthToken } from '../../lib/authStorage'
import { Logo } from '../brand/Logo'
import { useCatalog } from '../../context/CatalogContext'
import { sortCollectionsForDisplay } from '../../lib/catalogDisplayOrder'
import { fetchProductsByQuery } from '../../services/productSearch'
import type { ApiProduct } from '../../types/catalog'
import { useWishlistStore } from '../../store/wishlistStore'
import { useCartStore } from '../../store/cartStore'

const LANG_KEY = 'scnt-lang'
const MEGA_LEAVE_MS = 28
const SEARCH_DEBOUNCE_MS = 320

function formatEgp(n: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n)
}

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

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-4.3-9-8.5C1.2 8.5 3.3 5 7 5c2 0 3.4 1 5 3 1.6-2 3-3 5-3 3.7 0 5.8 3.5 4 7.5C19 16.7 12 21 12 21z"
      />
    </svg>
  )
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3-3" />
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
  'header-link-star relative inline-flex items-center gap-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'

const navText = 'text-scnt-text/90 hover:text-scnt-text'

export function Header() {
  const { collections, previewImageByCollectionId } = useCatalog()
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const cartCount = useCartStore((s) => s.items.length)
  const navCollections = useMemo(() => sortCollectionsForDisplay(collections), [collections])
  const location = useLocation()
  const navigate = useNavigate()
  const headerRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const megaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const overMega = useRef(false)
  const overTrigger = useRef(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  const [lang] = useState<'en' | 'ar'>(() => {
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
  }, [megaOpen, sideOpen, scrolled, searchOpen, searchExpanded])

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
    setMobileCollectionsOpen(false)
    setMegaOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
    setSearchExpanded(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSideOpen(false)
        setMegaOpen(false)
        setSearchOpen(false)
        setSearchQuery('')
        setSearchResults([])
        setSearchError(null)
        setSearchLoading(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      setSearchError(null)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    setSearchError(null)
    const id = window.setTimeout(() => {
      fetchProductsByQuery(q, 8)
        .then((res) => setSearchResults(res.items))
        .catch((err) => {
          setSearchError(err instanceof Error ? err.message : 'Search failed')
          setSearchResults([])
        })
        .finally(() => setSearchLoading(false))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [searchQuery])

  useEffect(() => {
    if (searchQuery.trim()) setSearchExpanded(true)
  }, [searchQuery])

  const groupedResults = useMemo(() => {
    const m = new Map<string, ApiProduct[]>()
    for (const p of searchResults) {
      const key = p.collection?.name?.trim() || 'Catalogue'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(p)
    }
    return [...m.entries()]
  }, [searchResults])

  const onSearchInput = (value: string, opts?: { keepOpenWhenEmpty?: boolean }) => {
    setSearchQuery(value)
    if (value.trim()) setSearchOpen(true)
    else if (!opts?.keepOpenWhenEmpty) {
      setSearchOpen(false)
      setSearchResults([])
      setSearchError(null)
      setSearchLoading(false)
    }
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
    setSearchLoading(false)
    setSearchExpanded(false)
  }

  const scheduleMegaClose = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current)
    megaTimer.current = setTimeout(() => {
      if (!overMega.current && !overTrigger.current) setMegaOpen(false)
    }, MEGA_LEAVE_MS)
  }

  const iconBtn =
    'inline-flex items-center justify-center rounded-full p-2 text-scnt-text-muted transition-colors hover:bg-scnt-border/40 hover:text-scnt-text'
  const topTransparent = !scrolled && !sideOpen && !megaOpen && !searchOpen
  const iconBtnClass = iconBtn
  const navTone = navText

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-0">
      <header
        ref={headerRef}
        className={`relative pointer-events-auto flex w-full max-w-[100vw] flex-col transition-[background-color,border-color,box-shadow,padding] duration-[820ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] ${
          topTransparent
            ? 'border-b border-transparent bg-transparent shadow-none'
            : 'border-b border-scnt-border/80 bg-scnt-bg/92 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150'
        }`}
      >
        <div
          className={`relative mx-auto flex w-full max-w-6xl items-center justify-center px-5 transition-[padding] duration-[820ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] sm:px-8 ${
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
            className={`flex justify-center transition-[transform,margin] duration-[900ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] will-change-transform ${
              scrolled ? 'lg:-translate-x-[40vw]' : ''
            }`}
          >
            <Logo
              tone="default"
              className={`transition-[font-size,letter-spacing,color,text-shadow,transform] duration-[900ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] will-change-transform ${
                topTransparent
                  ? 'text-[2.6rem] tracking-[0.11em] sm:text-[3.2rem]'
                  : 'text-[2rem] tracking-[0.12em] sm:text-[2.4rem]'
              }`}
            />
          </div>

          <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center justify-end gap-1 sm:right-8 sm:gap-2">
            <div
              className={`relative mr-0.5 hidden overflow-hidden rounded-full border transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:grid sm:items-stretch ${
                searchExpanded
                  ? 'w-[min(220px,40vw)] grid-cols-[minmax(0,1fr)_2.5rem]'
                  : 'h-10 w-10 grid-cols-1 place-items-center'
              } ${
                topTransparent
                  ? 'border-scnt-border/55 bg-scnt-bg/25 backdrop-blur-md'
                  : 'border-scnt-border/80 bg-scnt-bg-elevated/65'
              }`}
            >
              {searchExpanded ? (
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchInput(e.target.value)}
                  placeholder="Search"
                  className="col-start-1 min-w-0 border-0 bg-transparent py-2 pl-3 text-xs text-scnt-text placeholder:text-scnt-text-muted/75 focus:outline-none focus:ring-0"
                  aria-label="Search products"
                  autoComplete="off"
                />
              ) : null}
              <button
                type="button"
                className={`inline-flex size-10 shrink-0 items-center justify-center text-scnt-text-muted transition-colors hover:text-scnt-text ${
                  searchExpanded ? 'col-start-2 row-start-1' : 'col-start-1 row-start-1'
                }`}
                aria-label={searchExpanded ? 'Collapse search' : 'Expand search'}
                onClick={() => setSearchExpanded((prev) => !prev)}
              >
                <IconSearch className="pointer-events-none h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              className={`${iconBtnClass} sm:hidden`}
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch className="h-5 w-5" />
            </button>
            <Link to="/contact" className={`${iconBtnClass} !hidden lg:!inline-flex`} aria-label="Contact">
              <IconPhone className="h-5 w-5" />
            </Link>
            <button
              type="button"
              className={`${iconBtnClass} !hidden lg:!inline-flex`}
              aria-label="Profile"
              onClick={() => navigate(getStoredAuthToken() ? '/profile' : '/login')}
            >
              <IconUser className="h-5 w-5" />
            </button>
            <Link
              to="/wishlist"
              className={`${iconBtnClass} !hidden lg:!inline-flex relative`}
              aria-label="Wishlist"
            >
              <IconHeart className="h-5 w-5" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-scnt-text px-1 text-[0.6rem] leading-4 text-scnt-bg">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>
            <Link to="/cart" className={`${iconBtnClass} relative`} aria-label="Cart">
              <IconCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-scnt-text px-1 text-[0.6rem] leading-4 text-scnt-bg">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div
          className={`mx-auto w-full max-w-6xl px-5 transition-[border-color,transform,opacity,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 hidden ${
            searchOpen ? 'lg:hidden' : 'lg:block'
          } ${
            topTransparent
              ? 'border-t border-white/20 py-3 text-white/95'
              : 'border-t border-scnt-border/50 py-2.5'
          }`}
        >
          <nav
            className={`header-primary-nav flex flex-wrap items-center justify-center gap-x-8 gap-y-2 ${
              topTransparent ? 'header-primary-nav--transparent' : ''
            }`}
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
              to="/find-your-scnt"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              Find your SCNT
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/faqs"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              FAQs
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
                {navCollections.map((c) => (
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
                {navCollections.map((c) => (
                  <Link
                    key={c.id}
                    to={`/collections/${c.id}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-scnt-border/60 bg-scnt-bg/40 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                    onClick={() => setMegaOpen(false)}
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-scnt-bg-muted/50">
                      {previewImageByCollectionId[c.id] ? (
                        <img
                          src={previewImageByCollectionId[c.id]}
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

        {searchOpen ? (
          <div className="absolute left-0 right-0 top-full z-[110] max-h-[min(80vh,560px)] overflow-y-auto border-t border-scnt-border/80 bg-scnt-bg shadow-[0_28px_60px_-28px_var(--color-scnt-shadow)]">
            <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8">
              <button
                type="button"
                className="absolute end-4 top-5 inline-flex rounded-full p-2 text-scnt-text-muted transition-colors hover:bg-scnt-border/35 hover:text-scnt-text"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <IconX className="h-5 w-5" />
              </button>
              <h2 className="pr-12 font-serif text-xl font-normal tracking-[0.08em] text-scnt-text sm:text-2xl">Products</h2>
              <p className="mt-1 max-w-xl text-sm text-scnt-text-muted">Search the live catalogue — names, notes, and descriptions.</p>

              <div className="mt-5 sm:hidden">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchInput(e.target.value, { keepOpenWhenEmpty: true })}
                  placeholder="Search fragrances…"
                  className="w-full rounded-xl border border-scnt-border/80 bg-scnt-bg-elevated/70 px-4 py-3 text-sm text-scnt-text placeholder:text-scnt-text-muted/75 focus:border-scnt-text/20 focus:outline-none focus:ring-2 focus:ring-scnt-text/10"
                  aria-label="Search products"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="mt-8 space-y-8">
                {searchLoading ? (
                  <p className="text-sm text-scnt-text-muted">Searching…</p>
                ) : searchError ? (
                  <p className="text-sm text-scnt-text-muted">{searchError}</p>
                ) : !searchQuery.trim() ? (
                  <p className="text-sm text-scnt-text-muted">Type to see products from the server.</p>
                ) : searchResults.length === 0 ? (
                  <div className="rounded-xl border border-scnt-border/70 bg-scnt-bg-elevated/40 px-5 py-8 text-center">
                    <p className="text-sm font-medium text-scnt-text">No matches for “{searchQuery.trim()}”</p>
                    <p className="mt-2 text-xs text-scnt-text-muted">
                      Try a note, collection name, or part of a product name.
                    </p>
                  </div>
                ) : (
                  groupedResults.map(([brand, items]) => (
                    <div key={brand}>
                      <h3 className="border-b border-scnt-border/70 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-scnt-text-muted">
                        {brand}
                      </h3>
                      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="listbox">
                        {items.map((p) => (
                          <li key={p._id} className="sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)]">
                            <Link
                              to={`/product/${p.slug}`}
                              className="flex gap-3 rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/35 p-3 transition-[background-color,box-shadow,border-color] duration-300 hover:border-scnt-text/15 hover:bg-scnt-bg-muted/45 hover:shadow-[0_14px_40px_-24px_var(--color-scnt-shadow)]"
                              onClick={closeSearch}
                              role="option"
                            >
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-scnt-bg-muted/60 ring-1 ring-scnt-border/50">
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-scnt-text">{p.name}</p>
                                <p className="text-xs text-scnt-text-muted">{formatEgp(p.price)}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              {searchQuery.trim() && searchResults.length > 0 ? (
                <Link
                  to={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
                  className="mt-8 inline-flex text-sm font-medium text-scnt-text-muted underline-offset-4 transition-colors hover:text-scnt-text hover:underline"
                  onClick={closeSearch}
                >
                  View all results for “{searchQuery.trim()}”
                </Link>
              ) : null}
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
            <button
              type="button"
              className="mt-2 rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 text-left leading-6 text-scnt-text hover:bg-scnt-border/30"
              aria-expanded={mobileCollectionsOpen}
              onMouseEnter={() => setMobileCollectionsOpen(true)}
              onClick={(e) => {
                e.stopPropagation()
                setMobileCollectionsOpen((prev) => !prev)
              }}
            >
              Collections
            </button>
            {mobileCollectionsOpen
              ? navCollections.map((c) => (
                  <Link
                    key={c.id}
                    to={`/collections/${c.id}`}
                    className="rounded-md px-3 py-2 ps-5 text-scnt-text-muted hover:bg-scnt-border/30 hover:text-scnt-text"
                  >
                    {c.name}
                  </Link>
                ))
              : null}
            <Link
              to="/find-your-scnt"
              className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30"
            >
              Find your SCNT
            </Link>
            <Link to="/about" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              About
            </Link>
            <Link to="/faqs" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              FAQs
            </Link>
            <Link to="/contact" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Contact
            </Link>
            <Link to="/cart" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Cart
            </Link>
            <Link
              to={getStoredAuthToken() ? "/profile" : "/login"}
              className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30"
            >
              Profile
            </Link>
            <Link to="/wishlist" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              Wishlist
            </Link>
          </nav>
        </aside>
      </header>
    </div>
  )
}
