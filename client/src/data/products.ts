import type { CollectionId } from './collections'

/** Shared mood for soft “you might also like” matching */
export type ScentMood =
  | 'crisp-tailored'
  | 'coastal-airy'
  | 'velvet-nocturne'
  | 'golden-heritage'

export type ProductSummary = {
  id: string
  name: string
  collection: CollectionId
  /** Reference inspiration — not affiliated; house interpretation */
  inspiredBy: string
  price: number
  /** Placeholder gradient until product photography ships */
  placeholderGradient: [string, string]
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  /** Short emotional story — not a spec sheet */
  emotionalStory: string
  /** One line — when / how it feels */
  vibeSentence: string
  /** Where the mind goes — one phrase */
  lifestyleLine: string
  format: string
  volume: string
  concentrationHint: string
  scentMood: ScentMood
}

export const products: ProductSummary[] = [
  {
    id: 'exec-noir-linen',
    name: 'Azure Code',
    collection: 'executive',
    inspiredBy: 'Bleu de Chanel EDP',
    price: 2850,
    placeholderGradient: ['#e8edf2', '#9aa8b8'],
    topNotes: ['Bergamot', 'White pepper'],
    heartNotes: ['Iris', 'Lavender absolute'],
    baseNotes: ['Vetiver', 'Clean musk'],
    emotionalStory:
      'Cool linen against skin after the room has cleared. Precision without performance — a signature that stays close, then lingers.',
    vibeSentence: 'For early mornings and unshakable calm.',
    lifestyleLine: 'Boardrooms, gallery openings, the quiet between decisions.',
    format: 'Eau de Parfum',
    volume: '100 ml',
    concentrationHint: 'High concentration · Exceptional longevity',
    scentMood: 'crisp-tailored',
  },
  {
    id: 'expl-salt-fig',
    name: 'Deep Horizon',
    collection: 'explorer',
    inspiredBy: 'Acqua di Giò Profondo',
    price: 2650,
    placeholderGradient: ['#d4ecea', '#3d8f8f'],
    topNotes: ['Mediterranean fig', 'Sea spray'],
    heartNotes: ['Jasmine tea', 'Water lily'],
    baseNotes: ['Driftwood', 'Sheer amber'],
    emotionalStory:
      'Sun-warmed skin and tide at your ankles. Green fig gives way to salt and something softly floral — like memory, not description.',
    vibeSentence: 'For golden hours and barefoot confidence.',
    lifestyleLine: 'Coastal walks, open windows, anywhere the air moves.',
    format: 'Eau de Parfum',
    volume: '100 ml',
    concentrationHint: 'High concentration · Long-lasting trail',
    scentMood: 'coastal-airy',
  },
  {
    id: 'charm-velvet-orchid',
    name: 'Midnight Code',
    collection: 'charmer',
    inspiredBy: 'Armani Code EDP',
    price: 2950,
    placeholderGradient: ['#f1d4e8', '#6b2a45'],
    topNotes: ['Blackcurrant', 'Pink pepper'],
    heartNotes: ['Orchid', 'Rose de Mai'],
    baseNotes: ['Patchouli', 'Amber resin'],
    emotionalStory:
      'Dim light, silk at the wrist. Fruits spark first; the heart unfolds slow and close — invitation without a word.',
    vibeSentence: 'For late nights and quiet gravity.',
    lifestyleLine: 'Candlelit rooms, slow dinners, the pause before the smile.',
    format: 'Eau de Parfum',
    volume: '100 ml',
    concentrationHint: 'High concentration · Rich, enduring sillage',
    scentMood: 'velvet-nocturne',
  },
  {
    id: 'icon-gilded-rose',
    name: 'Golden Bloom',
    collection: 'icon',
    inspiredBy: 'La Vie Est Belle',
    price: 3450,
    placeholderGradient: ['#f3e8c8', '#a67c32'],
    topNotes: ['Saffron', 'Bergamot zest'],
    heartNotes: ['Turkish rose', 'Osmanthus'],
    baseNotes: ['Aged oud', 'Honeyed musk'],
    emotionalStory:
      'Rose lifted by gold and resin — not sweet, but radiant. Oud sits deep and patient; this is presence with history.',
    vibeSentence: 'For moments that need no announcement.',
    lifestyleLine: 'Gala steps, private salons, the weight of a perfect entrance.',
    format: 'Eau de Parfum',
    volume: '100 ml',
    concentrationHint: 'Extrait-level depth · Remarkable longevity',
    scentMood: 'golden-heritage',
  },
  {
    id: 'exec-silver-ink',
    name: 'Cobalt Drive',
    collection: 'executive',
    inspiredBy: 'YSL Y EDP',
    price: 2750,
    placeholderGradient: ['#ececee', '#787c88'],
    topNotes: ['Aldehydes', 'Green cardamom'],
    heartNotes: ['Metallic violet', 'Cedar'],
    baseNotes: ['Mineral musk', 'Soft leather'],
    emotionalStory:
      'Paper, metal, and a trace of violet — intellectual, exacting. It reads like a sharp line: no flourish, only intent.',
    vibeSentence: 'For clarity, contracts, and cool confidence.',
    lifestyleLine: 'Studios, airports at dawn, anywhere ideas turn into action.',
    format: 'Eau de Parfum',
    volume: '100 ml',
    concentrationHint: 'High concentration · Clean, persistent wear',
    scentMood: 'crisp-tailored',
  },
  {
    id: 'expl-azure-drift',
    name: 'Lumière',
    collection: 'icon',
    inspiredBy: 'YSL Libre',
    price: 2550,
    placeholderGradient: ['#dbeafe', '#3b6fb8'],
    topNotes: ['Yuzu', 'Coastal herbs'],
    heartNotes: ['Neroli', 'Blue ginger'],
    baseNotes: ['Sea moss', 'Pale woods'],
    emotionalStory:
      'Citrus cuts clean; neroli softens into blue air. It feels like horizon — light, transparent, impossible to pin down.',
    vibeSentence: 'For open schedules and wind in your coat.',
    lifestyleLine: 'Weekend escapes, rooftops, the first deep breath outside.',
    format: 'Eau de Parfum',
    volume: '100 ml',
    concentrationHint: 'High concentration · Airy yet lasting',
    scentMood: 'golden-heritage',
  },
]

export function getProductById(id: string): ProductSummary | undefined {
  return products.find((p) => p.id === id)
}

export function getBestsellers(limit = 4): ProductSummary[] {
  return products.slice(0, limit)
}

/** Related by mood first, then collection; excludes current product */
export function getRelatedProducts(productId: string, limit = 3): ProductSummary[] {
  const p = getProductById(productId)
  if (!p) return []
  const others = products.filter((x) => x.id !== productId)
  const seen = new Set<string>()
  const out: ProductSummary[] = []

  const push = (arr: ProductSummary[]) => {
    for (const x of arr) {
      if (out.length >= limit) return
      if (!seen.has(x.id)) {
        seen.add(x.id)
        out.push(x)
      }
    }
  }

  push(others.filter((x) => x.scentMood === p.scentMood && x.collection === p.collection))
  push(others.filter((x) => x.scentMood === p.scentMood))
  push(others.filter((x) => x.collection === p.collection))
  push(others)

  return out.slice(0, limit)
}
