export type CollectionId = 'executive' | 'explorer' | 'charmer' | 'icon'

export type CollectionSummary = {
  id: CollectionId
  name: string
  code: string
  tagline: string
  /** Who this line is for — one identity line */
  identityLine: string
  /** Italic serif mantra on product pages (Cormorant Garamond) */
  heroTagline: string
  /** Immersive intro — personality before the grid */
  worldIntro: string
  /** Primary accent for cards and future themed pages */
  accent: string
  accentSoft: string
  mood: string
}

export const collections: CollectionSummary[] = [
  {
    id: 'executive',
    name: 'The Executive',
    code: 'Azure · Cobalt',
    tagline: 'Structured precision for decisive days.',
    identityLine: 'For the one who leads without raising their voice.',
    heroTagline: 'Crafted for precision and presence.',
    worldIntro:
      'This is the line of crisp air and quiet authority — tailoring in scent form. Nothing shouts; everything holds.',
    accent: '#8a9caf',
    accentSoft: 'rgba(138, 156, 175, 0.2)',
    mood: 'Structured · Silver mist · Soft blue',
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    code: 'Deep Horizon',
    tagline: 'Salt air, open horizon, quiet confidence.',
    identityLine: 'For the curious soul who collects horizons.',
    heroTagline: 'Made for those who never stand still.',
    worldIntro:
      'Salt, sky, and skin that remembers the sun. These are fragrances for movement — the kind that feels like freedom, not escape.',
    accent: '#3d7a7a',
    accentSoft: 'rgba(61, 122, 122, 0.2)',
    mood: 'Fluid · Teal depth · Ocean calm',
  },
  {
    id: 'charmer',
    name: 'The Charmer',
    code: 'Midnight Code',
    tagline: 'Velvet dusk, amber warmth, effortless pull.',
    identityLine: 'For magnetic evenings and soft power.',
    heroTagline: 'Designed to leave a lasting impression.',
    worldIntro:
      'Dusk in a bottle — warmth that draws people in. Here, sensuality is refined: close, slow, unforgettable.',
    accent: '#8f3d62',
    accentSoft: 'rgba(143, 61, 98, 0.18)',
    mood: 'Sensual · Magenta dusk · Warm amber',
  },
  {
    id: 'icon',
    name: 'The Icon',
    code: 'Golden Bloom · Lumière',
    tagline: 'Radiant presence that needs no introduction.',
    identityLine: 'For those who need no second introduction.',
    heroTagline: 'A statement of timeless identity.',
    worldIntro:
      'Gold, resin, rose with weight. The Icon line is ceremony in wear — legacy notes for moments that stay in the room after you leave.',
    accent: '#c4a35a',
    accentSoft: 'rgba(196, 163, 90, 0.22)',
    mood: 'Bold · Champagne gold · Prestige',
  },
]

export function getCollectionById(id: string): CollectionSummary | undefined {
  return collections.find((c) => c.id === id)
}
