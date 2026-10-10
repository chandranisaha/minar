import { describe, expect, test } from 'vitest'
import { arrivals } from '../engine/dates'
import { FUTURES } from '../engine/content'
import { runPlan } from '../engine/run'
import { POINTS, type Choices, type Contract, type GoalId, type Plan } from '../engine/types'
import reference from './fixtures/reference.json'

const planOf = (e: (typeof reference)[number]): Plan => ({ contracts: e.contracts.map((c) => ({ id: c.id, haggles: c.h, qty: c.q, late: c.l }) as Contract), ranks: e.ranks as GoalId[] })

describe('the date screen\'s "money in" lines', () => {
  test('add up to the ledger\'s arrivals on every date, in every future, for every verified plan', () => {
    for (const e of reference) {
      for (const f of FUTURES) {
        const r = runPlan(planOf(e), f.id, e.choices as Choices)
        for (const p of POINTS) {
          const sum = arrivals(p, f.id, r).reduce((a, l) => a + l.amount, 0)
          expect(Math.round(sum), `${e.name} ${f.id} ${p}`).toBe(Math.round(r.ledger[p]!.arr))
        }
      }
    }
  })
  test('the played future F2: donation in Week 2, the sponsor and the crowd on Festival Day', () => {
    const r = runPlan(planOf(reference[0]), 'F2')
    expect(arrivals('W2', 'F2', r).map((l) => l.key)).toEqual(['donation'])
    expect(arrivals('W3', 'F2', r)).toEqual([])
    expect(arrivals('FD', 'F2', r).map((l) => l.key)).toEqual(['sponsor', 'event'])
  })
  test('the shortfall pause says what was due and what was in hand', () => {
    const planA = { contracts: [{ id: 'hall', haggles: 0, qty: 1, late: false }, { id: 'reliable', haggles: 0, qty: 1, late: false }, { id: 'lights', haggles: 0, qty: 1, late: false }, { id: 'plates', haggles: 0, qty: 450, late: false }, { id: 'kids', haggles: 0, qty: 1, late: false }, { id: 'p1', haggles: 0, qty: 1, late: false }] }
    const r = runPlan(planA, 'F2', {}, { mode: 'play' })
    expect(r.pending).toMatchObject({ point: 'W3', need: 3630 })
    expect(r.pending!.due - r.pending!.cash).toBe(3630)
  })
})
