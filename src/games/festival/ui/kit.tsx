import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LessonHit } from '../engine/lessons'
import { POCKETS, sumPockets, type PocketId, type Pockets } from '../engine/types'
import { useFestival } from '../state/store'
import { useFt } from './useFt'

export function GuardrailFooter() {
  const { t } = useFt()
  return (
    <p className="m-0 px-3 py-2 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }} role="note">
      ⓘ {t('guardrail')}
    </p>
  )
}

const ICON: Record<PocketId, ReactNode> = {
  // shopping bag
  ghar: (
    <g>
      <path d="M8 14 H32 L30 35 H10Z" fill="#E5457A" stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M14 15 V10 Q20 3 26 10 V15" fill="none" stroke="#2B1A17" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ),
  // small jar with a bow
  gift: (
    <g>
      <path d="M11 12 H29 V15 Q33 18 32 26 Q31 35 20 35 Q9 35 8 26 Q7 18 11 15Z" fill="#5BB5D6" stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M20 12 L13 6 L13 13Z M20 12 L27 6 L27 13Z" fill="#E5457A" stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="20" cy="25" r="4" fill="#D9A520" stroke="#2B1A17" strokeWidth="1.8" />
    </g>
  ),
  // ticket
  masti: (
    <g transform="rotate(-12 20 20)">
      <path d="M5 12 H35 V17 Q31 20 35 23 V28 H5 V23 Q9 20 5 17Z" fill="#F28C28" stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M14 13 V27" stroke="#2B1A17" strokeWidth="1.6" strokeDasharray="2 2" />
      <path d="M22 17 l1.5 3 3 .4 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.4z" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="1" />
    </g>
  ),
  // shoe
  bus: (
    <g>
      <path d="M6 28 Q5 18 12 14 L18 18 Q26 20 33 24 Q36 27 34 31 H7Z" fill="#2F6F73" stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M7 31 H34" stroke="#2B1A17" strokeWidth="3" />
      <path d="M15 19 l3 -2 M17 22 l3 -2" stroke="#FFF3D6" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),
  // coins
  loose: (
    <g>
      <ellipse cx="15" cy="28" rx="10" ry="5" fill="#D9A520" stroke="#2B1A17" strokeWidth="2.4" />
      <ellipse cx="15" cy="24" rx="10" ry="5" fill="#F0C24A" stroke="#2B1A17" strokeWidth="2.4" />
      <ellipse cx="26" cy="20" rx="10" ry="5" fill="#D9A520" stroke="#2B1A17" strokeWidth="2.4" />
      <ellipse cx="26" cy="16" rx="10" ry="5" fill="#F0C24A" stroke="#2B1A17" strokeWidth="2.4" />
    </g>
  ),
}

export function PocketIcon({ id, size = 34 }: { id: PocketId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      {ICON[id]}
    </svg>
  )
}

/** Wallet: total of every pocket. Money leaving flashes red with a down arrow (never colour alone). */
export function WalletStrip({ pockets, compact = false }: { pockets: Pockets; compact?: boolean }) {
  const { t, money } = useFt()
  const total = sumPockets(pockets)
  const prev = useRef(total)
  const [delta, setDelta] = useState<number | null>(null)
  useEffect(() => {
    const d = total - prev.current
    prev.current = total
    if (!d) return
    setDelta(d)
    const id = window.setTimeout(() => setDelta(null), 1600)
    return () => window.clearTimeout(id)
  }, [total])
  return (
    <div className="ink-chip flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5" role="group" aria-label={t('wallet')}>
      <span className="font-sign lang-fit text-[13px]">{t('wallet')} {money(total)}</span>
      {delta != null && (
        <span key={delta + ':' + total} className="anim-pop rounded-md px-1.5 text-[12px] font-extrabold" style={{ background: delta < 0 ? '#F7C9C0' : '#CDE8C4', color: delta < 0 ? '#7A2A22' : '#2B4A1E' }}>
          {delta < 0 ? '▼' : '▲'} {money(Math.abs(delta))}
        </span>
      )}
      {!compact && (
        <span className="flex flex-wrap gap-x-2.5 gap-y-1">
          {POCKETS.map((p) => (
            <span key={p} className="flex items-center gap-0.5 text-[12px] font-extrabold" title={t(`pockets.${p}.name`)}>
              <PocketIcon id={p} size={20} />
              <span className="sr-only">{t(`pockets.${p}.name`)}</span>
              {money(pockets[p])}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

/** Bottom sheet over the screen. */
export function Sheet({ children, label, onClose }: { children: ReactNode; label: string; onClose?: () => void }) {
  useEffect(() => {
    if (!onClose) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0" style={{ background: 'rgba(43,26,23,.55)' }} onClick={onClose} />
      <div className="paper anim-unfurl relative mx-2 mb-2 max-h-[88%] w-full max-w-md overflow-y-auto p-4" style={{ transformOrigin: '50% 100%' }}>
        {children}
      </div>
    </div>
  )
}

export function ToastHost() {
  const toast = useFestival((s) => s.toast)
  const showToast = useFestival((s) => s.showToast)
  const { t, money, itemName } = useFt()
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => showToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast, showToast])
  if (!toast) return null
  const v = toast.vars ?? {}
  const text = t(toast.key, {
    ...v,
    stall: v.stall ? t(`stalls.${v.stall}.name`) : undefined,
    item: v.item ? itemName(String(v.item)) : undefined,
    money: v.price != null ? money(Number(v.price)) : undefined,
  })
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div className="ink-chip anim-pop max-w-sm px-4 py-2.5 text-center text-[15px] font-extrabold" style={{ background: '#FFE08A' }}>
        {text}
      </div>
    </div>
  )
}

/** Three friend faces that smile or frown with the friendship meter (0 to 100, starts at 60). */
export function FriendFaces({ friendship }: { friendship: number }) {
  const { t } = useFt()
  const mood = friendship >= 60 ? 'happy' : friendship >= 40 ? 'meh' : 'sad'
  const colors = { arjun: '#F28C28', ayesha: '#3F7A3A', sunny: '#5BB5D6' }
  return (
    <div className="flex items-center gap-2" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={friendship} aria-label={t('mela.friendship')}>
      <div className="flex -space-x-1.5">
        {(['arjun', 'ayesha', 'sunny'] as const).map((f) => (
          <svg key={f} width="30" height="30" viewBox="0 0 30 30" aria-hidden>
            <circle cx="15" cy="15" r="12.5" fill="#C98552" stroke="#2B1A17" strokeWidth="2.4" />
            <path d="M4 12 Q6 2 15 3 Q24 2 26 12 Q20 7 15 8 Q10 7 4 12Z" fill={colors[f]} stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="11" cy="15" r="1.7" fill="#2B1A17" />
            <circle cx="19" cy="15" r="1.7" fill="#2B1A17" />
            <path d={mood === 'happy' ? 'M10 19 Q15 24 20 19' : mood === 'meh' ? 'M10 21 H20' : 'M10 22 Q15 17 20 22'} fill="none" stroke="#2B1A17" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ))}
      </div>
      <div className="h-3 w-20 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]">
        <div className="h-full" style={{ width: `${friendship}%`, background: friendship >= 60 ? '#3F7A3A' : friendship >= 40 ? '#E8B04A' : '#D8503A' }} />
      </div>
      <span className="text-[12px] font-extrabold">{friendship}</span>
    </div>
  )
}

/** Lesson card: three lines plus Learn more. The real-life term appears only here, after the player felt it. */
export function LessonCard({ hit, tilt = 0 }: { hit: LessonHit; tilt?: number }) {
  const { t, money, itemName } = useFt()
  const [more, setMore] = useState(false)
  const v = hit.vars
  const moneyKeys = ['m', 'r', 'p', 'c', 'cheap', 'new', 'extra', 'x']
  const vars: Record<string, string | number> = {}
  for (const [k, x] of Object.entries(v)) vars[k] = moneyKeys.includes(k) ? money(Number(x)) : x
  if (v.item) vars.item = itemName(String(v.item))
  if (v.pocket) vars.pocket = t(`pockets.${v.pocket}.name`)
  if (v.stall) vars.stall = t(`stalls.${v.stall}.name`)
  const line1 = hit.id === 'buffer' && hit.variant === 'good' ? t('lesson.buffer.good') : t(`lesson.${hit.id}.l1`, vars)
  return (
    <div className="paper p-4 text-left" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="font-sign lang-fit text-[12px] tracking-[.2em] text-pink">{t(`lesson.${hit.id}.term`)}</div>
      <p className="m-0 mt-1 text-[15px] font-extrabold leading-snug">{line1}</p>
      <p className="m-0 mt-1 text-[14px] leading-snug">{t(`lesson.${hit.id}.l2`)}</p>
      <p className="font-sign lang-fit m-0 mt-2 text-[17px]">“{t(`lesson.${hit.id}.l3`)}”</p>
      <button type="button" className="mt-2 min-h-12 text-[13px] font-extrabold underline" aria-expanded={more} onClick={() => setMore(!more)}>
        {more ? t('lesson.less') : t('lesson.learnMore')}
      </button>
      {more && <p className="m-0 text-[14px] leading-snug">{t(`lesson.${hit.id}.more`)}</p>}
    </div>
  )
}

/** Skyline strip (Old City rooftops, Charminar in the distance) behind every outdoor screen. */
export function Rooftops({ night = false }: { night?: boolean }) {
  const fill = night ? '#2A3658' : '#E7A86B'
  const back = night ? '#1E2A44' : '#F2C48D'
  return (
    <svg className="pointer-events-none fixed inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 360 160" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <g fill={back} stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" opacity=".9">
        {/* Charminar in the distance */}
        <path d="M150 160 V96 H210 V160Z" />
        <path d="M156 96 V58 Q158 50 160 58 V96 M200 96 V58 Q202 50 204 58 V96" />
        <path d="M170 96 Q180 74 190 96" fill={night ? '#121A2E' : '#C9875A'} />
        <circle cx="158" cy="52" r="5" />
        <circle cx="202" cy="52" r="5" />
      </g>
      <g fill={fill} stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M0 160 V112 H34 V100 H62 V122 H92 V108 H128 V128 H150 V160Z" />
        <path d="M210 160 V118 H238 V104 H266 V124 H296 V98 H330 V116 H360 V160Z" />
        <path d="M70 108 Q77 96 84 108 M300 98 Q313 84 326 98" fill="none" />
      </g>
      {[[12, 124], [44, 112], [104, 120], [222, 128], [250, 114], [308, 108], [340, 126]].map(([x, y]) => (
        <rect key={x} x={x} y={y} width="8" height="11" fill={night ? '#FFD25A' : '#2B1A17'} opacity={night ? 0.9 : 0.55} />
      ))}
    </svg>
  )
}
