import { draw } from '../../../lib/rng'
import { DECK, ITEM_DEFS, RULES, invite, type InviteDef } from './content'
import { sticker } from './shop'
import { replay } from './state'
import { DAYS, TERMINAL, type Day, type GameEvent, type GameState, type ItemId } from './types'

export type Card =
  | { id: string; day: Day; type: 'banner' }
  | { id: string; day: Day; type: 'shop'; item: ItemId; deferred: boolean; canLater: boolean }
  | { id: string; day: Day; type: 'invite'; invite: InviteDef }
  | { id: string; day: Day; type: 'mamu' }
  | { id: string; day: Day; type: 'torn'; rebuy: number }
  | { id: string; day: Day; type: 'ringtoss' }

/** State as it stood when a day began (the plan plus everything from earlier days). */
export const stateAtDayStart = (log: GameEvent[], day: Day): GameState =>
  replay(log.filter((e) => !('day' in e) || e.day < day))

/** Items put off with "Buy later" on the previous day and still not bought. */
function deferredItems(log: GameEvent[], day: Day): ItemId[] {
  const s = stateAtDayStart(log, day)
  return ITEM_DEFS.map((d) => d.id).filter((i) => {
    if (s.owned[i] || s.without.includes(i)) return false
    const lastLater = log.filter((e) => e.kind === 'later' && e.item === i).map((e) => (e as { day: Day }).day)
    return lastLater.includes((day - 1) as Day)
  })
}

/** The cards for one day, in order. Depends only on what happened before that day. */
export function cardsFor(log: GameEvent[], day: Day): Card[] {
  const s = stateAtDayStart(log, day)
  const out: Card[] = []
  for (const entry of DECK[String(day) as '1' | '2' | '3']) {
    switch (entry.type) {
      case 'banner':
        out.push({ id: `d${day}:banner`, day, type: 'banner' })
        break
      case 'shop':
        out.push({ id: `d${day}:shop:${entry.item}`, day, type: 'shop', item: entry.item, deferred: false, canLater: day < 3 })
        break
      case 'deferred':
        for (const i of deferredItems(log, day)) out.push({ id: `d${day}:shop:${i}`, day, type: 'shop', item: i, deferred: true, canLater: day < 3 })
        break
      case 'invite':
        out.push({ id: `d${day}:invite:${entry.id}`, day, type: 'invite', invite: invite(entry.id) })
        break
      case 'mamu':
        out.push({ id: `d${day}:mamu`, day, type: 'mamu' })
        break
      case 'torn': {
        // a cheap outfit bought before day 3 splits its seam on day-3 morning
        const o = s.owned.outfit
        if (o && o.quality === 'low' && !o.torn && o.day < 3) out.push({ id: `d${day}:torn`, day, type: 'torn', rebuy: sticker('outfit', 'daamfix', day) })
        break
      }
      case 'ringtoss':
        out.push({ id: `d${day}:ringtoss`, day, type: 'ringtoss' })
        break
    }
  }
  return out
}

export const resolvedCards = (log: GameEvent[]) =>
  new Set(log.filter((e) => TERMINAL.has(e.kind)).map((e) => (e as { card: string }).card))

/** The card to play now, or null when all three days are done (festival morning). */
export function currentCard(log: GameEvent[]): Card | null {
  const done = resolvedCards(log)
  for (const d of DAYS) {
    const next = cardsFor(log, d).find((c) => !done.has(c.id))
    if (next) return next
  }
  return null
}

/** Progress within the day, for the "card 2 of 5" label. */
export function dayProgress(log: GameEvent[], card: Card) {
  const all = cardsFor(log, card.day)
  return { n: all.findIndex((c) => c.id === card.id) + 1, of: all.length }
}

/** Seeded draws (nothing else is random): the ring toss and Sunny paying back. */
export const ringTossWin = (seed: string) => draw(seed, 'ringtoss') < RULES.ringToss.winChance
export const sunnyRepays = (seed: string) => draw(seed, 'sunny-repay') < RULES.sunnyRepayChance

/** Festival morning: Sunny's loan resolves, then the run ends. */
export function festivalMorning(seed: string, log: GameEvent[]): GameEvent[] {
  const s = replay(log)
  if (s.ended) return []
  const out: GameEvent[] = []
  if (s.sunnyLent > 0 && sunnyRepays(seed)) out.push({ kind: 'repay', amount: s.sunnyLent })
  out.push({ kind: 'end' })
  return out
}
