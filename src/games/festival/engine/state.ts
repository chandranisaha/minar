import { RULES, invite, item } from './content'
import { POCKETS, zeroPockets, type Day, type GameEvent, type GameState, type PocketId, type Pockets } from './types'

export function initialState(): GameState {
  return {
    pockets: { ...zeroPockets(), loose: RULES.startMoney },
    planned: zeroPockets(),
    spent: zeroPockets(),
    raidedIn: zeroPockets(),
    raidedOut: zeroPockets(),
    raids: [],
    owned: {},
    friendship: RULES.friendship.start,
    walked: [],
    ringTossPlays: { 1: 0, 2: 0, 3: 0 },
    teddy: false,
    sunnyLent: 0,
    sunnyRepaid: null,
    ayeshaCovered: null,
    ayeshaRepaid: false,
    mamuPaidFrom: null,
    s1: null,
    swaps: 0,
    mastiSpent: 0,
    moneyIn: RULES.startMoney,
    moneyOut: 0,
    ended: false,
  }
}

export class EngineError extends Error {}

const clampF = (n: number) => Math.max(0, Math.min(100, n))

/** Take money out of one pocket. Shortfalls must already have been covered by raid events. */
function pay(s: GameState, pocket: PocketId, amount: number): GameState {
  if (amount < 0) throw new EngineError('negative payment')
  if (s.pockets[pocket] < amount) throw new EngineError(`pocket ${pocket} short: has ${s.pockets[pocket]}, needs ${amount}`)
  return {
    ...s,
    pockets: { ...s.pockets, [pocket]: s.pockets[pocket] - amount },
    spent: { ...s.spent, [pocket]: s.spent[pocket] + amount },
    moneyOut: s.moneyOut + amount,
    mastiSpent: pocket === 'masti' ? s.mastiSpent + amount : s.mastiSpent,
  }
}

