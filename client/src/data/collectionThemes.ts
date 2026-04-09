import type { CollectionId } from './collections'

/** Visual tokens for immersive collection backdrops — keep opacity low for luxury control. */
export const collectionTheme = {
  executive: {
    /** High-impact UI (sweeps, chromatic accents) */
    vivid: '#2e5a88',
    /** Grid stroke — executive line */
    gridStroke: '#7a8fa3',
    gridStrokeOpacity: 0.18,
    coolMistTop: 'rgba(180, 198, 220, 0.22)',
    coolMistMid: 'rgba(210, 218, 232, 0.12)',
    coolMistBottom: 'transparent',
  },
  explorer: {
    vivid: '#006d6d',
    wave: '#3d8b8b',
    horizon: 'rgba(61, 139, 139, 0.12)',
    spray: 'rgba(125, 211, 252, 0.08)',
  },
  charmer: {
    vivid: '#b92d5d',
    /** Magenta dusk — cursor bloom at 5% */
    bloomFollow: 'rgba(139, 61, 92, 0.05)',
    veil: 'rgba(90, 40, 65, 0.06)',
  },
  icon: {
    vivid: '#d4af37',
    starAccent: '#b89b5e',
    gold: 'rgba(184, 155, 94, 0.22)',
    goldDeep: 'rgba(160, 120, 55, 0.12)',
    shine: 'rgba(255, 248, 230, 0.35)',
  },
} as const

export type CollectionThemeId = keyof typeof collectionTheme

export function getCollectionVivid(id: CollectionId): string {
  return collectionTheme[id].vivid
}
