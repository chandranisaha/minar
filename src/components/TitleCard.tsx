import type { CSSProperties, ReactNode } from 'react'
import { C, flat, inkBorder } from '../art/palette'

const Corner = ({ style }: { style: CSSProperties }) => (
  <svg width="34" height="34" viewBox="0 0 34 34" style={{ position: 'absolute', ...style }} aria-hidden>
    <path d="M3 31 V12 Q3 3 12 3 H31" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
    <path d="M9 31 V16 Q9 9 16 9 H31" fill="none" stroke={C.gold} strokeWidth="3" strokeLinecap="round" />
    <circle cx="9" cy="9" r="3.4" fill={C.pink} stroke={C.ink} strokeWidth="1.8" />
  </svg>
)

/** 1930s-style title card: inked double border, gold inner rule, corner flourishes. */
export function TitleCard({ eyebrow, title, children, className = '', tone = 'cream' }: { eyebrow?: string; title: ReactNode; children?: ReactNode; className?: string; tone?: 'cream' | 'dusk' }) {
  const dark = tone === 'dusk'
  return (
    <div
      className={`relative text-center ${className}`}
      style={{
        background: dark ? C.dusk : C.jasmine,
        color: dark ? C.jasmine : C.ink,
        border: inkBorder(4),
        borderRadius: '6px 10px 5px 11px',
        boxShadow: flat(6, 7),
        padding: '22px 22px 18px',
      }}
    >
      <div style={{ position: 'absolute', inset: 6, border: `2.5px solid ${dark ? C.mustard : C.gold}`, borderRadius: 4, pointerEvents: 'none' }} />
      <Corner style={{ left: 2, top: 2 }} />
      <Corner style={{ right: 2, top: 2, transform: 'scaleX(-1)' }} />
      <Corner style={{ left: 2, bottom: 2, transform: 'scaleY(-1)' }} />
      <Corner style={{ right: 2, bottom: 2, transform: 'scale(-1)' }} />
      {eyebrow && <div className="font-sign lang-fit mb-1 text-[13px] tracking-[.28em]" style={{ color: dark ? C.mustard : C.pink }}>{eyebrow}</div>}
      <h1 className="font-display lang-fit m-0 text-[30px] leading-[1.08] sm:text-[40px]" style={{ textShadow: dark ? flat(2, 3) : `2px 3px 0 ${C.mustard}` }}>{title}</h1>
      {children && <div className="mt-2 text-[15px] font-medium leading-snug sm:text-[17px]">{children}</div>}
    </div>
  )
}
