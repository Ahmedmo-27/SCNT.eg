/** Visual tokens for immersive collection backdrops — keep opacity low for luxury control. */
export const collectionTheme = {
  executive: {
    /** Grid stroke — executive line */
    gridStroke: '#7a8fa3',
    gridStrokeOpacity: 0.18,
    coolMistTop: 'rgba(180, 198, 220, 0.22)',
    coolMistMid: 'rgba(210, 218, 232, 0.12)',
    coolMistBottom: 'transparent',
  },
  explorer: {
    wave: '#3d8b8b',
    horizon: 'rgba(61, 139, 139, 0.12)',
    spray: 'rgba(125, 211, 252, 0.08)',
  },
  charmer: {
    /** Magenta dusk — cursor bloom at 5% */
    bloomFollow: 'rgba(139, 61, 92, 0.05)',
    veil: 'rgba(90, 40, 65, 0.06)',
  },
  icon: {
    starAccent: '#b89b5e',
    gold: 'rgba(184, 155, 94, 0.22)',
    goldDeep: 'rgba(160, 120, 55, 0.12)',
    shine: 'rgba(255, 248, 230, 0.35)',
  },
} as const

export type CollectionThemeId = keyof typeof collectionTheme
