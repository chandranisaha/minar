import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import { EMERGENCY_COST } from '../engine/events'
import { explainQuarter } from '../engine/explain'
import { LIGHT_KEYS, founderAnswer } from '../engine/lights'
import { canBuy, knownLights, lightsAt, needsDecision, type Action, type RunState } from '../engine/run'
import { holdingValueAt, knownQuarter, netWorth, pitchFor, tileAt } from '../engine/state'
import { LOAN_AMOUNT } from '../engine/state'
import type { CompanyId, LightKey, MarketRun } from '../engine/types'
import { Mark } from './Companies'
import { LessonCard } from './LessonCard'
import { LightChip } from './Lights'
import { ChanceCard, NewsBanner, Sheet, TileHead, toneOf, useInr } from './Panels'
import { ASK_STATS, StatRow } from './Stats'
import type { TradeMode } from './TradeDialog'

type Dispatch = (a: Action) => void
export interface TurnHandlers { onOpen: (id: CompanyId) => void; onTrade: (mode: TradeMode, id: CompanyId) => void }

/** An Auction pitch: the claim, then up to two questions. Each answer opens real numbers with a chart and what they mean. */
function Pitch({ run, m, id, dispatch, onTrade }: { run: RunState; m: MarketRun; id: CompanyId; dispatch: Dispatch; onTrade: TurnHandlers['onTrade'] }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = knownQuarter(run)
  const hist = m.history[id]
  const lights = lightsAt(m, id, q)
  const asked = run.asked[id] ?? []
  const clued = run.clues[id] ?? []
  const known = knownLights(run, id)
  const left = 2 - asked.length
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
        <div className="flex items-center gap-2 border-b-[3px] border-ink px-3 py-2" style={{ background: SECTOR_COLOUR[COMPANY[id].sector] }}>
          <Mark id={id} size={28} />
          <span className="font-sign lang-fit min-w-0 flex-1 truncate text-[18px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</span>
          <span className="shrink-0 rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[12px] font-extrabold">{t('perShare', { price: money(hist[q].price) })}</span>
        </div>
        <div className="px-3 py-2.5 text-[14px] leading-snug">
          <div className="font-semibold italic">“{t(`companies.${id}.slogan`)}”</div>
          <div className="mt-1.5"><span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a5a2b]">{t('pitch2.claim')}: </span><span className="font-extrabold">{t(`claims.${id}`)}</span></div>
          <div className="mt-1.5 rounded-lg border-2 border-ink bg-white/60 px-2.5 py-1.5"><span className="font-extrabold">{t(`companies.${id}.founder`)}:</span> “{t(`companies.${id}.line`)}”</div>
        </div>
      </div>

      <div>
        <div className="db-eyebrow text-[#8a5a2b]">{t('pitch2.ask')}</div>
        <div className="mt-1 grid grid-cols-4 gap-1.5" role="group" aria-label={t('lights.title')}>
          {LIGHT_KEYS.map((k) => <LightChip key={k} k={k} state={known.includes(k) ? lights[k] : null} />)}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
          {LIGHT_KEYS.map((k) => {
            const used = asked.includes(k) || clued.includes(k)
            return (
              <button key={k} type="button" disabled={used || left <= 0} onClick={() => dispatch({ type: 'ask', companyId: id, light: k })} className="min-h-12 rounded-lg border-2 border-ink px-2 py-1 text-left text-[13px] font-bold leading-tight" style={{ background: used ? '#E6D8B6' : '#FFF3D6', opacity: used || left <= 0 ? 0.55 : 1 }}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">{t(`lights.${k}.name`)}</span><br />{t(`lights.${k}.ask`)}
              </button>
            )
          })}
        </div>
        <p className="m-0 mt-1.5 text-[12px] opacity-65">{left > 0 ? t('pitch.askLeft', { n: left }) : t('pitch.askNone')} {t('pitch.tip')}</p>
      </div>

      {known.length > 0 && (
        <div className="space-y-3">
          <div className="db-eyebrow text-[#8a5a2b]">{t('pitch2.revealTitle')}</div>
          {known.map((k) => {
            const dodged = founderAnswer(lights, id, k) === 'X'
            return (
              <div key={k} className="space-y-1.5">
                <div className="rounded-lg border-2 border-ink bg-white/70 px-2.5 py-1.5 text-[13px] leading-snug">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t(`lights.${k}.ask`)}</div>
                  <div><span className="font-extrabold">{t('pitch2.answer', { name: t(`companies.${id}.founder`).split(',')[0] })}</span> {dodged ? t(`lights.${k}.deflect`) : t(`lights.${k}.${lights[k]}`)}</div>
                  {dodged && <div className="mt-1 font-bold text-[#6B5A4A]">{t('pitch2.dodged')}</div>}
                </div>
                {!dodged && (
                  <div className="grid grid-cols-1 gap-1.5 min-[460px]:grid-cols-2">
                    {ASK_STATS[k].map((s) => <StatRow key={s} id={s} hist={hist} q={q} money={money} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="ink-btn cream" onClick={() => dispatch({ type: 'pass', companyId: id })}>{t('pitch.pass')}</button>
        <button type="button" className="ink-btn pink" disabled={!canBuy(run)} style={{ opacity: canBuy(run) ? 1 : 0.5 }} onClick={() => onTrade('invest', id)}>{t('pitch.bid')} ▸</button>
      </div>
      {!canBuy(run) && <p className="m-0 text-right text-[13px] font-bold text-[#C8442F]">{t('trade.jailed')}</p>}
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

/** What happened last quarter and why: the tile, the news, and each holding's move with its reasons. */
function Recap({ run, m, onOpen }: { run: RunState; m: MarketRun; onOpen: (id: CompanyId) => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const rc = run.recap
  const q = run.turn
  if (!rc || q < 1) return null
  const buys = run.log.filter((d) => d.q === q && d.type === 'INVEST')
  const pass = run.log.filter((d) => d.q === q && d.type === 'REJECT')
  let line: string | null = null
  switch (rc.tile) {
    case 'start': line = t('recap.tile.start', { nw: money(netWorth(run, m)) }); break
    case 'auction':
      line = rc.ownTile ? t('recap.tile.own', { name: t(`companies.${rc.ownTile}.name`) })
        : buys.length ? t('recap.tile.invested', { amt: money(buys[0].amount ?? 0), name: t(`companies.${buys[0].companyId}.name`) })
        : pass.length ? t('recap.tile.passed', { name: t(`companies.${pass[0].companyId}.name`) })
        : t('recap.tile.empty')
      break
    case 'rent': line = rc.rent.length ? t('recap.tile.rent') : t('recap.tile.rentNone'); break
    case 'tax': line = t('recap.tile.tax', { fees: money(run.feesPaid) }); break
    case 'parking': line = t('recap.tile.parking', { lost: money(run.cashDragLost) }); break
    case 'chest': line = t('recap.tile.chest'); break
    case 'bank':
      line = rc.bank === 'loan' ? t('recap.tile.loan')
        : rc.bank === 'clue' && rc.clue ? t('recap.tile.clue', { name: t(`companies.${rc.clue.companyId}.name`), light: t(`lights.${rc.clue.light}.name`), state: t(`lights.state.${lightsAt(m, rc.clue.companyId, q - 1)[rc.clue.light]}`) })
        : t('recap.tile.skip')
      break
    default: break
  }
  const ids = Object.keys(run.holdings) as CompanyId[]
  const card = rc.cardKey && rc.cardType ? { key: rc.cardKey, type: rc.cardType, company: rc.cardCompany ?? undefined, effect: { kind: 'none' as const } } : null
  return (
    <div className="mt-3 rounded-lg border-2 border-ink bg-white/60 p-2.5">
      <div className="db-eyebrow text-[#8a5a2b]">{t('recap.title')} · {t('quarterShort', { n: q })}</div>
      {line && <p className="m-0 mt-1 text-[14px] leading-snug">{line}</p>}
      {card && <div className="mt-2"><ChanceCard card={card} /></div>}
      {rc.rent.length > 0 && (
        <ul className="m-0 mt-2 list-none space-y-1 p-0 text-[13px]">
          {rc.rent.map((r) => <li key={r.id} className="flex justify-between gap-2"><span className="font-bold">{t(`companies.${r.id}.name`)}</span><span className="font-extrabold" style={{ color: r.amount >= 0 ? '#2f6f4a' : '#C8442F' }}>{r.amount >= 0 ? '▲ ' : '▼ '}{money(Math.abs(r.amount))}</span></li>)}
        </ul>
      )}
      {ids.length > 0 && (
        <div className="mt-3 space-y-2.5">
          <div className="db-eyebrow text-[#8a5a2b]">{t('recap.results')}</div>
          {ids.map((id) => {
            const { move, reasons } = explainQuarter(m, id, q)
            const h = run.holdings[id]!
            const delta = h.units * (m.history[id][q].price - m.history[id][q - 1].price)
            return (
              <div key={id} className="rounded-lg border-2 border-ink bg-jasmine px-2.5 py-2">
                <button type="button" className="flex w-full items-center gap-2 text-left" onClick={() => onOpen(id)}>
                  <Mark id={id} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-extrabold">{t(`companies.${id}.name`)}</span>
                  <span className="text-[13px] font-extrabold" style={{ color: move >= 0 ? '#2f6f4a' : '#C8442F' }}>{move >= 0 ? '▲' : '▼'} {Math.abs(move * 100).toFixed(1)}%</span>
                </button>
                <div className="mt-0.5 text-[12px] opacity-75">{t('recap.held', { delta: `${delta >= 0 ? '+' : '−'}${money(Math.abs(delta))}` })}</div>
                <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5 text-[13px] leading-snug">
                  {reasons.map((r) => <li key={r.key}>{t(`why.${r.key}`, { ...r.params, sector: r.params.sector ? t(`sectors.${r.params.sector}`) : undefined })}</li>)}
                </ul>
              </div>
            )
          })}
        </div>
      )}
      {run.lastDrag > 0 && <p className="m-0 mt-2 text-[12px] opacity-65">{t('dragNote', { x: money(run.lastDrag) })}</p>}
    </div>
  )
}

/** Family emergency: sell what you must, then pay. */
function Emergency({ run, m, dispatch, onTrade }: { run: RunState; m: MarketRun; dispatch: Dispatch; onTrade: TurnHandlers['onTrade'] }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = knownQuarter(run)
  const short = Math.max(0, EMERGENCY_COST - run.cash)
  const ids = Object.keys(run.holdings) as CompanyId[]
  return (
    <Sheet eyebrow={t('emergency.eyebrow')} title={t('emergency.title')} tone="#C8442F" actions={<button type="button" className="ink-btn pink" disabled={short > 0 && ids.length > 0} style={{ opacity: short > 0 && ids.length > 0 ? 0.5 : 1 }} onClick={() => dispatch({ type: 'payEmergency' })}>{short > 0 ? t('emergency.payShort') : t('emergency.pay')}</button>}>
      <p className="m-0">{t('emergency.body')}</p>
      <p className="m-0 mt-1 font-bold">{t('emergency.have', { cash: money(run.cash) })} · {short > 0 ? t('emergency.short', { x: money(short) }) : t('emergency.ready')}</p>
      {short > 0 && ids.length === 0 && <p className="m-0 text-[13px] opacity-75">{t('emergency.payShortNote')}</p>}
      <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
        {ids.map((id) => {
          const h = run.holdings[id]!
          const v = holdingValueAt(run, m, id, q)
          const g = v - h.cost
          return (
            <li key={id} className="flex items-center gap-2 rounded-lg border-2 border-ink bg-white/60 px-2.5 py-1.5 text-[13px]">
              <Mark id={id} size={24} />
              <span className="min-w-0 flex-1 truncate font-extrabold">{t(`companies.${id}.name`)}</span>
              <span>{money(v)}</span>
              <span className="font-extrabold" style={{ color: g >= 0 ? '#2f6f4a' : '#C8442F' }}>{g >= 0 ? '▲' : '▼'}{money(Math.abs(g))}</span>
              <button type="button" className="ink-btn" style={{ minHeight: 40, padding: '0 12px' }} onClick={() => onTrade('sell', id)}>{t('portfolio.sell')}</button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}

/** The decision area, one step at a time: briefing, then only the tiles that need a decision. */
export function TurnPanel({ run, m, arrived, rolling, dispatch, onRoll, onRewind, onOpen, onTrade }: { run: RunState; m: MarketRun; arrived: boolean; rolling: boolean; dispatch: Dispatch; onRoll: () => void; onRewind: () => void } & TurnHandlers) {
  const { t } = useTranslation('dealboard')
  const money = useInr()

  if (run.phase === 'news') {
    const turn = run.turn + 1
    return (
      <Sheet eyebrow={t('news.label')} title={t('quarter', { n: turn })} actions={<button type="button" className="ink-btn pink px-6" disabled={rolling} onClick={onRoll}>🎲 {t('roll')}</button>}>
        <NewsBanner banner={m.banners[turn - 1]} />
        {run.turn === 0 && <p className="m-0 mt-2 text-[13px] leading-snug opacity-80">{t('briefing.first')}</p>}
        {run.loan > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] font-bold text-[#C8442F]">
            <span>{t('briefing.loan', { x: money(run.loan) })}</span>
            <button type="button" className="ink-btn cream" style={{ minHeight: 40 }} disabled={run.cash < run.loan} onClick={() => dispatch({ type: 'repay' })}>{t('bank.repay', { x: money(run.loan) })}</button>
          </div>
        )}
        <Recap run={run} m={m} onOpen={onOpen} />
      </Sheet>
    )
  }

  if (run.phase === 'land') {
    const kind = tileAt(run, m)
    const head = { eyebrow: t('quarter', { n: run.turn }), title: t(`tiles.${kind}.name`), icon: <TileHead kind={kind} />, tone: toneOf(kind) }
    if (!arrived) return <Sheet eyebrow={t('yourMove')} title={t('rolled', { n: m.rolls[run.turn - 1] })}><span className="opacity-70">{t('moving', { n: m.rolls[run.turn - 1] })}</span></Sheet>
    if (!needsDecision(run, m)) return <Sheet {...head}><span className="opacity-70">{t('land.waiting', { tile: t(`tiles.${kind}.name`) })}</span></Sheet>
    if (kind === 'bank') return <Sheet {...head}><Bank run={run} m={m} dispatch={dispatch} /></Sheet>
    const id = pitchFor(run, m)!
    return <Sheet {...head}><div className="db-eyebrow mb-1.5 text-[#8a5a2b]">{t('auction.pitching')}</div><Pitch run={run} m={m} id={id} dispatch={dispatch} onTrade={onTrade} /></Sheet>
  }

  if (run.phase === 'emergency') return <Emergency run={run} m={m} dispatch={dispatch} onTrade={onTrade} />

  if (run.phase === 'lesson' && run.lesson) return <LessonCard run={run} onContinue={() => dispatch({ type: 'continue' })} onReplay={onRewind} />

  return null
}
