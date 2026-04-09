import { apiDeleteDataAuthed, apiGetDataAuthed, apiPatchDataAuthed, apiPostDataAuthed, apiPutDataAuthed } from './api'

export type AdminDashboard = {
  usersCount: number
  productsCount: number
  ordersCount: number
  collectionsCount: number
  pendingOrders: number
  totalRevenue: number
}

export type AdminUser = {
  _id: string
  full_name: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
}

export type AdminOrder = {
  _id: string
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPED'
  promoCode?: string
  createdAt: string
  user?: { _id: string; full_name?: string; email?: string }
}

export type AdminCollection = {
  _id: string
  name: string
  slug: string
  themeColor?: string
  tagline?: string
  sub_tagline?: string
  description?: string
}

export type AdminPromo = {
  _id: string
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minSubtotal?: number
  maxDiscount?: number | null
  isActive: boolean
  startsAt?: string | null
  expiresAt?: string | null
}

export type AdminProduct = {
  _id: string
  name: string
  slug: string
  inspired_from: string
  gender: 'male' | 'female'
  collection: string | { _id: string; name?: string; slug?: string }
  price: number
  size?: string
  description?: string
  stock: number
}

export type PromotionalMailPayload = {
  subject: string
  preheader?: string
  contentHtml: string
  onlyVerified?: boolean
}

export type PromotionalMailResult = {
  totalUsers: number
  targetedRecipients: number
  attemptedCount: number
  processedCount: number
  sentCount: number
  failedCount: number
  skippedCount: number
  omittedCount: number
  omittedBreakdown: {
    missingEmailCount: number
    invalidEmailCount: number
    duplicateEmailCount: number
  }
  skippedBreakdown: Record<string, number>
  failureSamples: Array<{
    email: string
    reason: string
  }>
  onlyVerified: boolean
  processingMs: number
}

export type ProductListEnvelope = {
  items: AdminProduct[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export function fetchAdminDashboard(): Promise<AdminDashboard> {
  return apiGetDataAuthed<AdminDashboard>('/admin/dashboard')
}

export function fetchAdminUsers(): Promise<AdminUser[]> {
  return apiGetDataAuthed<AdminUser[]>('/admin/users')
}

export function updateAdminUserRole(userId: string, role: 'user' | 'admin'): Promise<AdminUser> {
  return apiPatchDataAuthed<AdminUser>(`/admin/users/${userId}/role`, { role })
}

export function deleteAdminUser(userId: string): Promise<null> {
  return apiDeleteDataAuthed<null>(`/admin/users/${userId}`)
}

export function fetchAdminOrders(): Promise<AdminOrder[]> {
  return apiGetDataAuthed<AdminOrder[]>('/admin/orders')
}

export function updateAdminOrderStatus(orderId: string, status: AdminOrder['status']): Promise<AdminOrder> {
  return apiPutDataAuthed<AdminOrder>(`/admin/orders/${orderId}/status`, { status })
}

export function fetchAdminCollections(): Promise<AdminCollection[]> {
  return apiGetDataAuthed<AdminCollection[]>('/admin/collections')
}

export function createAdminCollection(payload: Omit<AdminCollection, '_id'>): Promise<AdminCollection> {
  return apiPostDataAuthed<AdminCollection>('/admin/collections', payload)
}

export function updateAdminCollection(id: string, payload: Omit<AdminCollection, '_id'>): Promise<AdminCollection> {
  return apiPutDataAuthed<AdminCollection>(`/admin/collections/${id}`, payload)
}

export function deleteAdminCollection(id: string): Promise<null> {
  return apiDeleteDataAuthed<null>(`/admin/collections/${id}`)
}

export function fetchAdminPromoCodes(): Promise<AdminPromo[]> {
  return apiGetDataAuthed<AdminPromo[]>('/admin/promo-codes')
}

export function createAdminPromo(payload: Omit<AdminPromo, '_id'>): Promise<AdminPromo> {
  return apiPostDataAuthed<AdminPromo>('/admin/promo-codes', payload)
}

export function updateAdminPromo(id: string, payload: Omit<AdminPromo, '_id'>): Promise<AdminPromo> {
  return apiPutDataAuthed<AdminPromo>(`/admin/promo-codes/${id}`, payload)
}

export function deleteAdminPromo(id: string): Promise<null> {
  return apiDeleteDataAuthed<null>(`/admin/promo-codes/${id}`)
}

export function fetchAdminProducts(): Promise<AdminProduct[]> {
  return apiGetDataAuthed<ProductListEnvelope>('/products?limit=200').then((res) => res.items)
}

export function createAdminProduct(payload: Omit<AdminProduct, '_id'>): Promise<AdminProduct> {
  return apiPostDataAuthed<AdminProduct>('/products', payload)
}

export function updateAdminProduct(id: string, payload: Omit<AdminProduct, '_id'>): Promise<AdminProduct> {
  return apiPutDataAuthed<AdminProduct>(`/products/${id}`, payload)
}

export function deleteAdminProduct(id: string): Promise<null> {
  return apiDeleteDataAuthed<null>(`/products/${id}`)
}

export function sendPromotionalMail(payload: PromotionalMailPayload): Promise<PromotionalMailResult> {
  return apiPostDataAuthed<PromotionalMailResult>('/admin/mail/promotional', payload)
}
