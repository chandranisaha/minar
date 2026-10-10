import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TitleCard } from '../../../components/TitleCard'
import { useLite } from '../../../store/game'
import { BOARD, TURNS } from '../engine/board'
import { houses, invested, marketFor, needsDecision, netWorth, type RunState } from '../engine/run'
import { computeScore, type Score } from '../engine/scoring'
import type { CompanyId, MarketRun } from '../engine/types'
import { useDealBoard } from '../state/store'
import { Board } from './Board'
import { CompanyStrip, Meet } from './Companies'
import { Dossier } from './Dossier'
import { TradeDialog, type TradeMode } from './TradeDialog'
import { knownQuarter, priceAt } from '../engine/state'
import { Die } from './Dice'
import { Report } from './Report'
import { Sheet, Stat, useInr } from './Panels'
import { TurnPanel } from './Turn'
import './dealboard.css'

const NOOP = () => {}
const STEP_MS = 170
const ROLL_MS = 650

export interface DealBoardProps {
  /** fixed seed (a class can share one); otherwise each new game picks its own */
  seed?: string
  onExit: () => void
  /** called once when a run ends, with the judgement score and skill breakdown */
  onComplete?: (score: Score) => void
}

/** Deal Board Lite: the investing stage of the bazaar, played as a dice-and-board game. */
export default function DealBoard({ seed, onExit, onComplete }: DealBoardProps) {
  const run = useDealBoard((s) => s.run)
  const start = useDealBoard((s) => s.start)
  const { t } = useTranslation('dealboard')
  return (
    <div className="db-root absolute inset-0 overflow-y-auto">
      {run ? <Game run={run} onExit={onExit} onComplete={onComplete} /> : <Intro onStart={() => start(seed)} onExit={onExit} />}
      <footer className="db-guardrail sticky bottom-0 z-20 px-3 py-2 text-center" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {t('guardrail')}
      </footer>
    </div>
  )
}

/** `compact` drops the label on phones so the money strip gets the room. */
function BackButton({ onExit, compact }: { onExit: () => void; compact?: boolean }) {
  const { t } = useTranslation('dealboard')
  return (
    <button type="button" className="ink-chip font-sign lang-fit h-11 min-w-11 shrink-0 self-start px-3 text-[13px]" onClick={onExit} aria-label={t('back')}>
      ◀<span className={compact ? 'hidden sm:inline' : ''}> {t('back')}</span>
    </button>
  )
}

function Intro({ onStart, onExit }: { onStart: () => void; onExit: () => void }) {
  const { t } = useTranslation('dealboard')
  const steps = t('intro', { returnObjects: true }) as string[]
  return (
    <div className="mx-auto flex min-h-[calc(100%-40px)] max-w-[560px] flex-col gap-4 px-4 pb-6 pt-3">
      <BackButton onExit={onExit} />
      <TitleCard eyebrow={t('eyebrow')} title={t('title')}>
        <p className="m-0">{t('tagline')}</p>
      </TitleCard>
      <ol className="paper m-0 flex list-none flex-col gap-3 p-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] leading-snug">
            <span className="font-sign grid h-8 w-8 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-mustard text-[14px]">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="ink-btn pink self-center px-8 text-[18px]" onClick={onStart}>{t('start')}</button>
    </div>
  )
}

/** Walks the token one tile at a time from where it was to where the seed says it lands. */
function useTokenWalk(target: number, lite: boolean) {
  const [shown, setShown] = useState(target)
  const dist = (target - shown + BOARD.length) % BOARD.length
  useEffect(() => {
    if (lite || dist === 0) return
    // a long jump (a replay sending the token back) snaps; a die roll is at most 6 tiles
    const snap = dist > 6
    const id = window.setTimeout(() => setShown(snap ? target : (shown + 1) % BOARD.length), snap ? 0 : STEP_MS)
    return () => window.clearTimeout(id)
  }, [shown, target, lite, dist])
  return lite || dist > 6 ? target : shown
}

