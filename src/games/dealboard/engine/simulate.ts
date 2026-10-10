import type { Banner, Card, Company, CompanyId, MarketRun, QuarterStats } from './types'
import { COMPANIES, TUNING, pickCompanies, startProfit } from './companies'
import { BOARD, TURNS, rollPath } from './board'
import { buildBanners, drawChance, emergencyTurn } from './events'
import { normal, streamFor, type Rng } from './rng'

/** Everything outside the company that moves it this quarter. */
export interface QuarterCtx {
  marketShock: number
  sectorShock: number
  /** cumulative change to newGrowth from verified news */
  newGrowthDelta: number
  extraLayoff: number
  priceBump: number
  sentimentBump: number
  revenueBump: number
  payEasyPath: 'downRound' | 'fail'
}

const clip = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
const round = Math.round

/** Quarter in which a collapse company stops selling its story (99 = never). */
export function collapseQuarter(co: Company, path: QuarterCtx['payEasyPath']): number {
  if (co.params.collapse === 'downRoundOrFail') return path === 'downRound' ? 8 : 10
  if (co.params.collapse === 'restate') return 7
  return 99
}

function valuation(hist: QuarterStats[], profit: number, price: number, shares: number): number | null {
  const recent = [...hist.slice(-3).map((h) => h.profit), profit]
  const yearProfit = (recent.reduce((a, b) => a + b, 0) * 4) / recent.length
  if (yearProfit <= 0) return null
  return (price * shares) / 1e5 / yearProfit
}

/** Starting values at the first pitch (quarter 0), with flows implied by the parameters. */
export function startStats(co: Company): QuarterStats {
  const s = co.start
  const p = co.params
  const interest = s.debt * TUNING.interestRate
  const profit = startProfit(s)
  return {
    q: 0,
    revenue: s.revenue,
    margin: s.margin,
    interest,
    profit,
    debt: s.debt,
    cash: s.cash,
    raised: 0,
    runwayMonths: profit >= 0 ? null : s.cash / (-profit / 3),
    employees: s.employees,
    hires: 0,
    layoffs: 0,
    newCust: p.newBase,
    lostCust: round(s.customers * p.churn),
    customers: s.customers,
    users: s.users,
    retention: s.retention,
    complaints: round(p.churn * 100),
    ceoTrade: 'NONE',
    ceoNetWorth: 200 + (s.price * s.shares) / 1e5 / 2,
    price: s.price,
    shares: s.shares,
    valuationYears: profit > 0 ? (s.price * s.shares) / 1e5 / (profit * 4) : null,
    failed: false,
    events: [],
  }
}

/**
 * One quarter for one company (spec "Per-quarter update"). Pure apart from the rng it is handed;
 * it always draws the same number of values so streams never drift between branches.
 */
