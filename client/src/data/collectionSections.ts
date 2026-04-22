import type { CollectionSummary } from '../types/catalog'

export type TFn = (key: string, vars?: Record<string, string | number>) => string

export type CollectionSectionContent = {
  id: string
  ariaLabel?: string
  kicker?: string
  title: string
  body?: string
  ctaLabel?: string
  ctaTo?: string
  accent?: string
  imageSrc?: string
  productImageSrc?: string
  imageAlt?: string
  flip?: boolean
}

export function collectionPersonaLine(c: CollectionSummary, t: TFn): string {
  return t(`col.persona.${c.id}`)
}

export function collectionHeadlineCopy(c: CollectionSummary, t: TFn): { head: string; body: string } {
  if (c.id === 'executive') return { head: t('col.exec.head'), body: t('col.exec.body') }
  if (c.id === 'charmer') return { head: t('col.charm.head'), body: t('col.charm.body') }
  if (c.id === 'explorer') return { head: t('col.expl.head'), body: t('col.expl.body') }
  return { head: t('col.icon.head'), body: t('col.icon.body') }
}

export function getCollectionSections(c: CollectionSummary, t: TFn): CollectionSectionContent[] {
  const persona = collectionPersonaLine(c, t)
  const headline = collectionHeadlineCopy(c, t)

  return [
    {
      id: '01',
      ariaLabel: 'Collection hero',
      kicker: c.code,
      title: c.name,
      body: `${persona}\n\n${headline.head}\n${headline.body}`.trim(),
      ctaLabel: t('collections.enter'),
      ctaTo: `/collections/${c.id}`,
      accent: c.accent,
      imageSrc: c.coverImage || '',
      productImageSrc: c.clearBackground_Image || '',
      imageAlt: '',
    },
    {
      id: '02',
      ariaLabel: 'Collection story',
      kicker: t('col.inWorld'),
      title: headline.head,
      body: c.worldIntro,
      accent: c.accent,
      imageSrc: '',
      imageAlt: '',
      flip: true,
    },
  ]
}

