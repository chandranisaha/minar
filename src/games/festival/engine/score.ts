import { RULES, item, shop } from './content'
import { bestGood } from './shop'
import { replay } from './state'
import { JARS, NEEDS, type GameEvent, type GameState, type ItemId, type JarId } from './types'

export interface Stars { ghar: boolean; gift: boolean; dost: boolean; plan: boolean }
export interface Score { needs: number; gift: number; friends: number; plan: number; total: number }

export const hasGood = (s: GameState, i: ItemId) => !!s.owned[i] && !s.owned[i]!.torn
export const needsOwned = (s: GameState) => NEEDS.filter((i) => hasGood(s, i)).length

export function stars(s: GameState): Stars {
  return {
    ghar: needsOwned(s) === NEEDS.length,
    gift: !!s.owned.gift,
    dost: s.friendship >= 60,
    plan: s.borrowed <= RULES.planStarMaxBorrowed,
  }
}

/** 0 to 100, decisions only. Rewards balance: hoarding money and losing friends costs points too. */
export function score(s: GameState): Score {
  const needs = needsOwned(s) * 10
  const gift = s.owned.gift ? 20 : 0
  const friends = s.friendship >= 60 ? 20 : s.friendship >= 40 ? 10 : 0
  const plan = Math.max(0, 30 - Math.ceil(s.borrowed / 10))
  return { needs, gift, friends, plan, total: needs + gift + friends + plan }
}

export const starCount = (st: Stars) => Object.values(st).filter(Boolean).length
export const minaretLit = (st: Stars, sc: Score) => starCount(st) >= 3 || sc.total >= 70

export interface JarRow { jar: JarId; planned: number; spent: number; borrowedIn: number; borrowedOut: number }
export const planVsReality = (s: GameState): JarRow[] =>
  JARS.map((j) => ({ jar: j, planned: s.planned[j], spent: s.spent[j], borrowedIn: s.borrowedIn[j], borrowedOut: s.borrowedOut[j] }))

export interface Evidence {
  needsOnTime: number
  boughtBestPrice: number
  fakeSaleBuys: number
  lowQualityBuys: number
  haggles: number
  swaps: number
  borrowed: number
  bufferCoveredMamu: boolean
  ringToss: boolean
  lentToSunny: number
}

/** Per-concept evidence from play (no personal data), for the NGO view. */
export function evidence(log: GameEvent[], s: GameState = replay(log)): Evidence {
  const buys = log.filter((e): e is Extract<GameEvent, { kind: 'buy' }> => e.kind === 'buy')
  return {
    needsOnTime: buys.filter((b) => b.item !== 'gift' && b.day === item(b.item).day).length,
    boughtBestPrice: buys.filter((b) => shop(b.shop).quality === 'good' && b.price <= bestGood(b.item, b.day)).length,
    fakeSaleBuys: buys.filter((b) => b.shop === 'megasale').length,
    lowQualityBuys: buys.filter((b) => b.quality === 'low').length,
    haggles: log.filter((e) => e.kind === 'haggle').length,
    swaps: s.swaps,
    borrowed: s.borrowed,
    bufferCoveredMamu: s.mamu === 'spare',
    ringToss: s.ringTossPlays > 0,
    lentToSunny: s.sunnyLent,
  }
}
