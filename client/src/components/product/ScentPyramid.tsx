import { useState } from 'react'
import { motion } from 'framer-motion'
import { EightPointStar } from '../ui/EightPointStar'

type Layer = 'top' | 'heart' | 'base'

const EASE_SCNT: [number, number, number, number] = [0.22, 1, 0.36, 1]
const DURATION_SCNT = 0.65

/** Cyan (Executive) · Teal (Explorer) · Rose & Amber (Charmer / Icon) on base. */
const layerVisual: Record<
  Layer,
  {
    label: string
    family: string
    subtitle: string
    rail: string
  }
> = {
  top: {
    label: 'Top',
    family: 'Cyan · Executive',
    subtitle: 'First impression — bright, fleeting',
    rail: 'rgba(8, 105, 120, 0.35)',
  },
  heart: {
    label: 'Heart',
    family: 'Teal · Explorer',
    subtitle: 'The story — warm, unfolding',
    rail: 'rgba(15, 118, 110, 0.38)',
  },
  base: {
    label: 'Base',
    family: 'Rose & Amber · Charmer · Icon',
    subtitle: 'What stays — deep, slow',
    rail: 'rgba(120, 85, 45, 0.32)',
  },
}

const chipStyles: Record<
  'cyan' | 'teal' | 'rose' | 'amber',
  { idle: string; active: string; glow: string }
> = {
  cyan: {
    idle: 'border-cyan-900/14 bg-white/[0.04] text-scnt-text ring-1 ring-cyan-950/[0.06]',
    active:
      'border-cyan-800/28 bg-cyan-950/[0.05] text-scnt-text shadow-[0_0_26px_-4px_rgba(34,120,130,0.2)] ring-1 ring-cyan-900/15',
    glow: 'rgba(45, 140, 150, 0.2)',
  },
  teal: {
    idle: 'border-teal-900/14 bg-white/[0.04] text-scnt-text ring-1 ring-teal-950/[0.06]',
    active:
      'border-teal-800/28 bg-teal-950/[0.05] text-scnt-text shadow-[0_0_28px_-4px_rgba(15,118,110,0.22)] ring-1 ring-teal-900/15',
    glow: 'rgba(15, 118, 110, 0.22)',
  },
  rose: {
    idle: 'border-rose-900/16 bg-white/[0.03] text-scnt-text ring-1 ring-rose-950/[0.07]',
    active:
      'border-rose-800/30 bg-rose-950/[0.06] text-scnt-text shadow-[0_0_28px_-4px_rgba(160,70,95,0.2)] ring-1 ring-rose-900/18',
    glow: 'rgba(175, 85, 105, 0.22)',
  },
  amber: {
    idle: 'border-amber-950/16 bg-stone-900/[0.03] text-scnt-text ring-1 ring-amber-950/[0.08]',
    active:
      'border-amber-900/32 bg-amber-950/[0.07] text-scnt-text shadow-[0_0_30px_-4px_rgba(120,85,45,0.26)] ring-1 ring-amber-900/20',
    glow: 'rgba(130, 95, 55, 0.26)',
  },
}

function baseFamily(i: number): 'rose' | 'amber' {
  return i % 2 === 0 ? 'rose' : 'amber'
}

type NoteChipProps = {
  note: string
  family: keyof typeof chipStyles
  hovered: string | null
  setHovered: (v: string | null) => void
  layer: Layer
}

function NoteChip({ note, family, hovered, setHovered, layer }: NoteChipProps) {
  const id = `${layer}:${note}`
  const active = hovered === id
  const st = chipStyles[family]

  return (
    <motion.li layout>
      <button
        type="button"
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(id)}
        onBlur={() => setHovered(null)}
        className={`relative rounded-full border px-3.5 py-2 text-sm backdrop-blur-[2px] transition-[box-shadow,border-color,background-color] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] ${active ? st.active : st.idle}`}
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
        {active ? (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ boxShadow: `0 0 22px 0 ${st.glow}` }}
            transition={{ duration: DURATION_SCNT * 0.85, ease: EASE_SCNT }}
            aria-hidden
          />
        ) : null}
      </button>
    </motion.li>
  )
}

type BlockProps = {
  layer: Layer
  notes: string[]
}

function NoteBlock({ layer, notes }: BlockProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const vis = layerVisual[layer]

  return (
    <div className="relative border-b border-scnt-border py-6 last:border-b-0">
      <div
        className="pointer-events-none absolute -left-1 top-6 h-[calc(100%-3rem)] w-px rounded-full opacity-60"
        style={{ backgroundColor: vis.rail }}
        aria-hidden
      />
      <div className="pl-4">
        <p className="text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
          {vis.label} notes
        </p>
        <p className="mt-0.5 font-sans text-[0.65rem] tracking-wide text-scnt-text-muted/90">
          {vis.family}
        </p>
        <p className="mt-1 text-[0.7rem] text-scnt-text-muted/85">{vis.subtitle}</p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {notes.map((n, i) => (
            <NoteChip
              key={n}
              note={n}
              layer={layer}
              hovered={hovered}
              setHovered={setHovered}
              family={
                layer === 'top'
                  ? 'cyan'
                  : layer === 'heart'
                    ? 'teal'
                    : baseFamily(i)
              }
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
  return (
    <div className="rounded-2xl bg-scnt-bg-elevated/65 p-6 ring-1 ring-scnt-border/90 backdrop-blur-md">
      <p className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-scnt-text-muted">
        <EightPointStar size={9} className="opacity-45" />
        Note pyramid
      </p>
      <p className="mb-6 text-xs text-scnt-text-muted">
        Hover a note — each layer lifts on the house curve.
      </p>
      <NoteBlock layer="top" notes={topNotes} />
      <NoteBlock layer="heart" notes={heartNotes} />
      <NoteBlock layer="base" notes={baseNotes} />
    </div>
  )
}
