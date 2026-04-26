const Collection = require('../models/Collection');
const Product = require('../models/Product');

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/collections', changefreq: 'daily', priority: '0.9' },
  { path: '/find-your-scnt', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/faqs', changefreq: 'monthly', priority: '0.6' },
];

function safeBaseUrl(value) {
  if (!value) return '';
  return String(value).trim().replace(/\/$/, '').toLowerCase();
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(baseUrl, route) {
  const lastmod = route.lastmod
    ? `<lastmod>${new Date(route.lastmod).toISOString()}</lastmod>`
    : '';
  return [
    '  <url>',
    `    <loc>${xmlEscape(`${baseUrl}${route.path}`)}</loc>`,
    lastmod,
    `    <changefreq>${route.changefreq}</changefreq>`,
    `    <priority>${route.priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function buildDynamicRoutes() {
  const [collections, products] = await Promise.all([
    Collection.find({}, { slug: 1, updatedAt: 1 }).lean(),
    Product.find({}, { slug: 1, updatedAt: 1 }).lean(),
  ]);

  const collectionRoutes = collections
    .filter((item) => item.slug)
    .map((item) => ({
      path: `/collections/${String(item.slug).toLowerCase()}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: item.updatedAt,
    }));

  const productRoutes = products
    .filter((item) => item.slug)
    .map((item) => ({
      path: `/product/${String(item.slug).toLowerCase()}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: item.updatedAt,
    }));

  return [...STATIC_ROUTES, ...collectionRoutes, ...productRoutes];
}

function buildRobotsTxt(baseUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /checkout',
    'Disallow: /cart',
    'Disallow: /wishlist',
    'Disallow: /profile',
    'Disallow: /login',
    'Disallow: /register',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join('\n');
}

async function buildSitemapXml(baseUrl) {
  const routes = await buildDynamicRoutes();
  const xmlBody = routes.map((route) => urlEntry(baseUrl, route)).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    xmlBody,
    '</urlset>',
  ].join('\n');
}

module.exports = {
  safeBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
};
