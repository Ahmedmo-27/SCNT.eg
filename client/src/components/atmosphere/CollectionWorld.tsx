import { useEffect, useMemo } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import type { CollectionId } from '../../types/catalog'
import { collectionTheme } from '../../data/collectionThemes'
import { EightPointStar } from '../ui/EightPointStar'

const DURATION_SCNT = 0.65

/** Linear 0→max over the first 900px of scroll (matches previous useTransform input range). */
function mapScrollParallax(scrollY: number, maxOffset: number) {
  const t = Math.min(Math.max(scrollY / 900, 0), 1)
  return maxOffset * t
}

type CollectionWorldProps = {
  id: CollectionId
}

/** Full-viewport atmospheric layer — each collection reads as its own world. */
export function CollectionWorld({ id }: CollectionWorldProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {id === 'executive' ? <ExecutiveLayer /> : null}
      {id === 'explorer' ? <ExplorerLayer /> : null}
      {id === 'charmer' ? <CharmerLayer /> : null}
      {id === 'icon' ? <IconLayer /> : null}
    </div>
  )
}

function ExecutiveLayer() {
  const t = collectionTheme.executive
  const stroke = `rgba(122, 143, 163, ${t.gridStrokeOpacity})`
  const bands = 10
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${stroke} 1px, transparent 1px),
            linear-gradient(90deg, ${stroke} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          backgroundPosition: 'center top',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${t.coolMistTop} 0%, ${t.coolMistMid} 42%, ${t.coolMistBottom} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 28%, rgba(255,255,255,0.35) 0%, transparent 62%)',
        }}
      />
      {Array.from({ length: bands }, (_, i) => (
        <motion.div
          key={i}
          className="absolute left-[6%] right-[6%] h-px"
          style={{
            top: `${14 + i * 7.2}%`,
            background: `linear-gradient(90deg, transparent, ${stroke}, transparent)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{
            duration: DURATION_SCNT,
            delay: i * 0.07,
            ease: 'linear',
          }}
        />
      ))}
    </>
  )
}

function ExplorerLayer() {
  const t = collectionTheme.explorer
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const ySlow = useTransform(scrollY, (y) => (reduceMotion ? 0 : mapScrollParallax(y, -42)))
  const yMid = useTransform(scrollY, (y) => (reduceMotion ? 0 : mapScrollParallax(y, -64)))
  const yFast = useTransform(scrollY, (y) => (reduceMotion ? 0 : mapScrollParallax(y, -86)))

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 55% at 50% -5%, ${t.horizon}, transparent 58%)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          background: `linear-gradient(180deg, transparent, ${t.spray})`,
        }}
      />
      <div className="absolute -bottom-6 left-[-8%] w-[220%]">
        <div className="relative h-36 sm:h-44">
          <motion.svg
            className="absolute inset-0 h-full w-full opacity-[0.42]"
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            style={reduceMotion ? undefined : { y: ySlow }}
          >
            <path
              fill={t.wave}
              fillOpacity={0.14}
              d="M0,112 C220,48 380,152 600,80 C820,8 980,124 1200,72 L1200,160 L0,160 Z"
            />
          </motion.svg>
          <motion.svg
            className="absolute inset-0 h-full w-full opacity-[0.5]"
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            style={reduceMotion ? undefined : { y: yMid }}
          >
            <path
              fill={t.wave}
              fillOpacity={0.22}
              d="M0,96 C200,36 400,140 600,72 C800,4 1000,108 1200,64 L1200,160 L0,160 Z"
            />
          </motion.svg>
          <motion.svg
            className="absolute inset-0 h-full w-full opacity-[0.38]"
            viewBox="0 0 1200 180"
            preserveAspectRatio="none"
            style={reduceMotion ? undefined : { y: yFast }}
          >
            <path
              fill="none"
              stroke={t.wave}
              strokeWidth={1.2}
              strokeOpacity={0.35}
              d="M0,88 C240,28 360,138 600,66 C840,-6 960,102 1200,56"
            />
          </motion.svg>
        </div>
      </div>
      <motion.div
        className="absolute left-[15%] top-[20%] h-40 w-40 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)`,
        }}
        animate={{ x: [0, 12, 0], y: [0, -8, 0] }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  )
}

function CharmerLayer() {
  const t = collectionTheme.charmer
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const sx = useSpring(mx, { stiffness: 28, damping: 92 })
  const sy = useSpring(my, { stiffness: 28, damping: 92 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth)
      my.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [mx, my])

  const left = useTransform(sx, (v) => `${v * 100}vw`)
  const top = useTransform(sy, (v) => `${v * 100}vh`)

  return (
    <>
      <motion.div
        className="absolute h-[min(110vh,920px)] w-[min(110vw,920px)] rounded-full blur-3xl"
        style={{
          left,
          top,
          x: '-50%',
          y: '-50%',
          background: `radial-gradient(circle, ${t.bloomFollow}, transparent 58%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 100%, ${t.veil}, transparent 55%)`,
        }}
      />
    </>
  )
}

const ICON_STAR_SEED = [
  { top: '11%', left: '19%', s: 9, d: 3.2, delay: 0.1 },
  { top: '18%', left: '76%', s: 7, d: 4.1, delay: 0.6 },
  { top: '31%', left: '11%', s: 6, d: 2.8, delay: 0.2 },
  { top: '38%', left: '52%', s: 8, d: 3.6, delay: 1.1 },
  { top: '44%', left: '88%', s: 5, d: 4.4, delay: 0.4 },
  { top: '56%', left: '22%', s: 7, d: 3.0, delay: 0.9 },
  { top: '61%', left: '68%', s: 10, d: 3.9, delay: 0.15 },
  { top: '72%', left: '8%', s: 6, d: 4.8, delay: 1.4 },
  { top: '78%', left: '42%', s: 8, d: 2.6, delay: 0.7 },
  { top: '84%', left: '79%', s: 7, d: 3.4, delay: 1.2 },
  { top: '24%', left: '44%', s: 5, d: 4.2, delay: 0.3 },
  { top: '49%', left: '91%', s: 6, d: 3.1, delay: 1.6 },
  { top: '66%', left: '55%', s: 9, d: 4.6, delay: 0.55 },
  { top: '8%', left: '62%', s: 6, d: 3.7, delay: 0.85 },
  { top: '92%', left: '28%', s: 8, d: 2.9, delay: 1.0 },
]

function IconLayer() {
  const t = collectionTheme.icon
  const stars = useMemo(() => ICON_STAR_SEED, [])

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(165deg, rgba(42,38,34,0.04) 0%, transparent 42%, ${t.goldDeep} 100%)`,
        }}
      />
      <motion.div
        className="absolute -top-[20%] left-1/2 h-[55vh] w-[min(100vw,900px)] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${t.gold}, transparent 68%)`,
        }}
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-0 overflow-hidden opacity-[0.09]"
        initial={false}
      >
        <motion.div
          className="absolute -inset-y-8 w-[55%] blur-sm"
          style={{
            background: `linear-gradient(105deg, transparent 30%, ${t.shine} 50%, transparent 70%)`,
          }}
          animate={{ x: ['-30%', '130%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      {stars.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: p.top,
            left: p.left,
            color: t.starAccent,
          }}
          animate={{
            opacity: [0.22, 0.95, 0.22],
          }}
          transition={{
            duration: p.d,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        >
          <EightPointStar size={p.s} />
        </motion.div>
      ))}
    </>
  )
}
