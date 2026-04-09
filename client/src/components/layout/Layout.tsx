import type { ReactNode } from 'react'
import type { CollectionId } from '../../data/collections'
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
}

export function Layout({ children, collection }: LayoutProps) {
  return (
    <CollectionVisualProvider collectionId={collection}>
      <div className="relative min-h-svh">
        <GlobalAtmosphere />
        {collection ? <CollectionWorld id={collection} /> : null}
        {collection ? <CollectionAura id={collection} /> : null}
        <div className="relative z-10 flex min-h-svh flex-col">
          <Header />
          <main className="flex-1 pt-[var(--scnt-header-h,5.5rem)]">{children}</main>
          <Footer />
        </div>
      </div>
    </CollectionVisualProvider>
  )
}
