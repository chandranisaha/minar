import type { ReactNode } from 'react'
import type { Glow } from './summary'

/**
 * The facilitator desk has its own calm, professional look (burgundy, navy and warm neutrals) so it reads as an analytics page
 * rather than part of the game. The colours below match the variables in ngo.css.
 */
export const INK = '#2B2B2B'
export const NAVY = '#14213D'
export const BURG = '#7A1F2B'
export const TAN = '#C9A66B'
export const SAGE = '#6F8F72'
export const LINE = '#DDD6C8'
export const CREAM = '#F6F1E7'
export const TRACK = '#EAE5DA'
// legacy names kept so the panels read naturally
export const GOLD = TAN
export const CORAL = BURG
export const TEAL = NAVY

export function Card({ title, hint, children, className = '' }: { title?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`paper p-4 text-left ${className}`}>
      {title && <h2 className="font-display m-0 text-[17px] leading-tight">{title}</h2>}
      {hint && <p className="m-0 mt-1 text-[13px] leading-snug" style={{ color: '#6B6558' }}>{hint}</p>}
      <div className={title ? 'mt-3.5' : ''}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, sub, badge }: { label: string; value: ReactNode; sub?: string; badge?: string }) {
  return (
    <div className="paper flex min-w-[140px] flex-1 flex-col gap-1 p-4 text-left">
      <div className="text-[12px] font-semibold" style={{ color: '#6B6558' }}>{label}</div>
      <div className="text-[30px] font-bold leading-none tracking-tight" style={{ color: NAVY }}>{value}</div>
      {(badge || sub) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] leading-snug" style={{ color: '#6B6558' }}>
          {badge && <span className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold" style={{ background: '#F3DEE0', color: BURG }}>{badge}</span>}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  )
}

/** a labelled horizontal bar; the number is always written out so colour is never the only signal */
export function Bar({ label, value, of, color = NAVY, note }: { label: ReactNode; value: number; of: number; color?: string; note?: string }) {
  const pct = of > 0 ? Math.round((value / of) * 100) : 0
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[14px]">
        <span className="min-w-0 font-medium">{label}</span>
        <span className="shrink-0 text-[13px] tabular-nums" style={{ color: '#6B6558' }}>{value}/{of} · {pct}%{note ? ` · ${note}` : ''}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: TRACK }} role="img" aria-label={`${pct}%`}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .5s ease' }} />
      </div>
    </div>
  )
}

export function Chip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'gold' | 'coral' | 'sage' }) {
  const t = tone === 'gold' ? ['#F1E6CF', '#7A5C1E'] : tone === 'coral' ? ['#F3DEE0', BURG] : tone === 'sage' ? ['#E2EBE3', '#3F5E45'] : ['#EFEBE2', '#4A453B']
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: t[0], color: t[1] }}>{children}</span>
}

/** a small status mark for a place: filled when cleared (strength shown by shade), half when in progress, empty when not started */
export function Flag({ state, glow, size = 26 }: { state: 'n' | 'p' | 'c'; glow: Glow; size?: number }) {
  const word = state === 'c' ? (glow === 'b' ? 'cleared, bright' : glow === 'd' ? 'cleared, dim' : 'cleared, flickering') : state === 'p' ? 'in progress' : 'not started'
  const fill = glow === 'b' ? NAVY : glow === 'd' ? TAN : BURG
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" role="img" aria-label={word}>
      <title>{word}</title>
      <circle cx="13" cy="13" r="10.5" fill={state === 'c' ? fill : '#fff'} stroke={state === 'n' ? '#BDB5A3' : state === 'p' ? TAN : fill} strokeWidth="2" />
      {state === 'p' && <path d="M13 2.5a10.5 10.5 0 0 1 0 21z" fill={TAN} />}
      {state === 'c' && <path d="M8 13.4l3.4 3.3L18.2 9.8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="ngo-noprint -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className="h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold" style={pillStyle(value === t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export const pillStyle = (active: boolean): React.CSSProperties => ({ background: active ? BURG : '#fff', color: active ? '#fff' : NAVY, border: `1px solid ${active ? BURG : '#D4CCBB'}`, cursor: 'pointer' })

export const pct = (v: number | null) => (v === null ? '–' : `${Math.round(v * 100)}%`)

/** a ring split into shares, with the total in the middle and a written legend (never colour alone) */
export function Donut({ rows, total, centre }: { rows: { label: string; n: number; hidden?: boolean }[]; total: number; centre: string }) {
  const colors = [BURG, NAVY, TAN]
  const R = 38
  const C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width="116" height="116" viewBox="0 0 100 100" role="img" aria-label={rows.map((r) => `${r.label} ${r.n}`).join(', ')}>
        <circle cx="50" cy="50" r={R} fill="none" stroke={TRACK} strokeWidth="13" />
        {total > 0 && rows.map((r, i) => {
          const len = (r.n / total) * C
          const el = r.n > 0 ? <circle key={r.label} cx="50" cy="50" r={R} fill="none" stroke={colors[i % 3]} strokeWidth="13" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)" /> : null
          acc += len
          return el
        })}
        <text x="50" y="49" textAnchor="middle" fontSize="17" fontWeight="700" fill={NAVY}>{total}</text>
        <text x="50" y="62" textAnchor="middle" fontSize="8" fill="#6B6558">{centre}</text>
      </svg>
      <ul className="m-0 grid min-w-[150px] flex-1 list-none gap-1.5 p-0 text-[14px]">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-2">
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: colors[i % 3] }} />
            <span className="flex-1 font-medium">{r.label}</span>
            <span className="tabular-nums" style={{ color: '#6B6558' }}>{r.hidden ? `under 5` : `${r.n} · ${total ? Math.round((r.n / total) * 100) : 0}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** a half-circle dial with a needle, for a 0 to 100 value */
export function Gauge({ value, label }: { value: number | null; label: string }) {
  const v = value === null ? 0 : Math.max(0, Math.min(100, value))
  const ang = Math.PI * (1 - v / 100)
  const x = 60 + 38 * Math.cos(ang)
  const y = 62 - 38 * Math.sin(ang)
  const arc = (a: number, b: number, c: string) => {
    const p = (t: number) => `${60 + 46 * Math.cos(Math.PI * (1 - t))} ${62 - 46 * Math.sin(Math.PI * (1 - t))}`
    return <path d={`M ${p(a)} A 46 46 0 0 1 ${p(b)}`} fill="none" stroke={c} strokeWidth="9" />
  }
  return (
    <svg width="160" height="108" viewBox="0 0 120 81" role="img" aria-label={`${label}: ${value === null ? 'no data' : Math.round(v)} out of 100`}>
      {arc(0, 0.35, BURG)}{arc(0.35, 0.6, TAN)}{arc(0.6, 1, NAVY)}
      {value !== null && <><line x1="60" y1="62" x2={x} y2={y} stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" /><circle cx="60" cy="62" r="4.5" fill={NAVY} /></>}
      <text x="60" y="79" textAnchor="middle" fontSize="13" fontWeight="700" fill={NAVY}>{value === null ? '–' : Math.round(v)}</text>
    </svg>
  )
}
