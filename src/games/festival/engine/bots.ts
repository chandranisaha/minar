import { RULES, STALL_DEFS, invitesFor, stall, type InviteDef } from './content'
import { callbackFor, offerFor, respond, stallState, isClosed, type OfferButton } from './bargain'
import { festivalMorningEvents, morningEvents, needsS1, ringTossWin, s1RebuyPrice, visitsLeft } from './flow'
import { priceFor } from './prices'
import { applyEvent, autoRaids, initialState, walletTotal } from './state'
import { item as itemDef } from './content'
import type { Day, GameEvent, GameState, ItemId, PocketId, Pockets, Reply, StallId } from './types'

/**
 * Balancing bots. They play through the same engine and flow helpers the screens use,
 * so if the rules or prices drift, the bot tests catch it.
 */
export interface Ctx {
  seed: string
  day: Day
  log: GameEvent[]
  state: () => GameState
  push: (e: GameEvent) => void
  /** cover any shortfall with raids in the bot's order, then log `e`. false = not enough money */
  payWith: (pocket: PocketId, amount: number, reason: string, e: GameEvent) => boolean
}

export interface Policy {
  name: string
  plan: Pockets
  raidOrder: PocketId[]
  shop: (ctx: Ctx) => void
  invite: (inv: InviteDef) => Reply
  coverAyesha: boolean
  ringTosses: (day: Day) => number
  walkWhenBusShort: boolean
  rebuyTornOutfit: boolean
}

export function runBot(seed: string, p: Policy): GameEvent[] {
  const log: GameEvent[] = []
  let s = initialState()
  const push = (e: GameEvent) => {
    s = applyEvent(s, e)
    log.push(e)
  }
  const mk = (day: Day): Ctx => ({
    seed, day, log, state: () => s, push,
    payWith: (pocket, amount, reason, e) => {
      const raids = autoRaids(s, pocket, amount, p.raidOrder, day, reason)
      if (!raids) return false
      raids.forEach(push)
      push(e)
      return true
    },
  })

  for (const day of [1, 2, 3] as Day[]) {
    const ctx = mk(day)
    morningEvents(log, day).forEach(push)
    if (day === 3 && needsS1(s)) {
      const price = s1RebuyPrice()
      const ok = p.rebuyTornOutfit && ctx.payWith('ghar', price, 'S1', { kind: 'surprise', day, id: 'S1', choice: 'rebuy', cost: price })
      if (!ok) push({ kind: 'surprise', day, id: 'S1', choice: 'old', cost: 0 })
    }
    if (day === 1) push({ kind: 'plan', day, pockets: { ...p.plan } })

    p.shop(ctx)

    for (const inv of invitesFor(day)) {
      let reply = p.invite(inv)
      if (reply === 'swap' && inv.swap == null) reply = 'yes'
      const cost = reply === 'yes' ? inv.yes : reply === 'swap' ? inv.swap! : 0
      const e: GameEvent = { kind: 'invite', day, id: inv.id, reply, cost }
      if (cost === 0) push(e)
      else if (!ctx.payWith('masti', cost, `invite:${inv.id}`, e)) push({ ...e, reply: 'no', cost: 0 })
    }
    if (day === 2) {
      const e: GameEvent = { kind: 'surprise', day, id: 'S3', choice: 'cover', cost: RULES.ayeshaFare }
      if (!(p.coverAyesha && ctx.payWith('masti', RULES.ayeshaFare, 'S3', e))) push({ ...e, choice: 'refuse', cost: 0 })
    }
    for (let k = 0; k < Math.min(RULES.ringToss.playsPerEvening, p.ringTosses(day)); k++) {
      if (!ctx.payWith('masti', RULES.ringToss.cost, 'ringtoss', { kind: 'ringtoss', day, win: ringTossWin(seed, day, k) })) break
    }
    if (day === 2) {
      const cost = Math.min(RULES.mamuCost, walletTotal(s))
      ctx.payWith('loose', cost, 'S2', { kind: 'surprise', day, id: 'S2', choice: 'pay', cost })
    }
    if (s.pockets.bus >= RULES.busFare) push({ kind: 'bus', day, paid: true })
    else if (p.walkWhenBusShort || !ctx.payWith('bus', RULES.busFare, 'bus', { kind: 'bus', day, paid: true })) push({ kind: 'bus', day, paid: false })
  }
  festivalMorningEvents(seed, log).forEach(push)
  return log
}

// ---------- shopping strategies ----------

/** Try one stall with a button sequence; returns the final price it would get, without logging. */
function simulate(log: GameEvent[], st: StallId, it: ItemId, day: Day, opener: OfferButton): { price: number; offers: GameEvent[]; closed?: boolean } | null {
  if (!stall(st).bargain) return { price: priceFor(it, st, day)!, offers: [] }
  if (isClosed(log, st, day)) return null
  const ss = stallState(log, st, it, day)
  const offer = offerFor(ss.sticker, opener)
  const r = respond(ss, offer)
  const ev: GameEvent = { kind: 'offer', day, stall: st, item: it, offer, result: r.result, counter: r.counter }
  if (r.result === 'accept') return { price: offer, offers: [ev] }
  if (r.result === 'closed') return { price: Infinity, offers: [ev], closed: true }
  return { price: r.counter!, offers: [ev] }
}

