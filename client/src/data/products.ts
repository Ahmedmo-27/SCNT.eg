import type { CollectionId } from './collections'

/** Bottle front, bottle back, box — paths under `public/Products` */
const galleryByCollection: Record<CollectionId, readonly [string, string, string]> = {
  executive: [
    '/Products/The Executive Collection Bottle Mockup (Front).png',
    '/Products/The Executive Collection Bottle Mockup (Back).png',
    '/Products/The Executive Collection Box Mockup.png',
  ],
  explorer: [
    '/Products/The Explorer Collection Bottle Mockup (Front).png',
    '/Products/The Explorer Collection Bottle Mockup (Back).png',
    '/Products/The Explorer Collection Box Mockup.png',
  ],
  charmer: [
    '/Products/The Charmer Collection Bottle Mockup (Front).png',
    '/Products/The Charmer Collection Bottle Mockup (Back).png',
    '/Products/The Charmer Collection Box Mockup.png',
  ],
  icon: [
    '/Products/The Icon Collection Bottle Mockup (Front).png',
    '/Products/The Icon Collection Bottle Mockup (Back).png',
    '/Products/The Icon Collection Box Mockup.png',
  ],
}

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
  /** Bottle front, bottle back, box */
  galleryImages: readonly [string, string, string]
}

export const products: ProductSummary[] = [
  {
    id: 'azure-code',
    name: 'Azure Code',
    collection: 'executive',
    inspiredBy: 'Bleu de Chanel EDP',
    price: 750,
    galleryImages: galleryByCollection.executive,
    placeholderGradient: ['#e8edf2', '#9aa8b8'],
    topNotes: ['Grapefruit', 'Lemon', 'Mint', 'Pink Pepper'],
    heartNotes: ['Ginger', 'Nutmeg', 'Jasmine', 'Iso E Super'],
    baseNotes: ['Incense', 'Vetiver', 'Cedar', 'Sandalwood', 'Patchouli', 'Labdanum'],
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
    id: 'deep-horizon',
    name: 'Deep Horizon',
    collection: 'explorer',
    inspiredBy: 'Acqua di Giò Profondo',
    price: 750,
    galleryImages: galleryByCollection.explorer,
    placeholderGradient: ['#d4ecea', '#3d8f8f'],
    topNotes: ['Sea Notes', 'Aquozone', 'Bergamot', 'Green Mandarin'],
    heartNotes: ['Rosemary', 'Lavender', 'Cypress', 'Mastic (Lentisque)'],
    baseNotes: ['Mineral Notes', 'Musk', 'Patchouli', 'Amber'],
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
    id: 'midnight-code',
    name: 'Midnight Code',
    collection: 'charmer',
    inspiredBy: 'Armani Code EDP',
    price: 750,
    galleryImages: galleryByCollection.charmer,
    placeholderGradient: ['#f1d4e8', '#6b2a45'],
    topNotes: ['Bergamot', 'Lemon'],
    heartNotes: ['Olive Blossom', 'Star Anise', 'Guaiac Wood'],
    baseNotes: ['Tonka Bean', 'Leather', 'Tobacco'],
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
    id: 'golden-bloom',
    name: 'Golden Bloom',
    collection: 'icon',
    inspiredBy: 'La Vie Est Belle',
    price: 750,
    galleryImages: galleryByCollection.icon,
    placeholderGradient: ['#f3e8c8', '#a67c32'],
    topNotes: ['Black Currant', 'Pear'],
    heartNotes: ['Iris', 'Jasmine', 'Orange Blossom'],
    baseNotes: ['Praline', 'Vanilla', 'Patchouli', 'Tonka Bean'],
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
    id: 'cobalt-drive',
    name: 'Cobalt Drive',
    collection: 'executive',
    inspiredBy: 'YSL Y EDP',
    price: 750,
    galleryImages: galleryByCollection.executive,
    placeholderGradient: ['#ececee', '#787c88'],
    topNotes: ['Apple', 'Ginger', 'Bergamot'],
    heartNotes: ['Sage', 'Juniper Berries', 'Geranium'],
    baseNotes: ['Amberwood', 'Tonka Bean', 'Cedar', 'Vetiver', 'Olibanum'],
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
    id: 'lumiere',
    name: 'Lumière',
    collection: 'icon',
    inspiredBy: 'YSL Libre',
    price: 750,
    galleryImages: galleryByCollection.icon,
    placeholderGradient: ['#dbeafe', '#3b6fb8'],
    topNotes: ['Lavender', 'Mandarin Orange', 'Black Currant', 'Petitgrain'],
    heartNotes: ['Jasmine', 'Orange Blossom'],
    baseNotes: ['Madagascar Vanilla', 'Musk', 'Cedar', 'Ambergris'],
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
