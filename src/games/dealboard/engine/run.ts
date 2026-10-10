import type { CompanyId, Decision, LightKey, MarketRun } from './types'
import { TURNS, YEAR_ENDS } from './board'
import { TUNING } from './companies'
import { EMERGENCY_COST } from './events'
import { redFlags } from './lights'
import { collectEarned, collectLessons, houseCard, type LessonRef, type QuarterEvents } from './lessons'
import {
  CASH_DRAG, LOAN_AMOUNT, MIN_BID, TRADE_FEE, investedAt, knownLights, knownQuarter, lightsAt, marketFor,
  netWorthAt, pitchFor, priceAt, sectorShares, tileAt, type EmergencySale, type RunState,
} from './state'

export * from './state'

export type Action =
  | { type: 'roll' }
  | { type: 'ask'; companyId: CompanyId; light: LightKey }
  | { type: 'bid'; companyId: CompanyId; amount: number; reason: string }
  | { type: 'pass'; companyId: CompanyId }
  | { type: 'buyMore'; companyId: CompanyId; amount: number; reason: string }
  | { type: 'sell'; companyId: CompanyId; fraction: number; reason: string }
  | { type: 'clue'; companyId: CompanyId; light: LightKey }
  | { type: 'loan' }
  | { type: 'repay' }
  | { type: 'resolve' }
  | { type: 'endTurn' }
  | { type: 'payEmergency' }
  | { type: 'continue' }
  | { type: 'rewind' }

export const REASONS = ['strongGrowth', 'trustFounder', 'priceLow', 'scaredLoss', 'friendTold', 'looksHyped', 'dataSays', 'other'] as const

const strip = (r: RunState): Omit<RunState, 'checkpoints'> => {
  const { checkpoints: _c, ...rest } = r
  void _c
  return rest
}

export const canBuy = (run: RunState): boolean => run.jailedTurn !== run.turn

const decision = (run: RunState, type: Decision['type'], companyId: CompanyId, extra: Partial<Decision> = {}): Decision => ({
  id: `${run.turn}-${run.log.length}`,
  q: run.turn,
  type,
  companyId,
  tabsOpened: [],
  questionsAsked: [],
  ...extra,
})

function buy(run: RunState, m: MarketRun, id: CompanyId, amount: number, reason: string, flips: number): RunState {
  const price = priceAt(m, id, knownQuarter(run))
  if (price <= 0 || amount < MIN_BID || amount > run.cash || !canBuy(run)) return run
  const fee = Math.round(amount * TRADE_FEE)
  const prev = run.holdings[id]
  const card = m.chance[run.turn - 1]
  return {
    ...run,
    cash: run.cash - amount,
    feesPaid: run.feesPaid + fee,
    trades: run.trades + 1,
    holdings: {
      ...run.holdings,
      [id]: { units: (prev?.units ?? 0) + (amount - fee) / price, cost: (prev?.cost ?? 0) + amount, since: prev?.since ?? run.turn },
    },
    pitched: run.pitched.includes(id) ? run.pitched : [...run.pitched, id],
    log: [...run.log, decision(run, 'INVEST', id, { amount, reason, price, flips, rumour: card?.type === 'rumour' && card.company === id })],
  }
}

function sell(run: RunState, m: MarketRun, id: CompanyId, fraction: number, reason: string): RunState {
  const h = run.holdings[id]
  const q = knownQuarter(run)
  if (!h || fraction <= 0) return run
  const f = Math.min(1, fraction)
  const price = priceAt(m, id, q)
  const unitsSold = h.units * f
  const gross = unitsSold * price
  const fee = Math.round(gross * TRADE_FEE)
  const costPart = h.cost * f
  const gain = costPart > 0 ? (gross - fee) / costPart - 1 : 0
  const holdings = { ...run.holdings }
  if (f >= 0.999) delete holdings[id]
  else holdings[id] = { ...h, units: h.units - unitsSold, cost: h.cost - costPart }
  const sale: EmergencySale = { companyId: id, atLoss: gain < 0, inDip: m.banners[run.turn - 1].marketShock < 0 }
  return {
    ...run,
    cash: run.cash + Math.round(gross - fee),
    feesPaid: run.feesPaid + fee,
    trades: run.trades + 1,
    holdings,
    soldThisTurn: run.soldThisTurn + gross,
    soldRed: run.soldRed || redFlags(lightsAt(m, id, q)) > 0,
    emergencySales: run.phase === 'emergency' ? [...run.emergencySales, sale] : run.emergencySales,
    log: [...run.log, decision(run, 'SELL', id, { amount: Math.round(gross), reason, price, gain, held: run.turn - h.since })],
  }
}

