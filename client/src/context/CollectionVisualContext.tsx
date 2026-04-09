import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { CollectionId } from '../data/collections'
import { getCollectionById } from '../data/collections'
import { getCollectionVivid } from '../data/collectionThemes'
import { darkenHex } from '../lib/colorUtils'

export type CollectionVisualTokens = {
  accent: string
  vivid: string
  /** Accent darkened 20% toward black — base notes, etc. */
  accentDeep: string
}

const DEFAULT_TOKENS: CollectionVisualTokens = {
  accent: '#2a2622',
  vivid: 'rgba(255, 255, 255, 0.42)',
  accentDeep: darkenHex('#2a2622', 0.2),
}

const CollectionVisualContext = createContext<CollectionVisualTokens>(DEFAULT_TOKENS)

export function CollectionVisualProvider({
  collectionId,
  children,
}: {
  collectionId: CollectionId | null | undefined
  children: ReactNode
}) {
  const value = useMemo<CollectionVisualTokens>(() => {
    if (!collectionId) return DEFAULT_TOKENS
    const col = getCollectionById(collectionId)
    const accent = col?.accent ?? DEFAULT_TOKENS.accent
    return {
      accent,
      vivid: getCollectionVivid(collectionId),
      accentDeep: darkenHex(accent, 0.2),
    }
  }, [collectionId])

  return (
    <CollectionVisualContext.Provider value={value}>
      {children}
    </CollectionVisualContext.Provider>
  )
}

export function useCollectionVisual(): CollectionVisualTokens {
  return useContext(CollectionVisualContext)
}
