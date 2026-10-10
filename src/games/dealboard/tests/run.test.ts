import { describe, expect, test } from 'vitest'
import { START_CASH, act, marketFor, netWorth, newRun, pitchFor, tileAt, type Action, type RunState } from '../engine/run'
import { YEAR_ENDS } from '../engine/board'

/** Plays a whole run, passing on every pitch, and returns every state seen. */
function playThrough(seed: string): RunState[] {
  const m = marketFor(seed)
  let run = newRun(seed)
  const seen = [run]
  for (let guard = 0; run.phase !== 'done' && guard < 200; guard++) {
    let a: Action
    if (run.phase === 'news') a = { type: 'roll' }
    else if (run.phase === 'land') {
      const id = tileAt(run, m) === 'auction' ? pitchFor(run, m) : null
      a = id ? { type: 'pass', companyId: id } : { type: 'resolve' }
    } else if (run.phase === 'manage') a = { type: 'endTurn' }
    else a = { type: 'continue' }
    run = act(run, a)
    seen.push(run)
  }
  return seen
}

describe('turn loop', () => {
  test('a full 12-quarter run is playable and ends in done', () => {
    const states = playThrough('loop')
    const last = states[states.length - 1]
    expect(last.phase).toBe('done')
    expect(last.turn).toBe(12)
  })

  test('year-end reviews come after turns 4, 8 and 12 only', () => {
    const turns = playThrough('years').filter((s) => s.phase === 'yearEnd').map((s) => s.turn)
    expect(turns).toEqual(YEAR_ENDS)
  })

  test('idle cash loses 1% a quarter', () => {
    const last = playThrough('drag').at(-1)!
    expect(last.cash).toBeLessThan(START_CASH)
    expect(Math.abs(last.cash - START_CASH * 0.99 ** 12)).toBeLessThan(12)
    expect(last.cash + last.cashDragLost).toBe(START_CASH)
  })

  test('same seed and same decisions give identical states', () => {
    expect(playThrough('same')).toEqual(playThrough('same'))
  })

  test('actions out of phase are ignored', () => {
    const run = newRun('x')
    expect(act(run, { type: 'endTurn' })).toBe(run)
    expect(act(run, { type: 'continue' })).toBe(run)
  })

  test('passing logs a REJECT and the next Auction pitches someone new', () => {
    const m = marketFor('pitch')
    const first = pitchFor(newRun('pitch'), m)!
    let run = act(newRun('pitch'), { type: 'roll' })
    run = { ...run, phase: 'land' }
    run = act(run, { type: 'pass', companyId: first })
    expect(run.log.at(-1)).toMatchObject({ type: 'REJECT', companyId: first })
    expect(pitchFor(run, m)).not.toBe(first)
    expect(netWorth(run, m)).toBe(START_CASH)
  })
})
