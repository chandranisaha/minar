import { RULES, invite, item } from './content'
import { bestGood, fairPrice, sticker, wasPrice } from './shop'
import { replay } from './state'
import type { GameEvent, ItemId, JarId, ShopId } from './types'

/** The money ideas a player can feel. Each is named only after the choice that shows it. */
export type IdeaId = 'needs' | 'compare' | 'fakesale' | 'cheap' | 'early' | 'ask' | 'swap' | 'lending' | 'buffer' | 'odds' | 'budget' | 'opportunity'
export const IDEAS: IdeaId[] = ['needs', 'budget', 'compare', 'fakesale', 'cheap', 'early', 'ask', 'buffer', 'swap', 'opportunity', 'lending', 'odds']

export interface Line { key: string; vars?: Record<string, string | number> }
export interface Outcome {
  /** what happened, in one or two plain lines */
  lines: Line[]
  /** the idea this choice showed, if any */
  idea: IdeaId | null
  /** good, bad or neither: drives the face and colour (always paired with text) */
  tone: 'good' | 'bad' | 'neutral'
}

/** Vars use ids (item, shop, jar, friend); the screen turns them into names in the player's language. */
export function explain(log: GameEvent[], cardId: string): Outcome | null {
  const idx = log.findIndex((e) => 'card' in e && e.card === cardId && (e.kind !== 'borrow' && e.kind !== 'haggle'))
  if (idx < 0) return null
  const e = log[idx]
  const before = replay(log.slice(0, idx).filter((x) => !('card' in x) || x.card !== cardId))
  const borrows = log.filter((x): x is Extract<GameEvent, { kind: 'borrow' }> => x.kind === 'borrow' && x.card === cardId)
  const haggled = log.find((x): x is Extract<GameEvent, { kind: 'haggle' }> => x.kind === 'haggle' && x.card === cardId)
  const borrowed = borrows.reduce((a, b) => a + b.amount, 0)
  const borrowLine = (): Line[] => (borrowed ? [{ key: 'out.borrowed', vars: { money: borrowed, from: borrows[0].from as JarId, to: borrows[0].to as JarId } }] : [])
  const fromGiftForFun = borrows.some((b) => b.from === 'gift' && b.to === 'fun')

  switch (e.kind) {
    case 'buy': {
      const best = bestGood(e.item, e.day)
      const lines: Line[] = []
      let idea: IdeaId | null = null
      let tone: Outcome['tone'] = 'neutral'
      if (e.day > item(e.item).day) {
        lines.push({ key: 'out.late', vars: { extra: e.price - fairPrice(e.item), item: e.item } })
        idea = 'early'
        tone = 'bad'
      } else if (e.shop === 'megasale') {
        lines.push({ key: 'out.fakesale', vars: { was: wasPrice(e.item, e.shop, e.day)!, price: e.price, best } })
        idea = 'fakesale'
        tone = 'bad'
      } else if (e.quality === 'low') {
        lines.push({ key: 'out.cheap', vars: { price: e.price } })
        tone = 'neutral'
      } else if (haggled?.result === 'counter' && e.price < sticker(e.item, e.shop as ShopId, e.day)) {
        lines.push({ key: 'out.haggled', vars: { saved: sticker(e.item, e.shop, e.day) - e.price } })
        idea = 'ask'
        tone = 'good'
      } else if (e.price <= best) {
        lines.push({ key: 'out.best' })
        idea = 'compare'
        tone = 'good'
      } else {
        lines.push({ key: 'out.paidMore', vars: { extra: e.price - best } })
        idea = 'compare'
        tone = 'bad'
      }
      if (borrowed) {
        lines.push(...borrowLine())
        if (!idea || tone === 'good') idea = 'budget'
      }
      return { lines, idea, tone }
    }
    case 'later':
      return { lines: [{ key: 'out.later' }], idea: null, tone: 'neutral' }
    case 'without':
      return { lines: [{ key: 'out.without', vars: { item: e.item as ItemId } }], idea: 'needs', tone: 'bad' }
    case 'invite': {
      if (e.id === 'loan') {
        if (e.reply === 'no') return { lines: [{ key: 'out.loanNo' }], idea: 'lending', tone: 'neutral' }
        return { lines: [{ key: 'out.loan', vars: { money: e.cost } }, ...borrowLine()], idea: 'lending', tone: 'neutral' }
      }
      if (e.reply === 'swap') return { lines: [{ key: 'out.swap' }, ...borrowLine()], idea: fromGiftForFun ? 'opportunity' : 'swap', tone: 'good' }
      if (e.reply === 'no') return { lines: [{ key: 'out.no', vars: { friend: invite(e.id).from } }], idea: null, tone: 'neutral' }
      return { lines: [{ key: 'out.yes', vars: { money: e.cost } }, ...borrowLine()], idea: fromGiftForFun ? 'opportunity' : borrowed ? 'budget' : null, tone: borrowed ? 'bad' : 'good' }
    }
    case 'surprise':
      if (e.id === 'mamu')
        return borrowed
          ? { lines: [{ key: 'out.mamuBorrowed', vars: { money: borrowed, from: borrows[0].from } }], idea: 'buffer', tone: 'bad' }
          : { lines: [{ key: 'out.mamuSpare' }], idea: 'buffer', tone: 'good' }
      return e.choice === 'rebuy'
        ? { lines: [{ key: 'out.rebuy', vars: { cheap: before.owned.outfit?.price ?? 0, money: e.cost } }, ...borrowLine()], idea: 'cheap', tone: 'bad' }
        : { lines: [{ key: 'out.old' }], idea: 'cheap', tone: 'bad' }
    case 'ringtoss':
      if (!e.play) return { lines: [{ key: 'out.tossSkip' }], idea: null, tone: 'neutral' }
      return { lines: [{ key: e.win ? 'out.tossWin' : 'out.tossLose' }, { key: 'out.odds', vars: { cost: RULES.ringToss.cost } }], idea: 'odds', tone: e.win ? 'good' : 'neutral' }
    default:
      return null
  }
}

/** The ideas a whole run showed, in the order the player felt them (for the final report). */
export function ideasFelt(log: GameEvent[]): IdeaId[] {
  const seen: IdeaId[] = []
  for (const e of log) {
    if (!('card' in e) || e.kind === 'borrow' || e.kind === 'haggle' || e.kind === 'seen') continue
    const o = explain(log, e.card)
    if (o?.idea && !seen.includes(o.idea)) seen.push(o.idea)
  }
  // shopping at Sasta is only felt when it breaks or dims
  const s = replay(log)
  if (s.owned.decor?.quality === 'low' && !seen.includes('cheap')) seen.push('cheap')
  return seen
}
