import { motion } from 'framer-motion'
import type { CollectionId } from '../../data/collections'
import { getCollectionById } from '../../data/collections'
import { hexToRgba } from '../../lib/colorUtils'

const EASE_SCNT: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Radial center per line — shifts when navigating so the aura visibly travels. */
const AURA_CENTER: Record<CollectionId, { left: string; top: string }> = {
  executive: { left: '12%', top: '18%' },
  explorer: { left: '88%', top: '72%' },
  charmer: { left: '42%', top: '78%' },
  icon: { left: '58%', top: '24%' },
}

type Props = {
  id: CollectionId
}

/**
 * Soft collection-colored glow behind content — large radial, accent at ~6% opacity.
 */
export function CollectionAura({ id }: Props) {
  const col = getCollectionById(id)
  const accent = col?.accent ?? '#2a2622'
  const pos = AURA_CENTER[id]
  const core = hexToRgba(accent, 0.065)
  const mid = hexToRgba(accent, 0.035)

  return (
    <motion.div
      className="pointer-events-none fixed z-[2] h-[50vw] w-[50vw] max-h-[min(50vw,720px)] max-w-[min(50vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
      aria-hidden
      initial={false}
      animate={{ left: pos.left, top: pos.top }}
      transition={{ duration: 0.65, ease: EASE_SCNT }}
    >
      <motion.div
        key={id}
        className="h-full w-full rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, ease: EASE_SCNT }}
        style={{
          background: `radial-gradient(circle closest-side, ${core} 0%, ${mid} 42%, transparent 72%)`,
        }}
      />
    </motion.div>
  )
}
