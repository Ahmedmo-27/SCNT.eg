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

export type CartLineMetadata = {
  primary_tester_vial?: string
  complimentary_second_vial?: string
  matched_outing?: string
  bundle_type?: string
  [key: string]: string | undefined
}

export type CartLine = {
  productId: string
  name: string
  size?: string
  price: number
  quantity: number
  image: string
  metadata?: CartLineMetadata
}

function isSameCartLine(
  a: { productId: string; size?: string; metadata?: CartLineMetadata },
  b: { productId: string; size?: string; metadata?: CartLineMetadata }
): boolean {
  const sameProduct = a.productId === b.productId
  const sameSize = (a.size || '100ml') === (b.size || '100ml')
  const metaA = a.metadata ? JSON.stringify(a.metadata) : ''
  const metaB = b.metadata ? JSON.stringify(b.metadata) : ''
  return sameProduct && sameSize && metaA === metaB
}

const CART_LOCAL_STORAGE_KEY = 'scnt_local_cart_items_v2'

function loadSavedCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_LOCAL_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    return []
  }
}

function persistCart(items: CartLine[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_LOCAL_STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* quota / private mode */
  }
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
  removeItem: (productId: string, size?: string, metadata?: CartLineMetadata) => Promise<void>
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: loadSavedCart(),
  promo: null,
  summary: null,
  addItem: (line) => {
    const itemWithDefaults: CartLine = {
      ...line,
      size: line.size || '100ml',
    }
    set((s) => {
      const existing = s.items.find((i) => isSameCartLine(i, itemWithDefaults))
      let nextItems: CartLine[]
      if (existing) {
        nextItems = s.items.map((i) =>
          isSameCartLine(i, itemWithDefaults)
            ? { ...i, quantity: i.quantity + itemWithDefaults.quantity }
            : i
        )
      } else {
        nextItems = [...s.items, itemWithDefaults]
      }
      persistCart(nextItems)
      return { items: nextItems, summary: null }
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
    set((s) => {
      const existingMeta = new Map<string, CartLineMetadata>()
      s.items.forEach((item) => {
        if (item.metadata) {
          existingMeta.set(`${item.productId}-${item.size || '100ml'}`, item.metadata)
        }
      })
      const mergedItems = items.map((item) => {
        const key = `${item.productId}-${item.size || '100ml'}`
        const meta = item.metadata ?? existingMeta.get(key)
        return meta ? { ...item, metadata: meta } : item
      })
      persistCart(mergedItems)
      return { items: mergedItems, promo, summary }
    })
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
  removeItem: async (productId, size, metadata) => {
    set((s) => {
      const nextItems = s.items.filter((i) =>
        metadata
          ? !isSameCartLine(i, { productId, size, metadata })
          : size
            ? (i.size || '100ml') !== (size || '100ml') || i.productId !== productId
            : i.productId !== productId
      )
      persistCart(nextItems)
      return { items: nextItems, summary: null }
    })

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
      set((s) => {
        const existingMeta = new Map<string, CartLineMetadata>()
        s.items.forEach((item) => {
          if (item.metadata) {
            existingMeta.set(`${item.productId}-${item.size || '100ml'}`, item.metadata)
          }
        })
        const merged: CartLine[] = mapped.map((item) => {
          const key = `${item.productId}-${item.size || '100ml'}`
          const meta = existingMeta.get(key)
          return meta ? { ...item, metadata: meta } : item
        })
        persistCart(merged)
        return { items: merged, promo: cart.appliedPromo, summary: cart.summary ?? null }
      })
    } catch {
      // Keep optimistic local update
    }
  },
  clear: () => {
    persistCart([])
    set({ items: [], promo: null, summary: null })
    void clearServerCart().catch(() => {})
  },
}))
