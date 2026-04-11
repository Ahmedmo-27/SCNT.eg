/** Arabic copy stored on Mongo `translations.ar` for collections */
export type ApiCollectionTranslationsAr = {
  name?: string
  tagline?: string
  sub_tagline?: string
  description?: string
}

/** Aligns with Mongo-backed `Collection` documents from the API */
export type ApiCollection = {
  _id: string
  name: string
  slug: string
  themeColor: string
  tagline: string
  sub_tagline?: string
  description: string
  translations?: { ar?: ApiCollectionTranslationsAr }
}

/** Arabic copy stored on Mongo `translations.ar` for products */
export type ApiProductTranslationsAr = {
  name?: string
  inspired_from?: string
  description?: string
  size?: string
  topNotes?: string[]
  heartNotes?: string[]
  baseNotes?: string[]
}

/** Populated `Product.collection` from the API */
export type ApiProduct = {
  _id: string
  name: string
  slug: string
  inspired_from: string
  gender?: 'male' | 'female'
  collection: ApiCollection
  price: number
  size: string
  images: string[]
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  description: string
  stock?: number
  translations?: { ar?: ApiProductTranslationsAr }
}

export type ApiProductListResponse = {
  items: ApiProduct[]
  pagination: { total: number; page: number; pages: number; limit: number }
}

export type CollectionId = 'executive' | 'explorer' | 'charmer' | 'icon'

const SLUGS: CollectionId[] = ['executive', 'explorer', 'charmer', 'icon']

export function isCollectionId(id: string): id is CollectionId {
  const s = id.trim().toLowerCase()
  return SLUGS.includes(s as CollectionId)
}

/** Canonical slug for routes and ordering (always lowercase). */
export function parseCollectionIdParam(id: string): CollectionId | null {
  const s = id.trim().toLowerCase()
  return SLUGS.includes(s as CollectionId) ? (s as CollectionId) : null
}

/** Rich collection row used by marketing UI — derived from API + small copy tweaks */
export type CollectionSummary = {
  id: CollectionId
  name: string
  code: string
  tagline: string
  subTagline: string
  heroTagline: string
  worldIntro: string
  accent: string
  accentSoft: string
  mood: string
}

export type ScentMood =
  | 'crisp-tailored'
  | 'coastal-airy'
  | 'velvet-nocturne'
  | 'golden-heritage'

export type ProductSummary = {
  apiId: string
  id: string
  name: string
  collection: CollectionId
  inspiredBy: string
  gender: 'male' | 'female'
  price: number
  placeholderGradient: [string, string]
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  emotionalStory: string
  vibeSentence: string
  lifestyleLine: string
  format: string
  volume: string
  concentrationHint: string
  galleryImages: readonly [string, string, string]
  scentMood: ScentMood
}
