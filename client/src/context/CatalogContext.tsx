import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useI18n } from '../i18n/I18nContext'
import { sortCollectionsForDisplay, sortProductsForDisplay } from '../lib/catalogDisplayOrder'
import { mapApiCollectionToSummary, mapApiProductToSummary } from '../lib/catalogMappers'
import { fetchCollections, fetchProducts } from '../services/catalogApi'
import type { ApiCollection, ApiProduct, CollectionSummary, ProductSummary } from '../types/catalog'

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
  const { t, locale } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawCollections, setRawCollections] = useState<ApiCollection[]>([])
  const [rawProducts, setRawProducts] = useState<ApiProduct[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cols, list] = await Promise.all([fetchCollections(), fetchProducts(100)])
      setRawCollections(cols)
      setRawProducts(list.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('catalog.loadError'))
      setRawCollections([])
      setRawProducts([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const collections = useMemo(
    () => sortCollectionsForDisplay(rawCollections.map((c) => mapApiCollectionToSummary(c, locale))),
    [rawCollections, locale],
  )

  const products = useMemo(
    () => sortProductsForDisplay(rawProducts.map((p) => mapApiProductToSummary(p, locale))),
    [rawProducts, locale],
  )

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
