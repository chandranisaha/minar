import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { PERSONAS, PILLARS, inr, type PersonaId, type PillarId } from '../../content/data'
import { useGame } from '../../store/game'
import { Pigeon, Cloud } from '../../art/Scenery'
import { LOOKS, Toon } from '../../art/Toon'
import { C } from '../../art/palette'
import { CharminarArt } from '../../components/CharminarArt'
import { TitleCard } from '../../components/TitleCard'
import { WorldScene } from '../../world/WorldScene'
import { stepped } from '../../lib/stepped'
import { Backdrop, useStageSize } from './Stage'

const INK = C.ink
/* ------------------------------------------------------------------ 1. dawn at the Charminar */
export function B1Dawn() {
  const { t } = useTranslation()
  const flock = useMemo(
    () => [
      { x: 18, y: 63, fx: -380, fy: -520, d: 0.9 }, { x: 28, y: 66, fx: -300, fy: -640, d: 1.05 }, { x: 40, y: 62, fx: -120, fy: -700, d: 1.2 },
      { x: 58, y: 63, fx: 160, fy: -700, d: 1.0 }, { x: 70, y: 66, fx: 320, fy: -620, d: 1.15 }, { x: 80, y: 62, fx: 400, fy: -500, d: 1.3 }, { x: 50, y: 69, fx: 40, fy: -760, d: 1.1 },
    ],
    [],
  )
  return (
    <div className="absolute inset-0">
      <Backdrop>
        <defs>
          <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A2A5E" />
            <stop offset=".35" stopColor="#7C4A8E" />
            <stop offset=".62" stopColor="#F28C9A" />
            <stop offset=".8" stopColor="#FFC36B" />
            <stop offset="1" stopColor="#FFE3A8" />
          </linearGradient>
          <radialGradient id="sunrise"><stop offset="0" stopColor="#FFF1B0" stopOpacity=".95" /><stop offset=".5" stopColor="#FFC36B" stopOpacity=".5" /><stop offset="1" stopColor="#FFC36B" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="400" height="760" fill="url(#dawn)" />
        {Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={(i * 97) % 400} cy={((i * 53) % 260) + 10} r={i % 4 === 0 ? 2 : 1.2} fill="#FFF3D6" className="anim-twinkle" style={{ animationDelay: `${(i % 5) * 0.3}s` }} />
        ))}
        <circle cx="200" cy="560" r="230" fill="url(#sunrise)" />
        <circle cx="200" cy="580" r="62" fill="#FFF1B0" />
        <Cloud x={20} y={150} s={1.1} />
        <Cloud x={250} y={230} s={0.9} />
        <path d="M0 620 Q60 580 120 612 T240 600 T400 616 V760 H0Z" fill="#6A4A7A" opacity=".55" />
        <rect y="640" width="400" height="120" fill="#C98B58" />
        <path d="M0 640 H400" stroke={INK} strokeWidth="4" />
        <rect y="640" width="400" height="120" fill="#7A2A22" opacity=".18" />
      </Backdrop>
      <div className="absolute left-1/2 w-[112%] -translate-x-1/2" style={{ bottom: '17%', maxWidth: 620 }}>
        <CharminarArt className="block w-full" style={{ filter: 'saturate(.85) brightness(.92) hue-rotate(-10deg) drop-shadow(0 0 30px rgba(255,195,107,.5))' }} />
      </div>
      {flock.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: 38, height: 32, ['--fx' as string]: `${p.fx}px`, ['--fy' as string]: `${p.fy}px`, animation: `fly-away 2.6s steps(26) ${p.d}s both` }}
        >
          <Pigeon flip={i % 2 === 0} className="anim-hop" style={{ width: '100%', height: '100%', animationDelay: `${i * 0.2}s` }} />
        </div>
      ))}
      <div className="absolute inset-x-0 top-[13%] px-5">
        <div className="anim-pop mx-auto max-w-[420px]">
          <TitleCard eyebrow="★ ★ ★" title={t('story.b1.title')} tone="dusk">
            {t('story.b1.caption')}
          </TitleCard>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 2. choose your player */
