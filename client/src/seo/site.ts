export const SITE_NAME = 'SCNT.eg'
export const HOUSE_NAME = 'House of SCNT'
export const HOUSE_NAME_AR = 'دار SCNT'
export const BRAND_TAGLINE = 'Leave a trail, not a memory.'
export const BRAND_TAGLINE_AR = 'اترك أثرًا لا يُمحى.'
export const OFFICIAL_INSTAGRAM_HANDLE = 'scnt.eg'
export const OFFICIAL_INSTAGRAM_URL = 'https://www.instagram.com/scnt.eg/'

export const BRAND_ALIASES = [
  'House of SCNT',
  'SCNT Egypt',
  'SCNT Fragrances',
  'دار SCNT',
  'SCNT',
] as const

export const DISAMBIGUATING_DESCRIPTION =
  'SCNT.eg (House of SCNT) is an independent Egyptian luxury fragrance house based in Cairo, Egypt (canonical website: scnt-eg.me, Instagram: @scnt.eg). SCNT.eg designs original signature collections and is not affiliated with scent-eg.com, alternative dupe vendors, or generic scent sellers.'

export const DEFAULT_OG_IMAGE = '/SCNT.eg_Monogram.png'

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, '').toLowerCase()
}

export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL
  if (fromEnv) return normalizeOrigin(fromEnv)
  if (typeof window !== 'undefined' && window.location.origin) {
    return normalizeOrigin(window.location.origin)
  }
  return 'https://www.scnt-eg.me'
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin()
  const safePath = path.startsWith('/') ? path : `/${path}`
  return new URL(safePath, `${origin}/`).toString()
}

export function normalizeRoutePath(pathname: string): string {
  const base = pathname.split('?')[0].split('#')[0] || '/'
  if (base === '/') return '/'
  const cleaned = base.toLowerCase().replace(/\/+$/, '')
  return cleaned || '/'
}

export function truncateText(value: string, limit: number): string {
  if (value.length <= limit) return value
  return `${value.slice(0, Math.max(0, limit - 1)).trimEnd()}…`
}
