import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { inr } from '../../content/data'
import { useGame } from '../../store/game'
import { LOOKS, Toon } from '../../art/Toon'
import { C } from '../../art/palette'
import { useManifest } from '../../art/ArtSlot'
import { TitleCard } from '../../components/TitleCard'
import { stepped } from '../../lib/stepped'
import { Backdrop, useStageSize } from './Stage'

const INK = C.ink

/** Beat 3 with the painted flower stall (public/art/story-flowers.webp). Nani stands behind the counter. */
export function B3Painted() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const start = useGame((s) => s.startAmount)
  const { w } = useStageSize()
  const m = useManifest()['story-flowers']
  if (!m) return null
  const sw = Math.min(w * 1.5, 760)
  const sh = (sw * m.h) / m.w
  const th = sw * 0.4
  const tw = th * (100 / 150)
  const counter = 0.7
  const visible = th * 0.7
  return (
    <div className="absolute inset-0">
      <Backdrop>
        <defs>
          <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E2A44" /><stop offset="1" stopColor="#4a2530" /></linearGradient>
          <radialGradient id="lg"><stop offset="0" stopColor="#FFC36B" stopOpacity=".7" /><stop offset="1" stopColor="#FFC36B" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="400" height="760" fill="url(#nw)" />
        <ellipse cx="200" cy="470" rx="280" ry="320" fill="url(#lg)" />
        <path d="M-10 60 Q200 130 410 60" stroke={INK} strokeWidth="2.4" fill="none" />
        {Array.from({ length: 16 }, (_, i) => {
          const x = 10 + i * 25.5
          const y = 60 + Math.sin((i / 15) * Math.PI) * 52
          return <circle key={i} cx={x} cy={y + 6} r="5" fill="#FFE9A0" stroke={INK} strokeWidth="1.6" className="anim-twinkle" style={{ animationDelay: `${(i % 4) * 0.25}s` }} />
        })}
        {[0, 1, 2].map((i) => (
          <g key={i} style={{ animation: `bee${i} 3.4s steps(17) infinite` }}>
            <ellipse cx={70 + i * 120} cy={250 + i * 30} rx="8" ry="6" fill="#F4C430" stroke={INK} strokeWidth="1.6" />
            <ellipse cx={70 + i * 120} cy={242 + i * 30} rx="7" ry="4.4" fill="#FFF" opacity=".85" stroke={INK} strokeWidth="1" className="anim-twinkle" />
          </g>
        ))}
      </Backdrop>
      <style>{`@keyframes bee0{0%,100%{transform:translate(0,0)}50%{transform:translate(26px,-18px)}} @keyframes bee1{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,14px)}} @keyframes bee2{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,22px)}}`}</style>

      {/* the painted stall */}
      <div className="absolute left-1/2" style={{ bottom: '21%', width: sw, height: sh, transform: 'translateX(-50%)' }}>
        <img src="/art/story-flowers.webp" alt="" draggable={false} className="absolute inset-0 h-full w-full" />
        <div className="font-sign lang-fit absolute" style={{ left: '50%', top: '18%', transform: 'translate(-50%,-50%)', fontSize: sw * 0.05, color: C.maroon, textShadow: '1px 1px 0 rgba(255,243,214,.8)' }}>
          {t('world.flowers')}
        </div>
        <div className="absolute" style={{ left: sw * 0.56 - tw / 2, top: sh * counter - visible, width: tw, height: th, clipPath: `inset(-60px -90px ${th - visible}px -90px)` }}>
          <div className="anim-bob h-full w-full" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
            <Toon look={LOOKS.nani} mood="happy" wave flip x={0} y={0} width={tw} height={th} />
          </div>
        </div>
      </div>

      {/* you + the bundle */}
      <img src="/art/hero/front.png" alt="" draggable={false} className="anim-bob absolute" style={{ left: '1%', bottom: '19%', height: '34%', filter: 'drop-shadow(3px 4px 0 rgba(0,0,0,.5))' }} />
      <motion.div
        className="absolute"
        style={{ left: '25%', top: '50%', width: sw * 0.15 }}
        initial={{ x: 70, scale: 0.4, opacity: 0 }}
        animate={{ x: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.9, ease: stepped(9) }}
      >
        <svg viewBox="0 0 92 92" className="anim-bob-sm w-full" aria-hidden>
          <path d="M8 60 Q4 26 36 18 Q60 10 82 34 Q92 60 70 82 Q40 94 8 60Z" fill="#F7E6B8" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M20 40 Q44 30 70 40" stroke="#C9A867" strokeWidth="2.2" fill="none" />
          <rect x="28" y="12" width="26" height="16" rx="2" fill={C.sage} stroke={INK} strokeWidth="2.4" transform="rotate(-14 41 20)" />
          <circle cx="42" cy="22" r="4" fill={C.jasmine} stroke={INK} strokeWidth="1.6" />
          <path d="M44 24 Q40 38 46 44 Q54 38 52 24" fill="#F7E6B8" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        </svg>
        <div className="font-sign lang-fit anim-pop absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[3px] border-ink bg-gold px-2.5 py-0.5 text-[14px]" style={{ animationDelay: '1.7s' }}>
          +{inr(start, lang)}
        </div>
      </motion.div>
      <motion.div className="absolute" style={{ right: '3%', top: '11%', width: '62%' }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.45, ease: stepped(8) }}>
        <div className="paper relative px-3 py-2 text-[14px] font-bold leading-snug" style={{ boxShadow: '4px 5px 0 #2B1A17' }}>
          “{t('story.b3.quote')}”
          <div className="absolute -bottom-3 left-10 h-0 w-0" style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '14px solid #2B1A17' }} />
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

