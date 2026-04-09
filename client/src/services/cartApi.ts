import { apiPostDataAuthed } from './api'

export type CartPromo = {
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minSubtotal: number
  maxDiscount: number | null
  discountAmount: number
}

export type ServerCart = {
  user: string
  items: Array<{
    product: string | { _id: string }
    quantity: number
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

export async function clearServerCart(): Promise<void> {
  await apiPostDataAuthed<unknown>('/cart/clear', {})
}

export async function addToServerCart(productId: string, quantity: number): Promise<void> {
  await apiPostDataAuthed<unknown>('/cart/add', { productId, quantity })
}

/** Replaces the authenticated user’s server cart to match local checkout lines (same order). */
export async function replaceServerCart(lines: { productId: string; quantity: number }[]): Promise<ServerCart> {
  return apiPostDataAuthed<ServerCart>('/cart/replace', { lines })
}

export async function applyPromoCode(code: string): Promise<ServerCart> {
  return apiPostDataAuthed<ServerCart>('/cart/promo/apply', { code })
}

export async function removePromoCode(): Promise<ServerCart> {
  return apiPostDataAuthed<ServerCart>('/cart/promo/remove', {})
}
