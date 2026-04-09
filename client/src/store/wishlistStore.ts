import { create } from 'zustand'
import { getStoredAuthToken } from '../lib/authStorage'
import {
  addToServerWishlist,
  clearServerWishlist,
  removeFromServerWishlist,
} from '../services/wishlistApi'

export type WishlistItem = {
  productId: string
  slug: string
  name: string
  price: number
  image: string
  inspiredBy: string
  collection: string
}

type WishlistState = {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  toggleItem: (item: WishlistItem) => void
  hasItem: (productId: string) => boolean
  clear: () => void
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((s) => {
      if (s.items.some((i) => i.productId === item.productId)) return s
      if (getStoredAuthToken()) {
        void addToServerWishlist(item.productId).catch(() => {
          /* keep optimistic local wishlist even if sync fails */
        })
      }
      return { items: [...s.items, item] }
    }),
  removeItem: (productId) => {
    set((s) => ({
      items: s.items.filter((i) => i.productId !== productId),
    }))
    if (getStoredAuthToken()) {
      void removeFromServerWishlist(productId).catch(() => {
        /* keep optimistic local wishlist even if sync fails */
      })
    }
  },
  clear: () => {
    set({ items: [] })
    if (getStoredAuthToken()) {
      void clearServerWishlist().catch(() => {
        /* keep local clear even if sync fails */
      })
    }
  },
  toggleItem: (item) => {
    if (get().hasItem(item.productId)) {
      get().removeItem(item.productId)
      return
    }
    get().addItem(item)
  },
  hasItem: (productId) => get().items.some((i) => i.productId === productId),
}))
