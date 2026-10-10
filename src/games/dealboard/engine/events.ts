import type { Banner, Card, CompanyId, SectorId } from './types'
import { COMPANY } from './companies'
import { BOARD, TURNS } from './board'
import { int, shuffle, streamFor } from './rng'

/** Chance deck (spec "Chance card deck"). Half verified news, half unverified rumours. */
export const NEWS_CARDS: Card[] = [
  { key: 'fuelSpike', type: 'news', effect: { kind: 'sector', sector: 'mobility', shock: -0.08 } },
  { key: 'rooftopSubsidy', type: 'news', effect: { kind: 'sector', sector: 'energy', shock: 0.08 } },
  { key: 'hospitalRules', type: 'news', effect: { kind: 'sector', sector: 'health', shock: -0.05 } },
  { key: 'rivalApp', type: 'news', company: 'payEasy', effect: { kind: 'newGrowth', company: 'payEasy', delta: -0.02 } },
  { key: 'steelLayoffs', type: 'news', company: 'steelWorks', effect: { kind: 'layoff', company: 'steelWorks', rate: 0.12 } },
  { key: 'festival', type: 'news', company: 'dailyBasket', effect: { kind: 'revenueBump', company: 'dailyBasket', bump: 0.06 } },
  { key: 'quickRideCeoSold', type: 'news', company: 'quickRide', effect: { kind: 'none' } },
  { key: 'medLinkClinics', type: 'news', company: 'medLink', effect: { kind: 'none' } },
]

export const RUMOUR_CARDS: Card[] = [
  { key: 'quickRideDouble', type: 'rumour', company: 'quickRide', effect: { kind: 'priceBump', company: 'quickRide', bump: 0.05 } },
  { key: 'payEasyNextBig', type: 'rumour', company: 'payEasy', effect: { kind: 'sentimentBump', company: 'payEasy', bump: 0.03 } },
  { key: 'steelHiddenGem', type: 'rumour', company: 'steelWorks', effect: { kind: 'none' } },
  { key: 'medLinkBuyout', type: 'rumour', company: 'medLink', effect: { kind: 'priceBump', company: 'medLink', bump: 0.04 } },
  { key: 'solarGuaranteed', type: 'rumour', company: 'solarGrid', effect: { kind: 'none' } },
  { key: 'basketTip', type: 'rumour', company: 'dailyBasket', effect: { kind: 'none' } },
]

const relevant = (picked: CompanyId[]) => (c: Card) => !c.company || picked.includes(c.company)

/** Deck in draw order: news and rumours alternate so draws stay half and half. */
export function buildDeck(seed: string, picked: CompanyId[]): Card[] {
  const rng = streamFor(seed, 'deck')
  const news = shuffle(rng, NEWS_CARDS.filter(relevant(picked)))
  const rumours = shuffle(rng, RUMOUR_CARDS.filter(relevant(picked)))
  const rumourFirst = rng() < 0.5
  const deck: Card[] = []
  for (let i = 0; i < Math.max(news.length, rumours.length); i++) {
    const pair = rumourFirst ? [rumours[i], news[i]] : [news[i], rumours[i]]
    for (const c of pair) if (c) deck.push(c)
  }
  return deck
}

/** Banner for each quarter: the broad market cycle, one seeded sector rally in Q3-Q5, otherwise quiet. */
export function buildBanners(seed: string, picked: CompanyId[]): { banners: Banner[]; fallQ: number } {
  const rng = streamFor(seed, 'market')
  const fallQ = 9 + int(rng, -1, 1)
  const cycle = [-0.12, -0.03, 0.06, 0.06]
  const cycleKeys = ['slowdown', 'shaky', 'optimism', 'optimism']
  const rallyQ = int(rng, 3, 5)
  const sectors = [...new Set(picked.map((id) => COMPANY[id].sector))] as SectorId[]
  const rallySector = sectors[int(rng, 0, sectors.length - 1)]
  const banners: Banner[] = []
  for (let q = 1; q <= TURNS; q++) {
    const k = q - fallQ
    if (k >= 0 && k < cycle.length) banners.push({ key: cycleKeys[k], marketShock: cycle[k] })
    else if (q === rallyQ) banners.push({ key: 'sectorRally', marketShock: 0, sector: rallySector, sectorShock: 0.08 })
    else banners.push({ key: 'quiet', marketShock: 0 })
  }
  return { banners, fallQ }
}

/** Card drawn on each Chance landing (null on other turns). The deck reshuffles when it runs out. */
export function drawChance(seed: string, picked: CompanyId[], positions: number[]): (Card | null)[] {
  let deck = buildDeck(seed, picked)
  let i = 0
  let round = 0
  const out: (Card | null)[] = []
  for (let t = 1; t <= TURNS; t++) {
    if (BOARD[positions[t]] !== 'chance') {
      out.push(null)
      continue
    }
    if (i >= deck.length) {
      round += 1
      deck = buildDeck(`${seed}#${round}`, picked)
      i = 0
    }
    out.push(deck[i++])
  }
  return out
}

/** Family emergency: the first Chest landing up to turn 10, else forced once in a seeded turn 8-10. */
export function emergencyTurn(seed: string, positions: number[]): number {
  for (let t = 1; t <= 10; t++) if (BOARD[positions[t]] === 'chest') return t
  return int(streamFor(seed, 'emergency'), 8, 10)
}

export const EMERGENCY_COST = 25000
