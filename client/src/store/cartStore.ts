import { create } from 'zustand'
import { getStoredAuthToken } from '../lib/authStorage'
import {
  addToServerCart,
  applyPromoCode,
  clearServerCart,
  removePromoCode,
  type CartPromo,
} from '../services/cartApi'

export type CartLine = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

type CartState = {
  items: CartLine[]
  promo: CartPromo | null
  addItem: (line: CartLine) => void
  applyPromo: (code: string) => Promise<void>
  removePromo: () => Promise<void>
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  promo: null,
  addItem: (line) => {
    set((s) => {
      const existing = s.items.find((i) => i.productId === line.productId)
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === line.productId
              ? { ...i, quantity: i.quantity + line.quantity }
              : i,
          ),
        }
      }
      return { items: [...s.items, line] }
    })

    if (getStoredAuthToken()) {
      void addToServerCart(line.productId, line.quantity).catch(() => {
        /* keep optimistic local cart even if sync fails */
      })
    }
  },
  applyPromo: async (code) => {
    if (!getStoredAuthToken()) {
      throw new Error('Please log in to apply promo codes.')
    }
    const cart = await applyPromoCode(code)
    set({ promo: cart.appliedPromo })
  },
  removePromo: async () => {
    if (!getStoredAuthToken()) {
      set({ promo: null })
      return
    }
    const cart = await removePromoCode()
    set({ promo: cart.appliedPromo })
  },
  clear: () => {
    set({ items: [], promo: null })
    if (getStoredAuthToken()) {
      void clearServerCart().catch(() => {
        /* keep local clear even if sync fails */
      })
    }
  },
}))
