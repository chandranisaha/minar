import { describe, expect, test } from 'vitest'
import { floorFor, priceFor, wasPriceFor } from '../engine/prices'
import type { ItemId, StallId } from '../engine/types'

// Day-1 sticker table from the spec (null = stall doesn't sell it)
const TABLE: Record<ItemId, Partial<Record<StallId, number>>> = {
  sweets: { daamfix: 420, chacha: 460 },
  decor: { daamfix: 120, chacha: 130, megasale: 140, sasta: 80 },
  outfit: { daamfix: 400, aunty: 520, megasale: 460, sasta: 260 },
  small: { daamfix: 110, chacha: 120, aunty: 140 },
  gift: { daamfix: 300, aunty: 390, megasale: 350 },
}

describe('prices', () => {
  test('day-1 stickers match the spec table', () => {
    for (const [i, row] of Object.entries(TABLE)) for (const s of ['daamfix', 'chacha', 'aunty', 'megasale', 'sasta'] as StallId[])
      expect(priceFor(i as ItemId, s, 1)).toBe(row[s] ?? null)
  })
  test('Mega Sale "was" prices are double', () => {
    expect(wasPriceFor('decor', 'megasale', 1)).toBe(280)
    expect(wasPriceFor('outfit', 'megasale', 1)).toBe(920)
    expect(wasPriceFor('gift', 'megasale', 1)).toBe(700) // spec shows ₹690; 350 x 2 rounds to 700
  })
  test('day multipliers and floors', () => {
    expect(priceFor('outfit', 'daamfix', 3)).toBe(500)
    expect(priceFor('sweets', 'daamfix', 2)).toBe(460)
    expect(floorFor('outfit', 'aunty', 1)).toBe(360)
    expect(floorFor('gift', 'megasale', 1)).toBe(330)
  })
  test('Mega Sale floor is never below Daam Fix', () => {
    for (const d of [1, 2, 3] as const) for (const i of ['outfit', 'gift', 'decor'] as ItemId[])
      expect(floorFor(i, 'megasale', d)!).toBeGreaterThanOrEqual(priceFor(i, 'daamfix', d)!)
  })
})
