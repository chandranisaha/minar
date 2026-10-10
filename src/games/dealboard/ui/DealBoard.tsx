import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TitleCard } from '../../../components/TitleCard'
import { useLite } from '../../../store/game'
import { BOARD, TURNS } from '../engine/board'
import { invested, knownQuarter, marketFor, netWorth, pitchFor, tileAt, type RunState } from '../engine/run'
import type { MarketRun } from '../engine/types'
import { useDealBoard } from '../state/store'
import { Board } from './Board'
import { Die } from './Dice'
import { ChanceCard, CompanyCard, NewsBanner, Sheet, Stat, TileHead, toneOf, useInr } from './Panels'
import './dealboard.css'

const STEP_MS = 170
const ROLL_MS = 650

export interface DealBoardProps {
  /** fixed seed (a class can share one); otherwise each new game picks its own */
  seed?: string
  onExit: () => void
}

/** Deal Board Lite: the investing stage of the bazaar, played as a dice-and-board game. */
export default function DealBoard({ seed, onExit }: DealBoardProps) {
  const run = useDealBoard((s) => s.run)
  const start = useDealBoard((s) => s.start)
  const { t } = useTranslation('dealboard')
  return (
    <div className="db-root absolute inset-0 overflow-y-auto">
      {run ? <Game run={run} onExit={onExit} /> : <Intro onStart={() => start(seed)} onExit={onExit} />}
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
  useEffect(() => {
    if (lite || shown === target) return
    const id = window.setTimeout(() => setShown((s) => (s + 1) % BOARD.length), STEP_MS)
    return () => window.clearTimeout(id)
  }, [shown, target, lite])
  // lite mode jumps straight to the tile
  return lite ? target : shown
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

function Game({ run, onExit }: { run: RunState; onExit: () => void }) {
  const { t } = useTranslation('dealboard')
  const dispatch = useDealBoard((s) => s.dispatch)
  const quit = useDealBoard((s) => s.quit)
  const lite = useLite()
  const money = useInr()
  const m = marketFor(run.seed)
  const target = m.positions[run.turn]
  const shown = useTokenWalk(target, lite)
  const arrived = shown === target
  const [rolling, setRolling] = useState(false)
  const [face, setFace] = useState(1)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // cosmetic tumbling faces while the die rolls
  useEffect(() => {
    if (!rolling) return
    const id = window.setInterval(() => setFace((f) => (f % 6) + 1), 110)
    return () => window.clearInterval(id)
  }, [rolling])

  const roll = () => {
    if (lite) return dispatch({ type: 'roll' })
    setRolling(true)
    timer.current = window.setTimeout(() => {
      setRolling(false)
      dispatch({ type: 'roll' })
    }, ROLL_MS)
  }

  const nextQ = run.phase === 'news' ? run.turn + 1 : run.turn
  const lastRoll = run.turn > 0 ? m.rolls[run.turn - 1] : 1
  const dieFace = rolling ? face : lastRoll

  return (
    // phones: header, board, sheet stacked; wide screens: board beside the sheet so every decision stays above the fold
    <div className="mx-auto flex max-w-[560px] flex-col gap-3 px-3 pb-6 pt-3 sm:px-4 lg:grid lg:max-w-[1060px] lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-5">
      <Header run={run} m={m} onExit={onExit} />
      <Board tokenAt={shown} current={run.phase === 'land' && arrived ? target : null}>
        <div className="db-eyebrow text-[#E8B04A]">{t('quarter', { n: Math.min(TURNS, Math.max(1, nextQ)) })}</div>
        <div className="db-wordmark">{t('title')}</div>
        <div className="db-rule" />
        <div className="flex flex-wrap justify-center gap-1" aria-hidden>
          {Array.from({ length: TURNS }, (_, i) => <span key={i} className={`db-pip ${i < run.turn ? 'on' : ''}`} />)}
        </div>
        <Die value={dieFace} rolling={rolling} size={48} label={t('rolled', { n: lastRoll })} />
      </Board>
      <div className="lg:sticky lg:top-3">
        <Panel run={run} m={m} arrived={arrived} rolling={rolling} onRoll={roll} onAgain={() => quit()} onExit={onExit} money={money} />
      </div>
    </div>
  )
}

function Panel({ run, m, arrived, rolling, onRoll, onAgain, onExit, money }: {
  run: RunState; m: MarketRun; arrived: boolean; rolling: boolean; onRoll: () => void; onAgain: () => void; onExit: () => void; money: (n: number) => string
}) {
  const { t } = useTranslation('dealboard')
  const dispatch = useDealBoard((s) => s.dispatch)
  const next = (label = t('next')) => <button type="button" className="ink-btn" onClick={() => dispatch({ type: 'resolve' })}>{label}</button>

  if (run.phase === 'news') {
    const q = run.turn + 1
    return (
      <Sheet eyebrow={t('news.label')} title={t('quarter', { n: q })} actions={<button type="button" className="ink-btn pink px-6" disabled={rolling} onClick={onRoll}>🎲 {t('roll')}</button>}>
        <NewsBanner banner={m.banners[q - 1]} />
        {run.lastDrag > 0 && <p className="m-0 mt-2 text-[13px] opacity-70">{t('dragNote', { x: money(run.lastDrag) })}</p>}
      </Sheet>
    )
  }

  if (run.phase === 'land' && !arrived) {
    return <Sheet eyebrow={t('yourMove')} title={t('rolled', { n: m.rolls[run.turn - 1] })}><span className="opacity-70">{t('moving', { n: m.rolls[run.turn - 1] })}</span></Sheet>
  }

  if (run.phase === 'land') {
    const kind = tileAt(run, m)
    const head = { eyebrow: t('quarter', { n: run.turn }), title: t(`tiles.${kind}.name`), icon: <TileHead kind={kind} />, tone: toneOf(kind) }
    if (kind === 'auction') {
      const id = pitchFor(run, m)
      if (!id) return <Sheet {...head} actions={next()}>{t('auction.none')}</Sheet>
      return (
        <Sheet {...head} actions={<button type="button" className="ink-btn cream" onClick={() => dispatch({ type: 'pass', companyId: id })}>{t('auction.pass')}</button>}>
          <div className="db-eyebrow mb-1.5 text-[#8a5a2b]">{t('auction.pitching')}</div>
          <CompanyCard id={id} price={m.history[id][knownQuarter(run)].price} />
          <p className="m-0 mt-2 text-[13px] opacity-70">{t('auction.bidSoon')}</p>
        </Sheet>
      )
    }
    if (kind === 'chance') {
      const card = m.chance[run.turn - 1]
      return <Sheet {...head} actions={next(t('cards.gotIt'))}>{card && <ChanceCard card={card} />}</Sheet>
    }
    const body =
      kind === 'start' ? t('tiles.start.body', { cash: money(run.cash), nw: money(netWorth(run, m)) })
      : kind === 'tax' ? t('tiles.tax.body', { fees: money(run.feesPaid) })
      : kind === 'parking' ? t('tiles.parking.body', { lost: money(run.cashDragLost) })
      : kind === 'rent' ? (Object.keys(run.holdings).length ? t('tiles.rent.body') : t('tiles.rent.empty'))
      : t(`tiles.${kind}.body`)
    return <Sheet {...head} actions={next()}>{body}</Sheet>
  }

  if (run.phase === 'manage') {
    return (
      <Sheet eyebrow={t('quarter', { n: run.turn })} title={t('netWorth') + ': ' + money(netWorth(run, m))} actions={<button type="button" className="ink-btn pink" onClick={() => dispatch({ type: 'endTurn' })}>{t('endTurn')} ▸</button>}>
        <span className="opacity-75">{t('cash')} {money(run.cash)} · {t('invested')} {money(invested(run, m))}</span>
      </Sheet>
    )
  }

  if (run.phase === 'yearEnd') {
    const year = run.turn / 4
    const last = run.turn >= TURNS
    return (
      <Sheet eyebrow="★ ★ ★" title={t('yearEnd.title', { n: year })} actions={<button type="button" className="ink-btn pink" onClick={() => dispatch({ type: 'continue' })}>{last ? t('yearEnd.finish') : t('yearEnd.continue', { n: year + 1 })} ▸</button>}>
        <p className="m-0">{t('yearEnd.body', { nw: money(netWorth(run, m)), cash: money(run.cash), inv: money(invested(run, m)) })}</p>
        <p className="m-0 mt-1 text-[13px] opacity-75">{t('yearEnd.drag', { lost: money(run.cashDragLost) })} {t('yearEnd.fees', { fees: money(run.feesPaid) })}</p>
      </Sheet>
    )
  }

  return (
    <Sheet eyebrow="★ ★ ★" title={t('done.title')} actions={<>
      <button type="button" className="ink-btn teal" onClick={onExit}>◀ {t('back')}</button>
      <button type="button" className="ink-btn pink" onClick={onAgain}>{t('done.again')}</button>
    </>}>
      <p className="m-0">{t('done.body', { nw: money(netWorth(run, m)) })}</p>
      <p className="m-0 mt-1 text-[13px] opacity-75">{t('done.soon')}</p>
      <p className="m-0 mt-3 border-t-2 border-dashed border-ink/30 pt-2 text-[13px] font-semibold italic">{t('closing')}</p>
    </Sheet>
  )
}
