import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const BASE_URL = 'https://www.scnt-eg.me'
const DEFAULT_IMAGE = `${BASE_URL}/SCNT.eg_Monogram.png`
const DEFAULT_IMAGE_WIDTH = 858
const DEFAULT_IMAGE_HEIGHT = 684
const DEFAULT_IMAGE_ALT = 'House of SCNT Monogram'

const distDir = path.resolve(__dirname, '../client/dist')
const templatePath = path.join(distDir, 'index.html')

if (!fs.existsSync(templatePath)) {
  console.error(`[prerender-meta] Template file not found: ${templatePath}. Please run vite build first.`)
  process.exit(1)
}

const templateHtml = fs.readFileSync(templatePath, 'utf8')

// Load collections and products
const collectionsData = require('../server/seed/collections.data.js')
const productsData = require('../server/seed/products.data.js')

const collections = collectionsData.collections || []
const products = productsData.products || []

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function ensureAbsolute(urlPath) {
  if (!urlPath) return DEFAULT_IMAGE
  if (/^https?:\/\//i.test(urlPath)) return encodeURI(urlPath)
  const clean = urlPath.startsWith('/') ? urlPath : `/${urlPath}`
  return encodeURI(`${BASE_URL}${clean}`)
}

function replaceOrInsertMeta(html, {
  title,
  description,
  canonicalUrl,
  image = DEFAULT_IMAGE,
  imageWidth = DEFAULT_IMAGE_WIDTH,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  imageAlt = DEFAULT_IMAGE_ALT,
  type = 'website',
}) {
  let updated = html

  // 1. Title
  updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)

  // 2. Canonical
  updated = updated.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
  )

  // 3. Description
  updated = updated.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  )

  // 4. og:type
  updated = updated.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${escapeHtml(type)}" />`
  )

  // 5. og:title
  updated = updated.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  )

  // 6. og:description
  updated = updated.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  )

  // 7. og:url
  updated = updated.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`
  )

  // 8. og:image
  updated = updated.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapeHtml(image)}" />`
  )

  // 9. og:image:secure_url
  updated = updated.replace(
    /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />`
  )

  // 10. og:image:type
  const imgType = image.endsWith('.jpg') || image.endsWith('.jpeg') ? 'image/jpeg' : 'image/png'
  updated = updated.replace(
    /<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:type" content="${imgType}" />`
  )

  // 11. og:image:width & og:image:height
  if (updated.includes('property="og:image:width"')) {
    updated = updated.replace(
      /<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:width" content="${imageWidth}" />`
    )
  } else {
    updated = updated.replace(
      /(<meta\s+property="og:image:type"[^>]*>)/i,
      `$1\n    <meta property="og:image:width" content="${imageWidth}" />`
    )
  }

  if (updated.includes('property="og:image:height"')) {
    updated = updated.replace(
      /<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:height" content="${imageHeight}" />`
    )
  } else {
    updated = updated.replace(
      /(<meta\s+property="og:image:width"[^>]*>)/i,
      `$1\n    <meta property="og:image:height" content="${imageHeight}" />`
    )
  }

  // 12. og:image:alt
  if (updated.includes('property="og:image:alt"')) {
    updated = updated.replace(
      /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`
    )
  } else {
    updated = updated.replace(
      /(<meta\s+property="og:image:height"[^>]*>)/i,
      `$1\n    <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`
    )
  }

  // 13. twitter:title
  updated = updated.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  )

  // 14. twitter:description
  updated = updated.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  )

  // 15. twitter:image
  updated = updated.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`
  )

  // 16. twitter:image:alt
  updated = updated.replace(
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />`
  )

  return updated
}

const routes = [
  // Core pages
  {
    path: '/',
    title: 'House of SCNT | SCNT.eg Fragrances',
    description: 'Shop premium fragrances in Egypt from SCNT.eg. Discover signature scent collections, notes, and identity-led perfume stories.',
  },
  {
    path: '/find-your-scnt',
    title: 'Find Your SCNT | House of SCNT',
    description: 'Discover your signature fragrance with SCNT.eg Matcher. Match your persona, occasion, and scent notes in Egypt.',
  },
  {
    path: '/shop',
    title: 'Shop Fragrances Online | House of SCNT',
    description: 'Explore SCNT.eg perfumes by collection, notes, and style. Find long-lasting fragrances crafted for modern Egyptian lifestyles.',
  },
  {
    path: '/collections',
    title: 'Fragrance Collections | House of SCNT',
    description: 'Discover the SCNT.eg fragrance collections and explore scent families designed around mood, identity, and everyday rituals.',
  },
  {
    path: '/about',
    title: 'About SCNT.eg | House of SCNT',
    description: 'Learn the story behind SCNT.eg and our fragrance philosophy, craftsmanship, and identity-first approach to perfume in Egypt.',
  },
  {
    path: '/contact',
    title: 'Contact SCNT.eg | House of SCNT',
    description: 'Get in touch with SCNT.eg for fragrance support, order help, and product recommendations tailored to your scent preferences.',
  },
  {
    path: '/faqs',
    title: 'Fragrance FAQs | House of SCNT',
    description: 'Read common SCNT.eg perfume FAQs about scent longevity, notes, shipping, and choosing fragrances for your identity and routine.',
  },

  // Legal & policy pages
  {
    path: '/terms-of-service',
    title: 'Terms of Service | House of SCNT',
    description: 'Read the SCNT.eg terms of service covering orders, payments, account use, and customer rights and responsibilities.',
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy | House of SCNT',
    description: 'Learn SCNT.eg refund terms, return conditions, and how eligible products are reviewed and credited.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | House of SCNT',
    description: 'Understand how SCNT.eg collects, uses, and protects personal information when you visit and shop on our website.',
  },

  // Utility pages
  {
    path: '/cart',
    title: 'Shopping Cart | House of SCNT',
    description: 'Review your selected SCNT.eg fragrances before checkout.',
  },
  {
    path: '/wishlist',
    title: 'Your Wishlist | House of SCNT',
    description: 'Save your favorite SCNT.eg fragrances for later.',
  },
  {
    path: '/review',
    title: 'Customer Reviews | House of SCNT',
    description: 'Share your thoughts about SCNT.eg fragrances and rate the products you love.',
  },
]

// Add Collection detail pages
for (const c of collections) {
  const slug = c.slug || c.id
  const cover = c.coverImage || c.mainImage || '/SCNT.eg_Monogram.png'
  routes.push({
    path: `/collections/${slug}`,
    title: `${c.name} Fragrance Collection | House of SCNT`,
    description: `${c.name} by SCNT.eg. ${c.tagline} Explore signature perfumes, scent notes, and identity-led fragrance stories in Egypt.`,
    image: ensureAbsolute(cover),
    imageAlt: `${c.name} - House of SCNT`,
  })
}

// Add Product detail pages
for (const p of products) {
  const slug = p.slug || p._id
  const mainImage = (p.images && p.images[0]) || '/SCNT.eg_Monogram.png'
  const inspiration = p.inspired_from ? `Inspired by ${p.inspired_from}. ` : ''
  routes.push({
    path: `/product/${slug}`,
    title: `${p.name} Perfume | House of SCNT`,
    description: `${p.name} by SCNT.eg. ${inspiration}${p.description || 'Eau de Parfum crafted in Egypt.'}`,
    image: ensureAbsolute(mainImage),
    imageAlt: `${p.name} - House of SCNT Fragrances`,
    type: 'product',
  })
}

let generatedCount = 0

for (const route of routes) {
  const canonicalUrl = `${BASE_URL}${route.path === '/' ? '' : route.path}`
  const renderedHtml = replaceOrInsertMeta(templateHtml, {
    title: route.title,
    description: route.description,
    canonicalUrl,
    image: route.image || DEFAULT_IMAGE,
    imageWidth: route.imageWidth || DEFAULT_IMAGE_WIDTH,
    imageHeight: route.imageHeight || DEFAULT_IMAGE_HEIGHT,
    imageAlt: route.imageAlt || DEFAULT_IMAGE_ALT,
    type: route.type || 'website',
  })

  if (route.path === '/') {
    // Update the root index.html with the enriched meta
    fs.writeFileSync(templatePath, renderedHtml, 'utf8')
    generatedCount++
    continue
  }

  const cleanPath = route.path.replace(/^\//, '')

  // 1. Directory style: client/dist/<route>/index.html
  const routeDir = path.join(distDir, cleanPath)
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true })
  }
  fs.writeFileSync(path.join(routeDir, 'index.html'), renderedHtml, 'utf8')

  // 2. Clean HTML file: client/dist/<route>.html
  const singleHtmlPath = path.join(distDir, `${cleanPath}.html`)
  const singleHtmlDir = path.dirname(singleHtmlPath)
  if (!fs.existsSync(singleHtmlDir)) {
    fs.mkdirSync(singleHtmlDir, { recursive: true })
  }
  fs.writeFileSync(singleHtmlPath, renderedHtml, 'utf8')

  generatedCount++
}

console.log(`[prerender-meta] Successfully generated social card & SEO entry points for ${generatedCount} routes in ${distDir}`)
