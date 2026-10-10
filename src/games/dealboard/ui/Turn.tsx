import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import { EMERGENCY_COST } from '../engine/events'
import { LIGHT_KEYS, founderAnswer } from '../engine/lights'
import { canBuy, houses, knownLights, lightsAt, type Action, type RunState } from '../engine/run'
import { HOUSE, LOAN_AMOUNT, holdingValueAt, invested, knownQuarter, netWorth, pitchFor, tileAt } from '../engine/state'
import type { CompanyId, LightKey, MarketRun } from '../engine/types'
import { LessonCard } from './LessonCard'
import { LightsPanel, lightFacts } from './Lights'
import { ChanceCard, NewsBanner, Sheet, TileHead, toneOf, useInr } from './Panels'
import { TradeDialog, type TradeMode } from './TradeDialog'

type Dispatch = (a: Action) => void

function Founder({ id, k, state, hist, q }: { id: CompanyId; k: LightKey; state: 'G' | 'A' | 'R' | 'X'; hist: MarketRun['history'][CompanyId]; q: number }) {
  const { t } = useTranslation('dealboard')
  const text = state === 'X' ? t(`lights.${k}.deflect`) : lightFacts(hist, q, k, t).detail
  return (
    <div className="rounded-lg border-2 border-ink bg-white/70 px-2.5 py-1.5 text-[13px] leading-snug">
      <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t(`lights.${k}.ask`)}</div>
      <div><span className="font-extrabold">{t('pitch.founderSays', { name: t(`companies.${id}.founder`).split(',')[0] })}</span> {text}{state === 'X' && <span className="db-stamp ml-2 text-[#6B5A4A]">{t('lights.state.X')}</span>}</div>
    </div>
  )
}