/** Quarter ends: loan interest, idle-cash drag, trackers, then lessons. */
function closeQuarter(run: RunState, m: MarketRun, emergency: QuarterEvents['emergency']): RunState {
  const t = run.turn
  const r: RunState = { ...run, flagged: [...run.flagged], queue: [...run.queue], shown: { ...run.shown }, seen: [...run.seen] }

  if (r.loan > 0) {
    const interest = Math.round(r.loan * TUNING.loanRate)
    if (r.cash >= interest) r.cash -= interest
    else {
      r.loan += interest - r.cash
      r.cash = 0
    }
    r.loanInterest += interest
  }
  if (t === TURNS && r.loan > 0) {
    const pay = Math.min(r.cash, r.loan)
    r.cash -= pay
    r.loan -= pay
  }
  const drag = Math.round(r.cash * CASH_DRAG)
  r.cash -= drag
  r.cashDragLost += drag
  r.lastDrag = drag

  const nw = netWorthAt(r, m, t)
  r.cashStreak = nw > 0 && r.cash >= 0.6 * nw ? r.cashStreak + 1 : 0
  r.cashStreakMax = Math.max(r.cashStreakMax, r.cashStreak)
  const shares = Object.values(sectorShares(r, m, t)) as number[]
  r.spread = [...r.spread, { top: shares.length ? Math.max(...shares) : 0, holdings: Object.keys(r.holdings).length }]

  // panic sell: 70% or more of invested money in one market-wide fall quarter, nothing sold had a red light
  const jail = m.banners[t - 1].marketShock < 0 && r.turnStartInvested > 0 && r.soldThisTurn >= 0.7 * r.turnStartInvested && !r.soldRed
  if (jail) {
    r.jails += 1
    r.jailedTurn = t + 1
  }

  const fresh = [...collectLessons(r, m, { jail, emergency }), ...collectEarned(r, m)]
  for (const ref of fresh) {
    if ((r.shown[ref.id] ?? 0) >= 2 || r.queue.some((q) => q.id === ref.id)) continue
    r.queue.push(ref)
  }
  const next = r.queue.shift() ?? null
  r.after = YEAR_ENDS.includes(t) ? 'yearEnd' : 'news'
  if (r.after === 'yearEnd' && !r.seen.includes(11)) r.seen.push(11)
  if (next) {
    r.lesson = next
    r.shown[next.id] = (r.shown[next.id] ?? 0) + 1
    if (!r.seen.includes(next.id)) r.seen.push(next.id)
    if (next.id >= 100) r.positives = [...r.positives, Math.ceil(t / 4)]
    r.phase = 'lesson'
  } else {
    r.lesson = null
    r.phase = r.after
  }
  return r
}

