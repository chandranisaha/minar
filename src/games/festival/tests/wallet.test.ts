import { describe, expect, test } from 'vitest'
import { rngFor } from '../../../lib/rng'
import { invite as inviteDef } from '../engine/content'
import { runBot, shopBestBargain, shopBargainHunter, shopImpulsive, type Policy } from '../engine/bots'
import { applyEvent, initialState, replay, walletTotal, EngineError } from '../engine/state'
import { festivalScene } from '../engine/scene'
import { plannerScore, stars } from '../engine/score'
import { POCKETS, type GameEvent, type Pockets, type Reply } from '../engine/types'

/** A random player, seeded, so 1,000 runs explore odd corners of the rules. */
function randomPolicy(seed: string): Policy {
  const r = rngFor(`policy:${seed}`)
  const parts = POCKETS.map(() => r())
  const sum = parts.reduce((a, b) => a + b, 0)
  const plan = Object.fromEntries(POCKETS.map((p, i) => [p, Math.floor((parts[i] / sum) * 200) * 10])) as Pockets
  plan.loose += 2000 - POCKETS.reduce((a, p) => a + plan[p], 0)
  const order = [...POCKETS].sort(() => r() - 0.5)
  const shops = [shopBestBargain, shopBargainHunter, shopImpulsive]
  return {
    name: 'random', plan, raidOrder: order, shop: shops[Math.floor(r() * 3)],
    invite: () => (['yes', 'swap', 'no'] as Reply[])[Math.floor(r() * 3)],
    coverAyesha: r() < 0.5, ringTosses: () => Math.floor(r() * 4), walkWhenBusShort: r() < 0.3, rebuyTornOutfit: r() < 0.5,
  }
}

describe('wallet and raids', () => {
  test('pockets never go negative and money in = spent + left, over 1,000 random runs', () => {
    for (let k = 0; k < 1000; k++) {
      const seed = `r${k}`
      const log = runBot(seed, randomPolicy(seed))
      let s = initialState()
      for (const e of log) {
        s = applyEvent(s, e)
        for (const p of POCKETS) expect(s.pockets[p]).toBeGreaterThanOrEqual(0)
      }
      expect(s.moneyIn).toBe(s.moneyOut + walletTotal(s))
      // same seed and events give identical output
      expect(JSON.stringify([plannerScore(log), stars(s), festivalScene(s)])).toBe(JSON.stringify([plannerScore(log), stars(replay(log)), festivalScene(replay(log))]))
    }
  })
  test('a shortfall cannot be paid without a raid', () => {
    const s = applyEvent(initialState(), { kind: 'plan', day: 1, pockets: { ghar: 100, gift: 0, masti: 0, bus: 20, loose: 1880 } })
    expect(() => applyEvent(s, { kind: 'buy', day: 1, stall: 'daamfix', item: 'sweets', price: 420, quality: 'good' })).toThrow(EngineError)
    const raided = applyEvent(s, { kind: 'raid', day: 1, from: 'loose', to: 'ghar', amount: 320, reason: 'buy:sweets' })
    expect(applyEvent(raided, { kind: 'buy', day: 1, stall: 'daamfix', item: 'sweets', price: 420, quality: 'good' }).raids).toHaveLength(1)
  })
  test('morning rebalancing moves the plan, not counted as a raid', () => {
    const log: GameEvent[] = [
      { kind: 'plan', day: 1, pockets: { ghar: 1100, gift: 300, masti: 400, bus: 60, loose: 140 } },
      { kind: 'plan', day: 2, pockets: { ghar: 1000, gift: 300, masti: 500, bus: 60, loose: 140 } },
    ]
    const s = replay(log)
    expect(s.raids).toHaveLength(0)
    expect(s.planned.ghar).toBe(1000)
    expect(s.planned.masti).toBe(500)
  })
  test('Sunny: "No" costs only -3 friendship', () => {
    expect(inviteDef('I6').noFriendship).toBe(-3)
    const s = replay([{ kind: 'invite', day: 2, id: 'I6', reply: 'no', cost: 0 }])
    expect(s.friendship).toBe(57)
  })
})
