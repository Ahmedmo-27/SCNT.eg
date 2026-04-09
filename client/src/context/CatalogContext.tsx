import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { sortCollectionsForDisplay, sortProductsForDisplay } from '../lib/catalogDisplayOrder'
import { mapApiCollectionToSummary, mapApiProductToSummary } from '../lib/catalogMappers'
import { fetchCollections, fetchProducts } from '../services/catalogApi'
import type { CollectionSummary, ProductSummary } from '../types/catalog'

type CatalogState = {
  loading: boolean
  error: string | null
  collections: CollectionSummary[]
  products: ProductSummary[]
  previewImageByCollectionId: Record<string, string>
  reload: () => Promise<void>
}

const CatalogContext = createContext<CatalogState | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [products, setProducts] = useState<ProductSummary[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rawCollections, rawProducts] = await Promise.all([fetchCollections(), fetchProducts(100)])
      const cols = sortCollectionsForDisplay(rawCollections.map(mapApiCollectionToSummary))
      const items = sortProductsForDisplay(rawProducts.items.map(mapApiProductToSummary))
      setCollections(cols)
      setProducts(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load catalogue')
      setCollections([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const previewImageByCollectionId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of products) {
      const key = p.collection
      if (!map[key]) map[key] = p.galleryImages[0] ?? ''
    }
    return map
  }, [products])

  const value = useMemo<CatalogState>(
    () => ({
      loading,
      error,
      collections,
      products,
      previewImageByCollectionId,
      reload: load,
    }),
    [loading, error, collections, products, previewImageByCollectionId, load],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