const PersonaIcon = ({ id }: { id: PersonaId }) => (
  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
    {id === 'school' && (
      <g stroke={INK} strokeWidth="2.2" strokeLinejoin="round">
        <rect x="6" y="8" width="18" height="18" rx="5" fill={C.coral} />
        <rect x="9" y="15" width="12" height="7" rx="2" fill={C.mustard} />
        <path d="M10 8 Q15 0 20 8" fill="none" />
      </g>
    )}
    {id === 'college' && (
      <g stroke={INK} strokeWidth="2.2" strokeLinejoin="round">
        <rect x="6" y="6" width="18" height="13" rx="2" fill={C.sky} />
        <path d="M2 24 H28 L25 19 H5Z" fill="#D9D3C6" />
        <circle cx="15" cy="12.5" r="2.4" fill={C.jasmine} />
      </g>
    )}
    {id === 'earner' && (
      <g stroke={INK} strokeWidth="2.2" strokeLinejoin="round">
        <rect x="4" y="10" width="22" height="15" rx="3" fill={C.gold} />
        <path d="M11 10 V6 H19 V10" fill="none" />
        <path d="M4 17 H26" />
        <rect x="13" y="15" width="4" height="4" fill={C.jasmine} />
      </g>
    )}
  </svg>
)

export function B2Persona({ onPicked }: { onPicked: () => void }) {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona)
  const setPersona = useGame((s) => s.setPersona)
  const [tick, setTick] = useState(0)
  const ids = Object.keys(PERSONAS) as PersonaId[]
  const faces: Record<PersonaId, string> = { school: 'cheer', college: 'soft', earner: 'calm' }
  return (
    <div className="absolute inset-0">
      <Backdrop>
        <defs>
          <linearGradient id="peach" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5BB5D6" /><stop offset=".3" stopColor="#FFE3A8" /><stop offset="1" stopColor="#F2A56B" /></linearGradient>
        </defs>
        <rect width="400" height="760" fill="url(#peach)" />
        <path d="M-10 70 Q200 130 410 70" stroke={INK} strokeWidth="2.4" fill="none" />
        {Array.from({ length: 14 }, (_, i) => {
          const x = 10 + i * 29.5
          const y = 70 + Math.sin((i / 13) * Math.PI) * 44
          return <path key={i} d={`M${x - 8} ${y - 3} h16 l-8 22z`} fill={[C.pink, C.mustard, C.teal, C.coral][i % 4]} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        })}
        <rect x="-10" y="640" width="420" height="130" fill="#C98B58" stroke={INK} strokeWidth="4" />
      </Backdrop>
      <div className="absolute inset-x-0 top-[9%] px-4">
        <div className="mx-auto max-w-[440px]">
          <TitleCard title={t('story.b2.title')}>{t('story.b2.caption')}</TitleCard>
        </div>
      </div>
      <div className="absolute inset-x-0 top-[31%] flex flex-col gap-3 px-4" role="radiogroup" aria-label={t('story.b2.title')}>
        {ids.map((id) => {
          const sel = persona === id
          return (
            <button
              key={sel ? `${id}-${tick}` : id}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => { setPersona(id); setTick((n) => n + 1); onPicked() }}
              className={`paper mx-auto flex w-full max-w-[440px] items-center gap-3 p-2.5 text-left ${sel ? 'anim-squash' : ''}`}
              style={{ background: sel ? '#FFE3A8' : '#FFF3D6', borderColor: sel ? '#E5457A' : '#2B1A17', borderWidth: sel ? 5 : 4, cursor: 'pointer', minHeight: 92 }}
            >
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-[3px] border-ink bg-[#F9C97A]">
                <img src={`/art/faces/${sel ? 'laugh' : faces[id]}.png`} alt="" draggable={false} className="h-full w-full object-cover object-top" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-sign lang-fit flex items-center gap-1.5 text-[17px] leading-tight">
                  <PersonaIcon id={id} />
                  <span>{t(`personas.${id}.name`)}</span>
                </div>
                <div className="mt-0.5 text-[13px] font-medium leading-snug">{t(`personas.${id}.blurb`)}</div>
                <div className="mt-1 inline-block rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[12px] font-extrabold">
                  {t('personas.startsWith')} {inr(PERSONAS[id].start, lang)}
                </div>
              </div>
              <div className="font-sign grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] border-ink text-[16px]" style={{ background: sel ? '#E5457A' : 'transparent', color: '#FFF3D6' }} aria-hidden>
                {sel ? '✓' : ''}
              </div>
            </button>
          )
        })}
        <p className="m-0 text-center text-[11px] font-bold opacity-80">{t('hud.illustrative')}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 3. Nani's flower stall */
const Bloom = ({ cx, cy, r, f, glow }: { cx: number; cy: number; r: number; f: string; glow?: boolean }) => (
  <g>
    {glow && <circle cx={cx} cy={cy} r={r * 2.1} fill="#FFF1B0" opacity=".16" />}
    <circle cx={cx} cy={cy} r={r} fill={f} stroke={INK} strokeWidth="1.6" />
    <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.35} fill="#FFF" opacity=".75" />
  </g>
)

