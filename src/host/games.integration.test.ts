import { describe, expect, it } from 'vitest'
import { BARGAIN_HUNTER, HOARDER, IMPULSIVE, PLANNER, runBot } from '../games/festival/engine/bots'
import { ideasFelt } from '../games/festival/engine/explain'
import { evidence, minaretLit, score, stars } from '../games/festival/engine/score'
import { replay } from '../games/festival/engine/state'
import { ECON } from '../games/payrun/engine/content'
import { replaySeason } from '../games/payrun/engine/replay'
import { makeScript } from '../games/payrun/engine/script'
import { adaptFestival, adaptPayRun } from './adapters'

/** exactly what FestivalCountdown.finish() hands to onComplete, built from the game's own engine and bots */
function festivalPayload(seed: string, policy: Parameters<typeof runBot>[1]) {
  const log = runBot(seed, policy)
  const s = replay(log)
  const sr = stars(s)
  const sc = score(s)
  return { game: 'festival', cohortCode: '', seed, stars: { ...sr }, score: { ...sc }, evidence: { ...evidence(log, s) }, lessonsSeen: ideasFelt(log), minaretLit: minaretLit(sr, sc), meta: { festival: 'diwali' } }
}

describe('the real Festival Countdown, through its adapter', () => {
  const seeds = ['DEMO', ...Array.from({ length: 25 }, (_, i) => `seed-${i}`)]
  const rate = (policy: Parameters<typeof runBot>[1]) => seeds.filter((s) => adaptFestival(festivalPayload(s, policy)).cleared).length / seeds.length

  it('every bot run gives a well-formed result, and the shell clears exactly when the game lights its own minaret', () => {
    for (const policy of [PLANNER, HOARDER, IMPULSIVE, BARGAIN_HUNTER]) {
      for (const seed of seeds) {
        const payload = festivalPayload(seed, policy)
        const r = adaptFestival(payload)
        expect(r.pillar).toBe('plan')
        expect(r.cleared).toBe(payload.minaretLit)
        for (const n of [r.quality, r.partial]) expect(n >= 0 && n <= 1).toBe(true)
        if (!r.cleared) expect(r.partial).toBeLessThan(1)
        expect(r.joySignals.friendship).toBeDefined()
      }
    }
  })
  it('reads the real score parts as skills', () => {
    const r = adaptFestival(festivalPayload('DEMO', PLANNER))
    expect(Object.keys(r.skills).sort()).toEqual(['planning', 'prioritising', 'saving'])
  })
  it('a careful planner clears far more often than an impulsive player', () => {
    expect(rate(PLANNER)).toBeGreaterThan(rate(IMPULSIVE))
    expect(rate(PLANNER)).toBeGreaterThan(0.8)
  })
  it('a hoarder who refuses every friend gets a weaker friendship signal than the planner', () => {
    const friendship = (p: Parameters<typeof runBot>[1]) => adaptFestival(festivalPayload('DEMO', p)).joySignals.friendship ?? 0
    expect(friendship(HOARDER)).toBeLessThan(friendship(PLANNER))
  })
  it('carries the game\'s own lessons through', () => {
    expect(adaptFestival(festivalPayload('DEMO', PLANNER)).lessonsSeen.length).toBeGreaterThan(0)
  })
})

describe('the real Pay Run, through the shell wrapper payload', () => {
  const fresh = replaySeason(makeScript('DEMO'), []).state
  const payload = (over: Record<string, unknown>) => ({ game: 'payrun', jar: fresh.jar, goal: ECON.goal, shifts: fresh.week, ...over })

  it('reaching the goal clears the pillar with a full jar', () => {
    const r = adaptPayRun(payload({ goalReached: true, jar: ECON.goal }))
    expect(r).toMatchObject({ pillar: 'save', cleared: true, quality: 1, partial: 1 })
  })
  it('leaving early is a quit, not a clear, and keeps partial progress below 1', () => {
    const r = adaptPayRun(payload({ goalReached: false, jar: Math.round(ECON.goal / 2) }))
    expect(r.cleared).toBe(false)
    expect(r.partial).toBeCloseTo(0.5, 1)
    expect(r.partial).toBeLessThan(1)
  })
  it('an empty jar on a brand-new season is zero progress', () => {
    const r = adaptPayRun(payload({ goalReached: false }))
    expect(r).toMatchObject({ cleared: false, quality: 0, partial: 0 })
  })
  it('a jar above the goal never gives a quality above 1', () => {
    expect(adaptPayRun(payload({ goalReached: true, jar: ECON.goal * 3 })).quality).toBe(1)
  })
})
