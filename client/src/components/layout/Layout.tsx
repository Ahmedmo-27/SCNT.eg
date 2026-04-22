import type { ReactNode } from 'react'
import type { CollectionId } from '../../types/catalog'
import { CollectionVisualProvider } from '../../context/CollectionVisualContext'
import { CollectionAura } from '../atmosphere/CollectionAura'
import { CollectionWorld } from '../atmosphere/CollectionWorld'
import { GlobalAtmosphere } from '../atmosphere/GlobalAtmosphere'
import { Footer } from './Footer'
import { Header } from './Header'

type LayoutProps = {
  children: ReactNode
  /** When set, adds a collection-specific immersive backdrop behind content. */
  collection?: CollectionId | null
  /** Hides the shared footer for fullscreen section-based pages. */
  hideFooter?: boolean
}

export function Layout({ children, collection, hideFooter = false }: LayoutProps) {
  return (
    <CollectionVisualProvider collectionId={collection}>
      <div className="relative min-h-svh">
        <GlobalAtmosphere />
        {collection ? <CollectionWorld id={collection} /> : null}
        {collection ? <CollectionAura id={collection} /> : null}
        <div className="relative z-10 flex min-h-svh flex-col">
          <Header />
          <main className="min-h-0 flex-1 pt-[var(--scnt-header-h,5.5rem)]">{children}</main>
          {hideFooter ? null : <Footer />}
        </div>
      </div>
    </CollectionVisualProvider>
  )
}
