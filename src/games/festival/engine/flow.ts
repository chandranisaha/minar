import { draw } from '../../../lib/rng'
import { RULES } from './content'
import { priceFor } from './prices'
import { replay } from './state'
import type { Day, GameEvent, GameState } from './types'

/** Seeded draws (and nothing else is random): Aunty's call-back (bargain.ts), ring toss, Sunny's repayment. */
export const ringTossWin = (seed: string, day: Day, n: number) => draw(seed, `ringtoss:${day}:${n}`) < RULES.ringToss.winChance
export const sunnyRepays = (seed: string) => draw(seed, 'sunny-repay') < RULES.sunnyRepayChance

/** Walking home the night before leaves you tired: only 3 stall visits that afternoon. */
export function visitsLeft(log: GameEvent[], day: Day): number {
  const s = replay(log)
  const tired = day > 1 && s.walked.includes((day - 1) as Day)
  if (!tired) return Infinity
  return Math.max(0, RULES.tiredVisits - log.filter((e) => e.kind === 'visit' && e.day === day).length)
}
export const isTired = (s: GameState, day: Day) => day > 1 && s.walked.includes((day - 1) as Day)

/** Automatic events at the start of a morning (before the planner). */
export function morningEvents(log: GameEvent[], day: Day): GameEvent[] {
  if (day !== 3) return []
  const s = replay(log)
  const out: GameEvent[] = []
  if (s.ayeshaCovered && !s.ayeshaRepaid) out.push({ kind: 'repay', day: 3, who: 'ayesha', amount: RULES.ayeshaFare })
  if (s.owned.decor?.quality === 'low') out.push({ kind: 'surprise', day: 3, id: 'S4', choice: 'none', cost: 0 })
  return out
}

/** S1: a Sasta outfit bought on day 1 or 2 tears on day-3 morning. The player picks rebuy or old clothes. */
export function needsS1(s: GameState): boolean {
  const o = s.owned.outfit
  return !!o && o.quality === 'low' && !o.torn && o.day < 3 && s.s1 == null
}
export const s1RebuyPrice = () => priceFor('outfit', 'daamfix', 3)!

/** Festival morning: a day-3 Sasta outfit tears (no rebuy), Sunny's loan resolves, then the run ends. */
export function festivalMorningEvents(seed: string, log: GameEvent[]): GameEvent[] {
  const s = replay(log)
  const out: GameEvent[] = []
  const o = s.owned.outfit
  if (o && o.quality === 'low' && !o.torn && o.day === 3) out.push({ kind: 'surprise', day: 3, id: 'S1', choice: 'festival', cost: 0 })
  if (s.sunnyLent > 0 && sunnyRepays(seed)) out.push({ kind: 'repay', day: 4, who: 'sunny', amount: s.sunnyLent })
  out.push({ kind: 'end' })
  return out
}
