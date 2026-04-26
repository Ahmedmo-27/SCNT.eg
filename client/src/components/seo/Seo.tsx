import { useEffect } from 'react'
import { DEFAULT_OG_IMAGE, absoluteUrl, normalizeRoutePath, truncateText } from '../../seo/site'

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

export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd = [],
}: SeoProps) {
  useEffect(() => {
    const normalizedPath = normalizeRoutePath(path)
    const canonical = absoluteUrl(normalizedPath)
    const ogImage = image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_IMAGE)
    const cleanTitle = truncateText(titleWithBrand(title), 60)
    const cleanDescription = truncateText(description, 158)
    const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'

    document.title = cleanTitle
    document.documentElement.lang = 'en'

    const created: HTMLElement[] = []

    function addMetaByName(name: string, content: string) {
      const el = document.createElement('meta')
      el.setAttribute('name', name)
      el.setAttribute('content', content)
      el.setAttribute('data-scnt-seo', 'true')
      document.head.appendChild(el)
      created.push(el)
    }

    function addMetaByProperty(property: string, content: string) {
      const el = document.createElement('meta')
      el.setAttribute('property', property)
      el.setAttribute('content', content)
      el.setAttribute('data-scnt-seo', 'true')
      document.head.appendChild(el)
      created.push(el)
    }

    function addLink(rel: string, href: string) {
      const el = document.createElement('link')
      el.setAttribute('rel', rel)
      el.setAttribute('href', href)
      el.setAttribute('data-scnt-seo', 'true')
      document.head.appendChild(el)
      created.push(el)
    }

    addMetaByName('description', cleanDescription)
    addMetaByName('robots', robots)
    addLink('canonical', canonical)
    addMetaByProperty('og:locale', 'en_US')
    addMetaByProperty('og:type', type)
    addMetaByProperty('og:site_name', 'SCNT.eg')
    addMetaByProperty('og:title', cleanTitle)
    addMetaByProperty('og:description', cleanDescription)
    addMetaByProperty('og:url', canonical)
    addMetaByProperty('og:image', ogImage)
    addMetaByProperty('og:image:secure_url', ogImage)
    addMetaByProperty('og:image:type', 'image/png')
    addMetaByName('twitter:card', 'summary_large_image')
    addMetaByName('twitter:title', cleanTitle)
    addMetaByName('twitter:description', cleanDescription)
    addMetaByName('twitter:image', ogImage)
    addMetaByName('twitter:image:alt', 'SCNT.eg fragrance showcase')
    addLink('icon', absoluteUrl('/SCNT.eg_Monogram.png'))
    addLink('apple-touch-icon', absoluteUrl('/SCNT.eg_Monogram.png'))

    if (import.meta.env.VITE_GSC_VERIFICATION) {
      addMetaByName('google-site-verification', import.meta.env.VITE_GSC_VERIFICATION)
    }

    jsonLd.forEach((entry) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-scnt-seo', 'true')
      script.textContent = JSON.stringify(entry)
      document.head.appendChild(script)
      created.push(script)
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

    return () => {
      created.forEach((el) => el.remove())
    }
  }, [title, description, path, image, type, noindex, jsonLd])

  return null
}

declare global {
  interface Window {
    __scntGtagLoaded?: boolean
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
