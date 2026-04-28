export const SITE_NAME = 'SCNT.eg'
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
