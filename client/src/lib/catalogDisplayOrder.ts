import type { CollectionSummary, CollectionId } from '../types/catalog'
import type { ProductSummary } from '../types/catalog'

/**
 * Collection order across the site (featured, shop filters, header mega menu, etc.).
 * Icon → Charmer → Explorer → Executive (reverse of legacy static `collections.ts`).
 */
export const COLLECTION_DISPLAY_ORDER: readonly CollectionId[] = [
  'icon',
  'charmer',
  'explorer',
  'executive',
]

const ORDER_SET = new Set<string>(COLLECTION_DISPLAY_ORDER)

/**
 * Exact order from legacy `client/src/data/products.ts` (before API migration).
 * New catalogue slugs append to the end by sort index.
 */
export const PRODUCT_SLUG_ORDER: readonly string[] = [
  'azure-code',
  'deep-horizon',
  'midnight-code',
  'golden-bloom',
  'cobalt-drive',
  'lumiere',
]

function sortPosition(id: string, order: readonly string[]): number {
  const i = order.indexOf(id)
  return i === -1 ? order.length : i
}

/** Deterministic ordering: walks `COLLECTION_DISPLAY_ORDER`, then any extra lines by name. */
export function sortCollectionsForDisplay(collections: CollectionSummary[]): CollectionSummary[] {
  const byId = new Map<CollectionId, CollectionSummary>()
  for (const c of collections) {
    byId.set(c.id, c)
  }
  const ordered: CollectionSummary[] = []
  for (const id of COLLECTION_DISPLAY_ORDER) {
    const row = byId.get(id)
    if (row) ordered.push(row)
  }
  const extras = collections.filter((c) => !ORDER_SET.has(c.id))
  extras.sort((a, b) => a.name.localeCompare(b.name))
  return [...ordered, ...extras]
}

export function sortProductsForDisplay(products: ProductSummary[]): ProductSummary[] {
  return [...products].sort((a, b) => {
    const d = sortPosition(a.id, PRODUCT_SLUG_ORDER) - sortPosition(b.id, PRODUCT_SLUG_ORDER)
    return d !== 0 ? d : a.id.localeCompare(b.id)
  })
}
