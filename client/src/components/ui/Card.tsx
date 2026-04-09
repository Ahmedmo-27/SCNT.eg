import { motion } from 'framer-motion'
import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
> & {
  children: ReactNode
  asMotion?: boolean
}

export function Card({
  children,
  className = '',
  asMotion = true,
  ...props
}: CardProps) {
  const cls = [
    'rounded-2xl bg-scnt-bg-elevated/70 p-6 shadow-[0_24px_60px_-28px_var(--color-scnt-shadow)] ring-1 ring-scnt-border backdrop-blur-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (asMotion) {
    return (
      <motion.div
        className={cls}
        initial={false}
        whileHover={{
          y: -4,
          boxShadow: '0 28px 70px -24px rgba(42, 38, 34, 0.12)',
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={cls} {...props}>
      {children}
    </div>
  )
}
