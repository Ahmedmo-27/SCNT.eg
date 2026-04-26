import type { ProductSummary } from '../types/catalog'
import { absoluteUrl, getSiteOrigin, SITE_NAME } from './site'

export type JsonLd = Record<string, unknown>

export type FaqItem = {
  question: string
  answer: string
}

export function buildOrganizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: getSiteOrigin(),
    logo: absoluteUrl('/collections/covers/executive-cover.png'),
    sameAs: [getSiteOrigin()],
  }
}

export function buildWebsiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteOrigin(),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getSiteOrigin()}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function buildProductSchema(args: {
  product: ProductSummary
  collectionName: string
  description: string
  image: string
  path: string
  currency?: string
}): JsonLd {
  const { product, collectionName, description, image, path, currency = 'EGP' } = args
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: [image],
    sku: product.apiId,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    category: `Fragrance > ${collectionName}`,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(path),
      priceCurrency: currency,
      price: product.price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Gender',
        value: product.gender,
      },
      {
        '@type': 'PropertyValue',
        name: 'Top Notes',
        value: product.topNotes.join(', '),
      },
      {
        '@type': 'PropertyValue',
        name: 'Heart Notes',
        value: product.heartNotes.join(', '),
      },
      {
        '@type': 'PropertyValue',
        name: 'Base Notes',
        value: product.baseNotes.join(', '),
      },
    ],
  }
}

export function buildFaqSchema(items: FaqItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