function buyAt(ctx: Ctx, st: StallId, it: ItemId, opener: OfferButton | null): boolean {
  const { day, log } = ctx
  if (visitsLeft(log, day) <= 0) return false
  ctx.push({ kind: 'visit', day, stall: st })
  const sim = opener ? simulate(log, st, it, day, opener) : { price: priceFor(it, st, day)!, offers: [] }
  if (!sim) return false
  sim.offers.forEach(ctx.push)
  if (sim.closed) return false
  return ctx.payWith(itemDef(it).pocket, sim.price, `buy:${it}`, { kind: 'buy', day, stall: st, item: it, price: sim.price, quality: stall(st).quality })
}

const sellers = (it: ItemId) => STALL_DEFS.filter((d) => d.sells.includes(it))

/** Planner/Hoarder: look at every stall, then buy each item where a Fair opener (then accepting the counter) is cheapest; ties go to Daam Fix. */
export function shopBestBargain(ctx: Ctx) {
  if (ctx.day !== 1) return
  for (const d of STALL_DEFS) ctx.push({ kind: 'visit', day: 1, stall: d.id })
  for (const it of ['sweets', 'decor', 'outfit', 'small', 'gift'] as ItemId[]) {
    let best: { st: StallId; price: number; bargain: boolean } | null = null
    for (const d of sellers(it)) {
      if (d.quality !== 'good') continue
      const sim = simulate(ctx.log, d.id, it, 1, 'fair')
      if (sim && (!best || sim.price < best.price)) best = { st: d.id, price: sim.price, bargain: d.bargain }
    }
    if (best) buyAt(ctx, best.st, it, best.bargain ? 'fair' : null)
  }
}

/** Impulsive: needs on day 3 at the cheapest sticker, paying the sticker. */
export function shopImpulsive(ctx: Ctx) {
  if (ctx.day !== 3) return
  for (const it of ['sweets', 'decor', 'outfit', 'small', 'gift'] as ItemId[]) {
    if (ctx.state().owned[it]) continue
    const d = sellers(it).sort((a, b) => priceFor(it, a.id, 3)! - priceFor(it, b.id, 3)!)[0]
    buyAt(ctx, d.id, it, null)
  }
}

/** Bargain hunter: lowest sticker, always opens with Low, accepts the counter; if the stall closes, next-lowest sticker. Big items first. */
export function shopBargainHunter(ctx: Ctx) {
  if (ctx.day !== 1) return
  for (const it of ['sweets', 'outfit', 'gift', 'decor', 'small'] as ItemId[]) {
    const order = sellers(it).sort((a, b) => priceFor(it, a.id, 1)! - priceFor(it, b.id, 1)!)
    for (const d of order) {
      if (isClosed(ctx.log, d.id, 1)) continue
      if (buyAt(ctx, d.id, it, d.bargain ? 'low' : null)) break
    }
  }
}

/** Not a bot from the spec: a walk-away at Aunty's to exercise the seeded call-back. */
export function walkawayAt(ctx: Ctx, st: StallId, it: ItemId) {
  const cb = callbackFor(ctx.seed, ctx.log, st, it, ctx.day)
  ctx.push({ kind: 'walkaway', day: ctx.day, stall: st, item: it, callback: cb })
  return cb
}

const SENSIBLE = RULES.sensiblePlan

export const PLANNER: Policy = {
  name: 'planner', plan: SENSIBLE, raidOrder: ['masti', 'loose', 'gift', 'ghar', 'bus'], shop: shopBestBargain,
  invite: (inv) => (inv.loan ? 'swap' : 'swap'), coverAyesha: true, ringTosses: () => 0, walkWhenBusShort: false, rebuyTornOutfit: true,
}
export const HOARDER: Policy = { ...PLANNER, name: 'hoarder', invite: () => 'no', coverAyesha: false }
export const IMPULSIVE: Policy = {
  name: 'impulsive', plan: { ghar: 900, gift: 240, masti: 800, bus: 60, loose: 0 }, raidOrder: ['loose', 'bus', 'gift', 'ghar', 'masti'],
  shop: shopImpulsive, invite: () => 'yes', coverAyesha: true, ringTosses: () => 3, walkWhenBusShort: true, rebuyTornOutfit: false,
}
export const BARGAIN_HUNTER: Policy = { ...PLANNER, name: 'bargain', shop: shopBargainHunter }
export const BOTS = [PLANNER, IMPULSIVE, HOARDER, BARGAIN_HUNTER]
