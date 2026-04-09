import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useCollectionVisual } from '../../context/CollectionVisualContext'
import { hexToRgba } from '../../lib/colorUtils'

const MotionLink = motion.create(Link)

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
> & {
  variant?: 'primary' | 'ghost' | 'outline'
  children: ReactNode
  /** When set, renders a React Router link styled as a button (no nested &lt;button&gt;). */
  to?: string
}

const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-8 py-3 text-sm font-medium tracking-wide transition-colors duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] disabled:pointer-events-none disabled:opacity-45'

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-scnt-text text-scnt-bg hover:bg-scnt-text/90 shadow-[0_14px_44px_-14px_rgba(42,38,34,0.4)]',
  ghost:
    'bg-transparent text-scnt-text hover:bg-scnt-text/[0.04]',
  outline:
    'border border-scnt-border bg-scnt-bg-elevated/50 text-scnt-text hover:bg-scnt-bg-elevated',
}

const motionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
}

function vividSweepCss(vivid: string): string {
  if (vivid.startsWith('rgba') || vivid.startsWith('rgb(')) {
    return `linear-gradient(100deg, transparent 8%, ${vivid} 50%, transparent 92%)`
  }
  return `linear-gradient(100deg, transparent 6%, ${hexToRgba(vivid, 0.72)} 48%, ${hexToRgba(vivid, 0.38)} 52%, transparent 94%)`
}

function LightSweep({ active }: { active: boolean }) {
  const { vivid } = useCollectionVisual()
  if (!active) return null
  return (
    <span
      className="pointer-events-none absolute inset-0 z-0 translate-x-[-130%] skew-x-[-14deg] opacity-0 transition-[transform,opacity] duration-[var(--duration-scnt)] ease-[var(--ease-scnt)] group-hover:translate-x-[130%] group-hover:opacity-100"
      style={{ background: vividSweepCss(vivid) }}
      aria-hidden
    />
  )
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  to,
  ...props
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`.trim()
  const sweep = variant === 'primary' || variant === 'outline'

  if (to) {
    return (
      <MotionLink to={to} className={cls} {...motionProps}>
        <LightSweep active={sweep} />
        <span className="relative z-[1]">{children}</span>
      </MotionLink>
    )
  }

  return (
    <motion.button type={type} className={cls} {...motionProps} {...props}>
      <LightSweep active={sweep} />
      <span className="relative z-[1]">{children}</span>
    </motion.button>
  )
}
