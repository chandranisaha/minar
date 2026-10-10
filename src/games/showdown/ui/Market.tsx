import { useState } from 'react'
import { canPayLater, maxHaggles, schedule, unitPrice } from '../engine/contract'
import { ITEMS, RULES, item } from '../engine/content'
import { DEFAULT_PLATES, answerOf, dealOf, isSigned, offer, signBlock } from '../engine/log'
import { PREDICTIONS } from '../engine/predictions'
import { POINTS, type Point } from '../engine/types'
import { useShowdown, useView } from '../state/store'
import { Ask, CashLinesTable, Say, Sheet } from './kit'
import { useSd } from './useSd'

const VENDORS = ['daamfix', 'chacha', 'sasta', 'mega'] as const
const VENDOR_COLOR: Record<string, string> = { daamfix: '#2F6F73', chacha: '#3F7A3A', sasta: '#E8B04A', mega: '#D8503A' }

/** One item, one vendor: price, terms, haggle, pay later, fine print, and the total with required extras. */
function ItemSheet({ id, onClose, onSigned }: { id: string; onClose: () => void; onSigned: (msg: string) => void }) {
  const { t, money, when } = useSd()
  const decide = useShowdown((s) => s.decide)
  const { market: m, log } = useView()
  const def = item(id)
  const [qty, setQty] = useState(DEFAULT_PLATES)
  const [ask, setAsk] = useState<string | null>(null)

  // the guesses asked in context: P2 the first time a sound set is opened, P4 for the Combo
  const askId = ['basic', 'reliable'].includes(id) && !answerOf(log, 'P2') ? 'P2' : id === 'combo' && !answerOf(log, 'P4') ? 'P4' : null
  if (askId) {
    return (
      <Sheet label={t('ask.label')} onClose={onClose}>
        <div className="font-sign lang-fit mb-2 text-[13px] text-pink">{t('ask.label')}</div>
        <Ask q={t(`ask.${askId}.q`)} opts={PREDICTIONS[askId].options.map((o) => [o, t(`ask.${askId}.opts.${o}`)])} value={ask} onPick={setAsk} go={t('ask.go')} onLock={() => ask && decide({ k: 'predict', id: askId, answer: ask })} />
      </Sheet>
    )
  }

  const deal = dealOf(m, id)
  const signed = isSigned(m, id)
  const block = signBlock(m, id)
  const { contract, total } = offer(m, id, qty)
  const price = unitPrice(contract)
  const hidden = id === 'basic' && !m.readBasic
  const [sched] = schedule(contract)
  const shown = { ...sched }
  if (hidden) shown.W1 = (shown.W1 ?? 0) - (def.addon ?? 0)
  const canHaggle = !signed && !m.locked && m.actionsLeft > 0 && deal.haggles < maxHaggles(id)
  const nextPrice = def.ladder[Math.min(deal.haggles + 1, def.ladder.length - 1)]
  const cast = id === 'big' ? 'arjunBig' : id === 'combo' ? 'arjunCombo' : id === 'basic' ? 'ayeshaBasic' : 'ayeshaGeneral'
  const who = cast.startsWith('arjun') ? 'arjun' : 'ayesha'

  const sign = () => {
    decide({ k: 'sign', item: id, qty })
    if (hidden) onSigned(t('sheet.toast', { amount: money(def.addon!), total: money(total) }))
    onClose()
  }

  return (
    <Sheet label={t(`items.${id}.name`)} onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        <div>
          <h2 className="font-display lang-fit m-0 text-[22px] leading-tight">{t(`items.${id}.name`)}</h2>
          <p className="m-0 text-[13px] font-bold opacity-80">{t(`items.${id}.desc`)}</p>
        </div>
        <Say who={who}><span className="text-[14px]">{t(`sheet.${cast}`)}</span></Say>

        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-extrabold">{t('sheet.price')}</span>
          <span className="font-display text-[26px] leading-none">{money(price)}</span>
          {def.unit && <span className="text-[13px] font-bold">{t('sheet.perPlate')}</span>}
          {id === 'combo' && <span className="text-[13px] font-bold line-through opacity-70">{t('sheet.was', { was: money(28000) })}</span>}
        </div>
        {id === 'combo' && <p className="m-0 w-fit rounded-md border-2 border-ink bg-[#F7C9C0] px-2 text-[12px] font-extrabold">{t('sheet.ends')}</p>}

        {def.unit && (
          <div>
            <div className="text-[13px] font-extrabold">{t('sheet.qty')}</div>
            <div className="mt-1 flex items-center justify-center gap-3">
              <button type="button" className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40" disabled={signed || qty <= RULES.plateMin} aria-label="−" onClick={() => setQty(qty - RULES.plateStep)}>−</button>
              <span className="font-display min-w-16 text-center text-[24px]">{qty}</span>
              <button type="button" className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40" disabled={signed || qty >= RULES.plateMax} aria-label="+" onClick={() => setQty(qty + RULES.plateStep)}>+</button>
            </div>
            <p className="m-0 text-center text-[12px] font-bold opacity-80">{t('sheet.qtyNote')}</p>
          </div>
        )}

        <div>
          <div className="text-[13px] font-extrabold">{t('sheet.terms')}</div>
          <ul className="m-0 mt-0.5 list-none p-0 text-[14px] font-bold">
            {POINTS.filter((p: Point) => (shown[p] ?? 0) > 0).map((p) => <li key={p} className="flex justify-between"><span>{when(p)}</span><span>{money(Math.round(shown[p]!))}</span></li>)}
          </ul>
          {def.addon && !hidden && <p className="m-0 mt-1 text-[13px] font-bold">{t('sheet.extra', { amount: money(def.addon), when: when(def.addonAt!) })}</p>}
          <p className="m-0 mt-1 text-[14px] font-extrabold">{hidden ? t('sheet.unread') : t('sheet.totalIs', { total: money(Math.round(total)) })}</p>
        </div>

        {!signed && (
          <div className="flex flex-col gap-2">
            {def.ladder.length > 1 ? (
              <button type="button" className="ink-btn cream" disabled={!canHaggle} style={{ opacity: canHaggle ? 1 : 0.5 }} onClick={() => decide({ k: 'haggle', item: id })}>
                🤝 {deal.haggles >= maxHaggles(id) ? t('sheet.best') : m.actionsLeft <= 0 ? t('sheet.noActions') : t('sheet.haggleTo', { price: money(nextPrice) })}
              </button>
            ) : <p className="m-0 text-center text-[13px] font-bold opacity-80">{t('sheet.daamfix')}</p>}
            {canPayLater(id) && (
              <button type="button" className="ink-btn cream" disabled={deal.late || m.actionsLeft <= 0} style={{ opacity: deal.late || m.actionsLeft <= 0 ? 0.6 : 1 }} aria-pressed={deal.late} onClick={() => decide({ k: 'payLater', item: id })}>
                🗓 {deal.late ? t('sheet.payLaterOn') : t('sheet.payLater')}
              </button>
            )}
            {id === 'basic' && !m.readBasic && (
              <button type="button" className="ink-btn cream" disabled={m.actionsLeft <= 0} style={{ opacity: m.actionsLeft <= 0 ? 0.6 : 1 }} onClick={() => decide({ k: 'read', item: 'basic' })}>🔍 {t('sheet.read')}</button>
            )}
            {id === 'basic' && m.readBasic && <p className="m-0 text-[13px] font-extrabold">🔍 {t('sheet.fine', { amount: money(def.addon!), when: when(def.addonAt!) })}</p>}
          </div>
        )}

        {block && block !== 'signed' && <p className="m-0 text-center text-[13px] font-extrabold" style={{ color: '#7A2A22' }}>{t(`sheet.blocked.${block}`)}</p>}
        <div className="flex flex-col gap-2">
          {signed ? (
            <button type="button" className="ink-btn cream" onClick={() => { decide({ k: 'drop', item: id }); onClose() }}>{t('sheet.drop')}</button>
          ) : (
            <button type="button" className="ink-btn pink" disabled={!!block} style={{ opacity: block ? 0.5 : 1 }} onClick={sign}>
              {def.unit ? t('sheet.signPlates', { price: money(price) }) : t('sheet.sign', { price: money(price) })}
            </button>
          )}
          <button type="button" className="ink-btn cream" onClick={onClose}>{t('sheet.notNow')}</button>
        </div>
      </div>
    </Sheet>
  )
}

