import { mulberry32, hashString } from '../../../lib/rng'
import { RULES, item, shop, type InviteDef } from './content'
import { currentCard, festivalMorning, ringTossWin, type Card } from './deck'
import { haggle, sticker } from './shop'
import { applyEvent, autoBorrow, initialState, walletTotal } from './state'
import type { GameEvent, GameState, JarId, Jars, Reply, ShopId } from './types'

/**
 * Balancing bots. They play through the same engine and deck the screens use,
 * so if prices or rules drift, the bot tests catch it. Demo mode replays two of them.
 */
type ShopChoice = { buy: ShopId; haggle: boolean } | 'later' | 'without'

export interface Policy {
  name: string
  plan: Jars
  borrowOrder: JarId[]
  shop: (card: Extract<Card, { type: 'shop' }>, s: GameState, seed: string) => ShopChoice
  invite: (inv: InviteDef) => Reply
  rebuyTorn: boolean
  ringToss: boolean
}

export function runBot(seed: string, p: Policy): GameEvent[] {
  const log: GameEvent[] = []
  let s = initialState()
  const push = (e: GameEvent) => {
    s = applyEvent(s, e)
    log.push(e)
  }
  const payWith = (jar: JarId, amount: number, card: Card, e: GameEvent) => {
    const borrows = autoBorrow(s, jar, amount, p.borrowOrder, card.day, card.id)
    if (!borrows) return false
    borrows.forEach(push)
    push(e)
    return true
  }

  push({ kind: 'plan', jars: { ...p.plan } })
  for (let card = currentCard(log); card; card = currentCard(log)) {
    const { day, id } = card
    switch (card.type) {
      case 'banner':
        push({ kind: 'seen', day, card: id })
        break
      case 'shop': {
        let c = p.shop(card, s, seed)
        if (c === 'later' && !card.canLater) c = cheapestBuy(card)
        if (c === 'later') { push({ kind: 'later', day, card: id, item: card.item }); break }
        if (c === 'without') { push({ kind: 'without', day, card: id, item: card.item }); break }
        let price = sticker(card.item, c.buy, day)
        if (c.haggle) {
          const h = haggle(seed, card.item, c.buy, day)
          if (h) { push({ kind: 'haggle', day, card: id, shop: c.buy, item: card.item, result: h.result, price: h.price }); price = h.price }
        }
        const buy: GameEvent = { kind: 'buy', day, card: id, item: card.item, shop: c.buy, price, quality: shop(c.buy).quality }
        if (!payWith(item(card.item).jar, price, card, buy)) push({ kind: 'without', day, card: id, item: card.item })
        break
      }
      case 'invite': {
        const inv = card.invite
        let reply = p.invite(inv)
        if (reply === 'swap' && inv.swap == null) reply = 'yes'
        const cost = reply === 'yes' ? inv.yes : reply === 'swap' ? inv.swap! : 0
        const e: GameEvent = { kind: 'invite', day, card: id, id: inv.id, reply, cost }
        if (cost === 0 || !payWith('fun', cost, card, e)) push(cost === 0 ? e : { ...e, reply: 'no', cost: 0 })
        break
      }
      case 'mamu': {
        const cost = Math.min(RULES.mamuCost, walletTotal(s))
        payWith('spare', cost, card, { kind: 'surprise', day, card: id, id: 'mamu', choice: 'pay', cost })
        break
      }
      case 'torn': {
        const ok = p.rebuyTorn && payWith('needs', card.rebuy, card, { kind: 'surprise', day, card: id, id: 'torn', choice: 'rebuy', cost: card.rebuy })
        if (!ok) push({ kind: 'surprise', day, card: id, id: 'torn', choice: 'old', cost: 0 })
        break
      }
      case 'ringtoss': {
        const e: GameEvent = { kind: 'ringtoss', day, card: id, play: true, win: ringTossWin(seed) }
        if (!(p.ringToss && payWith('fun', RULES.ringToss.cost, card, e))) push({ kind: 'ringtoss', day, card: id, play: false, win: false })
        break
      }
    }
  }
  festivalMorning(seed, log).forEach(push)
  return log
}

// ---------- shopping strategies ----------

const priceAfterHaggle = (seed: string, card: Extract<Card, { type: 'shop' }>, sh: ShopId) =>
  haggle(seed, card.item, sh, card.day)?.price ?? sticker(card.item, sh, card.day)

/** Compare the good shops, ask for less where you can, buy the lowest. */
function bestBargain(card: Extract<Card, { type: 'shop' }>, _s: GameState, seed: string): ShopChoice {
  const good = item(card.item).shops.filter((sh) => shop(sh).quality === 'good')
  const best = good.sort((a, b) => priceAfterHaggle(seed, card, a) - priceAfterHaggle(seed, card, b))[0]
  return { buy: best, haggle: shop(best).haggle !== 'none' }
}

/** Lowest sticker on the card, including the cheap-and-flimsy shop. */
const cheapestBuy = (card: Extract<Card, { type: 'shop' }>): ShopChoice => ({
  buy: [...item(card.item).shops].sort((a, b) => sticker(card.item, a, card.day) - sticker(card.item, b, card.day))[0],
  haggle: false,
})

export const PLANNER: Policy = {
  name: 'planner', plan: RULES.sensiblePlan, borrowOrder: ['spare', 'fun', 'gift', 'needs'],
  shop: bestBargain, invite: () => 'swap', rebuyTorn: true, ringToss: false,
}
export const HOARDER: Policy = { ...PLANNER, name: 'hoarder', invite: () => 'no' }
export const IMPULSIVE: Policy = {
  name: 'impulsive', plan: { needs: 700, gift: 200, fun: 900, spare: 200 }, borrowOrder: ['spare', 'gift', 'needs', 'fun'],
  // wants first: puts the list off, then grabs the lowest sticker on day 3; buys the gift wherever the sign is loudest
  shop: (card) => (card.item === 'gift' ? { buy: 'megasale', haggle: false } : card.canLater ? 'later' : cheapestBuy(card)),
  invite: () => 'yes', rebuyTorn: false, ringToss: true,
}
export const BARGAIN_HUNTER: Policy = {
  ...PLANNER, name: 'bargain',
  shop: (card) => ({ ...(cheapestBuy(card) as { buy: ShopId }), haggle: true }),
}

/** Plays a random but legal game: for the "money is never lost or made up" test. */
export function randomPolicy(rngSeed: string): Policy {
  const r = mulberry32(hashString(rngSeed))
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const cut = [r(), r(), r()].sort()
  const toStep = (x: number) => Math.round((x * RULES.startMoney) / RULES.step) * RULES.step
  const a = toStep(cut[0]), b = toStep(cut[1]), c = toStep(cut[2])
  return {
    name: 'random', plan: { needs: a, gift: b - a, fun: c - b, spare: RULES.startMoney - c },
    borrowOrder: [...(['needs', 'gift', 'fun', 'spare'] as JarId[])].sort(() => r() - 0.5),
    shop: (card) => {
      const x = r()
      if (x < 0.15) return 'later'
      if (x < 0.22) return 'without'
      return { buy: pick(item(card.item).shops), haggle: r() < 0.5 }
    },
    invite: () => pick(['yes', 'swap', 'no'] as Reply[]),
    rebuyTorn: r() < 0.5,
    ringToss: r() < 0.5,
  }
}
