import type { RunState } from './state'
import { hashSeed, mulberry32, shuffle } from './rng'

/** Small reward for a correct bonus answer. */
export const BONUS_CASH = 500
export const BONUS_COUNT = 8

/** The bonus question of the quarter that just closed (none in quarter 1, none once answered). Option 0 is always the right answer in the content. */
export function bonusFor(run: RunState): { n: number; order: number[] } | null {
  if (run.turn < 2 || run.phase !== 'desk') return null
  if (run.bonus?.[run.turn] !== undefined) return null
  const n = (hashSeed(run.seed) + run.turn) % BONUS_COUNT
  return { n, order: shuffle(mulberry32(hashSeed(`${run.seed}:bonus:${run.turn}`)), [0, 1, 2]) }
}