function VendorSheet({ vendor, onPick, onClose }: { vendor: string; onPick: (id: string) => void; onClose: () => void }) {
  const { t, money } = useSd()
  const { market: m } = useView()
  const items = ITEMS.filter((i) => i.vendor === vendor && i.id !== 'hall')
  return (
    <Sheet label={t(`market.vendors.${vendor}.name`)} onClose={onClose}>
      <h2 className="font-display lang-fit m-0 text-[22px]">{t(`market.vendors.${vendor}.name`)}</h2>
      <p className="m-0 text-[13px] font-bold opacity-80">{t(`market.vendors.${vendor}.tag`)}</p>
      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {items.map((i) => {
          const signed = isSigned(m, i.id)
          return (
            <li key={i.id}>
              <button type="button" className="ink-chip flex min-h-14 w-full items-center gap-2 px-3 py-2 text-left" style={{ background: signed ? '#CDE8C4' : undefined }} onClick={() => onPick(i.id)}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold leading-tight">{signed ? '✓ ' : ''}{t(`items.${i.id}.name`)}</span>
                  <span className="block text-[12px] font-bold opacity-80">{t(`items.${i.id}.desc`)}</span>
                </span>
                <span className="font-display text-[18px]">{money(unitPrice(offer(m, i.id).contract))}{i.unit ? '/ea' : ''}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <button type="button" className="ink-btn cream mt-3 w-full" onClick={onClose}>{t('back')}</button>
    </Sheet>
  )
}

/** S5: four vendors, your actions, what you've signed, and the two cash lines. */
export function Market() {
  const { t, money } = useSd()
  const decide = useShowdown((s) => s.decide)
  const { market: m, lines } = useView()
  const [vendor, setVendor] = useState<string | null>(null)
  const [itemId, setItemId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const close = () => { setItemId(null); setVendor(null) }
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display lang-fit m-0 text-[22px]">{t('market.title')}</h1>
          <span className="rounded-md border-2 border-ink bg-mustard px-2 py-0.5 text-[13px] font-extrabold" role="status">{t('market.actions', { n: m.actionsLeft, max: RULES.actions })}</span>
        </div>
        <p className="m-0 mt-1 text-[12px] font-bold opacity-80">{t('market.actionsNote')}</p>
      </div>

      {toast && <p className="ink-chip anim-pop m-0 px-3 py-2 text-[14px] font-extrabold" style={{ background: '#FFE08A' }} role="status" onClick={() => setToast(null)}>{toast}</p>}

      <div className="grid grid-cols-2 gap-2.5">
        {VENDORS.map((v) => (
          <button key={v} type="button" onClick={() => setVendor(v)} className="overflow-hidden rounded-xl border-[3px] border-ink text-left" style={{ background: '#FFF8E6', boxShadow: '3px 4px 0 #2B1A17' }}>
            <div aria-hidden className="h-3" style={{ background: VENDOR_COLOR[v], borderBottom: '2px solid #2B1A17' }} />
            <div className="p-2">
              <div className="font-sign lang-fit text-[15px] leading-tight">{t(`market.vendors.${v}.name`)}</div>
              <div className="min-h-[2.4em] text-[11px] font-bold leading-tight opacity-80">{t(`market.vendors.${v}.tag`)}</div>
              <div className="mt-1 text-[12px] font-extrabold">{t('market.open')} ▶</div>
            </div>
          </button>
        ))}
      </div>

      <section className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[15px]">{t('market.signed')}</h2>
        <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0 text-[14px] font-bold">
          {m.signed.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span>{c.id === 'hall' ? '🏛 ' + t('market.hall') : t(`items.${c.id}.name`)}{c.id === 'plates' ? ` × ${c.qty}` : ''}</span>
              {c.id === 'hall' ? <span className="font-display">{money(10000)}</span> : (
                <span className="flex items-center gap-2"><span className="font-display">{money(Math.round(schedule(c)[1]))}</span>
                  <button type="button" className="ink-chip grid h-12 w-12 place-items-center" aria-label={t('sheet.drop')} onClick={() => decide({ k: 'drop', item: c.id })}>✕</button></span>
              )}
            </li>
          ))}
        </ul>
        {m.signed.length === 1 && <p className="m-0 mt-1 text-[12px] font-bold opacity-80">{t('market.none')}</p>}
      </section>

      <section className="paper p-3">
        <h2 className="font-sign lang-fit m-0 mb-1 text-[15px]">{t('market.lines')}</h2>
        <CashLinesTable lines={lines} />
      </section>

      <button type="button" className="ink-btn pink self-center" onClick={() => decide({ k: 'seen', screen: 'market' })}>{t('market.check')} ▶</button>

      {vendor && !itemId && <VendorSheet vendor={vendor} onPick={setItemId} onClose={close} />}
      {itemId && <ItemSheet id={itemId} onClose={() => setItemId(null)} onSigned={setToast} />}
    </div>
  )
}

