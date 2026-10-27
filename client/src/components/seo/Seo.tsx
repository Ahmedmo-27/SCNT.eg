import { useEffect } from 'react'
import { DEFAULT_OG_IMAGE, absoluteUrl, normalizeRoutePath, truncateText } from '../../seo/site'
import { useI18n } from '../../i18n/I18nContext'

type SeoProps = {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'product' | 'article'
  noindex?: boolean
  jsonLd?: Array<Record<string, unknown>>
}

function titleWithBrand(value: string): string {
  if (value.includes('SCNT.eg')) return value
  return `${value} | SCNT.eg`
}

function upsertMeta(attrName: 'name' | 'property', attrVal: string, content: string): HTMLMetaElement {
  const selector = `meta[${attrName}="${attrVal}"]`
  const existing = Array.from(document.head.querySelectorAll(selector))
  let el = existing[0] as HTMLMetaElement | undefined
  for (let i = 1; i < existing.length; i++) {
    existing[i].remove()
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrVal)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
  el.setAttribute('data-scnt-seo', 'true')
  return el
}

function upsertLink(rel: string, href: string, attrs?: Record<string, string>): HTMLLinkElement {
  const existing = Array.from(document.head.querySelectorAll(`link[rel="${rel}"]`))
  let el = existing[0] as HTMLLinkElement | undefined
  for (let i = 1; i < existing.length; i++) {
    existing[i].remove()
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
  }
  el.setAttribute('data-scnt-seo', 'true')
  return el
}

export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd = [],
}: SeoProps) {
  const { locale } = useI18n()

  useEffect(() => {
    const normalizedPath = normalizeRoutePath(path)
    const canonical = absoluteUrl(normalizedPath)
    const ogImage = image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_IMAGE)
    const cleanTitle = truncateText(titleWithBrand(title), 60)
    const cleanDescription = truncateText(description, 158)
    const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    const localeOg = locale === 'ar' ? 'ar_EG' : 'en_US'
    const localeAlt = locale === 'ar' ? 'en_US' : 'ar_EG'

    document.title = cleanTitle

    upsertMeta('name', 'description', cleanDescription)
    upsertMeta('name', 'robots', robots)
    upsertMeta('name', 'googlebot', robots)
    upsertLink('canonical', canonical)
    upsertMeta('property', 'og:locale', localeOg)
    upsertMeta('property', 'og:locale:alternate', localeAlt)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:site_name', 'SCNT.eg')
    upsertMeta('property', 'og:title', cleanTitle)
    upsertMeta('property', 'og:description', cleanDescription)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('property', 'og:image:secure_url', ogImage)
    upsertMeta('property', 'og:image:type', 'image/png')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', cleanTitle)
    upsertMeta('name', 'twitter:description', cleanDescription)
    upsertMeta('name', 'twitter:image', ogImage)
    upsertMeta('name', 'twitter:image:alt', 'SCNT.eg fragrance showcase')
    upsertLink('icon', absoluteUrl('/SCNT.eg_Monogram.png'))
    upsertLink('apple-touch-icon', absoluteUrl('/SCNT.eg_Monogram.png'))

    if (import.meta.env.VITE_GSC_VERIFICATION) {
      upsertMeta('name', 'google-site-verification', import.meta.env.VITE_GSC_VERIFICATION)
    }

    // Clean up old LD+JSON scripts created by SCNT SEO
    const oldScripts = Array.from(document.head.querySelectorAll('script[data-scnt-seo-jsonld="true"]'))
    oldScripts.forEach((s) => s.remove())

    jsonLd.forEach((entry) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-scnt-seo', 'true')
      script.setAttribute('data-scnt-seo-jsonld', 'true')
      script.textContent = JSON.stringify(entry)
      document.head.appendChild(script)
    })

    if (import.meta.env.VITE_GA_MEASUREMENT_ID && !window.__scntGtagLoaded) {
      const scriptSrc = document.createElement('script')
      scriptSrc.async = true
      scriptSrc.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID}`
      scriptSrc.setAttribute('data-scnt-seo', 'true')
      document.head.appendChild(scriptSrc)

      const scriptInline = document.createElement('script')
      scriptInline.setAttribute('data-scnt-seo', 'true')
      scriptInline.textContent = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = window.gtag || gtag; gtag('js', new Date()); gtag('config', '${import.meta.env.VITE_GA_MEASUREMENT_ID}', { anonymize_ip: true, page_path: '${normalizedPath}' });`
      document.head.appendChild(scriptInline)

      window.__scntGtagLoaded = true
    } else if (import.meta.env.VITE_GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, { page_path: normalizedPath })
    }
  }, [title, description, path, image, type, noindex, jsonLd, locale])

  return null
}

declare global {
  interface Window {
    __scntGtagLoaded?: boolean
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
