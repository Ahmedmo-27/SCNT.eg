import type { ReactNode } from 'react'
import type { CollectionId } from '../../data/collections'
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
    <div className="relative min-h-svh">
      <GlobalAtmosphere />
      {collection ? <CollectionWorld id={collection} /> : null}
      <div className="relative z-10 flex min-h-svh flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
