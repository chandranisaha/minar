import { describe, expect, test } from 'vitest'
import { act, canBuy, decisionQ, marketFor, needsDecision, newRun, pitchFor, tileAt, type RunState } from '../engine/run'
import { explainQuarter } from '../engine/explain'
import { COMPANY_IDS } from '../engine/companies'

/** A seed whose first landing is an Auction tile, so a pitch happens in quarter 1 or soon after. */
function seedWithAuction(max = 6) {
  for (let i = 0; i < 400; i++) {
    const m = marketFor(`flow-${i}`)
    const t = m.positions.findIndex((p, k) => k > 0 && k <= max && m.tiles[p] === 'auction')
    if (t > 0) return { seed: `flow-${i}`, t, m }
  }
  throw new Error('no seed')
}

describe('one decision per quarter', () => {
  test('quiet tiles resolve in one step and decision tiles are flagged', () => {
    let seen = 0
    for (let i = 0; i < 40; i++) {
      const m = marketFor(`q-${i}`)
      const run = { ...newRun(`q-${i}`), turn: 1, phase: 'land' as const }
      const tile = tileAt(run, m)
      const decides = needsDecision(run, m)
      expect(decides).toBe(tile === 'bank' || tile === 'auction')
      if (!decides) {
        const after = act(run, { type: 'resolve' })
        expect(['news', 'lesson', 'yearEnd', 'emergency']).toContain(after.phase)
        expect(after.recap?.tile).toBe(tile)
        seen++
      }
    }
    expect(seen).toBeGreaterThan(5)
  })

  test('buying claims the auction tile; selling everything gives it back', () => {
    const { seed, t, m } = seedWithAuction()
    let run: RunState = { ...newRun(seed), turn: t, phase: 'land' }
    const id = pitchFor(run, m)!
    const tile = m.positions[t]
    run = act(run, { type: 'bid', companyId: id, amount: 10000, reason: 'dataSays' })
    expect(run.owners[tile]).toBe(id)
    expect(run.holdings[id]).toBeDefined()
    // sell everything in the next briefing
    if (run.phase === 'lesson') run = act(run, { type: 'continue' })
    expect(run.phase).toBe('news')
    run = act(run, { type: 'sell', companyId: id, fraction: 1, reason: 'other' })
    expect(run.holdings[id]).toBeUndefined()
    expect(run.owners[tile]).toBeUndefined()
  })

  test('landing on your own property needs no decision and ask/bid are refused there', () => {
    const { seed, t, m } = seedWithAuction()
    const tile = m.positions[t]
    const base: RunState = { ...newRun(seed), turn: t, phase: 'land', owners: { [tile]: m.picked[0] }, holdings: { [m.picked[0]]: { units: 10, cost: 1000, since: 1 } } }
    expect(needsDecision(base, m)).toBe(false)
    expect(act(base, { type: 'ask', companyId: m.picked[1], light: 'cash' })).toBe(base)
    expect(act(base, { type: 'bid', companyId: m.picked[1], amount: 10000, reason: 'other' })).toBe(base)
    const after = act(base, { type: 'resolve' })
    expect(after.recap?.ownTile).toBe(m.picked[0])
  })

  test('buying and selling in the briefing belong to the coming quarter', () => {
    const { seed, m } = seedWithAuction()
    const id = m.picked[0]
    let run: RunState = { ...newRun(seed), turn: 1, phase: 'news', cash: 60000, holdings: { [id]: { units: 100, cost: 10000, since: 1 } } }
    expect(decisionQ(run)).toBe(2)
    run = act(run, { type: 'buyMore', companyId: id, amount: 5000, reason: 'dataSays' })
    expect(run.log.at(-1)).toMatchObject({ type: 'INVEST', q: 2 })
    expect(run.cash).toBe(55000)
    run = act(run, { type: 'sell', companyId: id, fraction: 0.5, reason: 'other' })
    expect(run.log.at(-1)).toMatchObject({ type: 'SELL', q: 2 })
  })

  test('a panic sell made in the briefing still counts for jail in that quarter', () => {
    for (let i = 0; i < 400; i++) {
      const m = marketFor(`dip-${i}`)
      if (m.fallQ > 10) continue
      const t = m.fallQ
      const id = 'dailyBasket'
      const price = m.history[id][t - 1].price
      let run: RunState = {
        ...newRun(`dip-${i}`), turn: t - 1, phase: 'news', cash: 50000, holdings: { [id]: { units: 400, cost: 40000, since: 1 } },
        turnStartInvested: 400 * price, briefed: true,
      }
      run = act(run, { type: 'sell', companyId: id, fraction: 1, reason: 'scaredLoss' })
      run = act(run, { type: 'roll' })
      run = act(run, { type: 'resolve' })
      expect(run.jails).toBe(1)
      expect(canBuy({ ...run, phase: 'news' })).toBe(false)
      return
    }
  })

  test('the introduction is recorded once', () => {
    const run = act(newRun('x'), { type: 'brief' })
    expect(run.briefed).toBe(true)
    expect(act(run, { type: 'brief' })).toBe(run)
  })
})

describe('why a price moved', () => {
  const m = marketFor('why-1')

  test('a broad market fall is named as a reason, for every company', () => {
    const q = m.fallQ
    for (const id of COMPANY_IDS) {
      const { reasons } = explainQuarter(m, id, q)
      expect(reasons.some((r) => r.key === 'market.fell')).toBe(m.history[id][q].failed === false || true)
      expect(reasons.length).toBeGreaterThan(0)
      expect(reasons.length).toBeLessThanOrEqual(3)
    }
    expect(explainQuarter(m, 'dailyBasket', q).reasons.map((r) => r.key)).toContain('market.fell')
  })

  test('PayEasy rising while losses grow is called excitement, not earnings', () => {
    let found = false
    for (let i = 0; i < 40 && !found; i++) {
      const mm = marketFor(`hype-${i}`)
      for (let q = 2; q <= 6; q++) {
        const { move, reasons } = explainQuarter(mm, 'payEasy', q)
        if (move > 0.04 && mm.history.payEasy[q].profit < mm.history.payEasy[q - 1].profit) {
          expect(reasons.map((r) => r.key)).toContain('excitement')
          found = true
          break
        }
      }
    }
    expect(found).toBe(true)
  })

  test('a failed company is explained by its failure', () => {
    for (let i = 0; i < 60; i++) {
      const mm = marketFor(`fail-${i}`)
      if (mm.payEasyPath !== 'fail') continue
      expect(explainQuarter(mm, 'payEasy', 10).reasons[0].key).toBe('event.failed')
      return
    }
  })

  test('a quiet quarter says so instead of inventing a story', () => {
    let quiet = 0
    for (let i = 0; i < 60; i++) {
      const mm = marketFor(`quiet-${i}`)
      for (let q = 1; q <= 3; q++) if (explainQuarter(mm, 'dailyBasket', q).reasons[0].key === 'steady') quiet++
    }
    expect(quiet).toBeGreaterThan(0)
  })
})
