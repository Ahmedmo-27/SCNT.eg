import type { ProductSummary } from '../types/catalog'
import {
  absoluteUrl,
  getSiteOrigin,
  SITE_NAME,
  HOUSE_NAME,
  BRAND_TAGLINE,
  BRAND_ALIASES,
  DISAMBIGUATING_DESCRIPTION,
  OFFICIAL_INSTAGRAM_URL,
} from './site'

export type JsonLd = Record<string, unknown>

export type FaqItem = {
  question: string
  answer: string
}

export function buildOrganizationSchema(): JsonLd {
  const origin = getSiteOrigin()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: SITE_NAME,
    legalName: `${SITE_NAME} Fragrances`,
    alternateName: [...BRAND_ALIASES],
    description: DISAMBIGUATING_DESCRIPTION,
    disambiguatingDescription: DISAMBIGUATING_DESCRIPTION,
    url: origin,
    logo: absoluteUrl('/SCNT.eg_Monogram.png'),
    image: absoluteUrl('/SCNT.eg_Monogram.png'),
    slogan: BRAND_TAGLINE,
    sameAs: [OFFICIAL_INSTAGRAM_URL],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      addressLocality: 'Cairo',
    },
    brand: {
      '@type': 'Brand',
      '@id': `${origin}/#brand`,
      name: HOUSE_NAME,
      alternateName: SITE_NAME,
      url: origin,
      logo: absoluteUrl('/SCNT.eg_Monogram.png'),
      slogan: BRAND_TAGLINE,
    },
    knowsAbout: [
      'Luxury Fragrance',
      'Eau de Parfum',
      'Egyptian Perfume House',
      'Artisanal Perfumes',
      'The Executive Collection',
      'The Explorer Collection',
      'The Charmer Collection',
      'The Icon Collection',
    ],
  }
}

export function buildWebsiteSchema(): JsonLd {
  const origin = getSiteOrigin()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: `${HOUSE_NAME} (${SITE_NAME})`,
    alternateName: [...BRAND_ALIASES],
    url: origin,
    publisher: {
      '@id': `${origin}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/shop?q={search_term_string}`,
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
  const origin = getSiteOrigin()

  // Collect images and ensure all URLs are fully qualified absolute URLs
  const rawImages =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [image || '/SCNT.eg_Monogram.png']
  const absoluteImages = rawImages.map((img) => absoluteUrl(img))

  // Calculate price bounds from sizes or fallback product price
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : []
  const prices = sizes
    .map((s) => Number(s.price))
    .filter((p) => !Number.isNaN(p) && p > 0)
  const lowPrice = prices.length > 0 ? Math.min(...prices) : Number(product.price || 500)
  const highPrice = prices.length > 0 ? Math.max(...prices) : Number(product.price || 750)

  const fullProductUrl = absoluteUrl(path)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: absoluteImages,
    sku: product.apiId || product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      '@id': `${origin}/#brand`,
      name: SITE_NAME,
      alternateName: HOUSE_NAME,
      url: origin,
    },
    category: `Fragrance > ${collectionName}`,
    offers: {
      '@type': 'AggregateOffer',
      url: fullProductUrl,
      priceCurrency: currency,
      lowPrice,
      highPrice,
      offerCount: Math.max(sizes.length, 1),
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'EG',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnPeriod',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        url: absoluteUrl('/refund-policy'),
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 80,
          currency,
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'EG',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'd',
          },
        },
      },
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
