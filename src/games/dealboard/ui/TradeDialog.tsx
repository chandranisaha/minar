import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import { REASONS } from '../engine/run'
import { MIN_BID, TRADE_FEE, type Holding } from '../engine/state'
import type { CompanyId } from '../engine/types'
import { useInr } from './Panels'

export type TradeMode = 'invest' | 'buyMore' | 'sell'

export interface TradeProps {
  mode: TradeMode
  companyId: CompanyId
  price: number
  cash: number
  holding?: Holding
  blocked?: boolean
  onConfirm: (v: { amount: number; fraction: number; reason: string }) => void
  onCancel: () => void
}

/** Buy or sell with the full cost shown first: the 1% fee, what you pay or get, and why you are doing it. */
export function TradeDialog({ mode, companyId, price, cash, holding, blocked, onConfirm, onCancel }: TradeProps) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const buying = mode !== 'sell'
  const maxBuy = Math.floor(cash / MIN_BID) * MIN_BID
  const [amount, setAmount] = useState(Math.min(Math.max(MIN_BID, 20000), Math.max(MIN_BID, maxBuy)))
  const [fraction, setFraction] = useState(1)
  const [reason, setReason] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus(), [])

  const name = t(`companies.${companyId}.name`)
  const fee = buying ? Math.round(amount * TRADE_FEE) : 0
  const grossSell = holding ? holding.units * fraction * price : 0
  const feeSell = Math.round(grossSell * TRADE_FEE)
  const costPart = holding ? holding.cost * fraction : 0
  const gainSell = grossSell - feeSell - costPart
  const cannotBuy = buying && (maxBuy < MIN_BID || !!blocked)
  const ok = !!reason && !cannotBuy

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t(`trade.${mode}`, { name })} onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div ref={ref} tabIndex={-1} className="paper db-sheet db-in max-h-[92vh] w-full max-w-[460px] overflow-y-auto p-4 outline-none">
        <div className="-mx-4 -mt-4 mb-3 border-b-[3px] border-ink px-4 py-2" style={{ background: SECTOR_COLOUR[COMPANY[companyId].sector] }}>
          <h2 className="font-sign lang-fit m-0 text-[18px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`trade.${mode}`, { name })}</h2>
        </div>

        {buying ? (
          <>
            <label className="block text-[12px] font-extrabold uppercase tracking-wider opacity-70" htmlFor="db-amt">{t('trade.amount')}</label>
            <div className="font-sign text-[26px] leading-none">{money(amount)}</div>
            <input id="db-amt" type="range" min={MIN_BID} max={Math.max(MIN_BID, maxBuy)} step={MIN_BID} value={amount} disabled={cannotBuy} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1 h-10 w-full accent-[#E5457A]" />
            <div className="flex justify-between text-[11px] opacity-65"><span>{t('trade.min', { min: money(MIN_BID) })}</span><span>{money(Math.max(MIN_BID, maxBuy))}</span></div>
            <dl className="m-0 mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-lg border-2 border-ink bg-white/60 px-3 py-2 text-[14px]">
              <dt>{t('trade.fee')}</dt><dd className="m-0 text-right font-extrabold">{money(fee)}</dd>
              <dt>{t('trade.youPay')}</dt><dd className="m-0 text-right font-extrabold">{money(amount)}</dd>
            </dl>
            <p className="m-0 mt-1 text-[12px] opacity-70">{t('trade.unitsNote', { n: ((amount - fee) / price).toFixed(1), price: money(price) })}</p>
            {maxBuy < MIN_BID && <p className="m-0 mt-1 text-[13px] font-bold text-[#C8442F]">{t('trade.notEnough')}</p>}
            {blocked && <p className="m-0 mt-1 text-[13px] font-bold text-[#C8442F]">{t('trade.jailed')}</p>}
          </>
        ) : (
          <>
            <div className="text-[12px] font-extrabold uppercase tracking-wider opacity-70">{t('trade.sellShare')}</div>
            <div className="mt-1 grid grid-cols-4 gap-1.5" role="group">
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <button key={f} type="button" aria-pressed={fraction === f} onClick={() => setFraction(f)} className="font-sign min-h-12 rounded-lg border-[2.5px] border-ink text-[14px]" style={{ background: fraction === f ? '#E5457A' : '#FFF3D6', color: fraction === f ? '#FFF3D6' : '#2B1A17' }}>
                  {t(`trade.share${f === 1 ? 'All' : Math.round(f * 100)}`)}
                </button>
              ))}
            </div>
            <dl className="m-0 mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-lg border-2 border-ink bg-white/60 px-3 py-2 text-[14px]">
              <dt>{t('trade.youBought')}</dt><dd className="m-0 text-right font-extrabold">{money(costPart)}</dd>
              <dt>{t('trade.fee')}</dt><dd className="m-0 text-right font-extrabold">{money(feeSell)}</dd>
              <dt>{t('trade.youGet')}</dt><dd className="m-0 text-right font-extrabold">{money(grossSell - feeSell)}</dd>
              <dt>{t('trade.gainLoss')}</dt>
              <dd className="m-0 text-right font-extrabold" style={{ color: gainSell >= 0 ? '#2f6f4a' : '#C8442F' }}>{gainSell >= 0 ? '▲ ' : '▼ '}{money(Math.abs(gainSell))}</dd>
            </dl>
          </>
        )}

        <div className="mt-3 text-[12px] font-extrabold uppercase tracking-wider opacity-70">{t('trade.why')}</div>
        <p className="m-0 text-[12px] opacity-65">{t('trade.whyHint')}</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5" role="group" aria-label={t('trade.why')}>
          {REASONS.map((r) => (
            <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className="min-h-11 rounded-lg border-2 border-ink px-2 text-left text-[13px] font-bold" style={{ background: reason === r ? '#E8B04A' : '#FFF3D6', boxShadow: reason === r ? '2px 2px 0 #2B1A17' : 'none' }}>
              {reason === r ? '● ' : '○ '}{t(`reasons.${r}`)}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="ink-btn cream" onClick={onCancel}>{t('trade.cancel')}</button>
          <button type="button" className="ink-btn pink" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }} onClick={() => ok && onConfirm({ amount, fraction, reason: reason! })}>{t('trade.confirm')}</button>
        </div>
      </div>
    </div>
  )
}
