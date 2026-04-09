import { create } from 'zustand'

export type CartLine = {
  productId: string
  name: string
  price: number
  quantity: number
}

type CartState = {
  items: CartLine[]
  addItem: (line: CartLine) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (line) =>
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
    }),
  clear: () => set({ items: [] }),
}))
