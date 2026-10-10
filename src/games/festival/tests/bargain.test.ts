import { describe, expect, test } from 'vitest'
import { callbackFor, isClosed, offerFor, patienceLeft, respond, stallState } from '../engine/bargain'
import type { GameEvent } from '../engine/types'

describe('bargaining: the five rules', () => {
  const aunty = stallState([], 'aunty', 'outfit', 1)
  test('worked examples from the spec', () => {
    expect(offerFor(520, 'low')).toBe(310)
    expect(respond(aunty, 310)).toEqual({ result: 'counter', counter: 420, patience: 2 })
    expect(respond(aunty, 390).result).toBe('accept')
    const chacha = stallState([], 'chacha', 'sweets', 1)
    expect(offerFor(460, 'fair')).toBe(350)
    expect(respond(chacha, 350)).toEqual({ result: 'counter', counter: 410, patience: 3 })
  })
  test('insult below 80% of floor: patience -2, counter at 95% of sticker', () => {
    expect(respond(aunty, 200)).toEqual({ result: 'insult', counter: 490, patience: 1 })
  })
  test('patience 0 closes the stall for the day, resets tomorrow', () => {
    const log: GameEvent[] = [
      { kind: 'offer', day: 1, stall: 'megasale', item: 'gift', offer: 210, result: 'closed' },
    ]
    expect(respond(stallState([], 'megasale', 'gift', 1), 210).result).toBe('closed')
    expect(isClosed(log, 'megasale', 1)).toBe(true)
    expect(isClosed(log, 'megasale', 2)).toBe(false)
    expect(patienceLeft(log, 'megasale', 2)).toBe(2)
  })
  test('Aunty call-back is seeded, about 60%, at floor +5%', () => {
    let hits = 0
    for (let k = 0; k < 2000; k++) {
      const a = callbackFor(`s${k}`, [], 'aunty', 'outfit', 1)
      expect(a).toBe(callbackFor(`s${k}`, [], 'aunty', 'outfit', 1))
      if (a) { hits++; expect(a).toBe(380) }
    }
    expect(hits / 2000).toBeGreaterThan(0.55)
    expect(hits / 2000).toBeLessThan(0.65)
    expect(callbackFor('x', [], 'chacha', 'sweets', 1)).toBeUndefined()
  })
})
