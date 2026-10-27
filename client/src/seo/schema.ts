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
    logo: absoluteUrl('/SCNT.eg_Monogram.png'),
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
      name: SITE_NAME,
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
