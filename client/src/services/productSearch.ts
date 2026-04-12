import { apiGetData } from './api'
import type { ApiProductListResponse } from '../types/catalog'

/**
 * Server search: `GET /api/products?q=...` matches English fields, `translations.ar`, and
 * collections whose Arabic or English copy matches (see server `productService.buildProductFilters`).
 */
export async function fetchProductsByQuery(q: string, limit = 8, page = 1): Promise<ApiProductListResponse> {
  const trimmed = q.trim()
  if (!trimmed) {
    return {
      items: [],
      pagination: { total: 0, page: 1, pages: 0, limit },
    }
  }
  const params = new URLSearchParams({
    q: trimmed,
    limit: String(limit),
    page: String(page),
  })
  return apiGetData<ApiProductListResponse>(`/products?${params.toString()}`)
}
