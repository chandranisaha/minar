import type { CompanyId, Decision, LightKey, Lights, MarketRun, SectorId, TileKind } from './types'
import { BOARD } from './board'
import { COMPANY } from './companies'
import { computeLights } from './lights'
import { simulateMarket } from './simulate'
import type { LessonRef } from './lessons'

export const START_CASH = 100000
export const TRADE_FEE = 0.01
export const CASH_DRAG = 0.01
export const MIN_BID = 5000
export const LOAN_AMOUNT = 20000
export const HOUSE = 10000

/**
 * news       banner for the coming quarter, waiting for the roll
 * land       token is on its tile; the tile does its thing
 * manage     (legacy) optional buys and sells before ending the quarter; the app no longer stops here
 * emergency  family emergency: raise the cash, then pay
 * lesson     a lesson card from the quarter that just ended
 * yearEnd    review after turns 4, 8 and 12
 * done       run finished
 */
export type Phase = 'news' | 'land' | 'manage' | 'emergency' | 'lesson' | 'yearEnd' | 'done'

export interface Holding {
  units: number
  /** rupees paid in (fees included) for the units still held */
  cost: number
  /** quarter of the first purchase */
  since: number
}

/** What happened on the tile last quarter, shown at the top of the next briefing. */
export interface Recap {
  tile: TileKind
  cardKey: string | null
  cardType: 'news' | 'rumour' | null
  cardCompany: CompanyId | null
  rent: { id: CompanyId; amount: number }[]
  /** the company whose property tile the token landed on */
  ownTile: CompanyId | null
  bank: 'clue' | 'loan' | 'skip' | null
  clue: { companyId: CompanyId; light: LightKey } | null
}

export interface FeedItem {
  q: number
  key: string
  type: 'news' | 'rumour'
  company: CompanyId | null
}

export interface EmergencySale {
  companyId: CompanyId
  atLoss: boolean
  inDip: boolean
}

export interface RunState {
  seed: string
  /** turns played so far (0 before the first roll) */
  turn: number
  phase: Phase
  cash: number
  loan: number
  loanInterest: number
  holdings: Partial<Record<CompanyId, Holding>>
  feesPaid: number
  trades: number
  cashDragLost: number
  /** idle-cash loss at the last quarter tick (shown with the next news) */
  lastDrag: number
  /** companies that have pitched at an Auction, in order */
  pitched: CompanyId[]
  /** lights asked of a founder at a pitch (max 2 per company) */
  asked: Partial<Record<CompanyId, LightKey[]>>
  /** lights revealed by the Banker's clue */
  clues: Partial<Record<CompanyId, LightKey[]>>
  log: Decision[]
  /** the player has seen the introduction to this game's companies */
  briefed: boolean
  /** auction tiles claimed by the companies bought there (tile index to company) */
  owners: Record<number, CompanyId>
  recap: Recap | null
  feed: FeedItem[]
  lastBank: 'clue' | 'loan' | 'skip' | null
  lastClue: { companyId: CompanyId; light: LightKey } | null

  // this quarter
  turnStartInvested: number
  soldThisTurn: number
  soldRed: boolean
  emergencySales: EmergencySale[]

  // run-long tracking for scoring and lessons
  emergencyDone: boolean
  emergencyForcedSale: boolean
  jails: number
  jailedTurn: number
  cashStreak: number
  cashStreakMax: number
  spread: { top: number; holdings: number }[]

  // lessons
  queue: LessonRef[]
  lesson: LessonRef | null
  after: 'news' | 'yearEnd'
  shown: Record<number, number>
  seen: number[]
  flagged: string[]
  positives: number[]

  // rewind: once per year, back to the start of the quarter a lesson came from
  rewinds: number[]
  checkpoints: Record<number, Omit<RunState, 'checkpoints'>>
}

