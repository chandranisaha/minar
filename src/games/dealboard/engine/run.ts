import type { CompanyId, Decision, MarketRun, TileKind } from './types'
import { BOARD, TURNS, YEAR_ENDS } from './board'
import { simulateMarket } from './simulate'

export const START_CASH = 100000
export const TRADE_FEE = 0.01
export const CASH_DRAG = 0.01

/**
 * news    banner for the coming quarter, waiting for the roll
 * land    token is on its tile; the tile does its thing
 * manage  optional buys and sells, then end the quarter
 * yearEnd review after turns 4, 8 and 12
 * done    run finished
 */
export type Phase = 'news' | 'land' | 'manage' | 'yearEnd' | 'done'

export interface Holding {
  units: number
  /** rupees paid in, after fees */
  cost: number
}

export interface RunState {
  seed: string
  /** turns played so far (0 before the first roll) */
  turn: number
  phase: Phase
  cash: number
  holdings: Partial<Record<CompanyId, Holding>>
  feesPaid: number
  cashDragLost: number
  /** idle-cash loss at the last quarter tick (shown with the next news) */
  lastDrag: number
  /** companies that have pitched at an Auction, in order */
  pitched: CompanyId[]
  log: Decision[]
}

export type Action =
  | { type: 'roll' }
  | { type: 'pass'; companyId: CompanyId }
  | { type: 'resolve' }
  | { type: 'endTurn' }
  | { type: 'continue' }

export const newRun = (seed: string): RunState => ({
  seed,
  turn: 0,
  phase: 'news',
  cash: START_CASH,
  holdings: {},
  feesPaid: 0,
  cashDragLost: 0,
  lastDrag: 0,
  pitched: [],
  log: [],
})

// The market is a pure function of the seed; cache the last one so renders stay cheap.
let cached: MarketRun | null = null
export function marketFor(seed: string): MarketRun {
  if (cached?.seed !== seed) cached = simulateMarket(seed)
  return cached
}

/** Latest quarter whose results the player can see: during a turn it is the previous quarter. */
export const knownQuarter = (run: RunState): number => (run.phase === 'land' || run.phase === 'manage' ? run.turn - 1 : run.turn)

export const tileAt = (run: RunState, m: MarketRun): TileKind => BOARD[m.positions[run.turn]]

export function holdingValue(run: RunState, m: MarketRun, id: CompanyId): number {
  const h = run.holdings[id]
  return h ? h.units * m.history[id][knownQuarter(run)].price : 0
}

export function invested(run: RunState, m: MarketRun): number {
  return (Object.keys(run.holdings) as CompanyId[]).reduce((sum, id) => sum + holdingValue(run, m, id), 0)
}

export const netWorth = (run: RunState, m: MarketRun): number => run.cash + invested(run, m)

/** Company pitching at the current Auction: the next one in the seeded order, else one that was passed on before. */
export function pitchFor(run: RunState, m: MarketRun): CompanyId | null {
  const fresh = m.pitchOrder.find((id) => !run.pitched.includes(id))
  if (fresh) return fresh
  return m.pitchOrder.find((id) => !run.holdings[id]) ?? null
}

const decision = (run: RunState, type: Decision['type'], companyId: CompanyId): Decision => ({
  id: `${run.turn}-${run.log.length}`,
  q: run.turn,
  type,
  companyId,
  tabsOpened: [],
  questionsAsked: [],
})

/** Pure turn reducer. Illegal actions for the current phase return the state unchanged. */
export function act(run: RunState, a: Action): RunState {
  switch (a.type) {
    case 'roll':
      if (run.phase !== 'news' || run.turn >= TURNS) return run
      return { ...run, turn: run.turn + 1, phase: 'land' }
    case 'pass':
      if (run.phase !== 'land') return run
      return {
        ...run,
        phase: 'manage',
        pitched: run.pitched.includes(a.companyId) ? run.pitched : [...run.pitched, a.companyId],
        log: [...run.log, decision(run, 'REJECT', a.companyId)],
      }
    case 'resolve':
      return run.phase === 'land' ? { ...run, phase: 'manage' } : run
    case 'endTurn': {
      if (run.phase !== 'manage') return run
      // quarter ticks: idle cash loses 1% to rising prices
      const drag = Math.round(run.cash * CASH_DRAG)
      const next = { ...run, cash: run.cash - drag, cashDragLost: run.cashDragLost + drag, lastDrag: drag }
      if (YEAR_ENDS.includes(run.turn)) return { ...next, phase: 'yearEnd' }
      return { ...next, phase: 'news' }
    }
    case 'continue':
      if (run.phase !== 'yearEnd') return run
      return { ...run, phase: run.turn >= TURNS ? 'done' : 'news' }
  }
}