function FlowerHeap({ x, y, kind }: { x: number; y: number; kind: 'jasmine' | 'pink' | 'marigold' }) {
  const spec = {
    jasmine: ['#FFF8E1', '#FFFFFF', '#FFF0C4'],
    pink: ['#E5457A', '#F26BA0', '#FF8FB8'],
    marigold: ['#F28C28', '#F5A623', '#E8742A'],
  }[kind]
  const dots = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ cx: x + ((i * 37) % 86) - 43, cy: y - 36 - ((i * 53) % 46) + Math.abs(((i * 37) % 86) - 43) * 0.35, r: 7 + (i % 3) * 2, f: spec[i % 3] })), [x, y, spec[0]]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <g>
      <path d={`M${x - 52} ${y - 10} L${x - 44} ${y + 62} H${x + 44} L${x + 52} ${y - 10}Z`} fill="#4B5A63" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={`M${x - 50} ${y + 8} H${x + 50} M${x - 47} ${y + 30} H${x + 47}`} stroke={INK} strokeWidth="2" opacity=".5" />
      {dots.map((d, i) => <Bloom key={i} {...d} glow={kind === 'jasmine' && i % 4 === 0} />)}
    </g>
  )
}

export function B3Flowers() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const start = useGame((s) => s.startAmount)
  const { w } = useStageSize()
  const k = w / 400
  return (
    <div className="absolute inset-0">
      <Backdrop>
        <defs>
          <linearGradient id="nightwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E2A44" /><stop offset="1" stopColor="#3b1f26" /></linearGradient>
          <radialGradient id="lampglow"><stop offset="0" stopColor="#FFC36B" stopOpacity=".75" /><stop offset="1" stopColor="#FFC36B" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="400" height="760" fill="url(#nightwall)" />
        <ellipse cx="210" cy="330" rx="260" ry="300" fill="url(#lampglow)" />
        {/* shop sign */}
        <g>
          <rect x="90" y="64" width="220" height="48" rx="6" fill={C.mustard} stroke={INK} strokeWidth="4" />
          <rect x="96" y="70" width="208" height="36" rx="3" fill="none" stroke={C.maroon} strokeWidth="1.6" />
          <text x="200" y="98" textAnchor="middle" fontSize="26" fill={C.maroon} style={{ fontFamily: 'var(--font-sign)' }}>{t('world.flowers')}</text>
          {Array.from({ length: 11 }, (_, i) => <circle key={i} cx={100 + i * 18.5} cy="60" r="3.6" fill="#FFF1B0" stroke={INK} strokeWidth="1.4" className="anim-twinkle" style={{ animationDelay: `${(i % 3) * 0.3}s` }} />)}
        </g>
        {/* calendar */}
        <g transform="rotate(-4 70 170)">
          <rect x="24" y="116" width="92" height="116" fill="#F7E6B8" stroke={INK} strokeWidth="3" />
          <rect x="24" y="116" width="92" height="28" fill={C.coral} stroke={INK} strokeWidth="3" />
          {Array.from({ length: 20 }, (_, i) => <rect key={i} x={32 + (i % 5) * 16} y={152 + Math.floor(i / 5) * 18} width="9" height="9" rx="2" fill={i === 11 ? C.pink : INK} opacity={i === 11 ? 1 : 0.45} />)}
          <circle cx="70" cy="116" r="4" fill={C.jasmine} stroke={INK} strokeWidth="2" />
        </g>
        {/* marigold garlands */}
        {[250, 290, 330, 365].map((x, i) => (
          <g key={x} className="anim-sway" style={{ transformOrigin: `${x}px 118px`, transformBox: 'view-box', animationDelay: `${i * 0.25}s` }}>
            <path d={`M${x} 118 V${200 + (i % 2) * 24}`} stroke={INK} strokeWidth="1.6" />
            {Array.from({ length: 7 + (i % 2) }, (_, j) => <circle key={j} cx={x + (j % 2 ? 3 : -3)} cy={128 + j * 11} r="7.2" fill={j % 3 === 0 ? '#F5A623' : '#F28C28'} stroke={INK} strokeWidth="1.6" />)}
          </g>
        ))}
        {/* counter + buckets */}
        <rect x="-10" y="500" width="420" height="24" fill="#8A4F2B" stroke={INK} strokeWidth="4" />
        <FlowerHeap x={70} y={520} kind="jasmine" />
        <FlowerHeap x={200} y={540} kind="pink" />
        <FlowerHeap x={332} y={520} kind="jasmine" />
        <FlowerHeap x={70} y={650} kind="marigold" />
        <FlowerHeap x={332} y={655} kind="pink" />
        <rect y="720" width="400" height="40" fill="#3b2a26" />
        {/* bees */}
        {[0, 1, 2].map((i) => (
          <g key={i} style={{ animation: `bee${i} 3.4s steps(17) infinite` }}>
            <ellipse cx={120 + i * 90} cy={300 + i * 40} rx="8" ry="6" fill="#F4C430" stroke={INK} strokeWidth="1.6" />
            <path d={`M${116 + i * 90} ${299 + i * 40} v-5 M${121 + i * 90} ${299 + i * 40} v-5`} stroke={INK} strokeWidth="2" />
            <ellipse cx={120 + i * 90} cy={292 + i * 40} rx="7" ry="4.4" fill="#FFF" opacity=".85" stroke={INK} strokeWidth="1" className="anim-twinkle" />
          </g>
        ))}
      </Backdrop>
      <style>{`@keyframes bee0{0%,100%{transform:translate(0,0)}50%{transform:translate(26px,-18px)}} @keyframes bee1{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,14px)}} @keyframes bee2{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,22px)}}`}</style>

      {/* Nani, the hero, the bundle */}
      <div className="absolute" style={{ left: '45%', top: '31%', width: 196 * k, height: 294 * k, clipPath: 'inset(-30px -60px 20% -60px)' }}>
        <Toon look={LOOKS.nani} mood="happy" wave flip x={0} y={0} width={196 * k} height={294 * k} />
      </div>
      <div className="absolute" style={{ left: '2%', top: '33%', width: 150 * k }}>
        <img src="/art/hero/front.png" alt="" draggable={false} className="block w-full anim-bob" style={{ filter: 'drop-shadow(3px 4px 0 rgba(43,26,23,.5))' }} />
      </div>
      <motion.div
        className="absolute"
        style={{ left: '31%', top: '45%', width: 92 * k }}
        initial={{ x: 70 * k, scale: 0.4, opacity: 0 }}
        animate={{ x: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.9, ease: stepped(9) }}
      >
        <svg viewBox="0 0 92 92" className="anim-bob-sm w-full" aria-hidden>
          <path d="M8 60 Q4 26 36 18 Q60 10 82 34 Q92 60 70 82 Q40 94 8 60Z" fill="#F7E6B8" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M20 40 Q44 30 70 40" stroke="#C9A867" strokeWidth="2.2" fill="none" />
          <rect x="28" y="12" width="26" height="16" rx="2" fill={C.sage} stroke={INK} strokeWidth="2.4" transform="rotate(-14 41 20)" />
          <circle cx="42" cy="22" r="4" fill={C.jasmine} stroke={INK} strokeWidth="1.6" />
          <path d="M34 22 q8 -6 16 0" stroke={INK} strokeWidth="1.4" fill="none" />
          <path d="M34 20 Q46 8 62 16 Q54 26 40 24Z" fill="#D9632E" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M44 24 Q40 38 46 44 Q54 38 52 24" fill="#F7E6B8" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        </svg>
        <div className="font-sign lang-fit anim-pop absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-ink bg-gold px-2.5 py-0.5 text-[14px]" style={{ animationDelay: '1.7s' }}>
          +{inr(start, lang)}
        </div>
      </motion.div>
      {/* Nani's line */}
      <motion.div className="absolute" style={{ right: '3%', top: '16.5%', width: '58%' }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.45, ease: stepped(8) }}>
        <div className="paper relative px-3 py-2 text-[14px] font-bold leading-snug" style={{ boxShadow: '4px 5px 0 #2B1A17' }}>
          “{t('story.b3.quote')}”
          <div className="absolute -bottom-3 left-8 h-0 w-0" style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '14px solid #2B1A17' }} />
        </div>
      </motion.div>
      <div className="absolute inset-x-0 bottom-[17%] px-4">
        <div className="mx-auto max-w-[440px]">
          <TitleCard title={t('story.b3.title')} tone="dusk">{t('story.b3.caption')}</TitleCard>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 4. the goal */
