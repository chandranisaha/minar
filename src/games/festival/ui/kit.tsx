import { useEffect, useId, useState, type ReactNode } from 'react'
import { Toon, type Mood, type ToonLook } from '../../../art/Toon'
import { JARS, type JarId, type Jars } from '../engine/types'
import { useFestival } from '../state/store'
import { JAR_COLOR } from './looks'
import { useFt } from './useFt'

export function GuardrailFooter() {
  const { t } = useFt()
  return (
    <p className="m-0 px-3 py-2 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }} role="note">
      ⓘ {t('guardrail')}
    </p>
  )
}

/** A glass jar whose coin level drops as money leaves. `full` is what 100% means (the planned amount). */
export function Jar({ id, amount, full, size = 64 }: { id: JarId; amount: number; full: number; size?: number }) {
  const clip = useId()
  const level = full > 0 ? Math.max(0, Math.min(1, amount / full)) : 0
  const top = 22 + (1 - level) * 50
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 64 74" aria-hidden className="shrink-0">
      <defs>
        <clipPath id={clip}><path d="M12 18 H52 Q58 24 57 44 Q56 70 32 70 Q8 70 7 44 Q6 24 12 18Z" /></clipPath>
      </defs>
      <path d="M12 18 H52 Q58 24 57 44 Q56 70 32 70 Q8 70 7 44 Q6 24 12 18Z" fill="#FFF8E6" />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y={top} width="64" height="74" fill={JAR_COLOR[id]} opacity=".9" style={{ transition: 'y .5s steps(5)' }} />
        {level > 0.05 && [14, 26, 38, 50].map((x, i) => <ellipse key={x} cx={x} cy={top + 3 + (i % 2) * 2} rx="6" ry="2.6" fill="#F0C24A" stroke="#2B1A17" strokeWidth="1.2" style={{ transition: 'cy .5s steps(5)' }} />)}
      </g>
      <path d="M12 18 H52 Q58 24 57 44 Q56 70 32 70 Q8 70 7 44 Q6 24 12 18Z" fill="none" stroke="#2B1A17" strokeWidth="3" />
      <rect x="10" y="8" width="44" height="11" rx="3" fill={JAR_COLOR[id]} stroke="#2B1A17" strokeWidth="3" />
      <path d="M15 26 Q13 40 16 54" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

/** The four jars, always on screen while playing. Money leaving shows a falling "▼ ₹X" chip (never colour alone). */
export function JarShelf({ jars, planned, highlight }: { jars: Jars; planned: Jars; highlight?: JarId }) {
  const { t, money } = useFt()
  const [prev, setPrev] = useState(jars)
  const [delta, setDelta] = useState<Partial<Record<JarId, number>>>({})
  // adjust state while rendering when the jars change (React's pattern for deriving from a changed prop)
  if (jars !== prev) {
    const d: Partial<Record<JarId, number>> = {}
    for (const j of JARS) if (jars[j] !== prev[j]) d[j] = jars[j] - prev[j]
    setPrev(jars)
    if (Object.keys(d).length) setDelta(d)
  }
  useEffect(() => {
    if (!Object.keys(delta).length) return
    const id = window.setTimeout(() => setDelta({}), 1700)
    return () => window.clearTimeout(id)
  }, [delta])
  return (
    <div className="grid grid-cols-4 gap-1" role="group" aria-label={t('jars.label')}>
      {JARS.map((j) => (
        <div key={j} className="relative flex flex-col items-center rounded-lg pb-0.5" style={{ background: highlight === j ? 'rgba(232,176,74,.45)' : undefined }}>
          <Jar id={j} amount={jars[j]} full={Math.max(planned[j], jars[j], 1)} size={32} />
          <span className="font-sign lang-fit text-[10px] leading-tight">{t(`jars.${j}.name`)}</span>
          <span className="text-[12px] font-extrabold leading-tight">{money(jars[j])}</span>
          {delta[j] != null && (
            <span key={`${j}${delta[j]}${jars[j]}`} className="fc-fly pointer-events-none absolute -top-1 right-0 rounded-md border-2 border-ink px-1 text-[11px] font-extrabold" style={{ background: delta[j]! < 0 ? '#F7C9C0' : '#CDE8C4', color: delta[j]! < 0 ? '#7A2A22' : '#2B4A1E' }}>
              {delta[j]! < 0 ? '▼' : '▲'}{money(Math.abs(delta[j]!))}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** Friendship: three faces that smile or frown (0 to 100, starts at 60). */
export function FriendMeter({ friendship }: { friendship: number }) {
  const { t } = useFt()
  const mood = friendship >= 60 ? 'happy' : friendship >= 40 ? 'meh' : 'sad'
  const hair = { arjun: '#F28C28', ayesha: '#3F7A3A', sunny: '#5BB5D6' }
  return (
    <div className="flex items-center gap-1.5" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={friendship} aria-label={t('friendship')}>
      <div className="flex -space-x-1.5">
        {(['arjun', 'ayesha', 'sunny'] as const).map((f) => (
          <svg key={f} width="24" height="24" viewBox="0 0 30 30" aria-hidden>
            <circle cx="15" cy="15" r="12.5" fill="#C98552" stroke="#2B1A17" strokeWidth="2.4" />
            <path d="M4 12 Q6 2 15 3 Q24 2 26 12 Q20 7 15 8 Q10 7 4 12Z" fill={hair[f]} stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="11" cy="15" r="1.7" fill="#2B1A17" />
            <circle cx="19" cy="15" r="1.7" fill="#2B1A17" />
            <path d={mood === 'happy' ? 'M10 19 Q15 24 20 19' : mood === 'meh' ? 'M10 21 H20' : 'M10 22 Q15 17 20 22'} fill="none" stroke="#2B1A17" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ))}
      </div>
      <span className="text-[11px] font-extrabold">{t(`friendshipMood.${mood}`)}</span>
    </div>
  )
}

/** A character portrait from the hub's rubber-hose rig. */
export function Portrait({ look, mood = 'happy', size = 72, wave, excited, shifty, armsUp }: { look: ToonLook; mood?: Mood; size?: number; wave?: boolean; excited?: boolean; shifty?: boolean; armsUp?: boolean }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 100 150" aria-hidden className="shrink-0" style={{ overflow: 'visible' }}>
      <Toon look={look} mood={mood} wave={wave} excited={excited} shifty={shifty} armsUp={armsUp} width={100} height={150} />
    </svg>
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
  const { t } = useFt()
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => showToast(null), 2600)
    return () => window.clearTimeout(id)
  }, [toast, showToast])
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div className="ink-chip anim-pop max-w-sm px-4 py-2.5 text-center text-[15px] font-extrabold" style={{ background: '#FFE08A' }}>{t(toast)}</div>
    </div>
  )
}

/** Paper bunting strung across the top of the bazaar. */
export function Bunting() {
  const colors = ['#E5457A', '#E8B04A', '#2F6F73', '#F28C28', '#5BB5D6', '#3F7A3A']
  return (
    <svg className="pointer-events-none block h-7 w-full" viewBox="0 0 360 28" preserveAspectRatio="none" aria-hidden>
      <path d="M0 4 Q180 16 360 4" fill="none" stroke="#2B1A17" strokeWidth="1.6" />
      {Array.from({ length: 18 }, (_, i) => {
        const x = 6 + i * 20
        const y = 4 + Math.sin((x / 360) * Math.PI) * 6
        return <path key={i} d={`M${x} ${y} L${x + 14} ${y} L${x + 7} ${y + 13}Z`} fill={colors[i % colors.length]} stroke="#2B1A17" strokeWidth="1.4" strokeLinejoin="round" />
      })}
    </svg>
  )
}

/** Old City rooftops (Charminar in the distance) behind every outdoor screen. */
export function Rooftops({ night = false }: { night?: boolean }) {
  const fill = night ? '#2A3658' : '#E7A86B'
  const back = night ? '#1E2A44' : '#F2C48D'
  return (
    <svg className="pointer-events-none fixed inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 360 160" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <g fill={back} stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" opacity=".9">
        <path d="M150 160 V96 H210 V160Z" />
        <path d="M156 96 V58 Q158 50 160 58 V96 M200 96 V58 Q202 50 204 58 V96" />
        <path d="M170 96 Q180 74 190 96" fill={night ? '#121A2E' : '#C9875A'} />
        <circle cx="158" cy="52" r="5" />
        <circle cx="202" cy="52" r="5" />
      </g>
      <g fill={fill} stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M0 160 V112 H34 V100 H62 V122 H92 V108 H128 V128 H150 V160Z" />
        <path d="M210 160 V118 H238 V104 H266 V124 H296 V98 H330 V116 H360 V160Z" />
      </g>
      {[[12, 124], [44, 112], [104, 120], [222, 128], [250, 114], [308, 108], [340, 126]].map(([x, y]) => (
        <rect key={x} x={x} y={y} width="8" height="11" fill={night ? '#FFD25A' : '#2B1A17'} opacity={night ? 0.9 : 0.55} />
      ))}
    </svg>
  )
}

export function FestivalBadge({ id, size = 40 }: { id: string; size?: number }) {
  const motif: Record<string, ReactNode> = {
    diwali: <g><path d="M8 26 Q20 36 32 26 Q30 22 20 22 Q10 22 8 26Z" fill="#D9632E" stroke="#2B1A17" strokeWidth="2.4" /><path d="M20 21 Q14 13 20 5 Q26 13 20 21Z" fill="#F28C28" stroke="#2B1A17" strokeWidth="2" /></g>,
    eid: <g><path d="M24 6 A14 14 0 1 0 30 30 A11 11 0 1 1 24 6Z" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2.4" /><path d="M30 12 l1.4 3 3 .4 -2.2 2 .6 3 -2.8 -1.5 -2.8 1.5 .6 -3 -2.2 -2 3 -.4z" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="1.2" /></g>,
    bonalu: <g><path d="M10 34 H30 L27 18 H13Z" fill="#D9632E" stroke="#2B1A17" strokeWidth="2.4" /><path d="M13 18 Q20 12 27 18" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2" /><path d="M20 14 Q16 8 20 3 Q24 8 20 14Z" fill="#F28C28" stroke="#2B1A17" strokeWidth="1.8" /></g>,
    sankranti: <g><path d="M20 3 L34 18 L20 33 L6 18Z" fill="#E5457A" stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round" /><path d="M20 3 V33 M6 18 H34" stroke="#2B1A17" strokeWidth="1.4" /><path d="M20 33 Q16 37 22 39" fill="none" stroke="#2B1A17" strokeWidth="1.6" /></g>,
    christmas: <g><path d="M20 3 l4.7 10 10.8 1.2 -8 7.4 2.3 10.6 -9.8 -5.6 -9.8 5.6 2.3 -10.6 -8 -7.4 10.8 -1.2z" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round" /></g>,
  }
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">{motif[id]}</svg>
}