/** Pure reducer. Screens never touch money directly; they append events. */
export function applyEvent(s: GameState, e: GameEvent): GameState {
  switch (e.kind) {
    case 'plan': {
      const total = POCKETS.reduce((a, k) => a + e.pockets[k], 0)
      const have = POCKETS.reduce((a, k) => a + s.pockets[k], 0)
      if (total !== have) throw new EngineError(`plan must place exactly ${have}, got ${total}`)
      if (POCKETS.some((k) => e.pockets[k] < 0)) throw new EngineError('negative pocket in plan')
      if (e.day === 1 && sumPlanned(s) === 0) return { ...s, pockets: { ...e.pockets }, planned: { ...e.pockets } }
      // later mornings: rebalancing is planning, so the plan shifts by what moved (not logged as a raid)
      const planned = { ...s.planned }
      for (const k of POCKETS) planned[k] += e.pockets[k] - s.pockets[k]
      return { ...s, pockets: { ...e.pockets }, planned }
    }
    case 'raid': {
      if (e.amount <= 0 || s.pockets[e.from] < e.amount) throw new EngineError(`raid from ${e.from} too large`)
      return {
        ...s,
        pockets: { ...s.pockets, [e.from]: s.pockets[e.from] - e.amount, [e.to]: s.pockets[e.to] + e.amount },
        raidedOut: { ...s.raidedOut, [e.from]: s.raidedOut[e.from] + e.amount },
        raidedIn: { ...s.raidedIn, [e.to]: s.raidedIn[e.to] + e.amount },
        raids: [...s.raids, { day: e.day, from: e.from, to: e.to, amount: e.amount, reason: e.reason }],
      }
    }
    case 'buy': {
      const def = item(e.item)
      const prev = s.owned[e.item]
      if (prev && !prev.torn) throw new EngineError(`${e.item} already owned`)
      const next = pay(s, def.pocket, e.price)
      return { ...next, owned: { ...next.owned, [e.item]: { stall: e.stall, day: e.day, price: e.price, quality: e.quality } } }
    }
    case 'invite': {
      const def = invite(e.id)
      const f = RULES.friendship
      const delta = e.reply === 'yes' ? f.yes : e.reply === 'swap' ? f.swap : (def.noFriendship ?? f.no)
      const next = e.cost > 0 ? pay(s, 'masti', e.cost) : s
      return {
        ...next,
        friendship: clampF(next.friendship + delta),
        swaps: next.swaps + (e.reply === 'swap' ? 1 : 0),
        sunnyLent: def.loan ? next.sunnyLent + e.cost : next.sunnyLent,
      }
    }
    case 'ringtoss': {
      const next = pay(s, 'masti', RULES.ringToss.cost)
      return { ...next, ringTossPlays: { ...next.ringTossPlays, [e.day]: next.ringTossPlays[e.day] + 1 }, teddy: next.teddy || e.win }
    }
    case 'surprise': {
      if (e.id === 'S1') {
        if (e.choice === 'rebuy') {
          const next = pay(s, 'ghar', e.cost)
          return { ...next, s1: 'rebuy', owned: { ...next.owned, outfit: { stall: 'daamfix', day: e.day, price: e.cost, quality: 'good' } } }
        }
        const o = s.owned.outfit
        return { ...s, s1: e.choice === 'festival' ? 'festival' : 'old', owned: o ? { ...s.owned, outfit: { ...o, torn: true } } : s.owned }
      }
      if (e.id === 'S2') {
        const next = pay(s, 'loose', e.cost)
        return { ...next, mamuPaidFrom: s.raids.filter((r) => r.reason === 'S2').map((r) => r.from) }
      }
      if (e.id === 'S3') {
        const covered = e.choice === 'cover'
        const next = covered ? pay(s, 'masti', e.cost) : s
        const f = RULES.friendship
        return { ...next, ayeshaCovered: covered, friendship: clampF(next.friendship + (covered ? f.coverAyesha : f.refuseAyesha)) }
      }
      return s // S4 is cosmetic
    }
    case 'bus': {
      if (!e.paid) return { ...s, walked: [...s.walked, e.day] }
      return pay(s, 'bus', RULES.busFare)
    }
    case 'repay': {
      const pockets = { ...s.pockets, loose: s.pockets.loose + e.amount }
      if (e.who === 'ayesha') return { ...s, pockets, moneyIn: s.moneyIn + e.amount, ayeshaRepaid: true }
      return { ...s, pockets, moneyIn: s.moneyIn + e.amount, sunnyRepaid: e.amount }
    }
    case 'end':
      return { ...s, ended: true }
    case 'visit':
    case 'offer':
    case 'walkaway':
      return s
  }
}

function sumPlanned(s: GameState) {
  return POCKETS.reduce((a, k) => a + s.planned[k], 0)
}

export const replay = (log: GameEvent[]): GameState => log.reduce(applyEvent, initialState())

export const wallet = (s: GameState): Pockets => ({ ...s.pockets })
export const walletTotal = (s: GameState) => POCKETS.reduce((a, k) => a + s.pockets[k], 0)

/** Can the whole wallet cover this? If not, the purchase shows "Not enough money". */
export const canAfford = (s: GameState, amount: number) => walletTotal(s) >= amount

/** How much a payment from `pocket` is short by (0 = no raid needed). */
export const shortfall = (s: GameState, pocket: PocketId, amount: number) => Math.max(0, amount - s.pockets[pocket])

/**
 * Build the raid events that cover a shortfall from a preferred order of source pockets.
 * Used by bots and Demo mode; real players pick each source on the Raid sheet.
 */
export function autoRaids(s: GameState, to: PocketId, amount: number, order: PocketId[], day: Day, reason: string): GameEvent[] | null {
  let need = shortfall(s, to, amount)
  if (!need) return []
  if (!canAfford(s, amount)) return null
  const out: GameEvent[] = []
  for (const from of order) {
    if (from === to || need <= 0) continue
    const take = Math.min(need, s.pockets[from])
    if (take > 0) {
      out.push({ kind: 'raid', day, from, to, amount: take, reason })
      need -= take
    }
  }
  return need > 0 ? null : out
}
