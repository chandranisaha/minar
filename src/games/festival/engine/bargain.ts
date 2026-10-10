import { draw } from '../../../lib/rng'
import { stall } from './content'
import { floorFor, priceFor, round10 } from './prices'
import type { Day, GameEvent, ItemId, OfferResult, StallId } from './types'

export type OfferButton = 'low' | 'fair' | 'close' | 'pay'
export const OFFER_SHARE: Record<OfferButton, number> = { low: 0.6, fair: 0.75, close: 0.9, pay: 1 }

export const offerFor = (sticker: number, b: OfferButton) => (b === 'pay' ? sticker : round10(sticker * OFFER_SHARE[b]))

export interface StallState {
  stall: StallId
  item: ItemId
  day: Day
  sticker: number
  floor: number
  patience: number
}

export interface Response {
  result: OfferResult
  counter?: number
  patience: number
}

/** The five bargaining rules. Pure: same state + offer, same answer. */
export function respond(st: StallState, offer: number): Response {
  if (offer >= st.floor) return { result: 'accept', patience: st.patience }
  if (offer >= 0.8 * st.floor) {
    const patience = st.patience - 1
    if (patience <= 0) return { result: 'closed', patience: 0 }
    return { result: 'counter', counter: round10(Math.max(st.floor, (st.sticker + offer) / 2)), patience }
  }
  const patience = st.patience - 2
  if (patience <= 0) return { result: 'closed', patience: 0 }
  return { result: 'insult', counter: round10(st.sticker * 0.95), patience }
}

/** Patience left at a stall today, read from the log (patience is shared across items and resets daily). */
export function patienceLeft(log: GameEvent[], s: StallId, day: Day): number {
  let p = stall(s).patience
  for (const e of log) {
    if (e.kind !== 'offer' || e.stall !== s || e.day !== day) continue
    if (e.result === 'counter') p -= 1
    else if (e.result === 'insult') p -= 2
    else if (e.result === 'closed') p = 0
  }
  return Math.max(0, p)
}

export const isClosed = (log: GameEvent[], s: StallId, day: Day) =>
  stall(s).bargain && log.some((e) => e.kind === 'offer' && e.stall === s && e.day === day && e.result === 'closed')

export function stallState(log: GameEvent[], s: StallId, i: ItemId, day: Day): StallState {
  return { stall: s, item: i, day, sticker: priceFor(i, s, day)!, floor: floorFor(i, s, day)!, patience: patienceLeft(log, s, day) }
}

/** Aunty's seeded call-back on walk-away. Returns the price, or undefined if she lets you go. */
export function callbackFor(seed: string, log: GameEvent[], s: StallId, i: ItemId, day: Day): number | undefined {
  const def = stall(s)
  if (!def.callback) return undefined
  const n = log.filter((e) => e.kind === 'walkaway' && e.stall === s && e.day === day).length
  if (draw(seed, `callback:${s}:${i}:${day}:${n}`) >= def.callback) return undefined
  return round10(floorFor(i, s, day)! * 1.05)
}
