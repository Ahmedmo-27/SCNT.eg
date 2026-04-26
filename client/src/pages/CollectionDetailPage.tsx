import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n/I18nContext'
import { StarLoader } from '../components/ui/StarLoader'
import { parseCollectionIdParam } from '../types/catalog'
import { PlaceholderPage } from './PlaceholderPage'
import { FullPageScroller } from '../components/scroll/FullPageScroller'
import { CollectionSplitSection } from '../components/collections/CollectionSplitSection'
import { CollectionProductSplitSection } from '../components/collections/CollectionProductSplitSection'
import { collectionPersonaLine } from '../data/collectionSections'
import { SectionScrollProvider } from '../context/SectionScrollContext'
import { Seo } from '../components/seo/Seo'
import { buildBreadcrumbSchema, buildOrganizationSchema, buildWebsiteSchema } from '../seo/schema'

export function CollectionDetailPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const { collections, products, loading } = useCatalog()
  const collectionId = id ? parseCollectionIdParam(id) : null
  const c = collectionId ? collections.find((x) => x.id === collectionId) : undefined
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)

  useEffect(() => {
    // Dispatch a synthetic scroll event to trigger navbar scrolled state
    // (actual scrolling is disabled on collection pages)
    const event = new Event('scroll', { bubbles: true })
    Object.defineProperty(window, 'scrollY', {
      value: activeSectionIndex > 0 ? 25 : 0,
      writable: true,
      configurable: true,
    })
    window.dispatchEvent(event)
  }, [activeSectionIndex])

  if (loading) {
    return (
      <Layout>
        <StarLoader className="py-32" label={t('col.loading')} />
      </Layout>
    )
  }

  if (!c) {
    return (
      <PlaceholderPage title={t('col.notFound')} subtitle={t('col.notFoundSub')} />
    )
  }

  const line = products.filter((p) => p.collection === c.id)
  const path = `/collections/${c.id}`

  const headlineBody = (() => {
    if (c.id === 'executive')
      return { head: t('col.exec.head'), body: t('col.exec.body') } as const
    if (c.id === 'charmer') return { head: t('col.charm.head'), body: t('col.charm.body') } as const
    if (c.id === 'explorer') return { head: t('col.expl.head'), body: t('col.expl.body') } as const
    return { head: t('col.icon.head'), body: t('col.icon.body') } as const
  })()

  return (
    <Layout collection={c.id} hideFooter>
      <Seo
        title={`${c.name} Fragrance Collection`}
        description={`${c.name} by SCNT.eg. ${c.tagline}. Explore signature perfumes, scent notes, and identity-led fragrance stories in Egypt.`}
        path={path}
        image={c.coverImage || c.mainImage}
        jsonLd={[
          buildOrganizationSchema(),
          buildWebsiteSchema(),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Collections', path: '/collections' },
            { name: c.name, path },
          ]),
        ]}
      />
      <SectionScrollProvider activeSectionIndex={activeSectionIndex}>
        <FullPageScroller
          stepperLabel={c.name}
          sections={[
            {
              id: 'hero',
              ariaLabel: 'Hero',
              node: (
                <CollectionSplitSection
                  kicker={c.code}
                  title={c.name}
                  body={`${collectionPersonaLine(c, t)}\n\n${headlineBody.head}\n${headlineBody.body}`.trim()}
                  accent={c.accent}
                  imageSrc={c.mainImage || c.coverImage}
                  productImageSrc={c.clearBackground_Image}
                  imageAlt=""
                />
              ),
            },
            {
              id: 'story',
              ariaLabel: 'Story',
              node: (
                <CollectionSplitSection
                  kicker={t('col.inWorld')}
                  title={headlineBody.head}
                  body={c.worldIntro}
                  accent={c.accent}
                  imageSrc={c.artwork}
                  imageAlt=""
                  flip
                />
              ),
            },
            ...line.map((p) => ({
              id: `p-${p.id}`,
              ariaLabel: p.name,
              node: (
                <CollectionProductSplitSection
                  product={p}
                  collection={c}
                />
              ),
            })),
          ]}
          onActiveIndexChange={setActiveSectionIndex}
        />
      </SectionScrollProvider>
    </Layout>
  )
}
