import { apiPostDataAuthed } from './api'

export async function clearServerCart(): Promise<void> {
  await apiPostDataAuthed<unknown>('/cart/clear', {})
}

export async function addToServerCart(productId: string, quantity: number): Promise<void> {
  await apiPostDataAuthed<unknown>('/cart/add', { productId, quantity })
}

/** Replaces the authenticated user’s server cart to match local checkout lines (same order). */
export async function replaceServerCart(lines: { productId: string; quantity: number }[]): Promise<void> {
  await clearServerCart()
  for (const line of lines) {
    await addToServerCart(line.productId, line.quantity)
  }
}
