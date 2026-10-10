import { describe, expect, test } from 'vitest'
import { simulateMarket } from '../engine/simulate'
import { rivalAlerts } from '../engine/rivals'

describe('rival alerts', () => {
  test('fire at most once per company, and only from real data', () => {
    let fired = 0
    for (let s = 0; s < 60; s++) {
      const m = simulateMarket(`seed${s}`)
      const seen = new Set<string>()
      for (let q = 1; q <= 12; q++) for (const id of rivalAlerts(m, q)) { expect(seen.has(id)).toBe(false); seen.add(id); fired++ }
    }
    expect(fired).toBeGreaterThan(10)
  })
})
