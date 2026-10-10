import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import { holdingValueAt, knownQuarter, lightsAt, type RunState } from '../engine/state'
import type { CompanyId, MarketRun } from '../engine/types'
import { LightChip } from './Lights'
import { useInr } from './Panels'
import { TitleCard } from '../../../components/TitleCard'

/** Round sector-coloured mark with the company's initial: the company's token on the board and in lists. */
export function Mark({ id, size = 26 }: { id: CompanyId; size?: number }) {
  const { t } = useTranslation('dealboard')
  return (
    <span className="font-sign grid shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-jasmine" style={{ width: size, height: size, background: SECTOR_COLOUR[COMPANY[id].sector], fontSize: size * 0.5, textShadow: '1px 1px 0 #2B1A17' }} aria-hidden>
      {t(`companies.${id}.name`).charAt(0)}
    </span>
  )
}

/** Gain or loss of a holding as a fraction of what was paid in. */
export function gainPct(run: RunState, m: MarketRun, id: CompanyId): number | null {
  const h = run.holdings[id]
  if (!h || h.cost <= 0) return null
  return holdingValueAt(run, m, id, knownQuarter(run)) / h.cost - 1
}

/** Compact card shown when hovering a company corner on the board. */
export function HoverCard({ run, m, id, touch }: { run: RunState; m: MarketRun; id: CompanyId; touch: boolean }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = Math.max(0, knownQuarter(run))
  const s = m.history[id][q]
  const h = run.holdings[id]
  const met = run.pitched.includes(id)
  const L = lightsAt(m, id, q)
  const value = h ? holdingValueAt(run, m, id, q) : 0
  const gain = h ? value - h.cost : 0
  const runway = s.failed ? '—' : s.profit >= 0 ? t('stats.profitable') : t('stats.months', { n: Math.round(s.runwayMonths ?? 0) })
  return (
    <div className="pointer-events-none w-[236px] rounded-xl border-[3px] border-ink bg-jasmine p-2.5 text-[12px] leading-snug" style={{ boxShadow: '3px 4px 0 #2B1A17' }} role="tooltip">
      <div className="flex items-center gap-1.5"><Mark id={id} size={22} /><span className="font-sign lang-fit truncate text-[14px]">{t(`companies.${id}.name`)}</span>{(h || met) && <span className="ml-auto font-extrabold">{money(s.failed ? 0 : s.price)}</span>}</div>
      {h ? (
        <>
          <div className="mt-1.5 flex justify-between font-extrabold"><span>{t('dossier.own', { v: money(value) })}</span><span style={{ color: gain >= 0 ? '#2f6f4a' : '#C8442F' }}>{gain >= 0 ? '▲ ' : '▼ '}{money(Math.abs(gain))}</span></div>
          <div className="mt-1.5 grid grid-cols-2 gap-1">{(['cash', 'customers', 'debt', 'ceo'] as const).map((k) => <LightChip key={k} k={k} state={L[k]} />)}</div>
          <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
            <dt className="opacity-60">{t('stats.runway.name')}</dt><dd className="m-0 text-right font-extrabold">{runway}</dd>
            <dt className="opacity-60">{t('stats.retention.name')}</dt><dd className="m-0 text-right font-extrabold">{Math.round(s.retention * 100)}%</dd>
            <dt className="opacity-60">{t('stats.profit.name')}</dt><dd className="m-0 text-right font-extrabold">{s.profit >= 0 ? '▲ ' : '▼ '}{t('stats.lakh', { v: Math.abs(s.profit).toFixed(1) })}</dd>
          </dl>
        </>
      ) : (
        <p className="m-0 mt-1.5">{met ? t('dossier.passed') : t('dossier.unmet')}</p>
      )}
      <div className="mt-1.5 text-center text-[11px] font-bold opacity-65">{touch ? t('hover.tap') : t('hover.click')}</div>
    </div>
  )
}

/** Introduction before the first quarter: who the four companies are and what they claim. */
export function Meet({ m, onStart }: { m: MarketRun; onStart: () => void }) {
  const { t } = useTranslation('dealboard')
  const tips = t('meet.tips', { returnObjects: true }) as string[]
  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-4 pb-6 pt-3">
      <TitleCard eyebrow={t('meet.eyebrow')} title={t('meet.title')}><p className="m-0">{t('meet.intro')}</p></TitleCard>
      <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
        {m.picked.map((id) => {
          const co = COMPANY[id]
          return (
            <article key={id} className="overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
              <header className="flex items-center gap-2 border-b-[3px] border-ink px-3 py-2" style={{ background: SECTOR_COLOUR[co.sector] }}>
                <Mark id={id} size={30} />
                <div className="min-w-0 leading-tight">
                  <div className="font-sign lang-fit truncate text-[17px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-jasmine">{t(`sectors.${co.sector}`)}</div>
                </div>
              </header>
              <div className="px-3 py-2.5 text-[14px] leading-snug">
                <div className="font-semibold italic">“{t(`companies.${id}.slogan`)}”</div>
                <div className="mt-2 text-[11px] font-extrabold uppercase tracking-wider text-[#8a5a2b]">{t('meet.headline')}</div>
                <div className="font-extrabold">{t(`claims.${id}`)}</div>
                <div className="mt-2 text-[13px] opacity-75"><span className="font-extrabold">{t(`companies.${id}.founder`)}</span></div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="paper p-4">
        <div className="db-eyebrow text-[#8a5a2b]">{t('meet.tipsTitle')}</div>
        <ol className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0">
          {tips.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[14px] leading-snug"><span className="font-sign grid h-7 w-7 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-mustard text-[13px]">{i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
      </div>
      <button type="button" className="ink-btn pink self-center px-8 text-[18px]" onClick={onStart}>{t('meet.start')} ▸</button>
    </div>
  )
}