function Header({ run, m, onExit }: { run: RunState; m: MarketRun; onExit: () => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  return (
    <header className="flex items-center gap-2 lg:col-span-2">
      <BackButton onExit={onExit} compact />
      <div className="ink-chip grid min-w-0 flex-1 grid-cols-3 gap-2 px-2.5 py-1.5 sm:px-3">
        <Stat label={t('cash')} value={money(run.cash)} />
        <Stat label={t('invested')} value={money(invested(run, m))} />
        <Stat label={t('netWorth')} value={money(netWorth(run, m))} strong />
      </div>
    </header>
  )
}

function YearEnd({ run, m }: { run: RunState; m: MarketRun }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const dispatch = useDealBoard((s) => s.dispatch)
  const year = run.turn / 4
  const last = run.turn >= TURNS
  const ids = Object.keys(run.holdings) as CompanyId[]
  const cost = ids.reduce((s, id) => s + run.holdings[id]!.cost, 0)
  const value = invested(run, m)
  const grew = cost > 0 && value > cost
  return (
    <Sheet eyebrow="★ ★ ★" title={t('yearEnd.title', { n: year })} actions={<button type="button" className="ink-btn pink" onClick={() => dispatch({ type: 'continue' })}>{last ? t('yearEnd.finish') : t('yearEnd.continue', { n: year + 1 })} ▸</button>}>
      <p className="m-0">{t('yearEnd.body', { nw: money(netWorth(run, m)), cash: money(run.cash), inv: money(value) })}</p>
      <p className="m-0 mt-1 text-[13px] opacity-75">{t('yearEnd.drag', { lost: money(run.cashDragLost) })} {t('yearEnd.fees', { fees: money(run.feesPaid) })}</p>
      <div className="mt-3 rounded-lg border-2 border-ink bg-[#F6E6BE] p-2.5 text-[14px] leading-snug">
        <div className="db-eyebrow text-[#8a5a2b]">{t('yearEnd2.compounding')}</div>
        <p className="m-0 mt-0.5 font-semibold">{grew ? t('lite.11.did', { r_a: money(cost), r_b: money(value) }) : t('lite.11.didB')}</p>
        <p className="m-0 mt-1">{t('lite.11.idea')}</p>
        <p className="m-0 mt-1 font-extrabold">{t('lite.11.rule')}</p>
      </div>
      <div className="mt-2 text-[13px]">
        <div className="db-eyebrow text-[#8a5a2b]">{t('yearEnd2.houses')}</div>
        {ids.length === 0 ? <span className="opacity-70">{t('yearEnd2.none')}</span> : ids.map((id) => <div key={id}>{t(`companies.${id}.name`)}: {houses(run.holdings[id]!) >= 5 ? '🏨' : '🏠'.repeat(houses(run.holdings[id]!)) || '–'}</div>)}
      </div>
    </Sheet>
  )
}

function Game({ run, onExit, onComplete }: { run: RunState; onExit: () => void; onComplete?: (s: Score) => void }) {
  const { t } = useTranslation('dealboard')
  const dispatch = useDealBoard((s) => s.dispatch)
  const quit = useDealBoard((s) => s.quit)
  const lite = useLite()
  const m = marketFor(run.seed)
  const target = m.positions[run.turn]
  const shown = useTokenWalk(target, lite)
  const arrived = shown === target
  const [rolling, setRolling] = useState(false)
  const [face, setFace] = useState(1)
  const [study, setStudy] = useState<CompanyId | null>(null)
  const [trade, setTrade] = useState<{ mode: TradeMode; id: CompanyId } | null>(null)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // cosmetic tumbling faces while the die rolls
  useEffect(() => {
    if (!rolling) return
    const id = window.setInterval(() => setFace((f) => (f % 6) + 1), 110)
    return () => window.clearInterval(id)
  }, [rolling])

  // tiles that need no decision resolve themselves a moment after the token lands: what happened is told in the next briefing
  const quiet = run.phase === 'land' && arrived && !needsDecision(run, m)
  useEffect(() => {
    if (!quiet) return
    const id = window.setTimeout(() => dispatch({ type: 'resolve' }), lite ? 250 : 900)
    return () => window.clearTimeout(id)
  }, [quiet, run.turn, lite, dispatch])

  const roll = () => {
    if (lite) return dispatch({ type: 'roll' })
    setRolling(true)
    timer.current = window.setTimeout(() => {
      setRolling(false)
      dispatch({ type: 'roll' })
    }, ROLL_MS)
  }

  if (!run.briefed) return <Meet m={m} onStart={() => dispatch({ type: 'brief' })} />

  const nextQ = run.phase === 'news' ? run.turn + 1 : run.turn
  const lastRoll = run.turn > 0 ? m.rolls[run.turn - 1] : 1
  const dieFace = rolling ? face : lastRoll
  const score = run.phase === 'done' ? computeScore(run, m) : null
  const q = knownQuarter(run)

  const confirmTrade = ({ amount, fraction, reason }: { amount: number; fraction: number; reason: string }) => {
    if (!trade) return
    if (trade.mode === 'invest') dispatch({ type: 'bid', companyId: trade.id, amount, reason })
    else if (trade.mode === 'buyMore') dispatch({ type: 'buyMore', companyId: trade.id, amount, reason })
    else dispatch({ type: 'sell', companyId: trade.id, fraction, reason })
    setTrade(null)
    if (trade.mode === 'sell' && fraction >= 1) setStudy(null)
  }

  return (
    // phones: header, companies, board, sheet stacked; wide screens: board beside the sheet
    <div className="mx-auto flex max-w-[560px] flex-col gap-3 px-3 pb-6 pt-3 sm:px-4 lg:grid lg:max-w-[1060px] lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-5">
      <Header run={run} m={m} onExit={onExit} />
      <div className="flex flex-col gap-2">
        <CompanyStrip run={run} m={m} onOpen={setStudy} />
        <Board run={run} m={m} tokenAt={shown} current={run.phase === 'land' && arrived ? target : null} onOpen={setStudy}>
          <div className="db-eyebrow text-[#E8B04A]">{t('quarter', { n: Math.min(TURNS, Math.max(1, nextQ)) })}</div>
          <div className="db-wordmark">{t('title')}</div>
          <div className="db-rule" />
          <div className="flex flex-wrap justify-center gap-1" aria-hidden>
            {Array.from({ length: TURNS }, (_, i) => <span key={i} className={`db-pip ${i < run.turn ? 'on' : ''}`} />)}
          </div>
          <Die value={dieFace} rolling={rolling} size={48} label={t('rolled', { n: lastRoll })} />
        </Board>
        <p className="m-0 text-center text-[12px] text-jasmine/80">{t('boardHint')}</p>
      </div>
      <div className="lg:sticky lg:top-3 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto lg:pr-1">
        {run.phase === 'done' && score ? (
          <Report run={run} score={score} onComplete={onComplete ?? NOOP} onAgain={() => quit()} onExit={onExit} />
        ) : run.phase === 'yearEnd' ? (
          <YearEnd run={run} m={m} />
        ) : (
          <TurnPanel run={run} m={m} arrived={arrived} rolling={rolling} dispatch={dispatch} onRoll={roll} onRewind={() => dispatch({ type: 'rewind' })} onOpen={setStudy} onTrade={(mode, id) => setTrade({ mode, id })} />
        )}
      </div>
      {study && !trade && <Dossier run={run} m={m} id={study} onClose={() => setStudy(null)} onTrade={(mode) => setTrade({ mode, id: study })} />}
      {trade && (
        <TradeDialog mode={trade.mode} companyId={trade.id} price={priceAt(m, trade.id, q)} cash={run.cash} holding={run.holdings[trade.id]} blocked={trade.mode !== 'sell' && run.jailedTurn === (run.phase === 'news' ? run.turn + 1 : run.turn)} onCancel={() => setTrade(null)} onConfirm={confirmTrade} />
      )}
    </div>
  )
}
