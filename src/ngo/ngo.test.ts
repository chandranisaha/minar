import { describe, expect, it } from 'vitest'
import { PILLAR_IDS } from '../content/data'
import { K_MIN, aggregate, bandOf, toCsv } from './analytics'
import { demoHistory, demoStudents } from './demo'
import { toCsvText } from './export'
import { focusAreas, studentInsight, understanding, weeklyTrend } from './insights'
import { labelKey, latestOf, useNgo } from './store'
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

describe('adding students to a class (device mode)', () => {
  const code = encodeSummary(buildSummary(game(played), 9))
  const cls = (id: string) => useNgo.getState().local.find((c) => c.id === id)
  it('puts students in the chosen class, even when their own code is different or missing', async () => {
    const a = await useNgo.getState().createCohort('Class 11 B')
    expect(a).toMatch(/^HYD-[A-Z0-9]{5}$/)
    const noCode = encodeSummary({ ...buildSummary(game(played), 10), cohort: null, id: 'zzzzzz' })
    const r = await useNgo.getState().importText(`from Priya: ${code}\n${noCode}`, a)
    expect(r).toMatchObject({ added: 2, found: 2, skipped: 0 })
    expect(Object.keys(cls(a)!.students)).toHaveLength(2)
    expect(cls(a)!.history).toHaveLength(2)
    expect(cls('UNASSIGNED')).toBeUndefined()
  })
  it('does not double count, keeps newer updates as history, and reports text with no codes', async () => {
    const a = await useNgo.getState().createCohort('Class 12')
    await useNgo.getState().importText(code, a)
    expect(await useNgo.getState().importText(code, a)).toMatchObject({ added: 0, skipped: 1 })
    const later = encodeSummary({ ...buildSummary(game(played), 99) })
    expect(await useNgo.getState().importText(later, a)).toMatchObject({ updated: 1 })
    expect(cls(a)!.history).toHaveLength(2)
    expect(await useNgo.getState().importText('hello', a)).toMatchObject({ found: 0, added: 0 })
  })
  it('sorts by each student own class code when no class is chosen', async () => {
    await useNgo.getState().importText(code, null)
    expect(cls('HYD-4K7Q')).toBeDefined()
  })
  it('keeps names on this device only and drops them with the student', async () => {
    const a = await useNgo.getState().createCohort('Names')
    await useNgo.getState().importText(code, a)
    const id = Object.keys(cls(a)!.students)[0]
    useNgo.getState().setLabel(a, id, '  Ravi   K ')
    expect(useNgo.getState().labels[labelKey(a, id)]).toBe('Ravi K')
    await useNgo.getState().deleteStudent(a, id)
    expect(useNgo.getState().labels[labelKey(a, id)]).toBeUndefined()
    expect(cls(a)!.history).toHaveLength(0)
  })
})

describe('insights for teaching', () => {
  const now = Date.UTC(2026, 9, 11)
  const hist = demoHistory(now)
  it('the demo history ends at the demo class and grows week by week', () => {
    const latest = latestOf(hist)
    expect(Object.keys(latest)).toHaveLength(48)
    const t = weeklyTrend(hist, 8, now)
    expect(t.length).toBeGreaterThanOrEqual(5)
    const u = t.map((p) => p.understanding as number)
    expect(u.at(-1)!).toBeGreaterThan(u[0])
    expect(t.at(-1)!.students).toBe(48)
  })
  it('understanding counts only skills a student has had the chance to show', () => {
    const s = buildSummary(game(played), 9)
    // plan and save were played: planning 0, prioritising 0, saving 0.8; invest and safe skills do not count yet
    expect(understanding(s)).toBeCloseTo(0.8 / 3)
    expect(understanding(buildSummary({}))).toBeNull()
  })
  it('flags students who need help, with a reason and a next step', () => {
    const fresh = buildSummary({})
    const i = studentInsight(fresh, Date.now())
    expect(i.flags[0]).toMatch(/not started/i)
    expect(i.next).toMatch(/Festival/)
    const quiet = studentInsight({ ...buildSummary(game(played), 0), at: 0 }, 20 * 86400000)
    expect(quiet.flags.some((f) => /Quiet for 20 days/.test(f))).toBe(true)
  })
  it('ranks focus areas, weakest first, and never more than three', () => {
    const v = aggregate(Object.values(latestOf(hist)))
    const f = focusAreas(v)
    expect(f.length).toBeLessThanOrEqual(3)
    expect(f.length).toBeGreaterThan(0)
    expect(f[0].why).toMatch(/students are still building/)
  })
  it('CSV cells cannot start a spreadsheet formula', () => {
    expect(toCsvText([['=HYPERLINK("x")', 'a,b']])).toBe(`"'=HYPERLINK(""x"")","a,b"`)
  })
})
