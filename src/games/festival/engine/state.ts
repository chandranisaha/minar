import { RULES, invite, item } from './content'
import { JARS, sumJars, zeroJars, type Day, type GameEvent, type GameState, type JarId } from './types'

export function initialState(): GameState {
  return {
    jars: { ...zeroJars(), spare: RULES.startMoney },
    planned: zeroJars(),
    spent: zeroJars(),
    borrowedIn: zeroJars(),
    borrowedOut: zeroJars(),
    borrowed: 0,
    borrowCards: [],
    owned: {},
    without: [],
    friendship: RULES.friendship.start,
    swaps: 0,
    sunnyLent: 0,
    sunnyRepaid: null,
    mamu: null,
    tornChoice: null,
    ringTossPlays: 0,
    teddy: false,
    ended: false,
  }
}

export class EngineError extends Error {}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/** Take money out of a jar. A shortfall must already have been covered by borrow events. */
function pay(s: GameState, jar: JarId, amount: number): GameState {
  if (amount < 0) throw new EngineError('negative payment')
  if (s.jars[jar] < amount) throw new EngineError(`${jar} jar short: has ${s.jars[jar]}, needs ${amount}`)
  return { ...s, jars: { ...s.jars, [jar]: s.jars[jar] - amount }, spent: { ...s.spent, [jar]: s.spent[jar] + amount } }
}

/** Pure reducer: screens never touch money, they append events. */
export function applyEvent(s: GameState, e: GameEvent): GameState {
  switch (e.kind) {
    case 'plan': {
      if (sumJars(e.jars) !== sumJars(s.jars)) throw new EngineError('plan must place all the money')
      if (JARS.some((k) => e.jars[k] < 0)) throw new EngineError('negative jar')
      return { ...s, jars: { ...e.jars }, planned: { ...e.jars } }
    }
    case 'borrow': {
      if (e.amount <= 0 || s.jars[e.from] < e.amount) throw new EngineError(`borrow from ${e.from} too large`)
      return {
        ...s,
        jars: { ...s.jars, [e.from]: s.jars[e.from] - e.amount, [e.to]: s.jars[e.to] + e.amount },
        borrowedOut: { ...s.borrowedOut, [e.from]: s.borrowedOut[e.from] + e.amount },
        borrowedIn: { ...s.borrowedIn, [e.to]: s.borrowedIn[e.to] + e.amount },
        borrowed: s.borrowed + e.amount,
        borrowCards: s.borrowCards.includes(e.card) ? s.borrowCards : [...s.borrowCards, e.card],
      }
    }
    case 'buy': {
      const o = s.owned[e.item]
      if (o && !o.torn) throw new EngineError(`${e.item} already bought`)
      const next = pay(s, item(e.item).jar, e.price)
      return { ...next, owned: { ...next.owned, [e.item]: { shop: e.shop, day: e.day, price: e.price, quality: e.quality } } }
    }
    case 'without':
      return { ...s, without: [...s.without, e.item] }
    case 'invite': {
      const def = invite(e.id)
      const f = RULES.friendship
      const delta = e.reply === 'yes' ? f.yes : e.reply === 'swap' ? f.swap : (def.noFriendship ?? f.no)
      const next = e.cost > 0 ? pay(s, 'fun', e.cost) : s
      return {
        ...next,
        friendship: clamp(next.friendship + delta),
        swaps: next.swaps + (e.reply === 'swap' ? 1 : 0),
        sunnyLent: def.loan ? next.sunnyLent + e.cost : next.sunnyLent,
      }
    }
    case 'surprise': {
      if (e.id === 'mamu') {
        return { ...pay(s, 'spare', e.cost), mamu: s.borrowCards.includes(e.card) ? 'borrowed' : 'spare' }
      }
      // torn outfit: rebuy a good one at the fixed shop, or wear old clothes
      const o = s.owned.outfit!
      if (e.choice === 'rebuy') {
        const next = pay(s, 'needs', e.cost)
        return { ...next, tornChoice: 'rebuy', owned: { ...next.owned, outfit: { shop: 'daamfix', day: e.day, price: e.cost, quality: 'good' } } }
      }
      return { ...s, tornChoice: 'old', owned: { ...s.owned, outfit: { ...o, torn: true } } }
    }
    case 'ringtoss': {
      if (!e.play) return s
      const next = pay(s, 'fun', RULES.ringToss.cost)
      return { ...next, ringTossPlays: next.ringTossPlays + 1, teddy: next.teddy || e.win }
    }
    case 'repay':
      return { ...s, jars: { ...s.jars, spare: s.jars.spare + e.amount }, sunnyRepaid: e.amount }
    case 'end': {
      // a cheap outfit bought on day 3 tears on festival morning, with no time to replace it
      const o = s.owned.outfit
      const owned = o && o.quality === 'low' && !o.torn && o.day === 3 ? { ...s.owned, outfit: { ...o, torn: true } } : s.owned
      return { ...s, owned, ended: true }
    }
    case 'haggle':
    case 'later':
    case 'seen':
      return s
  }
}

export const replay = (log: GameEvent[]): GameState => log.reduce(applyEvent, initialState())
export const walletTotal = (s: GameState) => sumJars(s.jars)
export const shortfall = (s: GameState, jar: JarId, amount: number) => Math.max(0, amount - s.jars[jar])
export const canAfford = (s: GameState, amount: number) => walletTotal(s) >= amount

/** Borrow events that cover a shortfall from jars in the given order (bots and demo; players pick on the Borrow sheet). */
export function autoBorrow(s: GameState, to: JarId, amount: number, order: JarId[], day: Day, card: string): GameEvent[] | null {
  let need = shortfall(s, to, amount)
  if (!need) return []
  if (!canAfford(s, amount)) return null
  const out: GameEvent[] = []
  for (const from of order) {
    if (from === to || need <= 0) continue
    const take = Math.min(need, s.jars[from])
    if (take > 0) {
      out.push({ kind: 'borrow', day, card, from, to, amount: take })
      need -= take
    }
  }
  return need > 0 ? null : out
}
