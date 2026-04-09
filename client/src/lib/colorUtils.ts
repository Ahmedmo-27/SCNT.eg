/** Blend hex toward black by `ratio` (0–1). */
export function darkenHex(hex: string, ratio: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const blend = (c: number) => Math.round(c * (1 - ratio))
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Beige base with 5% collection accent for glass cards. */
export function tintedBeigeGlass(accent: string): string {
  return `color-mix(in srgb, #ebe4d9 95%, ${accent} 5%)`
}
