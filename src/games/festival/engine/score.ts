import { stall } from './content'
import { fairPrice, priceFor } from './prices'
import { replay } from './state'
import { LIST_ITEMS, POCKETS, type Day, type GameEvent, type GameState, type ItemId, type PocketId, type StallId } from './types'

export interface Stars { ghar: boolean; gift: boolean; dost: boolean; plan: boolean }
export interface Score { needs: number; plan: number; shopping: number; goal: number; balance: number; total: number }

export const ownedGood = (s: GameState, i: ItemId) => !!s.owned[i] && !s.owned[i]!.torn
export const listOwned = (s: GameState) => LIST_ITEMS.filter((i) => ownedGood(s, i)).length
export const raidsTotal = (s: GameState) => s.raids.reduce((a, r) => a + r.amount, 0)

export function stars(s: GameState): Stars {
  return {
    ghar: listOwned(s) === 4,
    gift: !!s.owned.gift,
    dost: s.friendship >= 60,
    plan: s.walked.length === 0 && raidsTotal(s) <= 200,
  }
}

/** What was paid above the day-1 Daam Fix price, added up. A torn-outfit rebuy counts in full. */
export function overspend(log: GameEvent[]): number {
  let total = 0
  for (const e of log) {
    if (e.kind === 'buy') total += Math.max(0, e.price - fairPrice(e.item))
    if (e.kind === 'surprise' && e.id === 'S1' && e.choice === 'rebuy') total += e.cost
  }
  return total
}

export function plannerScore(log: GameEvent[], s: GameState = replay(log)): Score {
  const needs = Math.round((25 * listOwned(s)) / 4)
  const plan = Math.max(0, 25 - Math.min(15, Math.floor(raidsTotal(s) / 20)) - (s.walked.length ? 10 : 0))
  const shopping = Math.max(0, Math.round(20 - overspend(log) / 10))
  const goal = s.owned.gift ? 15 : 0
  const balance = s.friendship >= 60 ? 15 : s.friendship >= 40 ? 8 : 0
  return { needs, plan, shopping, goal, balance, total: needs + plan + shopping + goal + balance }
}

export const starCount = (st: Stars) => Object.values(st).filter(Boolean).length
export const minaretLit = (st: Stars, sc: Score) => starCount(st) >= 3 || sc.total >= 70

export interface PvrRow { pocket: PocketId; planned: number; spent: number; raidedIn: number; raidedOut: number }
export interface PlanVsReality {
  rows: PvrRow[]
  /** null = "Your plan held." */
  gap: { pocket: PocketId; planned: number; spent: number; raided: number; source: PocketId | null } | null
}

/**
 * Biggest gap = the pocket that went most over its plan (spending under plan is not a failure).
 * If none is more than ₹50 over, the plan held.
 */
export function planVsReality(s: GameState): PlanVsReality {
  const rows = POCKETS.map((p) => ({ pocket: p, planned: s.planned[p], spent: s.spent[p], raidedIn: s.raidedIn[p], raidedOut: s.raidedOut[p] }))
  let worst: PvrRow | null = null
  for (const r of rows) if (r.spent - r.planned > 50 && (!worst || r.spent - r.planned > worst.spent - worst.planned)) worst = r
  if (!worst) return { rows, gap: null }
  const by: Partial<Record<PocketId, number>> = {}
  for (const r of s.raids) if (r.to === worst.pocket) by[r.from] = (by[r.from] ?? 0) + r.amount
  const source = (Object.entries(by).sort((a, b) => b[1] - a[1])[0]?.[0] as PocketId | undefined) ?? null
  return { rows, gap: { pocket: worst.pocket, planned: worst.planned, spent: worst.spent, raided: worst.raidedIn, source } }
}

/** Price notebook: every sticker the player has seen, from the visits in the log. */
export interface Sticker { item: ItemId; stall: StallId; day: Day; price: number }
export function notebook(log: GameEvent[], upTo = log.length): Sticker[] {
  const seen = new Map<string, Sticker>()
  for (const e of log.slice(0, upTo)) {
    if (e.kind !== 'visit') continue
    for (const i of stall(e.stall).sells) seen.set(`${i}:${e.stall}:${e.day}`, { item: i, stall: e.stall, day: e.day, price: priceFor(i, e.stall, e.day)! })
  }
  return [...seen.values()]
}

/** Cheapest good-quality sticker seen today (a low-quality sticker isn't the same thing, so it's not a fair comparison). */
export const cheapestSeen = (book: Sticker[], i: ItemId, day: Day) =>
  book.filter((s) => s.item === i && s.day === day && stall(s.stall).quality === 'good').sort((a, b) => a.price - b.price)[0] ?? null

export interface Evidence {
  needsBoughtDay1: number
  raidsTotal: number
  walkedHome: boolean
  comparedFirst: number
  bargainsWon: number
  fakeSaleBuys: number
  lowQualityBuys: number
  bufferCoveredS2: boolean
  swaps: number
  ringTossPlays: number
}

export function evidence(log: GameEvent[], s: GameState = replay(log)): Evidence {
  const buys = log.map((e, idx) => ({ e, idx })).filter((x) => x.e.kind === 'buy') as { e: Extract<GameEvent, { kind: 'buy' }>; idx: number }[]
  let compared = 0
  for (const { e, idx } of buys) {
    const stallsSeen = new Set(notebook(log, idx).filter((st) => st.item === e.item).map((st) => st.stall))
    if (stallsSeen.size >= 2) compared++
  }
  return {
    needsBoughtDay1: buys.filter((b) => b.e.day === 1 && b.e.item !== 'gift').length,
    raidsTotal: raidsTotal(s),
    walkedHome: s.walked.length > 0,
    comparedFirst: buys.length ? Math.round((compared / buys.length) * 100) / 100 : 0,
    bargainsWon: buys.filter((b) => b.e.price < priceFor(b.e.item, b.e.stall, b.e.day)!).length,
    fakeSaleBuys: buys.filter((b) => b.e.stall === 'megasale').length,
    lowQualityBuys: buys.filter((b) => b.e.quality === 'low').length,
    bufferCoveredS2: s.mamuPaidFrom != null && s.mamuPaidFrom.length === 0,
    swaps: s.swaps,
    ringTossPlays: s.ringTossPlays[1] + s.ringTossPlays[2] + s.ringTossPlays[3],
  }
}