/** Beat 4 on the painted receipt (public/art/receipt.webp): amounts are lettered on top so they stay translatable. */
export function B4Painted() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona) ?? 'college'
  const goal = useGame((s) => s.goalAmount)
  const start = useGame((s) => s.startAmount)
  const m = useManifest().receipt
  const { w } = useStageSize()
  const n = useMotionValue(0)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const c = animate(n, goal, { duration: 1.3, delay: 0.7, ease: stepped(14), onUpdate: (v) => setShown(v) })
    return () => c.stop()
  }, [goal, n])
  if (!m) return null
  const rw = Math.min(w * 1.04, 520)
  const rh = (rw * m.h) / m.w
  const u = rw / 520 // font unit
  return (
    <div className="absolute inset-0">
      <Backdrop>
        <defs>
          <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F6F73" /><stop offset="1" stopColor="#1E2A44" /></linearGradient>
        </defs>
        <rect width="400" height="760" fill="url(#gb)" />
        {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={(i * 71) % 400} cy={(i * 97) % 760} r="2.4" fill="#FFF1B0" opacity=".5" className="anim-twinkle" style={{ animationDelay: `${(i % 4) * 0.3}s` }} />)}
        <circle cx="200" cy="360" r="250" fill="#E8B04A" opacity=".1" />
      </Backdrop>
      <motion.div className="absolute left-1/2" style={{ top: '13%', width: rw, height: rh, x: '-50%' }} initial={{ y: 420, rotate: 8, scale: 0.7 }} animate={{ y: 0, rotate: -1, scale: 1 }} transition={{ duration: 0.8, ease: stepped(9) }}>
        <img src="/art/receipt.webp" alt="" draggable={false} className="absolute inset-0 h-full w-full" style={{ filter: 'drop-shadow(5px 7px 0 rgba(43,26,23,.55))' }} />
        <div className="absolute inset-0" style={{ transform: 'rotate(4deg)', transformOrigin: '50% 50%' }}>
          <div className="font-sign lang-fit absolute text-center" style={{ left: '45%', top: '14%', transform: 'translate(-50%,-50%)', fontSize: 22 * u, color: C.maroon, letterSpacing: '.12em' }}>{t('story.b4.receipt')}</div>
          <div className="absolute text-center font-bold" style={{ left: '41%', top: '29%', transform: 'translate(-50%,-50%)', fontSize: 15 * u }}>{t(`personas.${persona}.goalFor`)}</div>
          <div className="absolute text-center font-extrabold uppercase" style={{ left: '41%', top: '37%', transform: 'translate(-50%,-50%)', fontSize: 12 * u, opacity: 0.7 }}>{t('story.b4.amount')}</div>
          <div className="font-display lang-fit absolute text-center" style={{ left: '41%', top: '47%', transform: 'translate(-50%,-50%)', fontSize: 46 * u, lineHeight: 1, textShadow: '2px 3px 0 #E8B04A', whiteSpace: 'nowrap' }}>{inr(shown, lang)}</div>
          <div className="absolute text-center font-extrabold" style={{ left: '41%', top: '60%', transform: 'translate(-50%,-50%)', fontSize: 17 * u, whiteSpace: 'nowrap' }}>{t('story.b4.deadline')}</div>
          <div className="absolute text-center font-semibold" style={{ left: '34%', top: '74%', transform: 'translate(-50%,-50%)', fontSize: 14 * u, whiteSpace: 'nowrap' }}>{t('story.b4.paid')}: {inr(start, lang)}</div>
          <motion.div
            className="font-display lang-fit absolute grid place-items-center rounded-full"
            style={{ left: '77%', top: '73%', width: 84 * u, height: 84 * u, x: '-50%', y: '-50%', color: C.coral, border: `${4 * u}px solid ${C.coral}`, fontSize: 24 * u, rotate: '-14deg', background: 'rgba(255,243,214,.45)' }}
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.92 }}
            transition={{ delay: 1.8, duration: 0.35, ease: stepped(6) }}
          >
            {t('story.b4.stamp')}
          </motion.div>
        </div>
      </motion.div>
      <div className="absolute inset-x-0 bottom-[17%] px-4">
        <div className="mx-auto max-w-[440px]">
          <TitleCard title={t('story.b4.title')}>{t('story.b4.caption')}</TitleCard>
        </div>
      </div>
    </div>
  )
}
