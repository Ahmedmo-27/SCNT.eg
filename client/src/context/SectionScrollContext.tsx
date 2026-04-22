import { createContext, useContext } from 'react'

type SectionScrollContextType = {
  /** Index of the currently visible section (0-based). */
  activeSectionIndex: number
}

const SectionScrollContext = createContext<SectionScrollContextType | undefined>(undefined)

export function SectionScrollProvider({
  children,
  activeSectionIndex,
}: {
  children: React.ReactNode
  activeSectionIndex: number
}) {
  return (
    <SectionScrollContext.Provider value={{ activeSectionIndex }}>
      {children}
    </SectionScrollContext.Provider>
  )
}

export function useSectionScroll() {
  const ctx = useContext(SectionScrollContext)
  return ctx ?? { activeSectionIndex: 0 }
}
