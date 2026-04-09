import { motion } from 'framer-motion'
import { EightPointStar } from './EightPointStar'

type StarLoaderProps = {
  className?: string
  label?: string
}

export function StarLoader({
  className = '',
  label = 'Loading',
}: StarLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center gap-4 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <motion.div
          animate={{ rotate: 360, opacity: [0.5, 0.95, 0.5] }}
          transition={{
            rotate: { duration: 5.2, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="text-scnt-text-muted"
        >
          <EightPointStar size={28} />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute text-scnt-text/[0.18]"
          animate={{
            scale: [0.85, 1.08, 0.85],
            rotate: [0, -22, 0],
            opacity: [0.2, 0.45, 0.2],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden
        >
          <EightPointStar size={14} />
        </motion.div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
