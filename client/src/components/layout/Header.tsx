import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getStoredAuthToken } from '../../lib/authStorage'
import { Logo } from '../brand/Logo'
import { useCatalog } from '../../context/CatalogContext'
import { useSectionScroll } from '../../context/SectionScrollContext'
import { sortCollectionsForDisplay } from '../../lib/catalogDisplayOrder'
import { fetchProductsByQuery } from '../../services/productSearch'
import { localizedCollectionName, localizedProductName } from '../../lib/catalogMappers'
import type { ApiProduct } from '../../types/catalog'
import { useWishlistStore } from '../../store/wishlistStore'
import { useCartStore } from '../../store/cartStore'
import { useI18n } from '../../i18n/I18nContext'
import { formatEgp } from '../../lib/formatEgp'

const MEGA_LEAVE_MS = 28
const SEARCH_DEBOUNCE_MS = 320
/** Past this offset we treat scroll as real user movement and drop the search hero lock. */
const SEARCH_HERO_LOCK_CLEAR_PX = 24

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
  const { t, locale, setLocale } = useI18n()
  const { collections, previewImageByCollectionId } = useCatalog()
  const { activeSectionIndex } = useSectionScroll()
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const cartCount = useCartStore((s) => s.items.length)
  const navCollections = useMemo(() => sortCollectionsForDisplay(collections), [collections])
  const location = useLocation()
  const navigate = useNavigate()
  const headerRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(() => (typeof window !== 'undefined' ? window.scrollY : 0))
  /** True when search text was first entered while at the top; avoids layout/search panel from briefly pushing `scrollY` past the hero threshold. */
  const [preserveHeroForSearch, setPreserveHeroForSearch] = useState(false)
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

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? entry?.contentRect.height
      if (typeof height !== 'number') return
      document.documentElement.style.setProperty('--scnt-header-h', `${height}px`)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrollY(y)
      setScrolled(y > 8)
      if (y > SEARCH_HERO_LOCK_CLEAR_PX) setPreserveHeroForSearch(false)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setSideOpen(false)
    setMobileCollectionsOpen(false)
    setMegaOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
    setSearchExpanded(false)
    setPreserveHeroForSearch(false)
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
        setPreserveHeroForSearch(false)
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
    const m = new Map<string, { slug: string; label: string; items: ApiProduct[] }>()
    for (const p of searchResults) {
      const slug = p.collection?.slug?.trim() || '_'
      const label = localizedCollectionName(p.collection, locale) || t('header.catalogue')
      if (!m.has(slug)) m.set(slug, { slug, label, items: [] })
      m.get(slug)!.items.push(p)
    }
    return [...m.values()]
  }, [searchResults, locale, t])

  const onSearchInput = (value: string, opts?: { keepOpenWhenEmpty?: boolean }) => {
    const prevTrim = searchQuery.trim()
    const nextTrim = value.trim()
    if (!prevTrim && nextTrim && typeof window !== 'undefined' && window.scrollY <= 8) {
      setPreserveHeroForSearch(true)
    }
    if (!nextTrim) setPreserveHeroForSearch(false)

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
    setPreserveHeroForSearch(false)
  }

  const scheduleMegaClose = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current)
    megaTimer.current = setTimeout(() => {
      if (!overMega.current && !overTrigger.current) setMegaOpen(false)
    }, MEGA_LEAVE_MS)
  }

  const iconBtn =
    'inline-flex items-center justify-center rounded-full p-2 text-scnt-text-muted transition-colors hover:bg-scnt-border/40 hover:text-scnt-text'

  const productSearchActive = searchQuery.trim().length > 0
  const isOnCollectionPage = activeSectionIndex > 0
  const navbarUsesScrolledShape =
    (scrolled || isOnCollectionPage) &&
    !(preserveHeroForSearch && productSearchActive && scrollY <= SEARCH_HERO_LOCK_CLEAR_PX)
  const topTransparent =
    !sideOpen &&
    (!searchOpen || productSearchActive) &&
    !navbarUsesScrolledShape

  const iconBtnClass = iconBtn
  const navTone = navText

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-0">
      <header
        ref={headerRef}
        className={`relative pointer-events-auto flex w-full max-w-[100vw] flex-col transition-[background-color,border-color,box-shadow,padding] duration-[820ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] max-lg:duration-[260ms] max-lg:ease-out max-lg:transition-[background-color,border-color,padding] ${
          topTransparent
            ? 'border-b border-transparent bg-transparent shadow-none'
            : 'border-b border-scnt-border/80 bg-scnt-bg/92 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150 max-lg:bg-scnt-bg max-lg:shadow-sm max-lg:backdrop-blur-none max-lg:backdrop-saturate-100'
        }`}
      >
        <div
          className={`relative mx-auto flex w-full max-w-6xl items-center justify-center px-5 transition-[padding] duration-[820ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] max-lg:duration-[260ms] max-lg:ease-out sm:px-8 ${
            topTransparent ? 'py-5 sm:py-6' : 'py-3 sm:py-3.5'
          }`}
        >
          <button
            type="button"
            className={`${iconBtnClass} absolute start-5 top-1/2 -translate-y-1/2 lg:hidden sm:start-8`}
            aria-label={t('header.openMenu')}
            aria-expanded={sideOpen}
            onClick={() => setSideOpen(true)}
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div
            className={`absolute start-5 top-1/2 z-[2] max-w-[min(100%,calc(50vw-3.5rem))] -translate-y-1/2 flex-wrap items-center gap-x-2 gap-y-2 sm:start-8 ${
              topTransparent ? 'hidden lg:flex' : 'hidden'
            }`}
          >
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-scnt-border/60 bg-scnt-bg-elevated/55 px-3 py-2 text-[0.7rem] font-medium text-scnt-text shadow-sm backdrop-blur-md transition-colors hover:bg-scnt-bg-elevated/80 hover:border-scnt-border/80"
              aria-label={t('header.contactUs')}
            >
              <IconPhone className="h-5 w-5 shrink-0 text-scnt-text-muted" />
              <span>{t('header.contactUs')}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="group" aria-label={t('header.language')}>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  className={`rounded-full px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wider transition-colors ${
                    locale === 'en'
                      ? 'bg-scnt-text text-scnt-bg'
                      : 'text-scnt-text-muted hover:bg-scnt-border/35 hover:text-scnt-text'
                  }`}
                  aria-pressed={locale === 'en'}
                  onClick={() => setLocale('en')}
                >
                  {t('lang.en')}
                </button>
                <button
                  type="button"
                  className={`rounded-full px-2 py-1 text-[0.65rem] font-medium transition-colors ${
                    locale === 'ar'
                      ? 'bg-scnt-text text-scnt-bg'
                      : 'text-scnt-text-muted hover:bg-scnt-border/35 hover:text-scnt-text'
                  }`}
                  aria-pressed={locale === 'ar'}
                  onClick={() => setLocale('ar')}
                >
                  {t('lang.ar')}
                </button>
              </div>
            </div>

            <div className="min-w-0 max-w-full">
              <div
                className={`relative min-w-0 overflow-hidden rounded-full border transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] grid sm:items-stretch ${
                  searchExpanded
                    ? 'w-[min(220px,40vw)] grid-cols-[minmax(0,1fr)_2.5rem]'
                    : 'h-10 w-10 grid-cols-1 place-items-center'
                } border-scnt-border/55 bg-scnt-bg-elevated/55 backdrop-blur-md`}
              >
                {searchExpanded ? (
                  <input
                    type="search"
                    dir="auto"
                    value={searchQuery}
                    onChange={(e) => onSearchInput(e.target.value)}
                    placeholder={t('header.searchPh')}
                    className="col-start-1 min-w-0 border-0 bg-transparent py-2 ps-3 text-xs text-scnt-text placeholder:text-scnt-text-muted/75 focus:outline-none focus:ring-0"
                    aria-label={t('header.searchProducts')}
                    autoComplete="off"
                  />
                ) : null}
                <button
                  type="button"
                  className={`inline-flex size-10 shrink-0 items-center justify-center text-scnt-text-muted transition-colors hover:text-scnt-text ${
                    searchExpanded ? 'col-start-2 row-start-1' : 'col-start-1 row-start-1'
                  }`}
                  aria-label={searchExpanded ? t('header.collapseSearch') : t('header.expandSearch')}
                  onClick={() => setSearchExpanded((prev) => !prev)}
                >
                  <IconSearch className="pointer-events-none h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`flex justify-center transition-[transform,margin] duration-[900ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] will-change-transform max-lg:transition-none max-lg:will-change-auto ${
              navbarUsesScrolledShape ? 'ltr:lg:-translate-x-[40vw] rtl:lg:translate-x-[40vw]' : ''
            }`}
          >
            <Logo
              tone="default"
              className={`transition-[font-size,letter-spacing,color,text-shadow,transform] duration-[900ms] ease-[cubic-bezier(0.2,0.95,0.28,1)] will-change-transform max-lg:duration-[280ms] max-lg:ease-out max-lg:will-change-auto max-lg:transition-[font-size,letter-spacing,color] ${
                topTransparent
                  ? 'text-[2.6rem] tracking-[0.11em] sm:text-[3.2rem]'
                  : 'text-[2rem] tracking-[0.12em] sm:text-[2.4rem]'
              }`}
            />
          </div>

          <div className="absolute end-5 top-1/2 flex -translate-y-1/2 items-center justify-end gap-1 sm:end-8 sm:gap-2">
            <div
              className={`relative mr-0.5 hidden overflow-hidden rounded-full border transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:grid sm:items-stretch ${
                topTransparent ? 'lg:hidden' : ''
              } ${
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
                  dir="auto"
                  value={searchQuery}
                  onChange={(e) => onSearchInput(e.target.value)}
                  placeholder={t('header.searchPh')}
                  className="col-start-1 min-w-0 border-0 bg-transparent py-2 ps-3 text-xs text-scnt-text placeholder:text-scnt-text-muted/75 focus:outline-none focus:ring-0"
                  aria-label={t('header.searchProducts')}
                  autoComplete="off"
                />
              ) : null}
              <button
                type="button"
                className={`inline-flex size-10 shrink-0 items-center justify-center text-scnt-text-muted transition-colors hover:text-scnt-text ${
                  searchExpanded ? 'col-start-2 row-start-1' : 'col-start-1 row-start-1'
                }`}
                aria-label={searchExpanded ? t('header.collapseSearch') : t('header.expandSearch')}
                onClick={() => setSearchExpanded((prev) => !prev)}
              >
                <IconSearch className="pointer-events-none h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              className={`${iconBtnClass} sm:hidden`}
              aria-label={t('header.openSearch')}
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch className="h-5 w-5" />
            </button>
            {!topTransparent ? (
              <>
                <div className="hidden items-center gap-0.5 lg:flex" role="group" aria-label={t('lang.en')}>
                  <button
                    type="button"
                    className={`rounded-full px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wider transition-colors ${
                      locale === 'en'
                        ? 'bg-scnt-text text-scnt-bg'
                        : 'text-scnt-text-muted hover:bg-scnt-border/35 hover:text-scnt-text'
                    }`}
                    aria-pressed={locale === 'en'}
                    onClick={() => setLocale('en')}
                  >
                    {t('lang.en')}
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-2 py-1 text-[0.65rem] font-medium transition-colors ${
                      locale === 'ar'
                        ? 'bg-scnt-text text-scnt-bg'
                        : 'text-scnt-text-muted hover:bg-scnt-border/35 hover:text-scnt-text'
                    }`}
                    aria-pressed={locale === 'ar'}
                    onClick={() => setLocale('ar')}
                  >
                    {t('lang.ar')}
                  </button>
                </div>
                <Link to="/contact" className={`${iconBtnClass} !hidden lg:!inline-flex`} aria-label={t('header.contact')}>
                  <IconPhone className="h-5 w-5" />
                </Link>
              </>
            ) : null}
            <button
              type="button"
              className={`${iconBtnClass} !hidden lg:!inline-flex ${topTransparent ? 'gap-2 px-3 py-2' : ''}`}
              aria-label={t('nav.profile')}
              onClick={() => navigate(getStoredAuthToken() ? '/profile' : '/login')}
            >
              <IconUser className="h-5 w-5 shrink-0" />
              {topTransparent ? (
                <span className="text-[0.7rem] font-medium tracking-wide text-scnt-text">{t('nav.profile')}</span>
              ) : null}
            </button>
            <Link
              to="/wishlist"
              className={`${iconBtnClass} !hidden lg:!inline-flex ${topTransparent ? 'gap-2 px-3 py-2' : 'relative'}`}
              aria-label={t('nav.wishlist')}
            >
              <span className="relative inline-flex shrink-0">
                <IconHeart className="h-5 w-5" />
                {wishlistCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-scnt-text px-1 text-[0.6rem] leading-4 text-scnt-bg">
                    {wishlistCount}
                  </span>
                ) : null}
              </span>
              {topTransparent ? (
                <span className="text-[0.7rem] font-medium tracking-wide text-scnt-text">{t('nav.wishlist')}</span>
              ) : null}
            </Link>
            <Link
              to="/cart"
              className={`${iconBtnClass} ${topTransparent ? 'lg:gap-2 lg:px-3 lg:py-2' : 'relative'}`}
              aria-label={t('nav.cart')}
            >
              <span className="relative inline-flex shrink-0">
                <IconCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-scnt-text px-1 text-[0.6rem] leading-4 text-scnt-bg">
                    {cartCount}
                  </span>
                ) : null}
              </span>
              {topTransparent ? (
                <span className="hidden text-[0.7rem] font-medium tracking-wide text-scnt-text lg:inline">
                  {t('nav.cart')}
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
            aria-label={t('header.primaryNav')}
            onMouseLeave={scheduleMegaClose}
          >
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              {t('nav.shopAll')}
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
              {t('nav.collections')}
            </button>
            <NavLink
              to="/find-your-scnt"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              {t('nav.findScnt')}
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              {t('nav.about')}
            </NavLink>
            <NavLink
              to="/faqs"
              className={({ isActive }) =>
                `${navLinkBase} border-b-2 border-transparent pb-2 transition-[border-color] duration-200 ${isActive ? (topTransparent ? 'border-white text-white' : 'border-scnt-text text-scnt-text') : `${navTone} ${topTransparent ? 'hover:border-white/55' : 'hover:border-scnt-text/30'}`}`
              }
            >
              {t('nav.faqs')}
            </NavLink>
          </nav>
        </div>

        {megaOpen ? (
          <div
            className="animate-scnt-mega absolute inset-x-0 top-full border-t border-scnt-border/70 bg-scnt-bg-elevated/98 shadow-[0_24px_48px_-24px_var(--color-scnt-shadow)] backdrop-blur-xl"
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-scnt-text">
                  {t('header.collectionsHeading')}
                </p>
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
                  {t('header.viewAll')}
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
                        <picture>
                          <source srcSet={previewImageByCollectionId[c.id]} type="image/png" />
                          <img
                            src={previewImageByCollectionId[c.id]}
                            alt=""
                            className="h-full w-full object-cover transition-[filter,transform] duration-500 group-hover:scale-[1.03] group-hover:brightness-[0.92]"
                          />
                        </picture>
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
          <div className="absolute inset-x-0 top-full z-[110] max-h-[min(80vh,560px)] overflow-y-auto border-t border-scnt-border/80 bg-scnt-bg shadow-[0_28px_60px_-28px_var(--color-scnt-shadow)]">
            <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8">
              <button
                type="button"
                className="absolute end-4 top-5 inline-flex rounded-full p-2 text-scnt-text-muted transition-colors hover:bg-scnt-border/35 hover:text-scnt-text"
                onClick={closeSearch}
                aria-label={t('header.closeSearch')}
              >
                <IconX className="h-5 w-5" />
              </button>
              <h2 className="pe-12 font-serif text-xl font-normal tracking-[0.08em] text-scnt-text sm:text-2xl">
                {t('header.productsTitle')}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-scnt-text-muted">{t('header.productsHint')}</p>

              <div className="mt-5 sm:hidden">
                <input
                  type="search"
                  dir="auto"
                  value={searchQuery}
                  onChange={(e) => onSearchInput(e.target.value, { keepOpenWhenEmpty: true })}
                  placeholder={t('header.searchPhMobile')}
                  className="w-full rounded-xl border border-scnt-border/80 bg-scnt-bg-elevated/70 px-4 py-3 text-sm text-scnt-text placeholder:text-scnt-text-muted/75 focus:border-scnt-text/20 focus:outline-none focus:ring-2 focus:ring-scnt-text/10"
                  aria-label={t('header.searchProducts')}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="mt-8 space-y-8">
                {searchLoading ? (
                  <p className="text-sm text-scnt-text-muted">{t('header.searching')}</p>
                ) : searchError ? (
                  <p className="text-sm text-scnt-text-muted">{searchError}</p>
                ) : !searchQuery.trim() ? (
                  <p className="text-sm text-scnt-text-muted">{t('header.typeToSee')}</p>
                ) : searchResults.length === 0 ? (
                  <div className="rounded-xl border border-scnt-border/70 bg-scnt-bg-elevated/40 px-5 py-8 text-center">
                    <p className="text-sm font-medium text-scnt-text">
                      {t('header.noMatches', { q: searchQuery.trim() })}
                    </p>
                    <p className="mt-2 text-xs text-scnt-text-muted">{t('header.noMatchesHint')}</p>
                  </div>
                ) : (
                  groupedResults.map((group) => (
                    <div key={group.slug}>
                      <h3 className="border-b border-scnt-border/70 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-scnt-text-muted">
                        {group.label}
                      </h3>
                      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="listbox">
                        {group.items.map((p) => (
                          <li key={p._id} className="sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)]">
                            <Link
                              to={`/product/${p.slug}`}
                              className="flex gap-3 rounded-xl border border-scnt-border/60 bg-scnt-bg-elevated/35 p-3 transition-[background-color,box-shadow,border-color] duration-300 hover:border-scnt-text/15 hover:bg-scnt-bg-muted/45 hover:shadow-[0_14px_40px_-24px_var(--color-scnt-shadow)]"
                              onClick={closeSearch}
                              role="option"
                            >
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-scnt-bg-muted/60 ring-1 ring-scnt-border/50">
                                {p.images?.[0] ? (
                                  <picture>
                                    <source srcSet={p.images[0]} type="image/png" />
                                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                                  </picture>
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-scnt-text">{localizedProductName(p, locale)}</p>
                                <p className="text-xs text-scnt-text-muted">{formatEgp(p.price, locale)}</p>
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
                  {t('header.viewAllResults', { q: searchQuery.trim() })}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          className={`fixed inset-0 z-[120] bg-scnt-text/30 transition-opacity duration-200 ease-out lg:hidden ${
            sideOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!sideOpen}
          onClick={() => setSideOpen(false)}
        />
        <aside
          className={`fixed inset-y-0 start-0 z-[130] m-0 flex h-svh w-[min(320px,92vw)] flex-col overflow-hidden rounded-none border-e border-scnt-border/80 bg-scnt-bg-elevated shadow-2xl transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
            sideOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
          }`}
          aria-label={t('nav.menu')}
          inert={!sideOpen}
        >
          <div className="flex items-center justify-between border-b border-scnt-border/60 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-scnt-text-muted">{t('nav.menu')}</span>
            <button type="button" className={iconBtn} onClick={() => setSideOpen(false)} aria-label={t('header.closeMenu')}>
              <IconX className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto bg-scnt-bg-elevated px-4 py-5 text-sm" onClick={() => setSideOpen(false)}>
            <Link to="/" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              {t('nav.home')}
            </Link>
            <Link to="/shop" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              {t('nav.shopAll')}
            </Link>
            <button
              type="button"
              className="mt-2 rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 text-start leading-6 text-scnt-text hover:bg-scnt-border/30"
              aria-expanded={mobileCollectionsOpen}
              onMouseEnter={() => setMobileCollectionsOpen(true)}
              onClick={(e) => {
                e.stopPropagation()
                setMobileCollectionsOpen((prev) => !prev)
              }}
            >
              {t('nav.collections')}
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
              {t('nav.findScnt')}
            </Link>
            <Link to="/about" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              {t('nav.about')}
            </Link>
            <Link to="/faqs" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              {t('nav.faqs')}
            </Link>
            <Link
              to={getStoredAuthToken() ? '/profile' : '/login'}
              className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30"
            >
              {t('nav.profile')}
            </Link>
            <Link to="/wishlist" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              {t('nav.wishlist')}
            </Link>
            <Link to="/cart" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              {t('nav.cart')}
            </Link>
            <Link to="/contact" className="rounded-md bg-scnt-bg-muted/70 px-3 py-2.5 leading-6 text-scnt-text hover:bg-scnt-border/30">
              {t('nav.contact')}
            </Link>
            <div
              className="mt-4 flex gap-2 border-t border-scnt-border/60 pt-4"
              role="group"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={`flex-1 rounded-full py-2 text-xs font-medium uppercase ${locale === 'en' ? 'bg-scnt-text text-scnt-bg' : 'bg-scnt-bg-muted/70 text-scnt-text'}`}
                onClick={() => setLocale('en')}
              >
                {t('lang.en')}
              </button>
              <button
                type="button"
                className={`flex-1 rounded-full py-2 text-xs font-medium ${locale === 'ar' ? 'bg-scnt-text text-scnt-bg' : 'bg-scnt-bg-muted/70 text-scnt-text'}`}
                onClick={() => setLocale('ar')}
              >
                {t('lang.ar')}
              </button>
            </div>
          </nav>
        </aside>
      </header>
    </div>
  )
}
