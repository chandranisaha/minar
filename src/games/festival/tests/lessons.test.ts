import { describe, expect, test } from 'vitest'
import { IMPULSIVE, PLANNER, runBot } from '../engine/bots'
import { LESSON_ORDER, lessonFor, lessonsTriggered, topLessons, type LessonId } from '../engine/lessons'
import type { Day } from '../engine/types'

describe('lesson cards', () => {
  test('at most one per Day diary, in priority order, each shown at most twice', () => {
    for (let k = 0; k < 200; k++) {
      const log = runBot(`L${k}`, k % 2 ? IMPULSIVE : PLANNER)
      const shown: LessonId[] = []
      for (const d of [1, 2, 3] as Day[]) {
        const hit = lessonFor(log, d, shown)
        const all = lessonsTriggered(log, d)
        if (hit) {
          const eligible = all.filter((h) => shown.filter((x) => x === h.id).length < 2)
          expect(hit.id).toBe(eligible[0].id)
          shown.push(hit.id)
        }
        for (let i = 1; i < all.length; i++) expect(LESSON_ORDER.indexOf(all[i].id)).toBeGreaterThan(LESSON_ORDER.indexOf(all[i - 1].id))
      }
      for (const id of new Set(shown)) expect(shown.filter((x) => x === id).length).toBeLessThanOrEqual(2)
    }
  })
  test('planner sees the positive cards; impulsive sees needs-before-wants first', () => {
    expect(topLessons(runBot('DEMO', PLANNER)).map((l) => l.id)).toContain('swap')
    expect(topLessons(runBot('DEMO', IMPULSIVE))[0].id).toBe('needs')
  })
})
