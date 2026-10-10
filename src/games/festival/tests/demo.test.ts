import { describe, expect, test } from 'vitest'
import demo from '../content/demo.json'
import { IMPULSIVE, PLANNER, runBot } from '../engine/bots'
import { plannerScore, stars } from '../engine/score'
import { replay, walletTotal } from '../engine/state'
import type { GameEvent } from '../engine/types'

describe('Demo mode', () => {
  test('replaying demo.json reproduces the frozen values exactly', () => {
    for (const k of ['planner', 'impulsive'] as const) {
      const d = demo[k]
      const log = d.log as GameEvent[]
      const s = replay(log)
      expect({ spent: s.spent, left: walletTotal(s), score: plannerScore(log).total, stars: stars(s), walked: s.walked }).toEqual(d.expect)
    }
  })
  test('the spec demo run: ₹275 left, score 100, 4 stars', () => {
    expect(demo.planner.expect).toMatchObject({ left: 275, score: 100, spent: { ghar: 1030, gift: 290, masti: 265, bus: 60 } })
  })
  test('demo.json is what the engine produces for seed DEMO today', () => {
    expect(runBot('DEMO', PLANNER)).toEqual(demo.planner.log)
    expect(runBot('DEMO', IMPULSIVE)).toEqual(demo.impulsive.log)
  })
})
