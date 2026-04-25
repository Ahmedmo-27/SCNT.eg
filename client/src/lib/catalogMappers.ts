import { darkenHex, hexToRgba } from './colorUtils'
import type { Locale } from '../i18n/types'
import {
  parseCollectionIdParam,
  type ApiCollection,
  type ApiProduct,
  type CollectionId,
  type CollectionSummary,
  type ProductSummary,
  type ScentMood,
} from '../types/catalog'

function safeHex(hex: string, fallback: string): string {
  const h = hex?.trim()
  if (h && /^#[0-9A-Fa-f]{6}$/.test(h)) return h
  return fallback
}

function toCollectionId(slug: string): CollectionId {
  const parsed = parseCollectionIdParam(slug)
  return parsed ?? 'executive'
}

function scentMoodForCollection(id: CollectionId): ScentMood {
  if (id === 'explorer') return 'coastal-airy'
  if (id === 'charmer') return 'velvet-nocturne'
  if (id === 'icon') return 'golden-heritage'
  return 'crisp-tailored'
}

function placeholderPairFromAccent(accent: string): [string, string] {
  const a = safeHex(accent, '#8a9caf')
  return [hexToRgba(a, 0.12), darkenHex(a, 0.12)]
}

export function galleryTuple(images: string[]): readonly [string, string, string] {
  const a = images[0] ?? ''
  const b = images[1] ?? a
  const c = images[2] ?? a
  return [a, b, c] as const
}

function collectionAr(c: ApiCollection | undefined, locale: Locale) {
  if (locale !== 'ar' || !c?.translations?.ar) return undefined
  return c.translations.ar
}

function productAr(p: ApiProduct, locale: Locale) {
  if (locale !== 'ar' || !p.translations?.ar) return undefined
  return p.translations.ar
}

/** Display name for search / grouping when API returns `translations.ar`. */
export function localizedCollectionName(c: ApiCollection | undefined, locale: Locale): string {
  if (!c) return ''
  const ar = collectionAr(c, locale)
  const n = ar?.name?.trim()
  if (n) return n
  return c.name ?? ''
}

export function localizedProductName(p: ApiProduct, locale: Locale): string {
  const ar = productAr(p, locale)
  const n = ar?.name?.trim()
  if (n) return n
  return p.name
}

function localizedCollectionTagline(c: ApiCollection | undefined, locale: Locale): string {
  if (!c) return ''
  const ar = collectionAr(c, locale)
  const t = (ar?.tagline?.trim() ? ar.tagline : (c.tagline ?? '')).trim()
  return t
}

function taglineFallback(pop: ApiCollection | undefined, locale: Locale): string {
  const t = localizedCollectionTagline(pop, locale)
  return t || 'A signature from the house.'
}

/** Filenames in `client/public/collections/covers/` (URL-encoded when built into paths). */
const DEFAULT_COLLECTION_COVER_FILE: Partial<Record<CollectionId, string>> = {
  executive: 'The Executive.jpg',
  explorer: 'The Explorer.png',
  charmer: 'The Charmer.png',
  icon: 'The Icon.png',
}

function resolveCollectionCoverImage(c: ApiCollection): string {
  const fromApi = c.coverImage?.trim()
  if (fromApi) return fromApi
  const slug = (c.slug ?? '').trim().toLowerCase()
  const parsed = parseCollectionIdParam(slug)
  const file = parsed ? DEFAULT_COLLECTION_COVER_FILE[parsed] : undefined
  return file ? `/collections/covers/${encodeURIComponent(file)}` : ''
}

export function mapApiCollectionToSummary(c: ApiCollection, locale: Locale = 'en'): CollectionSummary {
  const accent = safeHex(c.themeColor, '#2a2622')
  const ar = collectionAr(c, locale)
  const desc = (ar?.description?.trim() ? ar.description : (c.description ?? '')).trim()
  const tag = (ar?.tagline?.trim() ? ar.tagline : (c.tagline ?? '')).trim()
  const sub = (ar?.sub_tagline?.trim() ? ar.sub_tagline : (c.sub_tagline ?? '')).trim()
  const name = (ar?.name?.trim() ? ar.name : c.name).trim() || c.name
  return {
    id: toCollectionId(c.slug),
    name,
    code: c.slug.replace(/-/g, ' ').toUpperCase(),
    coverImage: resolveCollectionCoverImage(c),
    mainImage: c.mainImage?.trim() || '',
    artwork: c.artwork?.trim() || '',
    clearBackground_Image: c.clearBackground_Image?.trim() || '',
    tagline: tag,
    subTagline: sub,
    heroTagline: tag,
    worldIntro: desc,
    accent,
    accentSoft: hexToRgba(accent, 0.2),
    mood: tag,
  }
}

export function mapApiProductToSummary(p: ApiProduct, locale: Locale = 'en'): ProductSummary {
  const pop = p.collection
  const slug = pop?.slug ?? ''
  const cid = toCollectionId(slug)
  const accent = safeHex(pop?.themeColor ?? '', '#8a9caf')
  const ar = productAr(p, locale)
  const desc = (ar?.description?.trim() ? ar.description : (p.description ?? '')).trim()
  const parts = desc.split(/(?<=[.!?])\s+/).filter(Boolean)
  const vibeSentence = parts[0] ?? (desc.length > 0 ? desc.slice(0, 140) : taglineFallback(pop, locale))
  const lifestyleLine = parts[1] ?? vibeSentence
  const topNotes = ar?.topNotes?.length ? ar.topNotes : (p.topNotes ?? [])
  const heartNotes = ar?.heartNotes?.length ? ar.heartNotes : (p.heartNotes ?? [])
  const baseNotes = ar?.baseNotes?.length ? ar.baseNotes : (p.baseNotes ?? [])
  const name = (ar?.name?.trim() ? ar.name : p.name).trim() || p.name
  const inspiredBy = (ar?.inspired_from?.trim() ? ar.inspired_from : p.inspired_from).trim() || p.inspired_from
  const volume = (ar?.size?.trim() ? ar.size : p.size || '100 ml').trim() || '100 ml'
  const collectionCoverImage = pop?.coverImage?.trim() || ''
  const collectionClearBackgroundImage = pop?.clearBackground_Image?.trim() || ''
  const coverImage = p.coverImage?.trim() || collectionCoverImage
  const clearBackgroundImage = p.clearBackground_Image?.trim() || collectionClearBackgroundImage

  return {
    apiId: p._id,
    id: p.slug,
    name,
    collection: cid,
    inspiredBy,
    gender: p.gender === 'female' ? 'female' : 'male',
    price: p.price,
    placeholderGradient: placeholderPairFromAccent(accent),
    topNotes,
    heartNotes,
    baseNotes,
    emotionalStory: desc || vibeSentence,
    vibeSentence,
    lifestyleLine,
    format: 'Eau de Parfum',
    volume,
    concentrationHint: 'High concentration · Exceptional longevity',
    galleryImages: galleryTuple(p.images ?? []),
    coverImage: coverImage || undefined,
    clearBackground_Image: clearBackgroundImage || undefined,
    scentMood: scentMoodForCollection(cid),
  }
}

export function getRelatedProducts(
  all: ProductSummary[],
  productId: string,
  limit = 3,
): ProductSummary[] {
  const p = all.find((x) => x.id === productId)
  if (!p) return []
  const others = all.filter((x) => x.id !== productId)
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
  push(others.filter((x) => x.gender === p.gender && x.scentMood === p.scentMood && x.collection === p.collection))
  push(others.filter((x) => x.gender === p.gender && x.scentMood === p.scentMood))
  push(others.filter((x) => x.gender === p.gender && x.collection === p.collection))
  push(others.filter((x) => x.gender === p.gender))
  push(others.filter((x) => x.scentMood === p.scentMood && x.collection === p.collection))
  push(others.filter((x) => x.scentMood === p.scentMood))
  push(others.filter((x) => x.collection === p.collection))
  push(others)
  return out.slice(0, limit)
}
