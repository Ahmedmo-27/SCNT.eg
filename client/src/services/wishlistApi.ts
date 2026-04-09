import { apiGetDataAuthed, apiPostDataAuthed } from './api'

type WishlistDto = {
  user: string
  items: { product: { _id: string } | string; addedAt?: string }[]
}

export async function getServerWishlist(): Promise<WishlistDto> {
  return apiGetDataAuthed<WishlistDto>('/wishlist')
}

export async function addToServerWishlist(productId: string): Promise<void> {
  await apiPostDataAuthed<unknown>('/wishlist/add', { productId })
}

export async function removeFromServerWishlist(productId: string): Promise<void> {
  await apiPostDataAuthed<unknown>('/wishlist/remove', { productId })
}

export async function clearServerWishlist(): Promise<void> {
  await apiPostDataAuthed<unknown>('/wishlist/clear', {})
}
