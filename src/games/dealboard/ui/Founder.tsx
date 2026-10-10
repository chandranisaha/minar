import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import type { CompanyId } from '../engine/types'

const LOOKS: Record<CompanyId, { skin: string; hair: string; shirt: string; style: 'bun' | 'short' | 'bald' | 'long' | 'cap'; glasses?: boolean; beard?: boolean }> = {
  dailyBasket: { skin: '#C98B63', hair: '#3a2a24', shirt: '#F28C28', style: 'bun' },
  payEasy: { skin: '#E0AA80', hair: '#1f1a17', shirt: '#7C5BC4', style: 'short', glasses: true },
  solarGrid: { skin: '#B97B55', hair: '#2b2623', shirt: '#E8B04A', style: 'short', beard: true },
  medLink: { skin: '#D69B72', hair: '#2b1a17', shirt: '#2F8F8F', style: 'long' },
  steelWorks: { skin: '#C48A66', hair: '#c9c2b8', shirt: '#6D86A8', style: 'bald', beard: true },
  quickRide: { skin: '#D9A07A', hair: '#241513', shirt: '#D9573F', style: 'long', glasses: true },
}

/** A small hand-drawn portrait for each founder, so the profile feels like a person rather than a row of text. */
export function FounderFace({ id, size = 44 }: { id: CompanyId; size?: number }) {
  const l = LOOKS[id]
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden style={{ display: 'block' }}>
      <rect width="64" height="64" rx="12" fill={SECTOR_COLOUR[COMPANY[id].sector]} opacity=".35" />
      <path d="M8 64c2-14 12-20 24-20s22 6 24 20Z" fill={l.shirt} stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round" />
      {l.style === 'long' && <path d="M14 30c0-14 8-20 18-20s18 6 18 20v18H14Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.4" />}
      <ellipse cx="32" cy="31" rx="13" ry="15" fill={l.skin} stroke="#2B1A17" strokeWidth="2.4" />
      {l.style === 'short' && <path d="M19 28c0-10 5-15 13-15s13 5 13 15c-4-5-9-6-13-6s-9 1-13 6Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" strokeLinejoin="round" />}
      {l.style === 'bun' && <><circle cx="32" cy="12" r="5.5" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" /><path d="M19 28c0-9 5-14 13-14s13 5 13 14c-4-4-9-5-13-5s-9 1-13 5Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" strokeLinejoin="round" /></>}
      {l.style === 'long' && <path d="M19 29c0-9 5-14 13-14s13 5 13 14c-4-4-9-5-13-5s-9 1-13 5Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" strokeLinejoin="round" />}
      {l.style === 'bald' && <path d="M19 28c1-3 3-5 4-5M45 28c-1-3-3-5-4-5" stroke={l.hair} strokeWidth="4" strokeLinecap="round" fill="none" />}
      {l.beard && <path d="M20 35c1 9 6 12 12 12s11-3 12-12c-3 4-7 5-12 5s-9-1-12-5Z" fill={l.hair} opacity=".9" />}
      <circle cx="27" cy="31" r="1.8" fill="#2B1A17" />
      <circle cx="37" cy="31" r="1.8" fill="#2B1A17" />
      {l.glasses && <g fill="none" stroke="#2B1A17" strokeWidth="1.8"><circle cx="27" cy="31" r="4.6" /><circle cx="37" cy="31" r="4.6" /><path d="M31.6 31h0.8" /></g>}
      <path d="M28 38c2 2 6 2 8 0" stroke="#2B1A17" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** The founder's story: photo, a short career timeline and one clue to find with "Look closer". */
export function FounderProfile({ id, onClose }: { id: CompanyId; onClose: () => void }) {
  const { t } = useTranslation('dealboard')
  const [look, setLook] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  const jobs = ['j0', 'j1', 'j2'] as const
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t(`founders.${id}.name`)} onKeyDown={(e) => e.key === 'Escape' && onClose()} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className="paper db-sheet db-in max-h-[90vh] w-full max-w-[420px] overflow-y-auto p-4 outline-none">
        <div className="flex items-center gap-3">
          <div className="shrink-0 overflow-hidden rounded-xl border-[3px] border-ink" style={{ boxShadow: '2px 3px 0 #2B1A17' }}><FounderFace id={id} size={76} /></div>
          <div className="min-w-0">
            <div className="db-eyebrow text-[#8a5a2b]">{t('pitch3.founder')} · {t(`companies.${id}.name`)}</div>
            <h2 className="font-sign lang-fit m-0 text-[20px] leading-tight">{t(`founders.${id}.name`)}</h2>
            <div className="text-[13px] opacity-75">{t(`founders.${id}.role`)} · {t(`founders.${id}.age`)}</div>
          </div>
        </div>

        <div className="db-eyebrow mt-4 text-[#8a5a2b]">{t('pitch3.career')}</div>
        <ol className="m-0 mt-1.5 list-none p-0">
          {jobs.map((j, i) => (
            <li key={j} className="relative flex gap-3 pb-3 last:pb-0">
              <span className="relative z-[1] mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-ink" style={{ background: i === 2 ? '#E5457A' : '#E8B04A' }} aria-hidden />
              {i < 2 && <span className="absolute left-[5px] top-4 h-[calc(100%-4px)] w-[2px] bg-ink/40" aria-hidden />}
              <span className="text-[14px] leading-snug">{t(`founders.${id}.${j}`)}</span>
            </li>
          ))}
        </ol>

        <button type="button" className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink px-3 text-[14px] font-extrabold" style={{ background: look ? '#FFF3D6' : '#E8B04A' }} aria-expanded={look} onClick={() => setLook(true)}>
          {look ? <span className="font-bold">🔍 {t(`founders.${id}.notice`)}</span> : <span>🔍 {t('pitch3.look')}</span>}
        </button>
        <div className="mt-3 flex justify-end"><button type="button" className="ink-btn cream" onClick={onClose}>{t('pitch3.close')}</button></div>
      </div>
    </div>
  )
}
