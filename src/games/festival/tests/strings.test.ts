import { describe, expect, test } from 'vitest'
import en from '../content/en.json'
import hi from '../content/hi.json'
import te from '../content/te.json'
import { FESTIVAL_DEFS, INVITE_DEFS, SHOP_DEFS } from '../engine/content'
import { IDEAS } from '../engine/explain'
import { ITEMS, JARS } from '../engine/types'

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
    for (const f of FESTIVAL_DEFS) for (const i of ITEMS) expect(EN[`festivals.${f.id}.items.${i}`], `${f.id}.${i}`).toBeTruthy()
    for (const j of JARS) expect(EN[`jars.${j}.name`]).toBeTruthy()
    for (const s of SHOP_DEFS) {
      expect(EN[`shops.${s.id}.name`]).toBeTruthy()
      if (s.haggle !== 'none') expect(EN[`haggle.${s.id}.counter`], s.id).toBeTruthy()
    }
    for (const inv of INVITE_DEFS) {
      expect(EN[`invites.${inv.id}.text`]).toBeTruthy()
      expect(EN[`invites.${inv.id}.yes`]).toBeTruthy()
      expect(EN[`invites.${inv.id}.no`]).toBeTruthy()
      if (inv.swap != null) expect(EN[`invites.${inv.id}.swap`]).toBeTruthy()
    }
    for (const i of IDEAS) {
      expect(EN[`ideas.${i}.name`], i).toBeTruthy()
      expect(EN[`ideas.${i}.rule`], i).toBeTruthy()
    }
  })

  test('the guardrail line is present in every language', () => {
    expect(EN.guardrail).toBe('Made-up prices. Real life is different.')
    expect(flat(hi as Tree).guardrail).toBeTruthy()
    expect(flat(te as Tree).guardrail).toBeTruthy()
  })

  test('no real brand or app names in any language file', () => {
    const banned = /(paytm|phonepe|gpay|google pay|zomato|swiggy|amazon|flipkart|hdfc|sbi|icici|zerodha|groww|upstox)/i
    for (const file of [en, hi, te]) expect(JSON.stringify(file)).not.toMatch(banned)
  })
})
