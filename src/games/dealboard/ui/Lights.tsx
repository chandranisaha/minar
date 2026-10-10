import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { LIGHT_KEYS, interestCover } from '../engine/lights'
import type { Light, LightKey, Lights, QuarterStats } from '../engine/types'

const TONE: Record<Light, { bg: string; fg: string }> = {
  G: { bg: '#3F7A3A', fg: '#FFF3D6' },
  A: { bg: '#E8B04A', fg: '#2B1A17' },
  R: { bg: '#C8442F', fg: '#FFF3D6' },
  X: { bg: '#9A8F85', fg: '#FFF3D6' },
}

/** Icon plus label as well as colour, so the lights never rely on colour alone. */
function Glyph({ state }: { state: Light | null }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (state === 'G') return <svg {...common}><path d="m3.5 8.5 3 3 6-7" /></svg>
  if (state === 'A') return <svg {...common}><path d="M8 3v6.5" /><circle cx="8" cy="12.6" r=".6" fill="currentColor" /></svg>
  if (state === 'R') return <svg {...common}><path d="m4 4 8 8M12 4l-8 8" /></svg>
  if (state === 'X') return <svg {...common}><path d="M5.8 6.2a2.3 2.3 0 1 1 3.3 2c-.7.4-1.1.8-1.1 1.6" /><circle cx="8" cy="12.6" r=".6" fill="currentColor" /></svg>
  return <svg {...common}><circle cx="8" cy="8" r="4" strokeDasharray="2 2.4" /></svg>
}

export function LightChip({ k, state, active, onTap }: { k: LightKey; state: Light | null; active?: boolean; onTap?: () => void }) {
  const { t } = useTranslation('dealboard')
  const tone = state ? TONE[state] : { bg: '#E6D8B6', fg: '#6B5A4A' }
  const label = state ? t(`lights.state.${state}`) : t('lights.grey')
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={active}
      aria-label={`${t(`lights.${k}.name`)}: ${label}`}
      className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border-[2.5px] border-ink px-1 py-1"
      style={{ background: tone.bg, color: tone.fg, boxShadow: active ? '0 0 0 3px #E8B04A, 2px 2px 0 3px #2B1A17' : '2px 2px 0 #2B1A17' }}
    >
      <span className="flex max-w-full items-center gap-1">
        <Glyph state={state} />
        <span className="lang-fit text-[12px] font-extrabold leading-none">{t(`lights.${k}.name`)}</span>
      </span>
      <span className="text-[10px] font-extrabold uppercase leading-none tracking-wide opacity-90">{label}</span>
    </button>
  )
}

/** Six-quarter mini chart: six fixed slots (newest on the right), thick bars, green above zero and red below. */
export function MiniChart({ values, mode, height = 52 }: { values: number[]; mode: 'signed' | 'level'; height?: number }) {
  const SLOTS = 6
  const max = Math.max(1e-6, ...values.map((v) => Math.abs(v)))
  const W = 168, H = height, gap = 8
  const bw = (W - gap * (SLOTS - 1)) / SLOTS
  const mid = mode === 'signed' ? H / 2 : H - 3
  const offset = SLOTS - values.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={values.map((v) => v.toFixed(1)).join(', ')} style={{ display: 'block', maxHeight: H * 1.4 }}>
      {Array.from({ length: SLOTS }, (_, i) => <rect key={'g' + i} x={i * (bw + gap)} y={H - 3} width={bw} height={3} rx="1.5" fill="#2B1A17" opacity=".12" />)}
      {mode === 'signed' && <line x1="0" x2={W} y1={mid} y2={mid} stroke="#2B1A17" strokeWidth="1.5" strokeDasharray="3 3" opacity=".5" />}
      {values.map((v, i) => {
        const h = Math.max(2.5, (Math.abs(v) / max) * (mode === 'signed' ? H / 2 - 3 : H - 8))
        const up = v >= 0
        const y = mode === 'signed' ? (up ? mid - h : mid) : mid - h
        return <rect key={i} x={(i + offset) * (bw + gap)} y={y} width={bw} height={h} rx="2" fill={mode === 'level' ? '#8A6D3B' : up ? '#3F7A3A' : '#C8442F'} stroke="#2B1A17" strokeWidth="1.6" />
      })}
    </svg>
  )
}

const sales = (hist: QuarterStats[], q: number) => hist.slice(Math.max(1, q - 2), q + 1).filter((h) => h.ceoTrade === 'SELL').length

/** One plain sentence and the six-quarter series behind a light (used by the lights panel and founder answers). */
export function lightFacts(hist: QuarterStats[], q: number, k: LightKey, t: TFunction<'dealboard'>): { detail: string; series: number[]; mode: 'signed' | 'level' } {
  const slice = hist.slice(Math.max(0, q - 5), q + 1)
  const s = hist[q]
  if (k === 'cash') return { detail: s.profit >= 0 ? t('lights.detail.cashProfit') : t('lights.detail.cashRunway', { n: Math.round(s.runwayMonths ?? 0) }), series: slice.map((x) => x.profit), mode: 'signed' }
  if (k === 'customers') return { detail: t('lights.detail.customers', { pct: Math.round(s.retention * 100), net: (s.newCust - s.lostCust).toLocaleString('en-IN') }), series: slice.map((x) => x.newCust - x.lostCust), mode: 'signed' }
  if (k === 'debt') return { detail: s.debt <= 0.01 ? t('lights.detail.debtNone') : t('lights.detail.debtCover', { x: Math.max(0, interestCover(s)).toFixed(1) }), series: slice.map((x) => x.debt), mode: 'level' }
  const n = sales(hist, q)
  return { detail: n ? t('lights.detail.ceoSales', { n }) : t('lights.detail.ceoNone'), series: slice.map((x) => (x.ceoTrade === 'SELL' ? -1 : x.ceoTrade === 'BUY' ? 1 : 0.05)), mode: 'signed' }
}

/** Four lights for one company. `visible` says which are turned over; a tap explains one light. */
export function LightsPanel({ hist, q, lights, visible, selected, onSelect }: {
  hist: QuarterStats[]; q: number; lights: Lights; visible: LightKey[] | 'all'; selected: LightKey | null; onSelect: (k: LightKey | null) => void
}) {
  const { t } = useTranslation('dealboard')
  const shown = (k: LightKey) => visible === 'all' || visible.includes(k)
  const facts = selected ? lightFacts(hist, q, selected, t) : null
  const state = selected && shown(selected) ? lights[selected] : null
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 min-[470px]:grid-cols-4" role="group" aria-label={t('lights.title')}>
        {LIGHT_KEYS.map((k) => (
          <LightChip key={k} k={k} state={shown(k) ? lights[k] : null} active={selected === k} onTap={() => onSelect(selected === k ? null : k)} />
        ))}
      </div>
      {!selected && <p className="m-0 mt-1.5 text-[12px] opacity-65">{t('lights.tapHint')}</p>}
      {selected && (
        <div className="mt-2 rounded-lg border-2 border-ink bg-white/60 p-2.5 text-[13px] leading-snug">
          <div className="font-extrabold">{t(`lights.${selected}.explain`)}</div>
          {state ? (
            <>
              <div className="mt-1">{t(`lights.${selected}.${state === 'X' ? 'G' : state}`)} <span className="opacity-70">{facts!.detail}</span></div>
              <div className="mt-1.5"><div className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">{t('lights.chartTitle')}</div><MiniChart values={facts!.series} mode={facts!.mode} /></div>
            </>
          ) : (
            <div className="mt-1 opacity-75">{t('lights.grey')}</div>
          )}
        </div>
      )}
    </div>
  )
}
