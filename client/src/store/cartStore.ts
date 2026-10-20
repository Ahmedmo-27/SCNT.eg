import { create } from 'zustand'
import {
  addToServerCart,
  applyPromoCode,
  clearServerCart,
  removePromoCode,
  removeFromServerCart,
  type CartPromo,
  type ServerCart,
} from '../services/cartApi'
import { trackFunnelAction } from '../components/analytics/VisitTracker'

export type CartLine = {
  productId: string
  name: string
  size?: string
  price: number
  quantity: number
  image: string
}

function isSameCartLine(
  a: { productId: string; size?: string },
  b: { productId: string; size?: string }
): boolean {
  return a.productId === b.productId && (a.size || '100ml') === (b.size || '100ml')
}

type CartState = {
  items: CartLine[]
  promo: CartPromo | null
  summary: ServerCart['summary'] | null
  addItem: (line: CartLine) => void
  hydrateFromServer: (payload: {
    items: CartLine[]
    promo: CartPromo | null
    summary: ServerCart['summary'] | null
  }) => void
  applyPromo: (code: string) => Promise<void>
  removePromo: () => Promise<void>
  removeItem: (productId: string, size?: string) => Promise<void>
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  promo: null,
  summary: null,
  addItem: (line) => {
    const itemWithDefaults: CartLine = {
      ...line,
      size: line.size || '100ml',
    }
    set((s) => {
      const existing = s.items.find((i) => isSameCartLine(i, itemWithDefaults))
      if (existing) {
        return {
          items: s.items.map((i) =>
            isSameCartLine(i, itemWithDefaults)
              ? { ...i, quantity: i.quantity + itemWithDefaults.quantity }
              : i
          ),
          summary: null,
        }
      }
      return { items: [...s.items, itemWithDefaults], summary: null }
    })

    // Track funnel milestone
    trackFunnelAction('add_to_cart', 'cart_view', {
      productId: itemWithDefaults.productId,
      name: itemWithDefaults.name,
      size: itemWithDefaults.size,
      quantity: itemWithDefaults.quantity,
      price: itemWithDefaults.price,
    })

    // Always sync with server (supports both authenticated users and guests)
    void addToServerCart(
      itemWithDefaults.productId,
      itemWithDefaults.quantity,
      itemWithDefaults.size
    ).catch(() => {
      /* keep optimistic local cart even if sync fails */
    })
  },
  hydrateFromServer: ({ items, promo, summary }) => {
    set({ items, promo, summary })
  },
  applyPromo: async (code) => {
    const cart = await applyPromoCode(code)
    set({ promo: cart.appliedPromo, summary: cart.summary })
    trackFunnelAction('apply_coupon', 'cart_view', { code })
  },
  removePromo: async () => {
    try {
      const cart = await removePromoCode()
      set({ promo: cart.appliedPromo, summary: cart.summary })
    } catch {
      set({ promo: null, summary: null })
    }
  },
  removeItem: async (productId, size) => {
    set((s) => ({
      items: s.items.filter((i) =>
        size ? !isSameCartLine(i, { productId, size }) : i.productId !== productId
      ),
      summary: null,
    }))

    try {
      const cart = await removeFromServerCart(productId, size)
      const mapped =
        cart.lines?.map((line) => ({
          productId: line.productId,
          name: line.name,
          size: line.size || '100ml',
          price: Number(line.unitPrice || 0),
          quantity: Number(line.quantity || 0),
          image: line.image || '',
        })) ?? []
      set({ items: mapped, promo: cart.appliedPromo, summary: cart.summary ?? null })
    } catch {
      // Keep optimistic local update
    }
  },
  clear: () => {
    set({ items: [], promo: null, summary: null })
    void clearServerCart().catch(() => {})
  },
}))
