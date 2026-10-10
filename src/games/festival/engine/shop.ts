import { draw } from '../../../lib/rng'
import { RULES, item, shop } from './content'
import type { Day, ItemId, ShopId } from './types'

export const round10 = (x: number) => Math.round(x / 10) * 10
const raw = (i: ItemId, s: ShopId, day: Day) => item(i).base * RULES.dayMultiplier[String(day)] * shop(s).sticker

/** The price on the sticker. Prices rise 10% on day 2 and 25% on day 3. */
export const sticker = (i: ItemId, s: ShopId, day: Day) => round10(raw(i, s, day))

/** Mega Sale's "was" price: double the unrounded sticker. */
export const wasPrice = (i: ItemId, s: ShopId, day: Day) => {
  const w = shop(s).was
  return w ? round10(raw(i, s, day) * w) : null
}

/** The cheapest good-quality sticker on a shopping card (what "comparing" would have found). */
export const bestGood = (i: ItemId, day: Day) =>
  Math.min(...item(i).shops.filter((s) => shop(s).quality === 'good').map((s) => sticker(i, s, day)))

/** The day-1 fixed price: the yardstick for "you paid more by waiting". */
export const fairPrice = (i: ItemId) => round10(item(i).base * RULES.dayMultiplier['1'])

export interface HaggleResult { result: 'counter' | 'refuse'; price: number }

/** One tap of "Ask for less". Only Aunty's answer is a (seeded) gamble; the rest follow their personality. */
export function haggle(seed: string, i: ItemId, s: ShopId, day: Day): HaggleResult | null {
  const d = shop(s)
  const st = sticker(i, s, day)
  const base = item(i).base * RULES.dayMultiplier[String(day)]
  switch (d.haggle) {
    case 'none':
      return null
    case 'tenoff':
      return { result: 'counter', price: st - 10 }
    case 'friendly':
      return { result: 'counter', price: round10(base * d.haggleTo!) }
    case 'tough':
      return draw(seed, `haggle:${i}:${s}:${day}`) < d.haggleChance! ? { result: 'counter', price: round10(base * d.haggleTo!) } : { result: 'refuse', price: st }
  }
}
