import { darkenHex, hexToRgba } from './colorUtils'
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

export function mapApiCollectionToSummary(c: ApiCollection): CollectionSummary {
  const accent = safeHex(c.themeColor, '#2a2622')
  const desc = (c.description ?? '').trim()
  const tag = (c.tagline ?? '').trim()
  const sub = (c.sub_tagline ?? '').trim()
  return {
    id: toCollectionId(c.slug),
    name: c.name,
    code: c.slug.replace(/-/g, ' ').toUpperCase(),
    tagline: tag,
    subTagline: sub,
    heroTagline: tag,
    worldIntro: desc,
    accent,
    accentSoft: hexToRgba(accent, 0.2),
    mood: tag,
  }
}

export function mapApiProductToSummary(p: ApiProduct): ProductSummary {
  const pop = p.collection
  const slug = pop?.slug ?? ''
  const cid = toCollectionId(slug)
  const accent = safeHex(pop?.themeColor ?? '', '#8a9caf')
  const desc = (p.description ?? '').trim()
  const parts = desc.split(/(?<=[.!?])\s+/).filter(Boolean)
  const vibeSentence = parts[0] ?? (desc.length > 0 ? desc.slice(0, 140) : taglineFallback(pop))
  const lifestyleLine = parts[1] ?? vibeSentence

  return {
    apiId: p._id,
    id: p.slug,
    name: p.name,
    collection: cid,
    inspiredBy: p.inspired_from,
    gender: p.gender === 'female' ? 'female' : 'male',
    price: p.price,
    placeholderGradient: placeholderPairFromAccent(accent),
    topNotes: p.topNotes ?? [],
    heartNotes: p.heartNotes ?? [],
    baseNotes: p.baseNotes ?? [],
    emotionalStory: desc || vibeSentence,
    vibeSentence,
    lifestyleLine,
    format: 'Eau de Parfum',
    volume: p.size || '100 ml',
    concentrationHint: 'High concentration · Exceptional longevity',
    galleryImages: galleryTuple(p.images ?? []),
    scentMood: scentMoodForCollection(cid),
  }
}

function taglineFallback(pop: ApiCollection | undefined): string {
  const t = (pop?.tagline ?? '').trim()
  return t || 'A signature from the house.'
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
