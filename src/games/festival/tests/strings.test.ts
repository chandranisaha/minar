import { describe, expect, test } from 'vitest'
import en from '../content/en.json'
import hi from '../content/hi.json'
import te from '../content/te.json'
import { FESTIVAL_DEFS, INVITE_DEFS, STALL_DEFS } from '../engine/content'
import { LESSON_ORDER } from '../engine/lessons'
import { ITEMS, POCKETS } from '../engine/types'

type Tree = { [k: string]: string | Tree }
const flat = (o: Tree, pre = ''): Record<string, string> =>
  Object.entries(o).reduce((a, [k, v]) => (typeof v === 'string' ? { ...a, [pre + k]: v } : { ...a, ...flat(v, `${pre}${k}.`) }), {} as Record<string, string>)
const vars = (s: string) => [...s.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort()

const EN = flat(en as Tree)

describe('strings (content as data, language-ready)', () => {
  test.each([['hi', hi], ['te', te]])('%s has every English key with the same {{placeholders}}', (_, file) => {
    const other = flat(file as Tree)
    expect(Object.keys(other).sort()).toEqual(Object.keys(EN).sort())
    for (const k of Object.keys(EN)) expect(vars(other[k]), k).toEqual(vars(EN[k]))
  })

  test('every content id has its strings', () => {
    for (const f of FESTIVAL_DEFS) for (const i of ITEMS) expect(EN[`festivals.${f.id}.items.${i}`]).toBeTruthy()
    for (const p of POCKETS) expect(EN[`pockets.${p}.name`]).toBeTruthy()
    for (const s of STALL_DEFS) expect(EN[`stalls.${s.id}.name`]).toBeTruthy()
    for (const inv of INVITE_DEFS) {
      expect(EN[`invites.${inv.key}.text`]).toBeTruthy()
      if (inv.swap != null) expect(EN[`invites.${inv.key}.swap`]).toBeTruthy()
    }
    for (const l of LESSON_ORDER) for (const part of ['l1', 'l2', 'l3', 'term', 'more']) expect(EN[`lesson.${l}.${part}`]).toBeTruthy()
  })

  test('the guardrail line is present in every language', () => {
    expect(EN.guardrail).toBe('Made-up prices. Real life is different.')
    expect(flat(hi as Tree).guardrail).toBeTruthy()
    expect(flat(te as Tree).guardrail).toBeTruthy()
  })
})
