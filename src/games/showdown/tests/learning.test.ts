import { describe, expect, test } from 'vitest'
import { factsOf, lowestConcepts, masteryOf } from '../engine/concepts'
import { lessonFor } from '../engine/lessons'
import type { Decision } from '../engine/log'
import { reportOf, toGameResult } from '../engine/report'
import { optionOrder, pickTransfer, transferAnswers } from '../engine/transfer'
import { presetLog } from '../state/presets'

const ANSWERS: Decision[] = [{ k: 'predict', id: 'P2', answer: 'reliable' }, { k: 'predict', id: 'P4', answer: 'parts' }]
const planB = (): Decision[] => [...presetLog('B', 'transfer'), ...ANSWERS]
const planA = (): Decision[] => [...presetLog('A', 'transfer')]
const transfer = (ids: string[], answer: string): Decision[] => ids.map((id) => ({ k: 'transfer', id, answer }))

describe('what play shows about each concept (section 9: prediction + behaviour)', () => {
  test('Plan B shows every concept: both signals met on all six', () => {
    const f = factsOf(planB())
    for (const c of Object.keys(f.signals) as (keyof typeof f.signals)[]) expect(f.signals[c], c).toMatchObject({ prediction: true, flag: true })
  })
  test('Plan A: the late payment and the cancelled sound are exactly what the signals pick up', () => {
    const f = factsOf(planA())
    expect(f.signals.C1).toMatchObject({ prediction: true, flag: false }) // it guessed "no" and Week 3 did break
    expect(f.signals.C2).toMatchObject({ prediction: true, flag: false }) // two goals met, but an item was cancelled
    expect(f.signals.C5).toMatchObject({ prediction: false, flag: false }) // thin cushion, survived 3 of 10
    expect(f.signals.C4).toMatchObject({ prediction: false, flag: true }) // P2 never asked, but Basic was not signed
    expect(f.survived).toBe(3)
  })
  test('the three lowest concepts get a transfer question (ties in concept order)', () => {
    expect(lowestConcepts(factsOf(planA()))).toEqual(['C5', 'C1', 'C2'])
    expect(pickTransfer(planA())).toEqual(['T5', 'T1', 'T2'])
    expect(pickTransfer(planB())).toEqual(['T1', 'T2', 'T3']) // all tied, so the first three
  })
  test('"not sure" is no point and is logged as unsure', () => {
    const log = [...presetLog('B', 'transfer'), { k: 'predict', id: 'P2', answer: 'unsure' } as Decision, { k: 'predict', id: 'P4', answer: 'parts' } as Decision]
    expect(factsOf(log).signals.C4).toMatchObject({ prediction: false, unsure: true })
  })
})

describe('mastery and the minaret', () => {
  test('Got it = 3 points, Getting there = 2, otherwise Not yet; only a concept fully shown in play is credited an unasked transfer point', () => {
    const f = factsOf(planB())
    const m = masteryOf(f, {})
    expect([m.C1.level, m.C2.level, m.C3.level, m.C4.level, m.C5.level, m.C7.level]).toEqual(['getting', 'getting', 'getting', 'got', 'got', 'got'])
    const all = masteryOf(f, { C1: true, C2: true, C3: true })
    expect(Object.values(all).every((x) => x.level === 'got')).toBe(true)
    // a weak concept that was simply not asked is not inflated: Plan A's Total cost (1 point) stays "Not yet"
    expect(masteryOf(factsOf(planA()), {}).C4).toEqual({ points: 1, level: 'not' })
    expect(masteryOf(factsOf(planA()), {}).C3.level).toBe('got')
  })
  test('the minaret needs at least 4 of 6 concepts at "Getting there" or better', () => {
    expect(reportOf([...planB(), ...transfer(pickTransfer(planB()), 'ok')]).minaretLit).toBe(true)
    expect(reportOf([...planA(), ...transfer(pickTransfer(planA()), 'unsure')]).minaretLit).toBe(false)
    // Plan A with every transfer question right still does not light it: only 3 of 6 concepts reach "Getting there"
    const lifted = reportOf([...planA(), ...transfer(pickTransfer(planA()), 'ok')])
    expect(lifted.minaretLit).toBe(false)
    expect(Object.values(lifted.mastery).filter((m) => m.level !== 'not')).toHaveLength(3)
  })
})

