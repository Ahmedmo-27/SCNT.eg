import { create } from 'zustand'
import { getStoredAuthToken } from '../lib/authStorage'
import { addToServerCart, clearServerCart } from '../services/cartApi'

export type CartLine = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

type CartState = {
  items: CartLine[]
  addItem: (line: CartLine) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
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
  clear: () => {
    set({ items: [] })
    if (getStoredAuthToken()) {
      void clearServerCart().catch(() => {
        /* keep local clear even if sync fails */
      })
    }
  },
}))
