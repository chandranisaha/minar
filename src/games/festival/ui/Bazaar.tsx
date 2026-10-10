import { useState } from 'react'
import { Toon } from '../../../art/Toon'
import { callbackFor, isClosed, offerFor, patienceLeft, respond, stallState, type OfferButton } from '../engine/bargain'
import { STALL_DEFS, item as itemDef, stall as stallDef } from '../engine/content'
import { visitsLeft } from '../engine/flow'
import { priceFor, wasPriceFor } from '../engine/prices'
import { notebook } from '../engine/score'
import { ITEMS, LIST_ITEMS, type GameEvent, type ItemId, type StallId } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { PocketIcon, Sheet } from './kit'
import { STALL_LOOK } from './looks'
import { useFt } from './useFt'

function StallFront({ id, closed, onClick, disabled }: { id: StallId; closed: boolean; onClick: () => void; disabled: boolean }) {
  const { t } = useFt()
  const look = STALL_LOOK[id]
  return (
    <button type="button" onClick={onClick} disabled={disabled || closed} className="relative flex w-full flex-col items-stretch text-left disabled:opacity-60" aria-label={`${t(`stalls.${id}.name`)}, ${t(`stalls.${id}.tag`)}${closed ? `. ${t('stall.closed')}` : ''}`}>
      <svg viewBox="0 0 160 120" className="w-full" aria-hidden>
        <rect x="10" y="38" width="140" height="78" fill="#F0D9A8" stroke="#2B1A17" strokeWidth="3" />
        <rect x="18" y="48" width="124" height="44" fill="#7A2A22" opacity=".85" stroke="#2B1A17" strokeWidth="2.4" />
        <g transform="translate(58 34)"><Toon look={look.keeper} mood={closed ? 'worried' : id === 'megasale' ? 'sly' : 'happy'} shifty={id === 'sasta'} width={44} height={66} /></g>
        <rect x="14" y="88" width="132" height="22" fill={look.awning} stroke="#2B1A17" strokeWidth="3" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${6 + i * 25} 12 H${31 + i * 25} L${33 + i * 25} 40 Q${19.5 + i * 25} 48 ${6 + i * 25 - 2} 40Z`} fill={i % 2 ? look.stripe : look.awning} stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
        ))}
        <rect x="4" y="6" width="152" height="10" rx="3" fill={look.awning} stroke="#2B1A17" strokeWidth="2.6" />
        {id === 'megasale' && <g className="anim-blink"><rect x="104" y="58" width="42" height="22" fill="#FFE08A" stroke="#2B1A17" strokeWidth="2" transform="rotate(8 125 69)" /><text x="125" y="74" textAnchor="middle" fontSize="11" fontWeight="900" fill="#D8503A" transform="rotate(8 125 69)">50%</text></g>}
        {closed && <g><rect x="34" y="60" width="92" height="24" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="2.4" transform="rotate(-6 80 72)" /><path d="M44 72 H116" stroke="#D8503A" strokeWidth="4" transform="rotate(-6 80 72)" /></g>}
      </svg>
      <span className="font-sign lang-fit -mt-1 block text-center text-[14px] leading-tight">{t(`stalls.${id}.name`)}</span>
      <span className="block text-center text-[11px] font-extrabold opacity-80">{closed ? t('stall.closed') : t(`stalls.${id}.tag`)}</span>
    </button>
  )
}

export function ShoppingList() {
  const { t, money, itemName } = useFt()
  const s = useGameState()
  const left = LIST_ITEMS.filter((i) => !s.owned[i] || s.owned[i]!.torn)
  return (
    <div className="paper p-2.5" style={{ transform: 'rotate(-.6deg)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-sign lang-fit text-[14px]">📝 {t('bazaar.list')}</span>
        <span className="flex items-center gap-1 text-[12px] font-extrabold"><PocketIcon id="ghar" size={20} />{t('planner.leftFor', { money: money(s.pockets.ghar), n: left.length })}</span>
      </div>
      <ul className="m-0 mt-1 grid list-none grid-cols-1 gap-x-3 p-0 text-[13px] font-bold min-[400px]:grid-cols-2">
        {ITEMS.map((i) => {
          const o = s.owned[i]
          const ok = !!o && !o.torn
          return (
            <li key={i} className="flex items-center gap-1.5" style={{ textDecoration: ok ? 'line-through' : undefined, opacity: ok ? 0.7 : 1 }}>
              <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded border-2 border-ink text-[12px]" style={{ background: ok ? '#3F7A3A' : '#FFF3D6', color: '#FFF3D6' }}>{ok ? '✓' : ''}</span>
              <span className="sr-only">{ok ? '✓ ' : ''}</span>
              {i === 'gift' ? <em>{itemName(i)}</em> : itemName(i)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Notebook({ onClose }: { onClose: () => void }) {
  const { t, money, itemName } = useFt()
  const log = useFestival((s) => s.log)
  const book = notebook(log)
  return (
    <Sheet label={t('notebook.title')} onClose={onClose}>
      <h2 className="font-sign lang-fit m-0 text-[20px]">📒 {t('notebook.title')}</h2>
      {!book.length && <p className="m-0 mt-2 text-[14px]">{t('notebook.empty')}</p>}
      {ITEMS.map((i) => {
        const rows = book.filter((b) => b.item === i).sort((a, b) => a.day - b.day || a.price - b.price)
        if (!rows.length) return null
        return (
          <div key={i} className="mt-3">
            <div className="text-[14px] font-extrabold">{itemName(i)}</div>
            <ul className="m-0 list-none p-0">
              {rows.map((r) => (
                <li key={`${r.stall}${r.day}`} className="flex justify-between border-b-2 border-dashed border-[#D9A86A] py-1 text-[13px] font-bold">
                  <span>{t('day', { n: r.day })} · {t(`stalls.${r.stall}.name`)}{stallDef(r.stall).quality === 'low' ? ` (${t('stall.lowQuality')})` : ''}</span>
                  <span>{money(r.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      <button type="button" className="ink-btn cream mt-4 w-full" onClick={onClose}>{t('notebook.close')}</button>
    </Sheet>
  )
}

type Msg = { key: string; vars?: Record<string, string> } | null

function StallView({ id, onLeave }: { id: StallId; onLeave: () => void }) {
  const { t, money, itemName } = useFt()
  const s = useGameState()
  const log = useFestival((x) => x.log)
  const day = useFestival((x) => x.day)
  const seed = useFestival((x) => x.seed)
  const push = useFestival((x) => x.push)
  const pay = useFestival((x) => x.pay)
  const def = stallDef(id)
  const [sel, setSel] = useState<ItemId | null>(null)
  const [counter, setCounter] = useState<number | null>(null)
  const [msg, setMsg] = useState<Msg>(null)
  const closed = isClosed(log, id, day)
  const patience = def.bargain ? patienceLeft(log, id, day) : 0

  const buy = (i: ItemId, price: number) =>
    pay({
      pocket: itemDef(i).pocket,
      amount: price,
      reason: `buy:${i}`,
      event: { kind: 'buy', day, stall: id, item: i, price, quality: def.quality },
      alt: { kind: 'cancel' },
      after: () => { setSel(null); setCounter(null); setMsg({ key: 'stall.accept', vars: { money: money(price) } }) },
    })

  const offer = (i: ItemId, b: OfferButton) => {
    const ss = stallState(log, id, i, day)
    const o = offerFor(ss.sticker, b)
    const r = respond(ss, o)
    const e: GameEvent = { kind: 'offer', day, stall: id, item: i, offer: o, result: r.result, ...(r.counter != null ? { counter: r.counter } : {}) }
    push(e)
    if (r.result === 'accept') buy(i, o)
    else if (r.result === 'closed') { setCounter(null); setMsg({ key: 'stall.closed' }) }
    else { setCounter(r.counter!); setMsg({ key: r.result === 'insult' ? 'stall.insult' : 'stall.counter', vars: { money: money(r.counter!) } }) }
  }

  const walk = () => {
    if (!sel || closed) return onLeave()
    const cb = callbackFor(seed, log, id, sel, day)
    push({ kind: 'walkaway', day, stall: id, item: sel, ...(cb != null ? { callback: cb } : {}) })
    if (cb != null) { setCounter(cb); setMsg({ key: 'stall.callback', vars: { money: money(cb) } }) }
    else onLeave()
  }

  const say = msg ? t(msg.key, msg.vars) : t(`stalls.${id}.hello`)
  const items = def.sells

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-display lang-fit m-0 text-[22px] leading-tight">{t(`stalls.${id}.name`)}</h1>
            <span className="text-[12px] font-extrabold opacity-80">{t(`stalls.${id}.tag`)}</span>
          </div>
          {def.bargain && (
            <div className="text-right" role="meter" aria-label={t('stall.patience')} aria-valuemin={0} aria-valuemax={def.patience} aria-valuenow={patience}>
              <div className="text-[11px] font-extrabold">{t('stall.patience')}</div>
              <div className="flex justify-end gap-1">
                {Array.from({ length: def.patience }, (_, k) => (
                  <span key={k} className={`inline-block h-4 w-4 rounded-full border-2 border-ink ${k === patience ? 'anim-pop' : ''}`} style={{ background: k < patience ? '#E5457A' : '#E9D3A6' }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-end gap-2">
          <svg width="70" height="105" viewBox="0 0 100 150" className="shrink-0" aria-hidden>
            <Toon look={STALL_LOOK[id].keeper} mood={closed ? 'worried' : msg?.key === 'stall.insult' ? 'surprised' : id === 'megasale' ? 'sly' : 'happy'} shifty={id === 'sasta'} width={100} height={150} />
          </svg>
          <p key={say} className="ink-chip anim-pop m-0 mb-4 flex-1 px-3 py-2 text-[15px] font-extrabold leading-snug" aria-live="polite">“{say}”</p>
        </div>
      </div>

      {sel && !closed && (
        <div className="paper anim-unfurl flex flex-col gap-2 p-3" style={{ background: '#FFE08A' }}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-extrabold">{itemName(sel)}</span>
            <span className="font-display text-[19px]">{money(priceFor(sel, id, day)!)}</span>
          </div>
          {def.bargain ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(['low', 'fair', 'close'] as OfferButton[]).map((b) => (
                  <button key={b} type="button" className="ink-btn cream px-2 text-[14px]" onClick={() => offer(sel, b)}>
                    {t(`stall.${b}`)} {money(offerFor(priceFor(sel, id, day)!, b))}
                  </button>
                ))}
                <button type="button" className="ink-btn px-2 text-[14px]" onClick={() => buy(sel, priceFor(sel, id, day)!)}>
                  {t('stall.pay')} {money(priceFor(sel, id, day)!)}
                </button>
              </div>
              {counter != null && (
                <button type="button" className="ink-btn pink" onClick={() => buy(sel, counter)}>
                  ✓ {t('stall.acceptCounter', { money: money(counter) })}
                </button>
              )}
            </>
          ) : (
            <button type="button" className="ink-btn pink" onClick={() => buy(sel, priceFor(sel, id, day)!)}>
              {t('stall.buy')} {money(priceFor(sel, id, day)!)}
            </button>
          )}
          <button type="button" className="ink-btn teal" onClick={walk}>🚶 {t('stall.walk')}</button>
        </div>
      )}

      {!closed && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((i) => {
            const sticker = priceFor(i, id, day)!
            const was = wasPriceFor(i, id, day)
            const o = s.owned[i]
            const owned = !!o && !o.torn
            const active = sel === i
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={owned}
                  aria-pressed={active}
                  onClick={() => { setSel(i); setCounter(null); setMsg(null) }}
                  className="ink-chip flex min-h-14 w-full items-center gap-2 px-3 py-2 text-left disabled:opacity-60"
                  style={{ background: active ? '#FFE08A' : undefined }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold leading-tight">{itemName(i)}</span>
                    {def.quality === 'low' && <span className="text-[11px] font-extrabold" style={{ color: '#7A2A22' }}>⚠ {t('stall.lowQuality')}</span>}
                    {owned && <span className="text-[11px] font-extrabold">✓ {t('stall.owned')}</span>}
                  </span>
                  <span className="text-right">
                    {was != null && <span className="block text-[12px] font-bold line-through opacity-70">{t('stall.was', { money: money(was) })}</span>}
                    <span className="font-display block text-[19px] leading-none">{money(sticker)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {(!sel || closed) && (
        <button type="button" className="ink-btn teal self-center" onClick={onLeave}>◀ {t('stall.leave')}</button>
      )}
    </div>
  )
}

export function Bazaar() {
  const { t } = useFt()
  const log = useFestival((x) => x.log)
  const day = useFestival((x) => x.day)
  const visit = useFestival((x) => x.visit)
  const toMela = useFestival((x) => x.toMela)
  const [open, setOpen] = useState<StallId | null>(null)
  const [book, setBook] = useState(false)
  const left = visitsLeft(log, day)

  return (
    <div className="flex flex-col gap-3">
      <ShoppingList />
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="ink-chip font-sign lang-fit min-h-12 px-3 text-[14px]" onClick={() => setBook(true)}>📒 {t('bazaar.notebook')}</button>
        {Number.isFinite(left) && <span className="text-[13px] font-extrabold">😴 {left > 0 ? t('bazaar.visitsLeft', { n: left }) : t('bazaar.noVisits')}</span>}
      </div>

      {open ? (
        <StallView id={open} onLeave={() => setOpen(null)} />
      ) : (
        <>
          <p className="m-0 text-center text-[13px] font-bold">{t('bazaar.tapStall')}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-[480px]:grid-cols-3">
            {STALL_DEFS.map((d) => (
              <StallFront key={d.id} id={d.id} closed={isClosed(log, d.id, day)} disabled={left <= 0} onClick={() => { visit(d.id); setOpen(d.id) }} />
            ))}
          </div>
          <button type="button" className="ink-btn pink self-center" onClick={toMela}>🎡 {t('bazaar.toMela')}</button>
        </>
      )}
      {book && <Notebook onClose={() => setBook(false)} />}
    </div>
  )
}
