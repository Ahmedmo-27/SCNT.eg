import { apiGetData } from './api'
import type { ApiCollection, ApiProductListResponse } from '../types/catalog'

export async function fetchCollections(): Promise<ApiCollection[]> {
  return apiGetData<ApiCollection[]>('/collections')
}

export async function fetchProducts(limit = 100): Promise<ApiProductListResponse> {
  return apiGetData<ApiProductListResponse>(`/products?limit=${limit}`)
}