export function B4Goal() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona) ?? 'college'
  const goal = useGame((s) => s.goalAmount)
  const start = useGame((s) => s.startAmount)
  const n = useMotionValue(0)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const c = animate(n, goal, { duration: 1.3, delay: 0.7, ease: stepped(14), onUpdate: (v) => setShown(v) })
    return () => c.stop()
  }, [goal, n])
  return (
    <div className="absolute inset-0">
      <Backdrop>
        <defs>
          <linearGradient id="goalbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F6F73" /><stop offset="1" stopColor="#1E2A44" /></linearGradient>
        </defs>
        <rect width="400" height="760" fill="url(#goalbg)" />
        {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={(i * 71) % 400} cy={(i * 97) % 760} r="2.4" fill="#FFF1B0" opacity=".5" className="anim-twinkle" style={{ animationDelay: `${(i % 4) * 0.3}s` }} />)}
        <circle cx="200" cy="380" r="260" fill="#E8B04A" opacity=".1" />
      </Backdrop>
      <motion.div className="absolute inset-x-0 top-[17%] px-3" initial={{ y: 420, rotate: 8, scale: 0.7 }} animate={{ y: 0, rotate: -2, scale: 1 }} transition={{ duration: 0.8, ease: stepped(9) }}>
        <div className="relative mx-auto max-w-[400px]">
          <div
            className="relative px-5 pb-10 pt-5 text-center"
            style={{
              background: 'repeating-linear-gradient(#FFF3D6 0 27px, #F3E1B4 27px 28px)',
              border: '4px solid #2B1A17',
              boxShadow: '6px 8px 0 #2B1A17',
              clipPath: 'polygon(0 0,100% 0,100% 96%,95% 100%,90% 96%,85% 100%,80% 96%,75% 100%,70% 96%,65% 100%,60% 96%,55% 100%,50% 96%,45% 100%,40% 96%,35% 100%,30% 96%,25% 100%,20% 96%,15% 100%,10% 96%,5% 100%,0 96%)',
            }}
          >
            <div className="font-sign lang-fit text-[18px] tracking-[.2em] text-maroon">{t('story.b4.receipt')}</div>
            <div className="mx-auto my-1 h-[3px] w-24 rounded bg-ink opacity-70" />
            <div className="text-[15px] font-bold opacity-80">{t(`personas.${persona}.goalFor`)}</div>
            <div className="mt-2 text-[12px] font-extrabold uppercase tracking-wider opacity-70">{t('story.b4.amount')}</div>
            <div className="font-display lang-fit text-[58px] leading-none" style={{ textShadow: '2px 3px 0 #E8B04A' }}>{inr(shown, lang)}</div>
            <svg viewBox="0 0 220 10" className="mx-auto mt-1 w-48" aria-hidden><path d="M2 6 Q30 0 60 5 T120 5 T218 4" fill="none" stroke={C.pink} strokeWidth="3.4" strokeLinecap="round" /></svg>
            <div className="mt-3 flex items-center justify-center gap-2 text-[17px] font-extrabold">
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden><rect x="3" y="5" width="20" height="18" rx="3" fill="#FFF" stroke={INK} strokeWidth="2.4" /><rect x="3" y="5" width="20" height="6" fill={C.coral} stroke={INK} strokeWidth="2.4" /><text x="13" y="20" fontSize="10" fontWeight="900" textAnchor="middle" fill={INK}>12</text></svg>
              {t('story.b4.deadline')}
            </div>
            <div className="mt-1 text-[15px] font-semibold opacity-80">{t('story.b4.paid')}: {inr(start, lang)}</div>
          </div>
          <motion.div
            className="font-display lang-fit absolute -right-2 top-[44%] rounded-md border-[4px] px-3 py-0.5 text-[26px]"
            style={{ color: C.coral, borderColor: C.coral, rotate: '-14deg', background: 'rgba(255,243,214,.5)' }}
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.92 }}
            transition={{ delay: 1.8, duration: 0.35, ease: stepped(6) }}
          >
            {t('story.b4.stamp')}
          </motion.div>
        </div>
      </motion.div>
      <img src="/art/hero/front.png" alt="" draggable={false} className="anim-bob absolute" style={{ left: "4%", bottom: "30%", height: "23%", filter: 'drop-shadow(3px 4px 0 rgba(0,0,0,.45))' }} />
      <svg viewBox="0 0 120 110" className="absolute" style={{ right: '8%', bottom: '31%', width: '30%' }} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} className="anim-pop" style={{ animationDelay: `${1.2 + i * 0.25}s` }}>
            <ellipse cx="60" cy={96 - i * 17} rx="42" ry="12" fill={C.gold} stroke={INK} strokeWidth="3.4" />
            <path d={`M18 ${96 - i * 17} v-8 a42 12 0 0 0 84 0 v8`} fill="#B98A14" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" opacity=".0" />
            <path d={`M18 ${96 - i * 17} v8 a42 12 0 0 0 84 0 v-8`} fill="#B98A14" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
            <ellipse cx="60" cy={96 - i * 17} rx="42" ry="12" fill={C.gold} stroke={INK} strokeWidth="3.4" />
            <text x="60" y={100 - i * 17} fontSize="14" fontWeight="900" textAnchor="middle" fill={INK}>₹</text>
          </g>
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-[17%] px-4">
        <div className="mx-auto max-w-[440px]">
          <TitleCard title={t('story.b4.title')}>{t('story.b4.caption')}</TitleCard>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 5. the bazaar opens (camera pulls back to the hub) */
