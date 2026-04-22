import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n/I18nContext'
import { StarLoader } from '../components/ui/StarLoader'
import { FullPageScroller } from '../components/scroll/FullPageScroller'
import { CollectionSplitSection } from '../components/collections/CollectionSplitSection'
import { getCollectionSections } from '../data/collectionSections'
import { SectionScrollProvider } from '../context/SectionScrollContext'

export function CollectionsPage() {
  const { t } = useI18n()
  const { collections, loading } = useCatalog()
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

  return (
    <Layout hideFooter>
      {loading ? (
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <StarLoader className="py-20" label={t('collections.loading')} />
        </div>
      ) : (
        <SectionScrollProvider activeSectionIndex={activeSectionIndex}>
          <FullPageScroller
            stepperLabel={t('collections.title')}
            sections={collections.map((c, idx) => {
              const [hero] = getCollectionSections(c, t)
              const intro = idx === 0 ? `${t('collections.sub')}\n\n` : ''
              const kicker = idx === 0 ? `${t('collections.kicker')} · ${hero?.kicker ?? c.code}` : hero?.kicker
              return {
                id: c.id,
                ariaLabel: c.name,
                node: (
                  <CollectionSplitSection
                    kicker={kicker}
                    title={hero?.title ?? c.name}
                    body={intro + (hero?.body ?? '')}
                    ctaLabel={hero?.ctaLabel}
                    ctaTo={hero?.ctaTo}
                    accent={c.accent}
                    imageSrc={hero?.imageSrc}
                    productImageSrc={hero?.productImageSrc}
                    imageAlt=""
                    flip={idx % 2 === 1}
                  />
                ),
              }
            })}
            onActiveIndexChange={setActiveSectionIndex}
          />
        </SectionScrollProvider>
      )}
    </Layout>
  )
}
