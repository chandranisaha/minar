import { RULES, item, stall } from './content'
import type { Day, ItemId, StallId } from './types'

export const round10 = (x: number) => Math.round(x / 10) * 10

const dayMul = (day: Day) => RULES.dayMultiplier[String(day)]

export const sells = (s: StallId, i: ItemId) => stall(s).sells.includes(i)

/** The sticker price at a stall on a day (null if the stall doesn't sell it). */
export function priceFor(i: ItemId, s: StallId, day: Day): number | null {
  if (!sells(s, i)) return null
  return round10(item(i).base * dayMul(day) * stall(s).sticker)
}

/** The hidden lowest price the shopkeeper will accept. */
export function floorFor(i: ItemId, s: StallId, day: Day): number | null {
  if (!sells(s, i)) return null
  return round10(item(i).base * dayMul(day) * stall(s).floor)
}

/** Mega Sale's fake "was" price: double the sticker. */
export function wasPriceFor(i: ItemId, s: StallId, day: Day): number | null {
  const p = priceFor(i, s, day)
  const w = stall(s).wasMultiplier
  return p != null && w ? round10(p * w) : null
}

/** The Daam Fix day-1 price is the yardstick for "smart shopping". */
export const fairPrice = (i: ItemId) => priceFor(i, 'daamfix', 1)!