/** An Auction pitch: ask up to two questions (each turns a light over), then invest or pass. */
function Pitch({ run, m, id, dispatch, open }: { run: RunState; m: MarketRun; id: CompanyId; dispatch: Dispatch; open: () => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = knownQuarter(run)
  const co = COMPANY[id]
  const hist = m.history[id]
  const lights = lightsAt(m, id, q)
  const asked = run.asked[id] ?? []
  const known = knownLights(run, id)
  const left = 2 - asked.length
  const [sel, setSel] = useState<LightKey | null>(null)
  return (
    <div className="space-y-2.5">
      <div className="overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
        <div className="flex items-baseline justify-between gap-2 border-b-[3px] border-ink px-3 py-2" style={{ background: SECTOR_COLOUR[co.sector] }}>
          <span className="font-sign lang-fit truncate text-[18px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</span>
          <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-jasmine">{t(`sectors.${co.sector}`)}</span>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[15px] font-semibold italic">“{t(`companies.${id}.slogan`)}”</div>
          <div className="mt-1.5 rounded-lg border-2 border-ink bg-white/60 px-2.5 py-1.5 text-[14px]"><span className="font-extrabold">{t(`companies.${id}.founder`)}:</span> {t(`companies.${id}.line`)}</div>
          <div className="mt-2 flex justify-end"><span className="rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[13px] font-extrabold">{t('perShare', { price: money(hist[q].price) })}</span></div>
        </div>
      </div>

      <LightsPanel hist={hist} q={q} lights={lights} visible={known} selected={sel} onSelect={setSel} />

      <div>
        <div className="db-eyebrow text-[#8a5a2b]">{t('pitch.askTitle')} · {left > 0 ? t('pitch.askLeft', { n: left }) : t('pitch.askNone')}</div>
        <div className="mt-1.5 grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
          {LIGHT_KEYS.map((k) => (
            <button key={k} type="button" disabled={asked.includes(k) || left <= 0 || (run.clues[id] ?? []).includes(k)} onClick={() => dispatch({ type: 'ask', companyId: id, light: k })} className="min-h-12 rounded-lg border-2 border-ink px-2 py-1 text-left text-[13px] font-bold leading-tight" style={{ background: asked.includes(k) ? '#E6D8B6' : '#FFF3D6', opacity: asked.includes(k) || left <= 0 ? 0.55 : 1 }}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">{t(`lights.${k}.name`)}</span><br />{t(`lights.${k}.ask`)}
            </button>
          ))}
        </div>
        <div className="mt-2 space-y-1.5">{asked.map((k) => <Founder key={k} id={id} k={k} state={founderAnswer(lights, id, k)} hist={hist} q={q} />)}</div>
        <p className="m-0 mt-1.5 text-[12px] opacity-65">{t('pitch.tip')}</p>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="ink-btn cream" onClick={() => dispatch({ type: 'pass', companyId: id })}>{t('pitch.pass')}</button>
        <button type="button" className="ink-btn pink" disabled={!canBuy(run)} style={{ opacity: canBuy(run) ? 1 : 0.5 }} onClick={open}>{t('pitch.bid')} ▸</button>
      </div>
      {!canBuy(run) && <p className="m-0 text-right text-[13px] font-bold text-[#C8442F]">{t('trade.jailed')}</p>}
    </div>
  )
}

/** Owned companies: all four lights, value, gain, houses, buy more and sell. */
function Portfolio({ run, m, dispatch, onTrade, sellOnly }: { run: RunState; m: MarketRun; dispatch?: Dispatch; onTrade: (mode: TradeMode, id: CompanyId) => void; sellOnly?: boolean }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const [open, setOpen] = useState<{ id: CompanyId; k: LightKey } | null>(null)
  const q = knownQuarter(run)
  const ids = Object.keys(run.holdings) as CompanyId[]
  const nw = netWorth(run, m)
  void dispatch
  if (!ids.length) return <p className="m-0 text-[14px] opacity-70">{t('portfolio.empty')}</p>
  return (
    <div className="space-y-2.5">
      {ids.map((id) => {
        const h = run.holdings[id]!
        const value = holdingValueAt(run, m, id, q)
        const gain = value - h.cost
        const co = COMPANY[id]
        const share = nw > 0 ? value / nw : 0
        const hs = houses(h)
        const failed = m.history[id][q].failed
        return (
          <div key={id} className="overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
            <div className="flex items-baseline justify-between gap-2 border-b-[3px] border-ink px-3 py-1.5" style={{ background: SECTOR_COLOUR[co.sector] }}>
              <span className="font-sign lang-fit truncate text-[16px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</span>
              <span className="shrink-0 rounded-full border-2 border-ink bg-jasmine px-2 text-[12px] font-extrabold" style={{ color: gain >= 0 ? '#2f6f4a' : '#C8442F' }}>{gain >= 0 ? '▲ ' : '▼ '}{money(Math.abs(gain))}</span>
            </div>
            <div className="px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]">
                <span className="font-extrabold">{t('portfolio.value', { v: money(value) })}</span>
                <span className="opacity-70">{t('portfolio.paidIn', { c: money(h.cost) })}</span>
                <span className="opacity-70" title={t('portfolio.noHouses')}>{hs >= 5 ? '🏨 ' + t('portfolio.hotel') : hs > 0 ? '🏠'.repeat(hs) + ' ' + t('portfolio.houses', { n: hs }) : t('portfolio.noHouses')}</span>
              </div>
              <div className="mt-2">
                <LightsPanel hist={m.history[id]} q={q} lights={lightsAt(m, id, q)} visible="all" selected={open?.id === id ? open.k : null} onSelect={(k) => setOpen(k ? { id, k } : null)} />
              </div>
              {share > 0.4 && <p className="m-0 mt-2 rounded-md border-2 border-[#C8442F] bg-[#fbe3dc] px-2 py-1 text-[12px] font-bold">⚠ {t('portfolio.concentration', { pct: Math.round(share * 100), sector: t(`sectors.${co.sector}`) })}</p>}
              <div className="mt-2 flex justify-end gap-2">
                {!sellOnly && !failed && <button type="button" className="ink-btn cream" style={{ minHeight: 44 }} onClick={() => onTrade('buyMore', id)}>{t('portfolio.buyMore')}</button>}
                <button type="button" className="ink-btn" style={{ minHeight: 44 }} onClick={() => onTrade('sell', id)}>{t('portfolio.sell')}</button>
              </div>
            </div>
          </div>
        )
      })}
      <p className="m-0 text-[11px] opacity-60">{t('portfolio.colourNote')} {t('trade.min', { min: money(HOUSE) })}</p>
    </div>
  )
}

function QuarterResults({ run, m }: { run: RunState; m: MarketRun }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = run.turn
  const ids = Object.keys(run.holdings) as CompanyId[]
  if (q < 1) return null
  return (
    <div className="mt-2 rounded-lg border-2 border-ink bg-white/60 p-2.5">
      <div className="db-eyebrow text-[#8a5a2b]">{t('quarterResults.title', { n: q })}</div>
      {ids.length === 0 ? <p className="m-0 mt-1 text-[13px] opacity-70">{t('quarterResults.none')}</p> : (
        <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0 text-[13px]">
          {ids.map((id) => {
            const now = m.history[id][q]
            const before = m.history[id][q - 1]
            const move = before.price > 0 ? now.price / before.price - 1 : 0
            const h = run.holdings[id]!
            const yours = h.units * (now.price - before.price)
            return (
              <li key={id} className="leading-snug">
                <span className="font-extrabold">{t(`companies.${id}.name`)}</span> {move >= 0 ? '▲' : '▼'} {Math.abs(move * 100).toFixed(1)}% · {t('quarterResults.profit')} {t('quarterResults.lakh', { v: now.profit.toFixed(1) })} · {t('quarterResults.yours')} <span className="font-extrabold" style={{ color: yours >= 0 ? '#2f6f4a' : '#C8442F' }}>{yours >= 0 ? '+' : '−'}{money(Math.abs(yours))}</span>
                {now.events.filter((e) => e !== 'raised' || true).map((e) => <div key={e} className="text-[12px] opacity-75">• {t(`companies.${id}.name`)} {t(`quarterResults.ev.${e}`)}</div>)}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Bank({ run, m, dispatch }: { run: RunState; m: MarketRun; dispatch: Dispatch }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const [id, setId] = useState<CompanyId>(m.picked[0])
  const [k, setK] = useState<LightKey>('cash')
  const have = (run.clues[id] ?? []).includes(k)
  return (
    <div className="space-y-3 text-[14px]">
      <p className="m-0">{t('bank.intro')}</p>
      <div className="rounded-lg border-2 border-ink bg-white/60 p-2.5">
        <div className="font-sign lang-fit text-[15px]">{t('bank.clue')}</div>
        <p className="m-0 text-[13px] opacity-75">{t('bank.clueBody')}</p>
        <div className="mt-2 text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t('bank.pickCompany')}</div>
        <div className="flex flex-wrap gap-1.5">{m.picked.map((c) => <button key={c} type="button" aria-pressed={id === c} onClick={() => setId(c)} className="min-h-10 rounded-lg border-2 border-ink px-2 text-[13px] font-bold" style={{ background: id === c ? '#E8B04A' : '#FFF3D6' }}>{t(`companies.${c}.name`)}</button>)}</div>
        <div className="mt-2 text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t('bank.pickLight')}</div>
        <div className="flex flex-wrap gap-1.5">{LIGHT_KEYS.map((l) => <button key={l} type="button" aria-pressed={k === l} onClick={() => setK(l)} className="min-h-10 rounded-lg border-2 border-ink px-2 text-[13px] font-bold" style={{ background: k === l ? '#E8B04A' : '#FFF3D6' }}>{t(`lights.${l}.name`)}</button>)}</div>
        <div className="mt-2 flex justify-end"><button type="button" className="ink-btn" disabled={have} style={{ opacity: have ? 0.5 : 1 }} onClick={() => dispatch({ type: 'clue', companyId: id, light: k })}>{t('bank.clue')} ▸</button></div>
      </div>
      <div className="rounded-lg border-2 border-ink bg-white/60 p-2.5">
        <div className="font-sign lang-fit text-[15px]">{t('bank.loan')}</div>
        <p className="m-0 text-[13px] opacity-75">{t('bank.loanBody')}</p>
        <div className="mt-2 flex justify-end">
          {run.loan > 0 ? <span className="text-[13px] font-bold">{t('bank.loanHave', { x: money(run.loan) })}</span> : <button type="button" className="ink-btn cream" onClick={() => dispatch({ type: 'loan' })}>{money(LOAN_AMOUNT)} ▸</button>}
        </div>
      </div>
      <div className="flex justify-end"><button type="button" className="ink-btn cream" onClick={() => dispatch({ type: 'resolve' })}>{t('bank.skip')}</button></div>
    </div>
  )
}

/** The whole decision area under the board, one phase at a time. */
export function TurnPanel({ run, m, arrived, rolling, dispatch, onRoll, onRewind }: { run: RunState; m: MarketRun; arrived: boolean; rolling: boolean; dispatch: Dispatch; onRoll: () => void; onRewind: () => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const [dlg, setDlg] = useState<{ mode: TradeMode; id: CompanyId } | null>(null)
  const q = knownQuarter(run)
  const close = () => setDlg(null)

  const dialog = dlg && (
    <TradeDialog
      mode={dlg.mode}
      companyId={dlg.id}
      price={m.history[dlg.id][q].price}
      cash={run.cash}
      holding={run.holdings[dlg.id]}
      blocked={!canBuy(run)}
      onCancel={close}
      onConfirm={({ amount, fraction, reason }) => {
        if (dlg.mode === 'invest') dispatch({ type: 'bid', companyId: dlg.id, amount, reason })
        else if (dlg.mode === 'buyMore') dispatch({ type: 'buyMore', companyId: dlg.id, amount, reason })
        else dispatch({ type: 'sell', companyId: dlg.id, fraction, reason })
        close()
      }}
    />
  )

  if (run.phase === 'news') {
    const turn = run.turn + 1
    return (
      <Sheet eyebrow={t('news.label')} title={t('quarter', { n: turn })} actions={<button type="button" className="ink-btn pink px-6" disabled={rolling} onClick={onRoll}>🎲 {t('roll')}</button>}>
        <NewsBanner banner={m.banners[turn - 1]} />
        {run.lastDrag > 0 && <p className="m-0 mt-2 text-[13px] opacity-70">{t('dragNote', { x: money(run.lastDrag) })}</p>}
        <QuarterResults run={run} m={m} />
      </Sheet>
    )
  }

  if (run.phase === 'land' && !arrived) return <Sheet eyebrow={t('yourMove')} title={t('rolled', { n: m.rolls[run.turn - 1] })}><span className="opacity-70">{t('moving', { n: m.rolls[run.turn - 1] })}</span></Sheet>

  if (run.phase === 'land') {
    const kind = tileAt(run, m)
    const head = { eyebrow: t('quarter', { n: run.turn }), title: t(`tiles.${kind}.name`), icon: <TileHead kind={kind} />, tone: toneOf(kind) }
    const next = (label = t('next')) => <button type="button" className="ink-btn" onClick={() => dispatch({ type: 'resolve' })}>{label}</button>
    if (kind === 'auction') {
      const id = pitchFor(run, m)
      if (!id) return <Sheet {...head} actions={next()}>{t('auction.none')}</Sheet>
      return <Sheet {...head}><div className="db-eyebrow mb-1.5 text-[#8a5a2b]">{t('auction.pitching')}</div><Pitch run={run} m={m} id={id} dispatch={dispatch} open={() => setDlg({ mode: 'invest', id })} />{dialog}</Sheet>
    }
    if (kind === 'chance') {
      const card = m.chance[run.turn - 1]
      return <Sheet {...head} actions={next(t('cards.gotIt'))}>{card && <ChanceCard card={card} />}</Sheet>
    }
    if (kind === 'bank') return <Sheet {...head}><Bank run={run} m={m} dispatch={dispatch} /></Sheet>
    if (kind === 'rent') {
      const ids = Object.keys(run.holdings) as CompanyId[]
      return (
        <Sheet {...head} actions={next()}>
          {ids.length === 0 ? t('tiles.rent.empty') : (
            <ul className="m-0 list-none space-y-1.5 p-0 text-[14px]">
              {ids.map((id) => {
                const s = m.history[id][run.turn]
                const rent = (run.holdings[id]!.units / s.shares) * s.profit * 1e5
                return <li key={id} className="flex justify-between gap-2 rounded-lg border-2 border-ink bg-white/60 px-2.5 py-1.5"><span className="font-bold">{t(`companies.${id}.name`)}</span><span className="font-extrabold" style={{ color: rent >= 0 ? '#2f6f4a' : '#C8442F' }}>{rent >= 0 ? '▲ ' : '▼ '}{money(Math.abs(rent))} {rent >= 0 ? t('rent.profit') : t('rent.lossWord')}</span></li>
              })}
            </ul>
          )}
          {ids.length > 0 && <p className="m-0 mt-2 text-[12px] opacity-70">{t('rent.note')}</p>}
        </Sheet>
      )
    }
    const body =
      kind === 'start' ? t('tiles.start.body', { cash: money(run.cash), nw: money(netWorth(run, m)) })
      : kind === 'tax' ? t('tiles.tax.body', { fees: money(run.feesPaid) })
      : kind === 'parking' ? t('tiles.parking.body', { lost: money(run.cashDragLost) })
      : t('tiles.chest.body') + (run.turn === m.emergencyTurn ? ' ' + t('tiles.chest.warn') : '')
    return <Sheet {...head} actions={next()}>{body}</Sheet>
  }

  if (run.phase === 'manage') {
    return (
      <>
        <Sheet eyebrow={t('quarter', { n: run.turn })} title={t('portfolio.title')} actions={<button type="button" className="ink-btn pink" onClick={() => dispatch({ type: 'endTurn' })}>{t('endTurn')} ▸</button>}>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] opacity-80"><span>{t('cash')} {money(run.cash)}</span><span>{t('invested')} {money(invested(run, m))}</span>{run.loan > 0 && <span className="font-bold text-[#C8442F]">{t('bank.owe', { x: money(run.loan) })}</span>}</div>
          {run.loan > 0 && <button type="button" className="ink-btn cream mb-2" disabled={run.cash < run.loan} style={{ opacity: run.cash < run.loan ? 0.5 : 1, minHeight: 44 }} onClick={() => dispatch({ type: 'repay' })}>{t('bank.repay', { x: money(run.loan) })}</button>}
          <Portfolio run={run} m={m} dispatch={dispatch} onTrade={(mode, id) => setDlg({ mode, id })} />
        </Sheet>
        {dialog}
      </>
    )
  }

  if (run.phase === 'emergency') {
    const short = Math.max(0, EMERGENCY_COST - run.cash)
    const noHold = Object.keys(run.holdings).length === 0
    return (
      <>
        <Sheet eyebrow={t('emergency.eyebrow')} title={t('emergency.title')} tone="#C8442F" actions={<button type="button" className="ink-btn pink" disabled={short > 0 && !noHold} style={{ opacity: short > 0 && !noHold ? 0.5 : 1 }} onClick={() => dispatch({ type: 'payEmergency' })}>{short > 0 ? t('emergency.payShort') : t('emergency.pay')}</button>}>
          <p className="m-0">{t('emergency.body')}</p>
          <p className="m-0 mt-1 font-bold">{t('emergency.have', { cash: money(run.cash) })} · {short > 0 ? t('emergency.short', { x: money(short) }) : t('emergency.ready')}</p>
          {short > 0 && noHold && <p className="m-0 text-[13px] opacity-75">{t('emergency.payShortNote')}</p>}
          <div className="mt-2"><Portfolio run={run} m={m} onTrade={(mode, id) => setDlg({ mode, id })} sellOnly /></div>
        </Sheet>
        {dialog}
      </>
    )
  }

  if (run.phase === 'lesson' && run.lesson) return <LessonCard run={run} onContinue={() => dispatch({ type: 'continue' })} onReplay={onRewind} />

  return null
}
