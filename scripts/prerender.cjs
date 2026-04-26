const fs = require('fs/promises')
const path = require('path')

const SITE_URL = (process.env.SITE_BASE_URL || process.env.CLIENT_BASE_URL || 'https://scnt-eg.me').replace(/\/$/, '')
const CLIENT_DIST = path.resolve(__dirname, '..', 'client', 'dist')
const TEMPLATE_PATH = path.join(CLIENT_DIST, 'index.html')
const OUTPUT_ROOT = path.join(CLIENT_DIST, 'prerender')

const COLLECTION_ORDER = ['executive', 'explorer', 'charmer', 'icon']
const PRODUCT_ORDER = ['azure-code', 'deep-horizon', 'midnight-code', 'golden-bloom', 'cobalt-drive', 'lumiere']

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function titleWithBrand(title) {
  return title.includes('SCNT.eg') ? title : `${title} | SCNT.eg`
}

function sortByOrder(items, key, order) {
  return [...items].sort((a, b) => {
    const ai = order.indexOf(String(a[key]))
    const bi = order.indexOf(String(b[key]))
    const aPos = ai === -1 ? order.length : ai
    const bPos = bi === -1 ? order.length : bi
    if (aPos !== bPos) return aPos - bPos
    return String(a[key]).localeCompare(String(b[key]))
  })
}

function ensureLeadingSlash(value) {
  return value.startsWith('/') ? value : `/${value}`
}

