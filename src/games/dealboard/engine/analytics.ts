import type { CompanyId, MarketRun, SectorId } from './types'
import { START_CASH, holdingValueAt, knownQuarter, netWorthAt, sectorShares, type RunState } from './state'

export type ReasonKind = 'evidence' | 'feeling' | 'mixed'

export const REASON_KIND: Record<string, ReasonKind> = {
  dataSays: 'evidence',
  strongGrowth: 'mixed',
  trustFounder: 'mixed',
  priceLow: 'mixed',
  other: 'mixed',
  friendTold: 'feeling',
  looksHyped: 'feeling',
  scaredLoss: 'feeling',
}

export interface Analytics {
  /** net worth after each quarter that has been played (index 0 = start) */
  series: { q: number; networth: number; cash: number; invested: number }[]
  /** where the money is right now, including cash */
  allocation: { id: CompanyId | 'cash'; value: number; pct: number }[]
  sectors: { sector: SectorId; pct: number }[]
  holdings: { id: CompanyId; cost: number; value: number; gainPct: number; quarters: number }[]
  habits: { fees: number; idleLost: number; trades: number; questionsPerBuy: number; idlePct: number }
  counts: { invest: number; sell: number; pass: number; hold: number }
  reasons: { key: string; count: number; kind: ReasonKind }[]
  /** share of decisions that gave an evidence-based reason (0-1), null when no reasons yet */
  evidencePct: number | null
  /** net worth change since the start */
  change: number
  netWorth: number
}

/** All numbers behind the analytics view, computed only from quarters the player has already seen. */
export function computeAnalytics(run: RunState, m: MarketRun): Analytics {
  const q = Math.max(0, knownQuarter(run))
  const series = run.series
    .filter((s) => s.q <= q || s.q === 0)
    .map((s) => ({ q: s.q, networth: s.cash + s.invested - s.loan, cash: s.cash, invested: s.invested }))
  const nw = netWorthAt(run, m, q)
  const ids = Object.keys(run.holdings) as CompanyId[]
  const total = Math.max(1, run.cash + ids.reduce((a, id) => a + holdingValueAt(run, m, id, q), 0))
  const allocation: Analytics['allocation'] = [
    ...ids.map((id) => ({ id, value: holdingValueAt(run, m, id, q), pct: holdingValueAt(run, m, id, q) / total })),
    { id: 'cash' as const, value: run.cash, pct: run.cash / total },
  ].filter((a) => a.value > 0)
  const sectors = (Object.entries(sectorShares(run, m, q)) as [SectorId, number][]).map(([sector, pct]) => ({ sector, pct }))
  const holdings = ids.map((id) => {
    const h = run.holdings[id]!
    const value = holdingValueAt(run, m, id, q)
    return { id, cost: h.cost, value, gainPct: h.cost > 0 ? value / h.cost - 1 : 0, quarters: Math.max(0, run.turn - h.since + (run.phase === 'desk' ? 0 : 1)) }
  })
  const buys = run.log.filter((d) => d.type === 'INVEST')
  const reasonCount: Record<string, number> = {}
  for (const d of run.log) if (d.reason) reasonCount[d.reason] = (reasonCount[d.reason] ?? 0) + 1
  const reasons = Object.entries(reasonCount).map(([key, count]) => ({ key, count, kind: REASON_KIND[key] ?? 'mixed' })).sort((a, b) => b.count - a.count)
  const reasoned = reasons.reduce((a, r) => a + r.count, 0)
  const evidence = reasons.filter((r) => r.kind === 'evidence').reduce((a, r) => a + r.count, 0)
  return {
    series,
    allocation,
    sectors,
    holdings,
    habits: {
      fees: run.feesPaid,
      idleLost: run.cashDragLost,
      trades: run.trades,
      questionsPerBuy: buys.length ? buys.reduce((a, d) => a + (d.flips ?? 0), 0) / buys.length : 0,
      idlePct: allocation.find((a) => a.id === 'cash')?.pct ?? 0,
    },
    counts: { invest: buys.length, sell: run.log.filter((d) => d.type === 'SELL').length, pass: run.log.filter((d) => d.type === 'REJECT').length, hold: run.log.filter((d) => d.type === 'HOLD').length },
    reasons,
    evidencePct: reasoned ? evidence / reasoned : null,
    change: nw - START_CASH,
    netWorth: nw,
  }
}