describe('the report and the result for the hub', () => {
  test('scores: Plan B 98 and Plan A 45, with the title and stars from the spec', () => {
    const b = reportOf(planB())
    expect(b.score).toMatchObject({ goals: 40, onTime: 20, resilience: 18, smart: 20, total: 98 })
    expect(b.title).toBe('master')
    expect(b.stars).toEqual({ goals: true, onTime: true, resilient: true, cleanBooks: true })
    const a = reportOf(planA())
    expect(a.score.total).toBe(45)
    expect(a.title).toBe('careful')
  })
  test('the lessons on the report are for the three lowest concepts, in the player\'s own numbers', () => {
    const a = reportOf([...planA(), ...transfer(pickTransfer(planA()), 'unsure')])
    expect(a.lowest).toEqual(['C5', 'C1', 'C2'])
    expect(a.lessons.map((l) => l.id)).toEqual(['L5', 'L1', 'L2'])
    expect(a.lessons[1]).toMatchObject({ key: 'L1.what', vars: { when: 'W3', due: 10500, cash: 6870 } })
    expect(a.lessons[2]).toMatchObject({ key: 'L2.what', vars: { item: 'reliable', goal: 'G3' } })
    expect(a.lessons[0]).toMatchObject({ key: 'L5.what', vars: { k: 3 } })
  })
  test('predictions are revealed with the truth; P1 is a made-up 12% rise', () => {
    const r = reportOf(planB())
    expect(r.predictions.map((p) => [p.id, p.truth, p.correct])).toEqual([['P1', '12', true], ['P2', 'reliable', true], ['P3', 'yes', true], ['P4', 'parts', true]])
  })
  test('the result has the shape the hub expects and holds no personal data', () => {
    const log = [...planB(), ...transfer(pickTransfer(planB()), 'ok')]
    const res = toGameResult(reportOf(log), 'K7M2', 'local', ['L1'])
    expect(res).toMatchObject({ game: 'festival', cohortCode: 'local', seed: 'K7M2', minaretLit: true, stars: { goals: true, onTime: true, resilient: true, cleanBooks: true }, score: { total: 98 } })
    expect(res.evidence).toMatchObject({ C1: 3, C2: 3, C3: 3, C4: 3, C5: 3, C7: 3, futuresSurvived: 9 })
    expect(JSON.stringify(res)).not.toMatch(/@|phone|name/i)
  })
  test('Learn-more variants exist for every card, and the lesson line changes with what the player did', () => {
    const f = factsOf(planB())
    expect(lessonFor('C1', planB(), f).key).toBe('L1.ok')
    expect(lessonFor('C4', planB(), f).key).toBe('L4.skip')
    const withBasic = [...presetLog('B', 'market'), { k: 'drop', item: 'big' } as Decision, { k: 'sign', item: 'basic' } as Decision]
    expect(lessonFor('C4', withBasic, factsOf(withBasic)).key).toBe('L4.what')
  })
})

describe('transfer questions', () => {
  test('option order is shuffled but the same for the same code; "not sure" is always last', () => {
    expect(optionOrder('K7M2', 'T1')).toEqual(optionOrder('K7M2', 'T1'))
    expect(optionOrder('K7M2', 'T1').at(-1)).toBe('unsure')
    expect([...optionOrder('K7M2', 'T1')].sort()).toEqual(['ok', 'unsure', 'w1', 'w2'])
    const orders = new Set(['AAAA', 'BBBB', 'CCCC', 'DDDD', 'EEEE', 'FFFF'].map((c) => optionOrder(c, 'T3').join()))
    expect(orders.size).toBeGreaterThan(1)
  })
  test('answers are read from the log: only "ok" is correct', () => {
    expect(transferAnswers([{ k: 'transfer', id: 'T1', answer: 'ok' }, { k: 'transfer', id: 'T5', answer: 'w1' }, { k: 'transfer', id: 'T2', answer: 'unsure' }])).toEqual({ C1: true, C5: false, C2: false })
  })
})
