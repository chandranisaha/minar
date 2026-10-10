import type { TileKind } from './types'
import { int, streamFor } from './rng'

/** The 16-tile ring, clockwise from Start (spec "The board"). */
export const BOARD: TileKind[] = [
  'start', 'auction', 'chance', 'auction', 'bank',
  'rent', 'chance', 'auction',
  'chest', 'chance', 'tax', 'bank', 'auction',
  'rent', 'parking', 'chance',
]

export const TURNS = 12
export const YEAR_ENDS = [4, 8, 12]

/** Seeded d6 rolls and the resulting token positions. positions[0] is Start. */
export function rollPath(seed: string): { rolls: number[]; positions: number[] } {
  const rng = streamFor(seed, 'dice')
  const rolls: number[] = []
  const positions = [0]
  for (let t = 1; t <= TURNS; t++) {
    const r = int(rng, 1, 6)
    rolls.push(r)
    positions.push((positions[t - 1] + r) % BOARD.length)
  }
  return { rolls, positions }
}