export function simulateQuarter(hist: QuarterStats[], co: Company, ctx: QuarterCtx, rng: Rng): QuarterStats {
  const prev = hist[hist.length - 1]
  const q = prev.q + 1
  const p = co.params
  const eRev = normal(rng, p.sigmaRev)
  const eMargin = normal(rng, TUNING.sigmaMargin)
  const eRunway = normal(rng, 0.2)
  const eLost = normal(rng, TUNING.sigmaCust)
  const eNew = normal(rng, TUNING.sigmaCust)
  const eUsers = normal(rng, TUNING.sigmaUsers)
  const ceoRoll = rng()
  const ePrice = normal(rng, p.sigmaPrice)

  if (prev.failed) {
    return { ...prev, q, profit: 0, interest: 0, raised: 0, hires: 0, layoffs: 0, newCust: 0, lostCust: 0, ceoTrade: 'NONE', events: [] }
  }

  const events: QuarterStats['events'] = []
  const collapseQ = collapseQuarter(co, ctx.payEasyPath)
  const season = p.season ? p.season[(q - 1) % p.season.length] : 0

  const revenue = prev.revenue * (1 + p.g + season + ctx.sectorShock + ctx.revenueBump + eRev)
  const margin = prev.margin + p.dm + eMargin
  const interest = prev.debt * TUNING.interestRate
  const profit = revenue * margin - interest
  const debt = prev.debt * (1 + p.gd)
  // new borrowing lands in the bank (the spec formula leaves it out; see DECISIONS.md)
  let cash = prev.cash + profit + (debt - prev.debt)
  let raised = 0
  let shares = prev.shares

  // hype companies keep raising money while the story sells, so the runway glides down instead of hitting zero at once
  if (co.archetype === 'hype' && q < collapseQ && profit < 0) {
    const needed = (TUNING.hypeRunway[q] + eRunway) * (-profit / 3)
    if (cash < needed) {
      raised = needed - cash
      cash = needed
      events.push('raised')
    }
  }
  if (co.params.collapse === 'downRoundOrFail' && ctx.payEasyPath === 'downRound' && q === collapseQ) {
    shares = round(shares * (1 + TUNING.downRound.newShares))
    const needed = TUNING.downRound.runwayMonths * Math.max(0, -profit / 3)
    raised += Math.max(0, needed - cash)
    cash = Math.max(cash, needed)
    events.push('downRound')
  }

  // people
  const rule = p.layoff
  let rate = 0
  if (q >= rule.from && (!rule.weakSeasonOnly || season < 0)) rate = Math.min(rule.cap, rule.base + rule.step * (q - rule.from))
  rate += ctx.extraLayoff
  if (ctx.extraLayoff > 0) events.push('layoffNews')
  const layoffs = round(prev.employees * rate)
  const hires = layoffs > 0 ? 0 : round(prev.employees * Math.max(0, revenue / prev.revenue - 1) * 0.5)
  const employees = prev.employees - layoffs + hires

  // customers: paying customers, plus reported users that can drift away from them
  const lostCust = round(prev.customers * p.churn * (1 + eLost))
  const newCust = round(p.newBase * Math.pow(1 + p.newGrowth + ctx.newGrowthDelta, q) * (1 + eNew))
  const customers = Math.max(0, prev.customers + newCust - lostCust)
  const retention = prev.customers > 0 ? 1 - lostCust / prev.customers : 0
  let users = Math.max(customers, prev.users * (1 + p.userGrowth + eUsers))

  // insiders
  const forced = p.ceoForcedSell?.includes(q)
  const ceoTrade = forced || ceoRoll < p.ceoSellProb ? 'SELL' : ceoRoll < p.ceoSellProb + p.ceoBuyProb ? 'BUY' : 'NONE'

  // price
  const storyActive = q < Math.min(p.sentimentUntil, collapseQ)
  const storyPriced = storyActive && (co.archetype === 'hype' || co.archetype === 'smoke')
  const surprise = clip((profit - prev.profit) / Math.max(Math.abs(prev.revenue) * 0.1, 1), -1, 1)
  let logReturn =
    (storyPriced ? 0 : TUNING.surpriseWeight) * surprise +
    TUNING.marketWeight * TUNING.marketBeta[co.archetype] * ctx.marketShock +
    TUNING.sectorWeight * ctx.sectorShock +
    (storyActive ? p.sentiment : 0) +
    (p.collapse && q > collapseQ ? TUNING.postCollapseSentiment : 0) +
    ctx.priceBump +
    ctx.sentimentBump +
    ePrice
  if (co.archetype === 'smoke' && TUNING.smokeSpike.quarters.includes(q)) {
    logReturn += TUNING.smokeSpike.bump
    events.push('rumourSpike')
  }
  let price = prev.price * Math.exp(logReturn)
  if (events.includes('downRound')) price *= TUNING.downRound.priceMult
  if (co.params.collapse === 'restate' && q === collapseQ) {
    price *= TUNING.restate.priceMult
    users = Math.max(customers, users * TUNING.restate.usersMult)
    events.push('restated')
  }

  let failed = false
  const failNow =
    co.params.collapse === 'downRoundOrFail' && ((ctx.payEasyPath === 'fail' && q === collapseQ) || (q > collapseQ && cash <= 0))
  if (failNow) {
    failed = true
    price = 0
    cash = Math.max(0, cash)
    events.push('failed')
  }

  return {
    q,
    revenue,
    margin,
    interest,
    profit,
    debt,
    cash,
    raised,
    runwayMonths: profit >= 0 ? null : Math.max(0, cash) / (-profit / 3),
    employees,
    hires,
    layoffs,
    newCust,
    lostCust,
    customers,
    users,
    retention,
    complaints: round((lostCust / Math.max(1, prev.customers)) * 100),
    ceoTrade,
    ceoNetWorth: prev.ceoNetWorth * (prev.price > 0 ? price / prev.price : 1) * (ceoTrade === 'SELL' ? 0.97 : 1),
    price,
    shares,
    valuationYears: failed ? null : valuation(hist, profit, price, shares),
    failed,
    events,
  }
}

function ctxFor(co: Company, banner: Banner, card: Card | null, carry: { newGrowthDelta: number }, path: QuarterCtx['payEasyPath']): QuarterCtx {
  const ctx: QuarterCtx = {
    marketShock: banner.marketShock,
    sectorShock: banner.sector === co.sector ? (banner.sectorShock ?? 0) : 0,
    newGrowthDelta: carry.newGrowthDelta,
    extraLayoff: 0,
    priceBump: 0,
    sentimentBump: 0,
    revenueBump: 0,
    payEasyPath: path,
  }
  const e = card?.effect
  if (!e) return ctx
  if (e.kind === 'sector' && e.sector === co.sector) ctx.sectorShock += e.shock
  if (e.kind === 'newGrowth' && e.company === co.id) ctx.newGrowthDelta = carry.newGrowthDelta += e.delta
  if (e.kind === 'layoff' && e.company === co.id) ctx.extraLayoff = e.rate
  if (e.kind === 'priceBump' && e.company === co.id) ctx.priceBump = e.bump
  if (e.kind === 'sentimentBump' && e.company === co.id) ctx.sentimentBump = e.bump
  if (e.kind === 'revenueBump' && e.company === co.id) ctx.revenueBump = e.bump
  return ctx
}

/** The whole seeded market: dice, tiles, news, chance draws and all six companies for 12 quarters. */
export function simulateMarket(seed: string): MarketRun {
  const picked = pickCompanies(seed)
  const { rolls, positions } = rollPath(seed)
  const { banners, fallQ } = buildBanners(seed, picked)
  const chance = drawChance(seed, picked, positions)
  const payEasyPath = streamFor(seed, 'payEasyPath')() < 0.5 ? 'downRound' : 'fail'
  const history = {} as Record<CompanyId, QuarterStats[]>
  for (const co of COMPANIES) {
    const rng = streamFor(seed, co.id)
    const hist = [startStats(co)]
    const carry = { newGrowthDelta: 0 }
    for (let q = 1; q <= TURNS; q++) hist.push(simulateQuarter(hist, co, ctxFor(co, banners[q - 1], chance[q - 1], carry, payEasyPath), rng))
    history[co.id] = hist
  }
  return {
    seed,
    picked,
    pitchOrder: picked,
    rolls,
    positions,
    tiles: BOARD,
    banners,
    chance,
    emergencyTurn: emergencyTurn(seed, positions),
    fallQ,
    payEasyPath,
    history,
  }
}
