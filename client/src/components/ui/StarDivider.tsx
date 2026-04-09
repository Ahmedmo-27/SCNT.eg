import { EightPointStar } from './EightPointStar'

type StarDividerProps = {
  className?: string
}

/** Quiet section rhythm — star as jewel, not decoration. */
export function StarDivider({ className = '' }: StarDividerProps) {
  return (
    <div
      className={`flex items-center gap-5 py-10 ${className}`.trim()}
      role="separator"
      aria-hidden
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-scnt-border to-scnt-border/40" />
      <span className="text-scnt-text/25">
        <EightPointStar size={11} />
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-scnt-border to-scnt-border/40" />
    </div>
  )
}