function pageShell({ title, description, pathName, body, image = '/Hero Section Image.png', jsonLd = [] }) {
  const canonical = pathName === '/' ? `${SITE_URL}/` : `${SITE_URL}${ensureLeadingSlash(pathName)}`
  const jsonLdTags = jsonLd
    .map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`)
    .join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/SCNT.eg_Monogram.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SCNT.eg" />
    <meta property="og:title" content="${escapeHtml(titleWithBrand(title))}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(titleWithBrand(title))}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
    <title>${escapeHtml(titleWithBrand(title))}</title>
  </head>
  <body>
    <div id="root">${body}</div>
    ${jsonLdTags}
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
}

function renderList(items, renderItem) {
  return `<ul>${items.map(renderItem).join('')}</ul>`
}

function renderHome({ collections, products }) {
  const featuredCollections = collections.slice(0, 4)
  const bestSellers = products.slice(0, 4)

  return pageShell({
    title: 'Luxury Fragrances in Egypt',
    description: 'Shop premium fragrances in Egypt from SCNT.eg. Discover signature scent collections, notes, and identity-led perfume stories.',
    pathName: '/',
    body: `
      <main>
        <section>
          <p>SCNT.eg</p>
          <h1>Luxury fragrances crafted for distinct identities.</h1>
          <p>Explore fragrance families, modern scent notes, and signature perfume stories designed for everyday wear.</p>
        </section>
        <section>
          <h2>Featured collections</h2>
          ${renderList(featuredCollections, (collection) => `
            <li>
              <a href="/collections/${collection.slug}">${escapeHtml(collection.name)}</a>
              <p>${escapeHtml(collection.tagline || collection.description || '')}</p>
            </li>
          `)}
        </section>
        <section>
          <h2>Best sellers</h2>
          ${renderList(bestSellers, (product) => `
            <li>
              <a href="/product/${product.slug}">${escapeHtml(product.name)}</a>
              <p>${escapeHtml(product.inspired_from || '')}</p>
            </li>
          `)}
        </section>
      </main>
    `,
  })
}

function renderShop({ collections, products }) {
  return pageShell({
    title: 'Shop Perfumes Online Egypt',
    description: 'Explore SCNT.eg perfumes by collection, notes, and style. Find long-lasting fragrances crafted for modern Egyptian lifestyles.',
    pathName: '/shop',
    body: `
      <main>
        <section>
          <p>Shop SCNT.eg</p>
          <h1>Perfumes and fragrance stories in one place.</h1>
          <p>Browse every scent by collection, inspiration, and note structure.</p>
        </section>
        <section>
          <h2>Collections</h2>
          ${renderList(collections, (collection) => `<li><a href="/collections/${collection.slug}">${escapeHtml(collection.name)}</a></li>`)}
        </section>
        <section>
          <h2>All fragrances</h2>
          ${renderList(products, (product) => `
            <li>
              <a href="/product/${product.slug}">${escapeHtml(product.name)}</a>
              <p>${escapeHtml(product.inspired_from || '')}</p>
            </li>
          `)}
        </section>
      </main>
    `,
  })
}

function renderCollections({ collections }) {
  return pageShell({
    title: 'Fragrance Collections',
    description: 'Discover the SCNT.eg fragrance collections and explore scent families designed around mood, identity, and everyday rituals.',
    pathName: '/collections',
    body: `
      <main>
        <section>
          <p>Collections</p>
          <h1>Signature fragrance collections by SCNT.eg.</h1>
          <p>Each line is designed around identity, mood, and modern wearability.</p>
        </section>
        <section>
          ${renderList(collections, (collection) => `
            <li>
              <a href="/collections/${collection.slug}">${escapeHtml(collection.name)}</a>
              <p>${escapeHtml(collection.tagline || collection.description || '')}</p>
            </li>
          `)}
        </section>
      </main>
    `,
  })
}

function renderProduct(product, collection) {
  const description = `${product.name} by SCNT.eg. Inspired by ${product.inspired_from}. Top notes: ${(product.topNotes || []).join(', ')}. Heart notes: ${(product.heartNotes || []).join(', ')}. Base notes: ${(product.baseNotes || []).join(', ')}.`
  return pageShell({
    title: `${product.name} Perfume in Egypt`,
    description,
    pathName: `/product/${product.slug}`,
    image: product.coverImage || product.clearBackground_Image || collection.coverImage || '/Hero Section Image.png',
    body: `
      <main>
        <nav><a href="/">Home</a> / <a href="/collections">Collections</a> / <a href="/collections/${collection.slug}">${escapeHtml(collection.name)}</a></nav>
        <article>
          <p>${escapeHtml(collection.name)}</p>
          <h1>${escapeHtml(product.name)}</h1>
          <p>${escapeHtml(product.inspired_from || '')}</p>
          <p>${escapeHtml(product.description || '')}</p>
          <section>
            <h2>Notes</h2>
            <p>Top notes: ${escapeHtml((product.topNotes || []).join(', '))}</p>
            <p>Heart notes: ${escapeHtml((product.heartNotes || []).join(', '))}</p>
            <p>Base notes: ${escapeHtml((product.baseNotes || []).join(', '))}</p>
          </section>
          <p><a href="/shop">Back to shop</a></p>
        </article>
      </main>
    `,
  })
}

async function writePage(relativePath, html) {
  const outPath = path.join(OUTPUT_ROOT, ...relativePath.split('/'))
  await fs.mkdir(outPath, { recursive: true })
  await fs.writeFile(path.join(outPath, 'index.html'), html, 'utf8')
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.log('[prerender] Skipping prerender because MONGODB_URI is not set.')
    return
  }

  const connectDb = require('../server/src/config/db')
  const Collection = require('../server/src/models/Collection')
  const Product = require('../server/src/models/Product')

  const mongoose = await connectDb()

  try {
    const [collectionDocs, productDocs] = await Promise.all([
      Collection.find({}, { name: 1, slug: 1, coverImage: 1, mainImage: 1, artwork: 1, clearBackground_Image: 1, themeColor: 1, tagline: 1, sub_tagline: 1, description: 1 }).lean(),
      Product.find({}, { name: 1, slug: 1, inspired_from: 1, collection: 1, price: 1, size: 1, images: 1, coverImage: 1, clearBackground_Image: 1, topNotes: 1, heartNotes: 1, baseNotes: 1, description: 1 })
        .populate('SCNTcollection', 'name slug coverImage mainImage artwork clearBackground_Image themeColor tagline sub_tagline description')
        .lean(),
    ])

    const collections = sortByOrder(collectionDocs, 'slug', COLLECTION_ORDER)
    const products = sortByOrder(productDocs.map((product) => ({ ...product, collection: product.SCNTcollection })), 'slug', PRODUCT_ORDER)

    await fs.rm(OUTPUT_ROOT, { recursive: true, force: true })
    await fs.mkdir(OUTPUT_ROOT, { recursive: true })

    await writePage('/', renderHome({ collections, products }))
    await writePage('/shop', renderShop({ collections, products }))
    await writePage('/collections', renderCollections({ collections }))

    const topProducts = products.slice(0, 4)
    for (const product of topProducts) {
      if (!product.SCNTcollection?.slug) continue
      await writePage(`/product/${product.slug}`, renderProduct(product, product.SCNTcollection))
    }

    console.log(`[prerender] Wrote ${3 + topProducts.length} prerendered pages to ${OUTPUT_ROOT}`)
  } finally {
    if (mongoose?.disconnect) {
      await mongoose.disconnect()
    }
  }
}

main().catch((error) => {
  console.error('[prerender] Failed:', error)
  process.exitCode = 1
})
