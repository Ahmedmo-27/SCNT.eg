import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const BASE_URL = 'https://www.scnt-eg.me'
const today = new Date().toISOString().split('T')[0]

// Load seed collections and products
const collectionsData = require('../server/seed/collections.data.js')
const productsData = require('../server/seed/products.data.js')

const collections = collectionsData.collections || []
const products = productsData.products || []

const staticRoutes = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/collections', changefreq: 'daily', priority: '0.9' },
  { path: '/find-your-scnt', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/faqs', changefreq: 'monthly', priority: '0.6' },
]

const legalRoutes = [
  { path: '/terms-of-service', changefreq: 'monthly', priority: '0.4' },
  { path: '/refund-policy', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy-policy', changefreq: 'monthly', priority: '0.4' },
]

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

xml += `  <!-- Core Pages -->\n`
for (const r of staticRoutes) {
  xml += `  <url>\n    <loc>${BASE_URL}${r.path ? r.path : '/'}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`
}

xml += `\n  <!-- Collection Detail Pages -->\n`
for (const c of collections) {
  const slug = c.slug || c.id
  xml += `  <url>\n    <loc>${BASE_URL}/collections/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
}

xml += `\n  <!-- Product Pages -->\n`
for (const p of products) {
  const slug = p.slug || p._id
  xml += `  <url>\n    <loc>${BASE_URL}/product/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
}

xml += `\n  <!-- Legal & Policy Pages -->\n`
for (const r of legalRoutes) {
  xml += `  <url>\n    <loc>${BASE_URL}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`
}

xml += `</urlset>\n`

const targetPath = path.resolve(__dirname, '../client/public/sitemap.xml')
fs.writeFileSync(targetPath, xml, 'utf8')
console.log(`Successfully generated sitemap.xml with ${staticRoutes.length + collections.length + products.length + legalRoutes.length} URLs at ${targetPath}`)
