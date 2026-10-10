import { fairPrice } from './prices'
import { cheapestSeen, notebook } from './score'
import { replay } from './state'
import { LIST_ITEMS, type Day, type GameEvent, type ItemId, type PocketId, type StallId } from './types'

export type LessonId =
  | 'needs' | 'budget' | 'opportunity' | 'compare' | 'cheap'
  | 'early' | 'fakesale' | 'buffer' | 'swap' | 'odds'

/** Priority order from the spec (1 = highest). */
export const LESSON_ORDER: LessonId[] = ['needs', 'budget', 'opportunity', 'compare', 'cheap', 'early', 'fakesale', 'buffer', 'swap', 'odds']

export interface LessonHit {
  id: LessonId
  /** values for line 1 of the card */
  vars: Record<string, string | number>
  /** lesson 8 has a positive and a negative version */
  variant?: 'good' | 'bad'
}

const eventsTo = (log: GameEvent[], day: Day) => {
  // everything up to and including this day's events (the 'repay' on festival morning is day 4)
  let last = -1
  log.forEach((e, i) => { if ('day' in e && e.day <= day) last = i })
  return log.slice(0, last + 1)
}
const dayEvents = (log: GameEvent[], day: Day) => log.filter((e) => 'day' in e && e.day === day)

/** Which lessons does the log trigger for one day? (ordered by priority) */
export function lessonsTriggered(log: GameEvent[], day: Day): LessonHit[] {
  const upTo = eventsTo(log, day)
  const s = replay(upTo)
  const today = dayEvents(log, day)
  const hits: LessonHit[] = []

  const missing = LIST_ITEMS.find((i) => !s.owned[i] || s.owned[i]!.torn)
  if (missing && s.mastiSpent > 200) hits.push({ id: 'needs', vars: { m: s.mastiSpent, item: missing } })

  const raidsToday = today.filter((e): e is Extract<GameEvent, { kind: 'raid' }> => e.kind === 'raid')
  const raidedToday = raidsToday.reduce((a, r) => a + r.amount, 0)
  if (raidedToday >= 100) {
    const by: Partial<Record<PocketId, number>> = {}
    for (const r of raidsToday) by[r.from] = (by[r.from] ?? 0) + r.amount
    const pocket = Object.entries(by).sort((a, b) => b[1] - a[1])[0][0]
    hits.push({ id: 'budget', vars: { r: raidedToday, pocket } })
  }

  const giftForMasti = raidsToday.filter((r) => r.from === 'gift' && r.to === 'masti').reduce((a, r) => a + r.amount, 0)
  if (giftForMasti > 0) hits.push({ id: 'opportunity', vars: { r: giftForMasti } })

  const book = notebook(log, upTo.length)
  const buysToday = today.filter((e): e is Extract<GameEvent, { kind: 'buy' }> => e.kind === 'buy')
  for (const b of buysToday) {
    const c = cheapestSeen(book, b.item, day)
    if (c && b.price - c.price >= 40) {
      hits.push({ id: 'compare', vars: { p: b.price, stall: c.stall as StallId, c: c.price, item: b.item } })
      break
    }
  }

  const s1 = today.find((e) => e.kind === 'surprise' && e.id === 'S1')
  if (s1 && s1.kind === 'surprise') {
    const cheap = log.find((e) => e.kind === 'buy' && e.item === 'outfit' && e.stall === 'sasta')
    hits.push({ id: 'cheap', vars: { cheap: cheap && cheap.kind === 'buy' ? cheap.price : 0, new: s1.cost } })
  }

  const late = buysToday.find((b) => b.item !== 'gift' && b.day > 1)
  if (late) hits.push({ id: 'early', vars: { item: late.item as ItemId, d: late.day, extra: Math.max(0, late.price - fairPrice(late.item)) } })

  const mega = buysToday.find((b) => b.stall === 'megasale')
  if (mega) hits.push({ id: 'fakesale', vars: { extra: Math.max(0, mega.price - fairPrice(mega.item)), item: mega.item } })

  if (today.some((e) => e.kind === 'surprise' && e.id === 'S2')) {
    const from = s.mamuPaidFrom ?? []
    if (from.length === 0) hits.push({ id: 'buffer', variant: 'good', vars: {} })
    else {
      const r = s.raids.filter((x) => x.reason === 'S2').reduce((a, x) => a + x.amount, 0)
      hits.push({ id: 'buffer', variant: 'bad', vars: { r, pocket: from[0] } })
    }
  }

  if (s.swaps >= 3) hits.push({ id: 'swap', vars: { n: s.swaps } })

  const plays = s.ringTossPlays[1] + s.ringTossPlays[2] + s.ringTossPlays[3]
  if (plays >= 2) hits.push({ id: 'odds', vars: { x: plays * 30 } })

  return hits.sort((a, b) => LESSON_ORDER.indexOf(a.id) - LESSON_ORDER.indexOf(b.id))
}

/** At most one card per Day diary, highest priority first, each card shown at most twice. */
export function lessonFor(log: GameEvent[], day: Day, shown: LessonId[]): LessonHit | null {
  return lessonsTriggered(log, day).find((h) => shown.filter((x) => x === h.id).length < 2) ?? null
}

/** Top three for the final report, from the whole run. */
export function topLessons(log: GameEvent[], n = 3): LessonHit[] {
  const seen = new Map<LessonId, LessonHit>()
  for (const d of [1, 2, 3] as Day[]) for (const h of lessonsTriggered(log, d)) if (!seen.has(h.id)) seen.set(h.id, h)
  return [...seen.values()].sort((a, b) => LESSON_ORDER.indexOf(a.id) - LESSON_ORDER.indexOf(b.id)).slice(0, n)
}
