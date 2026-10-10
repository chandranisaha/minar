import type { PillarId } from '../content/data'

/** World is 1000 x 1400 "world units". Everything (art, hotspots, collision) shares these coords. */
export const W = 1000
export const H = 1400
export const T = 25
export const COLS = W / T
export const ROWS = H / T

export interface Rect { x: number; y: number; w: number; h: number }

export const SHOP_LAYOUT: Record<PillarId, { x: number; y: number; w: number; h: number; base: number; door: { x: number; y: number }; foot: Rect }> = {
  plan: { x: 70, y: 470, w: 240, h: 250, base: 720, door: { x: 190, y: 758 }, foot: { x: 78, y: 585, w: 224, h: 135 } },
  save: { x: 690, y: 470, w: 240, h: 250, base: 720, door: { x: 810, y: 758 }, foot: { x: 698, y: 585, w: 224, h: 135 } },
  invest: { x: 70, y: 830, w: 240, h: 250, base: 1080, door: { x: 190, y: 1118 }, foot: { x: 78, y: 880, w: 224, h: 200 } },
  safe: { x: 690, y: 830, w: 240, h: 250, base: 1080, door: { x: 810, y: 1118 }, foot: { x: 698, y: 880, w: 224, h: 200 } },
}

export const CHARMINAR = { x: 300, y: 240, w: 400, h: 520, base: 760, foot: { x: 330, y: 585, w: 340, h: 175 } as Rect }
export const START = { x: 500, y: 890 }
export const DOOR_RADIUS = 52

const BLOCKS: Rect[] = [
  ...Object.values(SHOP_LAYOUT).map((s) => s.foot),
  CHARMINAR.foot,
  { x: 780, y: 1165, w: 150, h: 130 }, // flower cart
  { x: 90, y: 786, w: 44, h: 32 }, // left lamp post
  { x: 866, y: 786, w: 44, h: 32 }, // right lamp post
  { x: 580, y: 1212, w: 60, h: 30 }, // water pot
  { x: 0, y: 0, w: W, h: 590 }, // north: back row of buildings
  { x: 0, y: 1285, w: W, h: 115 }, // south kerb
  { x: 0, y: 0, w: 72, h: H }, // west wall
  { x: 928, y: 0, w: 72, h: H }, // east wall
]

export const grid: number[][] = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => {
    const cx = c * T + T / 2
    const cy = r * T + T / 2
    return BLOCKS.some((b) => cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h) ? 1 : 0
  }),
)

export const cellOf = (x: number, y: number) => ({ c: Math.max(0, Math.min(COLS - 1, Math.floor(x / T))), r: Math.max(0, Math.min(ROWS - 1, Math.floor(y / T))) })
export const walkable = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return false
  const { c, r } = cellOf(x, y)
  return grid[r][c] === 0
}
/** feet-radius test used for keyboard movement */
export const canStand = (x: number, y: number) => walkable(x, y) && walkable(x - 10, y) && walkable(x + 10, y) && walkable(x, y - 6)

/** nearest walkable cell centre to a world point (BFS over cells) */
export function nearestWalkable(x: number, y: number) {
  const s = cellOf(x, y)
  if (grid[s.r][s.c] === 0) return { c: s.c, r: s.r }
  const seen = new Set<number>([s.r * COLS + s.c])
  const q = [s]
  while (q.length) {
    const cur = q.shift()!
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = cur.c + dc, r = cur.r + dr
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS || seen.has(r * COLS + c)) continue
      seen.add(r * COLS + c)
      if (grid[r][c] === 0) return { c, r }
      q.push({ c, r })
    }
  }
  return s
}