const NO_REACT: Record<PillarId, boolean> = { plan: false, save: false, invest: false, safe: false }
export function B5Bazaar({ onReady }: { onReady: () => void }) {
  const { t } = useTranslation()
  const { w, h } = useStageSize()
  const [lit, setLit] = useState<PillarId[]>([])
  const [ready, setReady] = useState(false)
  const scale = useMotionValue(1)
  const fit = Math.max(w / 1000, 0.3)
  // the camera: close on the Charminar, then a stepped pull-back to the whole bazaar
  const sx = useMotionValue(0)
  const sy = useMotionValue(0)
  useEffect(() => {
    const z0 = Math.max(fit * 2.6, 1)
    const cx0 = -(500 * z0 - w / 2)
    const cy0 = -(560 * z0 - h * 0.34)
    const z1 = Math.max(fit, w / 848)
    const cx1 = (w - 1000 * z1) / 2
    const cy1 = h * 0.52 - 760 * z1
    scale.set(z0); sx.set(cx0); sy.set(cy0)
    const opts = { duration: 2.4, delay: 0.7, ease: stepped(16) }
    const a = [animate(scale, z1, opts), animate(sx, cx1, opts), animate(sy, cy1, opts)]
    const timers = PILLARS.map((p, i) => window.setTimeout(() => setLit((l) => [...l, p.id]), 3300 + i * 800))
    const done = window.setTimeout(() => { setReady(true); onReady() }, 3300 + 4 * 800)
    return () => { a.forEach((x) => x.stop()); timers.forEach(clearTimeout); clearTimeout(done) }
  }, [w, h, fit, scale, sx, sy, onReady])
  const glow = useMemo(() => Object.fromEntries(PILLARS.map((p) => [p.id, lit.includes(p.id)])) as Record<PillarId, boolean>, [lit])
  const react = useMemo(() => {
    const last = lit[lit.length - 1]
    return { ...NO_REACT, ...(last && !ready ? { [last]: true } : {}) } as Record<PillarId, boolean>
  }, [lit, ready])
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(#5BB5D6 0 50%, #8A4F2B 50% 100%)' }}>
      <motion.div style={{ position: 'absolute', left: 0, top: 0, width: 1000, height: 1400, transformOrigin: '0 0', x: sx, y: sy, scale, willChange: 'transform' }}>
        <WorldScene lamps={[false, false, false, false]} done={{ plan: false, save: false, invest: false, safe: false }} react={react} doorGlow={glow} />
      </motion.div>
      <div className="absolute inset-x-0 top-[14%] px-4">
        <motion.div className="mx-auto max-w-[440px]" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: ready || lit.length ? 1 : 0, scale: ready || lit.length ? 1 : 0.6 }} transition={{ duration: 0.4, ease: stepped(8) }}>
          <TitleCard eyebrow={t('story.b5.title')} title={t('story.b5.ask')}>{t('story.b5.caption')}</TitleCard>
        </motion.div>
      </div>
    </div>
  )
}
