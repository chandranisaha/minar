import type { TileKind } from '../engine/types'

const INK = '#2B1A17'

/** Muted band colour per tile type: the board reads by shape and label first, colour second. */
export const TILE_TONE: Record<TileKind, string> = {
  start: '#E8B04A',
  auction: '#D9A520',
  chance: '#C9506F',
  bank: '#2F6F73',
  rent: '#3F7A3A',
  tax: '#B8473A',
  parking: '#3E8FAE',
  chest: '#D9632E',
}

/** Small inked glyph for each tile type (24 x 24 viewBox). */
export function TileIcon({ kind, size = 24 }: { kind: TileKind; size?: number }) {
  const tone = TILE_TONE[kind]
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  switch (kind) {
    case 'start':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill={tone} />
          <path d="M16 12H8m3-3-3 3 3 3" />
        </svg>
      )
    case 'auction':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="10" height="5" rx="1.5" transform="rotate(-35 8.5 7.5)" fill={tone} />
          <path d="m11 11 7 7" strokeWidth="2.4" />
          <path d="M4 20h9" />
        </svg>
      )
    case 'chance':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill={tone} />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1.9-1.1 1.8" stroke="#FFF3D6" strokeWidth="2" />
          <circle cx="12" cy="17" r="1" fill="#FFF3D6" stroke="none" />
        </svg>
      )
    case 'bank':
      return (
        <svg {...common}>
          <path d="M3 9 12 4l9 5H3Z" fill={tone} />
          <path d="M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 19.5h17" />
        </svg>
      )
    case 'rent':
      return (
        <svg {...common}>
          <path d="M4 11 12 4.5 20 11v8.5H4Z" fill={tone} />
          <circle cx="12" cy="14.5" r="2.6" fill="#E8B04A" />
        </svg>
      )
    case 'tax':
      return (
        <svg {...common}>
          <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4Z" fill="#FFF3D6" />
          <path d="M9 8.5h6M9 12h6M9 15.5h3.5" stroke={tone} strokeWidth="2" />
        </svg>
      )
    case 'parking':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="4" fill={tone} />
          <path d="M10 17V7.5h2.8a2.7 2.7 0 0 1 0 5.4H10" stroke="#FFF3D6" strokeWidth="2.2" />
        </svg>
      )
    case 'chest':
      return (
        <svg {...common}>
          <path d="M4 10a8 5 0 0 1 16 0v1H4Z" fill={tone} />
          <rect x="4" y="11" width="16" height="8.5" rx="1" fill={tone} />
          <rect x="10.5" y="10" width="3" height="4" rx=".6" fill="#E8B04A" />
        </svg>
      )
  }
}

/** The player's token: an inked brass pawn. */
export function Pawn() {
  return (
    <svg viewBox="0 0 40 50" width="100%" height="100%" aria-hidden>
      <ellipse cx="20" cy="46" rx="15" ry="3.6" fill="rgba(0,0,0,.25)" />
      <path d="M8 44c0-5 4-7 6-8-2-2-3-5-3-8 0-3 2-5 4-6-2-1.5-3-3.6-3-6a8 8 0 0 1 16 0c0 2.4-1 4.5-3 6 2 1 4 3 4 6 0 3-1 6-3 8 2 1 6 3 6 8Z" fill="#E5457A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M15 12a5 5 0 0 1 5-4" stroke="#FFF3D6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}
