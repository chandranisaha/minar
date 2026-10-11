import { describe, expect, it } from 'vitest'
import { PILLAR_IDS } from '../content/data'
import { K_MIN, aggregate, bandOf, toCsv } from './analytics'
import { demoStudents } from './demo'
import { useNgo } from './store'
import { buildSummary, cleanCode, decodeSummary, encodeSummary, findCodes, parseSummary } from './summary'

const game = (state: object) => ({ 'money-mohalla-v2': JSON.stringify({ state, version: 2 }) })
const played = {
  installId: 'abc-123', classCode: 'hyd-4k7q', language: 'te', persona: 'college', liteMode: true, happy: 72.4, skills: { saving: 0.8, riskSense: 0.2 },
  lifeMomentsUsed: { chai: 2 },
  pillars: { plan: { status: 'complete', bestQuality: 0.9, attempts: 2, brightness: 'bright' }, save: { status: 'in_progress', attempts: 1 } },
}

describe('student summary', () => {
  it('reads a saved game without names or typed text', () => {
    const s = buildSummary({ ...game({ ...played, nickname: 'Priya' }), 'p4.v1': JSON.stringify({ state: { completed: ['C1'], progress: { C1: { wrongTotal: 3, hintUsed: true } } } }) }, 5)
    expect(s).toMatchObject({ cohort: 'HYD-4K7Q', lang: 'te', persona: 'college', lite: true, happy: 72, breaks: 2, p4: { closed: 1, wrong: 3, hints: 1 } })
    expect(s.places.plan).toEqual({ s: 'c', q: 0.9, a: 2, b: 'b' })
    expect(s.places.save.s).toBe('p')
    expect(JSON.stringify(s)).not.toContain('Priya')
    expect(JSON.stringify(s)).not.toContain('abc-123')
  })
  it('survives an empty or broken save', () => {
    expect(buildSummary({}).places.plan.s).toBe('n')
    expect(buildSummary({ 'money-mohalla-v2': '{nope' }).happy).toBe(50)
  })
  it('round-trips through the shareable code, even inside a chat message', () => {
    const s = buildSummary(game(played), 9)
    const code = encodeSummary(s)
    expect(decodeSummary(code)).toEqual(s)
    expect(findCodes(`hi sir, my code is ${code} thanks!`)).toEqual([code])
  })
  it('rejects tampered or foreign codes', () => {
    expect(decodeSummary('MM1.@@@')).toBeNull()
    expect(decodeSummary('hello')).toBeNull()
    expect(parseSummary({ v: 2 })).toBeNull()
    expect(parseSummary({ v: 1, id: 'abcdef', happy: 9999, skills: { saving: 7 } })?.happy).toBe(100)
    expect(parseSummary({ v: 1, id: 'abcdef', skills: { saving: 7 } })?.skills.saving).toBe(1)
  })
  it('cleans class codes', () => expect(cleanCode(' hyd 4k7q!! ')).toBe('HYD4K7Q'))
})

describe('cohort analytics', () => {
  const demo = demoStudents(1)
  it('the demo class is stable and anonymous', () => {
    expect(demo).toHaveLength(48)
    expect(demoStudents(1)).toEqual(demo)
    expect(new Set(demo.map((s) => s.id)).size).toBe(48)
  })
  it('counts the funnel and who has started', () => {
    const v = aggregate(demo)
    expect(v.n).toBe(48)
    expect(v.funnel.map((f) => f.id)).toEqual(PILLAR_IDS)
    expect(v.funnel[0].started).toBeGreaterThanOrEqual(v.funnel[0].cleared)
    expect(v.funnel[0].cleared).toBeGreaterThanOrEqual(v.funnel[3].cleared)
    expect(v.active).toBeLessThanOrEqual(48)
  })
  it('finds a weakest skill and ranks mistakes by how common they are', () => {
    const v = aggregate(demo)
    expect(v.weakestSkill).not.toBeNull()
    const shares = v.mistakes.filter((m) => m.reliable).map((m) => m.share)
    expect([...shares].sort((a, b) => b - a)).toEqual(shares)
  })
  it('hides groups smaller than the minimum', () => {
    const few = demo.slice(0, 3)
    const v = aggregate(few)
    expect(v.languages.every((l) => l.n === 0)).toBe(true)
    expect(v.languages.some((l) => l.hidden)).toBe(true)
    expect(K_MIN).toBe(5)
  })
  it('splits the Happy Index into bands', () => {
    expect([bandOf(80), bandOf(40), bandOf(10)]).toEqual(['bright', 'dim', 'flicker'])
    const v = aggregate(demo)
    expect(v.happy.bright + v.happy.dim + v.happy.flicker).toBe(48)
  })
  it('lists only students who still have places to clear, least started first', () => {
    const q = aggregate(demo).quiet
    expect(q.every((r) => r.missing.length > 0)).toBe(true)
    expect(q.map((r) => r.started)).toEqual([...q.map((r) => r.started)].sort((a, b) => a - b))
  })
  it('handles an empty class', () => {
    const v = aggregate([])
    expect(v).toMatchObject({ n: 0, active: 0, weakestSkill: null, lastSeen: null })
    expect(v.happy.avg).toBeNull()
  })
  it('exports one anonymous line per student', () => {
    const csv = toCsv(demo).split('\n')
    expect(csv).toHaveLength(49)
    expect(csv[0].startsWith('id,class_code')).toBe(true)
  })
})

describe('adding students to a class', () => {
  const code = encodeSummary(buildSummary(game(played), 9))
  it('puts students in the chosen class, even when their own code is different or missing', () => {
    const st = useNgo.getState()
    const a = st.createCohort('Class 11 B')
    const noCode = encodeSummary({ ...buildSummary(game(played), 10), cohort: null, id: 'zzzzzz' })
    const r = useNgo.getState().importText(`from Priya: ${code}
${noCode}`, a)
    expect(r).toMatchObject({ added: 2, found: 2, skipped: 0 })
    const cohort = useNgo.getState().cohorts.find((c) => c.id === a)
    expect(Object.keys(cohort!.students)).toHaveLength(2)
    expect(useNgo.getState().cohorts.some((c) => c.id === 'UNASSIGNED')).toBe(false)
  })
  it('does not double count, and reports text with no codes', () => {
    const a = useNgo.getState().createCohort('Class 12')
    useNgo.getState().importText(code, a)
    expect(useNgo.getState().importText(code, a)).toMatchObject({ added: 0, skipped: 1 })
    expect(useNgo.getState().importText('hello', a)).toMatchObject({ found: 0, added: 0 })
  })
  it('sorts by each student own class code when no class is chosen', () => {
    useNgo.getState().importText(code, null)
    expect(useNgo.getState().cohorts.some((c) => c.id === 'HYD-4K7Q')).toBe(true)
  })
})
