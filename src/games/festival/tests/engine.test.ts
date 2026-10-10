import { describe, expect, test } from 'vitest'
import { BARGAIN_HUNTER, HOARDER, IMPULSIVE, PLANNER, randomPolicy, runBot } from '../engine/bots'
import { cardsFor, currentCard } from '../engine/deck'
import { explain, ideasFelt } from '../engine/explain'
import { festivalScene } from '../engine/scene'
import { haggle, sticker, wasPrice } from '../engine/shop'
import { replay, walletTotal } from '../engine/state'
import { minaretLit, score, starCount, stars } from '../engine/score'
import { JARS, sumJars, type GameEvent } from '../engine/types'

const SEEDS = Array.from({ length: 1000 }, (_, i) => `seed-${i}`)

describe('prices', () => {
  test('day-1 stickers on each shopping card', () => {
    expect([sticker('sweets', 'daamfix', 1), sticker('sweets', 'chacha', 1), sticker('sweets', 'megasale', 1)]).toEqual([420, 460, 480])
    expect([sticker('outfit', 'aunty', 1), sticker('outfit', 'megasale', 1), sticker('outfit', 'sasta', 1)]).toEqual([520, 460, 260])
    expect(wasPrice('outfit', 'megasale', 1)).toBe(920)
  })
  test('prices rise 10% on day 2 and 25% on day 3', () => {
    expect([1, 2, 3].map((d) => sticker('sweets', 'daamfix', d as 1 | 2 | 3))).toEqual([420, 460, 530])
  })
  test('asking for less follows each shopkeeper, and only Aunty is a (seeded) gamble', () => {
    expect(haggle('x', 'sweets', 'daamfix', 1)).toBeNull()
    expect(haggle('x', 'sweets', 'chacha', 1)).toEqual({ result: 'counter', price: 410 })
    expect(haggle('x', 'outfit', 'megasale', 1)).toEqual({ result: 'counter', price: 450 })
    const aunty = SEEDS.map((s) => haggle(s, 'outfit', 'aunty', 1)!)
    expect(new Set(aunty.map((a) => a.result))).toEqual(new Set(['counter', 'refuse']))
    expect(aunty.filter((a) => a.result === 'counter').every((a) => a.price === 420)).toBe(true)
    expect(haggle('same', 'outfit', 'aunty', 1)).toEqual(haggle('same', 'outfit', 'aunty', 1))
  })
})

describe('deck', () => {
  test('a day is a short run of cards (about 5 per day)', () => {
    const log = runBot('DEMO', PLANNER)
    for (const d of [1, 2, 3] as const) expect(cardsFor(log, d).length).toBeLessThanOrEqual(6)
    expect(currentCard(log)).toBeNull()
  })
  test('"Buy later" brings the card back the next day at the higher price', () => {
    const log: GameEvent[] = [{ kind: 'plan', jars: { needs: 1000, gift: 300, fun: 400, spare: 300 } }, { kind: 'seen', day: 1, card: 'd1:banner' }, { kind: 'later', day: 1, card: 'd1:shop:sweets', item: 'sweets' }]
    expect(cardsFor(log, 2).map((c) => c.id)).toContain('d2:shop:sweets')
  })
  test('the torn-outfit card appears only after a cheap outfit from before day 3', () => {
    const sasta = runBot('t', { ...PLANNER, shop: (c) => (c.item === 'outfit' ? { buy: 'sasta', haggle: false } : PLANNER.shop(c, replay([]), 't')) })
    expect(cardsFor(sasta, 3).some((c) => c.type === 'torn')).toBe(true)
    expect(cardsFor(runBot('t', PLANNER), 3).some((c) => c.type === 'torn')).toBe(false)
  })
})

describe('money is never lost or made up', () => {
  test('jars never go negative and money in = spent + left, over 1,000 random games', () => {
    for (const seed of SEEDS) {
      const log = runBot(seed, randomPolicy(seed))
      const s = replay(log)
      expect(JARS.every((j) => s.jars[j] >= 0)).toBe(true)
      expect(sumJars(s.spent) + walletTotal(s)).toBe(2000 + (s.sunnyRepaid ?? 0))
      expect(s.ended).toBe(true)
    }
  })
  test('same seed and same choices give the same game', () => {
    expect(runBot('repeat', IMPULSIVE)).toEqual(runBot('repeat', IMPULSIVE))
  })
})

describe('balance (bots over 1,000 seeds)', () => {
  const runs = (p: typeof PLANNER) => SEEDS.map((seed) => replay(runBot(seed, p)))
  test('Planner: 4 stars, score 95+, minaret lit', () => {
    for (const s of runs(PLANNER)) {
      expect(starCount(stars(s))).toBe(4)
      expect(score(s).total).toBeGreaterThanOrEqual(95)
    }
  })
  test('Impulsive: the minaret stays dark', () => {
    for (const s of runs(IMPULSIVE)) {
      expect(starCount(stars(s))).toBeLessThanOrEqual(2)
      expect(minaretLit(stars(s), score(s))).toBe(false)
    }
  })
  test('Hoarder: saying no to everything loses the Dost star', () => {
    for (const s of runs(HOARDER)) expect(stars(s)).toEqual({ ghar: true, gift: true, dost: false, plan: true })
  })
  test('Bargain hunter: the cheap outfit tears and the rebuy breaks the plan', () => {
    for (const s of runs(BARGAIN_HUNTER)) {
      expect(s.tornChoice).toBe('rebuy')
      expect(stars(s).plan).toBe(false)
    }
  })
})

describe('every choice explains itself', () => {
  test('each resolved card (except day banners) has an outcome line', () => {
    for (const p of [PLANNER, IMPULSIVE, HOARDER, BARGAIN_HUNTER]) {
      const log = runBot('DEMO', p)
      for (const e of log) if ('card' in e && e.kind !== 'borrow' && e.kind !== 'haggle' && e.kind !== 'seen') expect(explain(log, e.card)?.lines.length).toBeGreaterThan(0)
    }
  })
  test('the planner and the impulsive run feel different ideas', () => {
    expect(ideasFelt(runBot('DEMO', PLANNER))).toEqual(expect.arrayContaining(['compare', 'swap', 'buffer']))
    expect(ideasFelt(runBot('DEMO', IMPULSIVE))).toEqual(expect.arrayContaining(['early', 'fakesale', 'odds']))
  })
  test('festival morning shows the difference', () => {
    expect(festivalScene(replay(runBot('DEMO', PLANNER)))).toMatchObject({ lights: 'full', sweets: true, brother: 'new', gift: true, friends: true })
    expect(festivalScene(replay(runBot('DEMO', IMPULSIVE)))).toMatchObject({ lights: 'half', brother: 'torn' })
  })
})
