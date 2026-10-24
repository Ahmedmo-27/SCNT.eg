import { apiDeleteDataAuthed, apiGetDataAuthed, apiPatchDataAuthed, apiPostDataAuthed, apiPutDataAuthed } from './api'

export type AdminDashboard = {
  usersCount: number
  productsCount: number
  ordersCount: number
  collectionsCount: number
  pendingOrders: number
  totalRevenue: number
  onlineRevenue?: number
  offlineRevenue?: number
  offlineSalesCount?: number
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
  coverImage?: string
  clearBackground_Image?: string
  themeColor?: string
  tagline?: string
  sub_tagline?: string
  description?: string
}

export type PromoApplicableProduct = {
  product: string | { _id: string; name: string; price?: number; slug?: string }
  maxCount?: number | null
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
  applicableProducts?: PromoApplicableProduct[]
}

export type AdminReview = {
  _id: string
  productId: string
  rating: number
  review: string
  guestName: string
  createdAt: string
  updatedAt: string
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
  sizes?: { size: string; price: number; stock?: number }[]
  description?: string
  coverImage?: string
  clearBackground_Image?: string
  images?: string[]
  stock: number
  rating?: number
  reviews?: AdminReview[]
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

export type OfflineSaleItem = {
  product: string | { _id: string; name: string; slug?: string; price?: number; images?: string[]; coverImage?: string }
  productName: string
  size: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type OfflineSaleCustomer = {
  fullName: string
  phone: string
  email: string
}

export type OfflineSale = {
  _id: string
  receiptNumber: string
  items: OfflineSaleItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: 'CASH' | 'INSTAPAY' | 'CARD' | 'VODAFONE_CASH' | 'BANK_TRANSFER' | 'OTHER'
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING'
  channel: 'WALK_IN' | 'BAZAAR' | 'POPUP_BOOTH' | 'WHATSAPP' | 'PHONE' | 'INSTAGRAM' | 'EXHIBITION' | 'OTHER'
  location?: string
  customer?: OfflineSaleCustomer
  notes?: string
  saleDate: string
  deductedStock: boolean
  createdAt: string
  updatedAt: string
}

export type CreateOfflineSalePayload = {
  items: Array<{
    product: string
    productName?: string
    size: string
    quantity: number
    unitPrice: number
  }>
  discount?: number
  paymentMethod?: 'CASH' | 'INSTAPAY' | 'CARD' | 'VODAFONE_CASH' | 'BANK_TRANSFER' | 'OTHER'
  paymentStatus?: 'PAID' | 'PARTIALLY_PAID' | 'PENDING'
  channel?: 'WALK_IN' | 'BAZAAR' | 'POPUP_BOOTH' | 'WHATSAPP' | 'PHONE' | 'INSTAGRAM' | 'EXHIBITION' | 'OTHER'
  location?: string
  customer?: {
    fullName?: string
    phone?: string
    email?: string
  }
  notes?: string
  saleDate?: string
  deductStock?: boolean
}

export type OfflineSalesSummary = {
  totalRevenue: number
  totalOrders: number
  totalUnitsSold: number
  avgOrderValue: number
  paymentMethods: Array<{ method: string; count: number; total: number }>
  channels: Array<{ channel: string; count: number; total: number }>
  topProducts: Array<{ productName: string; quantity: number; revenue: number }>
}

export type OfflineSalesListResponse = {
  sales: OfflineSale[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export function fetchOfflineSales(params?: {
  page?: number
  limit?: number
  search?: string
  paymentMethod?: string
  channel?: string
  paymentStatus?: string
  startDate?: string
  endDate?: string
}): Promise<OfflineSalesListResponse> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.search) query.set('search', params.search)
  if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod)
  if (params?.channel) query.set('channel', params.channel)
  if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus)
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  const qs = query.toString()
  return apiGetDataAuthed<OfflineSalesListResponse>(`/admin/offline-sales${qs ? `?${qs}` : ''}`)
}

export function fetchOfflineSalesSummary(): Promise<OfflineSalesSummary> {
  return apiGetDataAuthed<OfflineSalesSummary>('/admin/offline-sales/summary')
}

export function createOfflineSale(payload: CreateOfflineSalePayload): Promise<OfflineSale> {
  return apiPostDataAuthed<OfflineSale>('/admin/offline-sales', payload)
}

export function updateOfflineSale(
  id: string,
  payload: Partial<CreateOfflineSalePayload>
): Promise<OfflineSale> {
  return apiPatchDataAuthed<OfflineSale>(`/admin/offline-sales/${id}`, payload)
}

export function deleteOfflineSale(
  id: string,
  restoreStock = true
): Promise<{ deletedId: string; restoredStock: boolean }> {
  return apiDeleteDataAuthed<{ deletedId: string; restoredStock: boolean }>(
    `/admin/offline-sales/${id}?restoreStock=${restoreStock ? 'true' : 'false'}`
  )
}

