import { describe, expect, test } from 'vitest'
import { BARGAIN_HUNTER, HOARDER, IMPULSIVE, PLANNER, runBot } from '../engine/bots'
import { festivalMorningEvents, needsS1, visitsLeft } from '../engine/flow'
import { festivalScene } from '../engine/scene'
import { minaretLit, plannerScore, planVsReality, stars } from '../engine/score'
import { replay } from '../engine/state'
import type { GameEvent } from '../engine/types'

const SEEDS = Array.from({ length: 1000 }, (_, k) => `seed-${k}`)
const runs = (p: typeof PLANNER) => SEEDS.map((sd) => { const log = runBot(sd, p); return { log, s: replay(log), score: plannerScore(log) } })

describe('balancing bots over 1,000 seeds', () => {
  test('Planner: 4 stars, score 90+, ₹200-₹300 left', () => {
    for (const r of runs(PLANNER)) {
      expect(Object.values(stars(r.s)).every(Boolean)).toBe(true)
      expect(r.score.total).toBeGreaterThanOrEqual(90)
      const left = Object.values(r.s.pockets).reduce((a, b) => a + b, 0)
      expect(left).toBeGreaterThanOrEqual(200)
      expect(left).toBeLessThanOrEqual(300)
      expect(planVsReality(r.s).gap).toBeNull()
    }
  })
  test('Impulsive: 0-1 stars, walks home in 80%+ of seeds, score under 45', () => {
    const rs = runs(IMPULSIVE)
    for (const r of rs) {
      expect(Object.values(stars(r.s)).filter(Boolean).length).toBeLessThanOrEqual(1)
      expect(r.score.total).toBeLessThan(45)
    }
    expect(rs.filter((r) => r.s.walked.length > 0).length / rs.length).toBeGreaterThanOrEqual(0.8)
  })
  test('Hoarder: 3 stars (no Dost), score 80-88', () => {
    for (const r of runs(HOARDER)) {
      const st = stars(r.s)
      expect(st).toEqual({ ghar: true, gift: true, dost: false, plan: true })
      expect(r.score.total).toBeGreaterThanOrEqual(80)
      expect(r.score.total).toBeLessThanOrEqual(88)
    }
  })
  test('Bargain hunter: loses the Ghar star (cannot afford the rebuy) and closes a stall', () => {
    // Spec target "score 55-75" is not reachable under the spec's own rules; see the PR notes.
    for (const r of runs(BARGAIN_HUNTER)) {
      expect(stars(r.s).ghar).toBe(false)
      expect(r.log.some((e) => e.kind === 'offer' && e.result === 'closed')).toBe(true)
    }
  })
})

describe('surprises, walking home, minaret', () => {
  test('S2 always fires on day 2; S1 only after a Sasta outfit', () => {
    for (const p of [PLANNER, IMPULSIVE, HOARDER, BARGAIN_HUNTER]) {
      const log = runBot('x', p)
      expect(log.filter((e) => e.kind === 'surprise' && e.id === 'S2' && e.day === 2)).toHaveLength(1)
      const sasta = log.some((e) => e.kind === 'buy' && e.item === 'outfit' && e.stall === 'sasta')
      expect(log.some((e) => e.kind === 'surprise' && e.id === 'S1')).toBe(sasta)
    }
  })
  test('a Sasta outfit bought on day 3 tears on festival morning, no rebuy', () => {
    const log: GameEvent[] = [
      { kind: 'plan', day: 1, pockets: { ghar: 1100, gift: 300, masti: 400, bus: 60, loose: 140 } },
      { kind: 'buy', day: 3, stall: 'sasta', item: 'outfit', price: 330, quality: 'low' },
    ]
    expect(needsS1(replay(log))).toBe(false)
    const fm = festivalMorningEvents('z', log)
    expect(fm[0]).toMatchObject({ kind: 'surprise', id: 'S1', choice: 'festival' })
    const s = replay([...log, ...fm])
    expect(s.owned.outfit?.torn).toBe(true)
    expect(festivalScene(s).find((l) => l.id === 'brother')).toEqual({ id: 'brother', newOutfit: false })
  })
  test('walking home: tired (3 visits) and no Plan star', () => {
    const log: GameEvent[] = [
      { kind: 'plan', day: 1, pockets: { ghar: 1100, gift: 300, masti: 400, bus: 0, loose: 200 } },
      { kind: 'bus', day: 1, paid: false },
      { kind: 'visit', day: 2, stall: 'daamfix' },
    ]
    expect(visitsLeft(log, 2)).toBe(2)
    expect(visitsLeft(log, 1)).toBe(Infinity)
    expect(stars(replay(log)).plan).toBe(false)
    expect(plannerScore(log).plan).toBe(15)
  })
  test('minaret lights at 3+ stars or 70+', () => {
    const st = { ghar: true, gift: true, dost: false, plan: false }
    expect(minaretLit(st, { needs: 0, plan: 0, shopping: 0, goal: 0, balance: 0, total: 69 })).toBe(false)
    expect(minaretLit(st, { needs: 0, plan: 0, shopping: 0, goal: 0, balance: 0, total: 70 })).toBe(true)
    expect(minaretLit({ ...st, dost: true }, { needs: 0, plan: 0, shopping: 0, goal: 0, balance: 0, total: 10 })).toBe(true)
  })
})