export const newRun = (seed: string): RunState => ({
  seed,
  turn: 0,
  phase: 'news',
  cash: START_CASH,
  loan: 0,
  loanInterest: 0,
  holdings: {},
  feesPaid: 0,
  trades: 0,
  cashDragLost: 0,
  lastDrag: 0,
  pitched: [],
  asked: {},
  clues: {},
  log: [],
  briefed: false,
  owners: {},
  recap: null,
  feed: [],
  lastBank: null,
  lastClue: null,
  turnStartInvested: 0,
  soldThisTurn: 0,
  soldRed: false,
  emergencySales: [],
  emergencyDone: false,
  emergencyForcedSale: false,
  jails: 0,
  jailedTurn: -1,
  cashStreak: 0,
  cashStreakMax: 0,
  spread: [],
  queue: [],
  lesson: null,
  after: 'news',
  shown: {},
  seen: [],
  flagged: [],
  positives: [],
  rewinds: [],
  checkpoints: {},
})

// The market is a pure function of the seed; cache the last one so renders stay cheap.
let cached: MarketRun | null = null
export function marketFor(seed: string): MarketRun {
  if (cached?.seed !== seed) cached = simulateMarket(seed)
  return cached
}

/** Latest quarter whose results the player can see: during a turn it is the previous quarter. */
export const knownQuarter = (run: RunState): number =>
  run.phase === 'land' || run.phase === 'manage' || run.phase === 'emergency' ? run.turn - 1 : run.turn

/** The quarter a decision belongs to: the briefing before the roll already decides the coming quarter. */
export const decisionQ = (run: RunState): number => (run.phase === 'news' ? run.turn + 1 : run.turn)

export const tileAt = (run: RunState, m: MarketRun): TileKind => BOARD[m.positions[run.turn]]

export const priceAt = (m: MarketRun, id: CompanyId, q: number): number => m.history[id][q].price

export const holdingValueAt = (run: RunState, m: MarketRun, id: CompanyId, q: number): number => {
  const h = run.holdings[id]
  return h ? h.units * priceAt(m, id, q) : 0
}

export const investedAt = (run: RunState, m: MarketRun, q: number): number =>
  (Object.keys(run.holdings) as CompanyId[]).reduce((sum, id) => sum + holdingValueAt(run, m, id, q), 0)

export const holdingValue = (run: RunState, m: MarketRun, id: CompanyId): number => holdingValueAt(run, m, id, knownQuarter(run))
export const invested = (run: RunState, m: MarketRun): number => investedAt(run, m, knownQuarter(run))
export const netWorthAt = (run: RunState, m: MarketRun, q: number): number => run.cash + investedAt(run, m, q) - run.loan
export const netWorth = (run: RunState, m: MarketRun): number => netWorthAt(run, m, knownQuarter(run))

/** Company pitching at the current Auction: the next one in the seeded order, else one passed on before. */
export function pitchFor(run: RunState, m: MarketRun): CompanyId | null {
  const fresh = m.pitchOrder.find((id) => !run.pitched.includes(id))
  if (fresh) return fresh
  return m.pitchOrder.find((id) => !run.holdings[id]) ?? null
}

export const lightsAt = (m: MarketRun, id: CompanyId, q: number): Lights => computeLights(m.history[id], COMPANY[id], q)

/** Lights the player has seen for a company: founder answers plus banker clues. */
export function knownLights(run: RunState, id: CompanyId): LightKey[] {
  return [...new Set([...(run.asked[id] ?? []), ...(run.clues[id] ?? [])])]
}

/** Share of invested money per sector (0 when nothing is invested). */
export function sectorShares(run: RunState, m: MarketRun, q: number): Partial<Record<SectorId, number>> {
  const total = investedAt(run, m, q)
  const out: Partial<Record<SectorId, number>> = {}
  if (total <= 0) return out
  for (const id of Object.keys(run.holdings) as CompanyId[]) {
    const s = COMPANY[id].sector
    out[s] = (out[s] ?? 0) + holdingValueAt(run, m, id, q) / total
  }
  return out
}

export const houses = (h: Holding): number => Math.floor(h.cost / HOUSE)
