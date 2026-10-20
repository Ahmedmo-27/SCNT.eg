import { apiGetCartData, apiPostCartData } from './api'

export type CartPromo = {
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minSubtotal: number
  maxDiscount: number | null
  discountAmount: number
}

export type ServerCart = {
  user?: string | null
  visitorId?: string | null
  items: Array<{
    product: string | { _id: string }
    size?: string
    quantity: number
  }>
  lines?: Array<{
    productId: string
    size?: string
    quantity: number
    unitPrice: number
    lineTotal: number
    name: string
    image: string
  }>
  promoCode: string
  appliedPromo: CartPromo | null
  summary: {
    subtotal: number
    shipping: number
    discount: number
    total: number
  }
}

export async function fetchServerCart(): Promise<ServerCart> {
  return apiGetCartData<ServerCart>('/cart')
}

export async function clearServerCart(): Promise<void> {
  await apiPostCartData<unknown>('/cart/clear', {})
}

export async function addToServerCart(
  productId: string,
  quantity: number,
  size = '100ml'
): Promise<ServerCart> {
  return apiPostCartData<ServerCart>('/cart/add', { productId, quantity, size })
}

export async function removeFromServerCart(productId: string, size?: string): Promise<ServerCart> {
  return apiPostCartData<ServerCart>('/cart/remove', { productId, size })
}

/** Replaces the user's or guest's server cart to match checkout lines */
export async function replaceServerCart(
  lines: { productId: string; quantity: number; size?: string }[]
): Promise<ServerCart> {
  return apiPostCartData<ServerCart>('/cart/replace', { lines })
}

export async function applyPromoCode(code: string): Promise<ServerCart> {
  return apiPostCartData<ServerCart>('/cart/promo/apply', { code })
}

export async function removePromoCode(): Promise<ServerCart> {
  return apiPostCartData<ServerCart>('/cart/promo/remove', {})
}
