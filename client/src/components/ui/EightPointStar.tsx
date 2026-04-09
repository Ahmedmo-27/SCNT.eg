type EightPointStarProps = {
  className?: string
  size?: number
  title?: string
}

function octagramPath(outer: number, inner: number): string {
  const cx = 50
  const cy = 50
  const n = 8
  const step = Math.PI / n
  let d = ''
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = i * step - Math.PI / 2
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(3)},${y.toFixed(3)}`
  }
  return `${d}Z`
}

const PATH = octagramPath(44, 17)

export function EightPointStar({
  className,
  size = 14,
  title,
}: EightPointStarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d={PATH} />
    </svg>
  )
}
