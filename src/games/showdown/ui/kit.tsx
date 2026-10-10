import { useEffect, type ReactNode } from 'react'
import { Toon, type Mood } from '../../shared/Toon'
import type { CashLines } from '../engine/lines'
import { POINTS } from '../engine/types'
import { CAST, type CastId } from './cast'
import { useSd } from './useSd'

export function GuardrailFooter() {
  const { t } = useSd()
  return <p className="m-0 px-3 py-2 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }} role="note">ⓘ {t('guardrail')}</p>
}

export function Portrait({ who, size = 64, mood = 'happy' }: { who: CastId; size?: number; mood?: Mood }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 100 150" aria-hidden className="shrink-0" style={{ overflow: 'visible' }}>
      <Toon look={CAST[who]} mood={mood} width={100} height={150} />
    </svg>
  )
}

/** A cast member says one or two short lines (never which option to pick). */
export function Say({ who, children, mood }: { who: CastId; children: ReactNode; mood?: Mood }) {
  const { t } = useSd()
  return (
    <div className="flex items-end gap-2">
      <Portrait who={who} mood={mood} />
      <div className="ink-chip mb-3 flex-1 px-3 py-2">
        <div className="font-sign lang-fit text-[12px] text-pink">{t(`cast.${who}`)}</div>
        <div className="text-[15px] font-extrabold leading-snug">{children}</div>
      </div>
    </div>
  )
}

/** Bottom sheet over the screen. */
export function Sheet({ children, label, onClose }: { children: ReactNode; label: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0" style={{ background: 'rgba(43,26,23,.55)' }} onClick={onClose} />
      <div className="paper relative mx-2 mb-2 max-h-[90%] w-full max-w-md overflow-y-auto p-4">{children}</div>
    </div>
  )
}

/** A multiple-choice question: tap one, then lock it in. Nothing is marked right or wrong here. */
export function Ask({ q, opts, value, onPick, onLock, go, note }: { q: string; opts: [string, string][]; value: string | null; onPick: (id: string) => void; onLock?: () => void; go?: string; note?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-[16px] font-extrabold leading-snug">{q}</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={q}>
        {opts.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onPick(id)} className="ink-chip min-h-12 px-3 text-left text-[15px] font-bold" style={{ background: value === id ? '#E8B04A' : undefined }}>
            {value === id ? '● ' : '○ '}{label}
          </button>
        ))}
      </div>
      {note && <p className="m-0 text-[12px] font-bold opacity-80">{note}</p>}
      {onLock && <button type="button" className="ink-btn pink self-center" disabled={!value} style={{ opacity: value ? 1 : 0.5 }} onClick={onLock}>{go}</button>}
    </div>
  )
}

/**
 * The two cash lines, as a table so every number has text (a negative is "Short", never just a colour).
 * The certain line is what the cushion is measured on.
 */
export function CashLinesTable({ lines }: { lines: CashLines }) {
  const { t, money, when } = useSd()
  // a negative is the amount plus the word "Short" and an arrow, so colour is never the only signal
  const cell = (n: number) => (
    <span style={{ color: n < 0 ? '#7A2A22' : undefined }}>
      <span className="block whitespace-nowrap">{money(n)}</span>
      {n < 0 && <span className="block text-[11px] font-extrabold">▼ {t('lines.short')}</span>}
    </span>
  )
  return (
    <div className="flex flex-col gap-1.5">
      <table className="w-full table-fixed border-collapse text-[13px]">
        <caption className="sr-only">{t('lines.title')}</caption>
        <thead>
          <tr className="text-left text-[11px]">
            <th scope="col" className="w-[28%] py-1 align-bottom">{t('lines.date')}</th>
            <th scope="col" className="w-[36%] py-1 pl-1 text-right align-bottom leading-tight">{t('lines.optimistic')}</th>
            <th scope="col" className="w-[36%] py-1 pl-1 text-right align-bottom leading-tight">{t('lines.cautious')}</th>
          </tr>
        </thead>
        <tbody>
          {POINTS.map((p) => (
            <tr key={p} className="border-t-2 border-dashed border-[#D9A86A] font-bold">
              <th scope="row" className="py-1.5 text-left font-extrabold">{when(p)}</th>
              <td className="py-1.5 text-right">{cell(lines.optimistic[p])}</td>
              <td className="py-1.5 text-right">{cell(lines.cautious[p])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m-0 text-[12px] font-bold opacity-80">{t('lines.note')}</p>
      <p className="m-0 text-[12px] font-bold opacity-80">{t('lines.fd')}</p>
      <div className="ink-chip px-3 py-1.5" style={{ background: lines.cushion < 0 ? '#F7C9C0' : '#E6F2DF' }}>
        <div className="text-[14px] font-extrabold">{lines.cushion < 0 ? '▼ ' : ''}{t('lines.cushion', { money: money(lines.cushion) })}</div>
        <div className="text-[12px] font-bold opacity-80">{t('lines.cushionNote')}</div>
      </div>
    </div>
  )
}
