import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCollectionVisual } from '../../context/CollectionVisualContext'
import { useI18n } from '../../i18n/I18nContext'
import { hexToRgba } from '../../lib/colorUtils'
import { EightPointStar } from '../ui/EightPointStar'

type Layer = 'top' | 'heart' | 'base'

const EASE_SCNT: [number, number, number, number] = [0.22, 1, 0.36, 1]
const DURATION_SCNT = 0.65

type NoteChipProps = {
  note: string
  layerColor: string
  hovered: string | null
  setHovered: (v: string | null) => void
  layer: Layer
}

function NoteChip({
  note,
  layerColor,
  hovered,
  setHovered,
  layer,
}: NoteChipProps) {
  const id = `${layer}:${note}`
  const active = hovered === id
  const soft = hexToRgba(layerColor, 0.1)
  const borderIdle = hexToRgba(layerColor, 0.22)
  const borderActive = hexToRgba(layerColor, 0.42)
  const fillActive = hexToRgba(layerColor, 0.08)
  const glow = hexToRgba(layerColor, 0.28)

  return (
    <motion.li layout>
      <button
        type="button"
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(id)}
        onBlur={() => setHovered(null)}
        className="relative rounded-full border px-3.5 py-2 text-sm text-scnt-text backdrop-blur-[2px] transition-[box-shadow,border-color,background-color] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)]"
        style={{
          borderColor: active ? borderActive : borderIdle,
          backgroundColor: active ? fillActive : soft,
          boxShadow: active ? `0 0 22px -2px ${glow}` : undefined,
        }}
      >
        <motion.span
          className="relative z-[1] inline-block"
          animate={active ? { scale: 1.06 } : { scale: 1 }}
          transition={{ duration: DURATION_SCNT, ease: EASE_SCNT }}
        >
          {note}
        </motion.span>
        <motion.span
          className="pointer-events-none absolute -right-0.5 -top-0.5 text-scnt-text/30"
          initial={false}
          animate={{
            opacity: active ? 1 : 0,
            scale: active ? 1 : 0.5,
            rotate: active ? 0 : -20,
          }}
          transition={{ duration: DURATION_SCNT, ease: EASE_SCNT }}
          aria-hidden
        >
          <EightPointStar size={11} />
        </motion.span>
      </button>
    </motion.li>
  )
}

type BlockProps = {
  layer: Layer
  notes: string[]
  layerColor: string
}

function NoteBlock({ layer, notes, layerColor }: BlockProps) {
  const { t } = useI18n()
  const [hovered, setHovered] = useState<string | null>(null)
  const titleKey =
    layer === 'top' ? 'scent.topTitle' : layer === 'heart' ? 'scent.heartTitle' : 'scent.baseTitle'
  const subKey =
    layer === 'top' ? 'scent.topSub' : layer === 'heart' ? 'scent.heartSub' : 'scent.baseSub'
  const detKey =
    layer === 'top' ? 'scent.topDet' : layer === 'heart' ? 'scent.heartDet' : 'scent.baseDet'

  return (
    <div className="relative border-b border-scnt-border py-6 last:border-b-0">
      <div className="ps-4">
        <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">{t(titleKey)}</p>
        <p className="mt-1 text-[0.7rem] text-scnt-text-muted/85">{t(subKey)}</p>
        <p className="mt-0.5 font-sans text-[0.65rem] tracking-wide text-scnt-text-muted/90">
          {t(detKey)}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {notes.map((n) => (
            <NoteChip
              key={n}
              note={n}
              layer={layer}
              layerColor={layerColor}
              hovered={hovered}
              setHovered={setHovered}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

type Props = {
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
}

export function ScentPyramid({ topNotes, heartNotes, baseNotes }: Props) {
  const { t } = useI18n()
  const { vivid, accent, accentDeep } = useCollectionVisual()

  return (
    <div className="rounded-2xl bg-scnt-bg-elevated/65 p-6 ring-1 ring-scnt-border/90 backdrop-blur-md">
      <p className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
        <EightPointStar size={9} className="opacity-45" />
        {t('scent.pyramidTitle')}
      </p>
      <p className="mb-6 text-xs text-scnt-text-muted">{t('scent.pyramidHint')}</p>
      <div className="relative ps-5">
        <div
          className="pointer-events-none absolute bottom-0 start-0 top-0 w-1 rounded-full opacity-[0.72]"
          style={{
            background: `linear-gradient(180deg, ${vivid} 0%, ${accent} 48%, ${accentDeep} 100%)`,
          }}
          aria-hidden
        />
        <NoteBlock layer="top" notes={topNotes} layerColor={vivid} />
        <NoteBlock layer="heart" notes={heartNotes} layerColor={accent} />
        <NoteBlock layer="base" notes={baseNotes} layerColor={accentDeep} />
      </div>
    </div>
  )
}