/** Pure turn reducer. Illegal actions for the current phase return the state unchanged. */
export function act(run: RunState, a: Action): RunState {
  const m = marketFor(run.seed)
  switch (a.type) {
    case 'roll': {
      if (run.phase !== 'news' || run.turn >= TURNS) return run
      const t = run.turn + 1
      return {
        ...run,
        turn: t,
        phase: 'land',
        checkpoints: { ...run.checkpoints, [t]: strip(run) },
        turnStartInvested: investedAt(run, m, run.turn),
        soldThisTurn: 0,
        soldRed: false,
        emergencySales: [],
      }
    }

    case 'ask': {
      if (run.phase !== 'land' || tileAt(run, m) !== 'auction' || pitchFor(run, m) !== a.companyId) return run
      const asked = run.asked[a.companyId] ?? []
      if (asked.length >= 2 || asked.includes(a.light)) return run
      return { ...run, asked: { ...run.asked, [a.companyId]: [...asked, a.light] } }
    }

    case 'bid': {
      if (run.phase !== 'land' || tileAt(run, m) !== 'auction' || pitchFor(run, m) !== a.companyId) return run
      const next = buy(run, m, a.companyId, a.amount, a.reason, Math.min(2, knownLights(run, a.companyId).length))
      return next === run ? run : { ...next, phase: 'manage' }
    }

    case 'pass': {
      if (run.phase !== 'land') return run
      return {
        ...run,
        phase: 'manage',
        pitched: run.pitched.includes(a.companyId) ? run.pitched : [...run.pitched, a.companyId],
        log: [...run.log, decision(run, 'REJECT', a.companyId, { price: priceAt(m, a.companyId, knownQuarter(run)), flips: Math.min(2, knownLights(run, a.companyId).length) })],
      }
    }

    case 'clue': {
      if (run.phase !== 'land' || tileAt(run, m) !== 'bank') return run
      const have = run.clues[a.companyId] ?? []
      if (have.includes(a.light)) return run
      return { ...run, phase: 'manage', clues: { ...run.clues, [a.companyId]: [...have, a.light] } }
    }

    case 'loan':
      if (run.phase !== 'land' || tileAt(run, m) !== 'bank' || run.loan > 0) return run
      return { ...run, phase: 'manage', cash: run.cash + LOAN_AMOUNT, loan: LOAN_AMOUNT }

    case 'repay':
      if (run.phase !== 'manage' || run.loan <= 0 || run.cash < run.loan) return run
      return { ...run, cash: run.cash - run.loan, loan: 0 }

    case 'buyMore': {
      if (run.phase !== 'manage' || !run.holdings[a.companyId]) return run
      return buy(run, m, a.companyId, a.amount, a.reason, 2)
    }

    case 'sell':
      if (run.phase !== 'manage' && run.phase !== 'emergency') return run
      return sell(run, m, a.companyId, a.fraction, a.reason)

    case 'resolve':
      return run.phase === 'land' ? { ...run, phase: 'manage' } : run

    case 'endTurn': {
      if (run.phase !== 'manage') return run
      if (run.turn === m.emergencyTurn && !run.emergencyDone) return { ...run, phase: 'emergency' }
      return closeQuarter(run, m, null)
    }

    case 'payEmergency': {
      if (run.phase !== 'emergency') return run
      const pay = Math.min(run.cash, EMERGENCY_COST)
      const short = EMERGENCY_COST - pay
      const forced = run.emergencySales.find((s) => s.atLoss || s.inDip)
      const paid: RunState = {
        ...run,
        cash: run.cash - pay,
        loan: run.loan + short,
        emergencyDone: true,
        emergencyForcedSale: run.emergencyForcedSale || !!forced,
      }
      let ev: QuarterEvents['emergency'] = null
      if (forced) {
        const last = run.log.filter((d) => d.type === 'SELL' && d.companyId === forced.companyId).at(-1)
        ev = { companyId: forced.companyId, lossPct: forced.atLoss && last?.gain !== undefined ? Math.round(-last.gain * 100) : null }
      }
      return closeQuarter(paid, m, ev)
    }

    case 'continue': {
      if (run.phase === 'lesson') return { ...run, lesson: null, phase: run.after }
      if (run.phase !== 'yearEnd') return run
      return { ...run, phase: run.turn >= TURNS ? 'done' : 'news' }
    }

    case 'rewind': {
      const year = Math.ceil(run.turn / 4)
      const snap = run.checkpoints[run.turn]
      if (run.phase !== 'lesson' || !snap || run.rewinds.includes(year)) return run
      const restored = { ...snap, checkpoints: Object.fromEntries(Object.entries(run.checkpoints).filter(([k]) => Number(k) <= run.turn)) } as RunState
      return { ...restored, shown: run.shown, seen: run.seen, positives: run.positives, flagged: run.flagged, rewinds: [...run.rewinds, year] }
    }
  }
}

/** Year-end review: shows the houses (compounding) card. */
export function yearEndCard(run: RunState, m: MarketRun): LessonRef {
  return houseCard(run, m)
}

