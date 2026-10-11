import type { ReactNode } from 'react'
import type { Glow } from './summary'

/** the game's own colours, so the facilitator desk looks like the same place */
export const INK = '#3A2A24'
export const GOLD = '#F2B84B'
export const CORAL = '#D9573F'
export const SAGE = '#86B35F'
export const TEAL = '#2F6F73'

export function Card({ title, hint, children, className = '' }: { title?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`paper p-3.5 text-left ${className}`}>
      {title && <h2 className="font-display m-0 text-[20px] leading-tight">{title}</h2>}
      {hint && <p className="m-0 mt-0.5 text-[13px] leading-snug opacity-75">{hint}</p>}
      <div className={title ? 'mt-3' : ''}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="paper flex min-w-[120px] flex-1 flex-col gap-0.5 p-3 text-left">
      <div className="text-[11px] font-bold uppercase tracking-[.16em] opacity-65">{label}</div>
      <div className="font-display text-[30px] leading-none">{value}</div>
      {sub && <div className="text-[12px] leading-snug opacity-70">{sub}</div>}
    </div>
  )
}

/** a labelled horizontal bar; the number is always written out so colour is never the only signal */
export function Bar({ label, value, of, color = GOLD, note }: { label: ReactNode; value: number; of: number; color?: string; note?: string }) {
  const pct = of > 0 ? Math.round((value / of) * 100) : 0
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[14px]">
        <span className="min-w-0 font-semibold">{label}</span>
        <span className="shrink-0 tabular-nums opacity-80">{value}/{of} · {pct}%{note ? ` · ${note}` : ''}</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full border-[1.5px]" style={{ borderColor: INK, background: '#F3E6C2' }} role="img" aria-label={`${pct}%`}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width .5s steps(8)' }} />
      </div>
    </div>
  )
}

export function Chip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'gold' | 'coral' | 'sage' }) {
  const bg = tone === 'gold' ? '#FBE3A6' : tone === 'coral' ? '#F6C9BD' : tone === 'sage' ? '#D5E6C2' : '#FBF0D2'
  return <span className="inline-flex items-center rounded-full border-[1.5px] px-2.5 py-0.5 text-[12.5px] font-bold" style={{ borderColor: INK, background: bg }}>{children}</span>
}

/** the small flag a place shows on the island, reused as a progress mark */
export function Flag({ state, glow, size = 28 }: { state: 'n' | 'p' | 'c'; glow: Glow; size?: number }) {
  const src = state === 'c' ? '/art/flag-done.webp' : '/art/flag-open.webp'
  const filter = state === 'c' ? (glow === 'b' ? 'drop-shadow(0 0 4px #F2B84B)' : glow === 'd' ? 'saturate(.7)' : 'saturate(.45) brightness(.85)') : state === 'p' ? 'none' : 'grayscale(1) opacity(.5)'
  const word = state === 'c' ? (glow === 'b' ? 'cleared, bright' : glow === 'd' ? 'cleared, dim' : 'cleared, flickering') : state === 'p' ? 'in progress' : 'not started'
  return <img src={src} alt={word} title={word} draggable={false} style={{ width: size, height: size, objectFit: 'contain', filter }} />
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="ngo-noprint -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className="h-11 shrink-0 rounded-full px-4 text-[14px] font-bold" style={{ background: value === t.id ? INK : '#FBF0D2', color: value === t.id ? '#FBF0D2' : INK, border: `1.5px solid ${INK}`, cursor: 'pointer', boxShadow: value === t.id ? 'none' : '0 2px 0 rgba(58,42,36,.35)' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export const pct = (v: number | null) => (v === null ? '–' : `${Math.round(v * 100)}%`)
