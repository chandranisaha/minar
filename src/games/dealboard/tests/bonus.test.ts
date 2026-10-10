import { describe, expect, test } from 'vitest'
import { act, newRun, pitchFor, marketFor } from '../engine/run'
import { BONUS_CASH, bonusFor } from '../engine/bonus'
import type { Action } from '../engine/run'
import en from '../content/judgement.json'

/** plays quarter 1 by passing, so quarter 2's desk opens */
const toQuarter2 = (seed: string) => {
  let r = act(newRun(seed), { type: 'brief' } as Action)
  const id = pitchFor(r, marketFor(seed))!
  r = act(r, { type: 'pass', companyId: id })
  return r
}

describe('bonus question', () => {
  test('none in quarter 1; one in later quarters; right answer pays once', () => {
    const r1 = act(newRun('b1'), { type: 'brief' } as Action)
    expect(bonusFor(r1)).toBeNull()
    let r = toQuarter2('b1')
    while (r.phase !== 'desk') r = act(r, { type: 'continue' })
    expect(r.turn).toBe(2)
    expect(bonusFor(r)).not.toBeNull()
    const before = r.cash
    const wrong = act(r, { type: 'bonus', choice: 1 })
    expect(wrong.cash).toBe(before)
    expect(bonusFor(wrong)).toBeNull()
    const right = act(r, { type: 'bonus', choice: 0 })
    expect(right.cash).toBe(before + BONUS_CASH)
    expect(act(right, { type: 'bonus', choice: 0 }).cash).toBe(before + BONUS_CASH)
  })

  test('every question has all its text', () => {
    for (let n = 0; n < 8; n++) {
      const q = (en.bonus.q as Record<string, Record<string, string>>)[String(n)]
      expect(Object.keys(q).sort()).toEqual(['a0', 'a1', 'a2', 'q', 'why'])
    }
  })
})
