import { useEffect, useRef } from 'react'
import { animate, useMotionValue, useTransform, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LANGS, PERSONAS, inr, type Lang } from '../content/data'
import { useGame, useLite } from '../store/game'
import { useTouchUi } from '../world/input'
import { stepped } from '../lib/stepped'

export function Coin({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <circle cx="20" cy="20" r="17" fill="#D9A520" stroke="#2B1A17" strokeWidth="3.4" />
      <circle cx="20" cy="20" r="11.5" fill="#F0C24A" stroke="#2B1A17" strokeWidth="1.8" strokeDasharray="3 2.4" />
      <text x="20" y="27" textAnchor="middle" fontSize="19" fontWeight="900" fill="#2B1A17" fontFamily="serif">₹</text>
      <path d="M9 14 q3 -6 9 -7" stroke="#FFF3D6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Always-visible goal bar: ₹ saved / ₹ target. The fill animates in stepped frames. */
export function GoalBar({ className = '', intro = false }: { className?: string; intro?: boolean }) {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const saved = useGame((s) => s.savedAmount)
  const goal = useGame((s) => s.goalAmount)
  const pct = goal ? Math.min(1, saved / goal) : 0
  const mv = useMotionValue(0)
  const width = useTransform(mv, (v) => `${v * 100}%`)
  const first = useRef(true)
  useEffect(() => {
    const c = animate(mv, pct, { duration: first.current && intro ? 1.2 : 0.7, ease: stepped(12) })
    first.current = false
    return () => c.stop()
  }, [pct, mv, intro])
  return (
    <div className={`ink-chip flex items-center gap-2 px-2 py-1.5 ${intro ? 'anim-pop' : ''} ${className}`} role="group" aria-label={t('play.goalBar')}>
      <Coin />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 font-sign lang-fit leading-none" style={{ fontSize: 14 }}>
          <span className="hidden min-[430px]:inline">{t("hud.goal")}</span>
          <span className="whitespace-nowrap" style={{ fontSize: 13 }}>
            {inr(saved, lang)} <span className="opacity-60">/ {inr(goal, lang)}</span>
          </span>
        </div>
        <div className="relative mt-1 h-3.5 overflow-hidden rounded-full border-[2.5px] border-ink bg-[#E9D3A6]" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(saved)}>
          <motion.div className="h-full" style={{ width, background: 'repeating-linear-gradient(115deg,#E5457A 0 9px,#F28C28 9px 18px)' }} />
        </div>
      </div>
    </div>
  )
}

export function PersonaChip() {
  const persona = useGame((s) => s.persona)
  const { t } = useTranslation()
  if (!persona) return null
  return (
    <div className="ink-chip flex h-[52px] items-center gap-2 pl-1 pr-3" title={t(`personas.${persona}.name`)}>
      <img src={`/art/faces/${PERSONAS[persona].face}.png`} alt="" className="h-10 w-10 rounded-full border-[2.5px] border-ink bg-[#F9C97A] object-cover object-top" draggable={false} />
      <span className="font-sign lang-fit hidden text-[13px] sm:block">{t(`personas.${persona}.name`)}</span>
    </div>
  )
}

export function LangSwitch() {
  const lang = useGame((s) => s.language)
  const setLanguage = useGame((s) => s.setLanguage)
  const { t } = useTranslation()
  return (
    <div className="ink-chip flex items-center p-1" role="group" aria-label={t('hud.language')}>
      {LANGS.map((l: Lang) => (
        <button
          key={l}
          type="button"
          onClick={() => setLanguage(l)}
          aria-pressed={lang === l}
          className="font-sign h-11 min-w-12 rounded-lg px-2 text-[15px]"
          style={{ background: lang === l ? '#E5457A' : 'transparent', color: lang === l ? '#FFF3D6' : '#2B1A17', border: lang === l ? '2.5px solid #2B1A17' : '2.5px solid transparent', fontFamily: l === 'en' ? undefined : 'var(--font-body)', fontWeight: 800 }}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  )
}

export function LiteToggle() {
  const { t } = useTranslation()
  const lite = useLite()
  const setLite = useGame((s) => s.setLite)
  return (
    <button type="button" className="ink-chip font-sign lang-fit h-12 px-3 text-[13px]" aria-pressed={lite} onClick={() => setLite(!lite)} title={t('hud.lite')}>
      {lite ? '☀ ' : '✦ '}
      {lite ? t('hud.liteOn') : t('hud.liteOff')}
    </button>
  )
}

export function ReplayStory() {
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <button type="button" className="ink-chip font-sign lang-fit h-12 px-3 text-[13px]" onClick={() => nav('/story?replay=1')}>
      ↺ {t('hud.replay')}
    </button>
  )
}

/** Four minaret-lamp progress meter: mirrors the lamps on the Charminar so progress is always visible. */
export function LampMeter() {
  const done = useGame((s) => s.completedPillars)
  const order = ['plan', 'save', 'invest', 'safe'] as const
  return (
    <div className="ink-chip flex h-[52px] items-end gap-1.5 px-2.5 pb-1.5 pt-1" aria-label={`${done.length}/4`} role="img">
      {order.map((id, i) => {
        const lit = done.includes(id)
        const h = i < 2 ? 30 : 24
        return (
          <svg key={id} width="16" height="40" viewBox="0 0 16 40" aria-hidden>
            {lit && <circle cx="8" cy={40 - h - 5} r="9" fill="#FFD25A" opacity=".5" className="anim-twinkle" />}
            <path d={`M5 ${40 - h} L3 ${40 - h - 8} Q8 ${40 - h - 14} 13 ${40 - h - 8} L11 ${40 - h}Z`} fill={lit ? '#FFD25A' : '#8C7B6E'} stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" />
            <rect x="4" y={40 - h} width="8" height={h} fill="#F0D9A8" stroke="#2B1A17" strokeWidth="2" />
          </svg>
        )
      })}
    </div>
  )
}

export function TopHud({ showGoal = true }: { showGoal?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start gap-2 p-2" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
      {showGoal && <GoalBar className="pointer-events-auto min-w-0 max-w-[520px] flex-1" />}
      <div className="pointer-events-auto ml-auto flex shrink-0 gap-1.5">
        <LampMeter />
        <PersonaChip />
      </div>
    </div>
  )
}

export function BottomHud({ replay = true }: { replay?: boolean }) {
  const touch = useTouchUi()
  const { t } = useTranslation()
  const lite = useLite()
  const setLite = useGame((x) => x.setLite)
  const nav = useNavigate()
  if (touch) {
    // phone / tablet: the left thumb zone belongs to the joystick; controls stack on the right
    return (
      <div className="pointer-events-none absolute bottom-0 right-0 z-40 flex flex-col items-end gap-2 p-2" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))', paddingRight: 'max(8px, env(safe-area-inset-right))' }}>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" className="ink-chip grid h-12 w-12 place-items-center text-[20px]" aria-pressed={lite} aria-label={t('hud.lite')} title={t('hud.lite')} onClick={() => setLite(!lite)}>
            {lite ? '☀' : '✦'}
          </button>
          {replay && (
            <button type="button" className="ink-chip grid h-12 w-12 place-items-center text-[20px]" aria-label={t('hud.replay')} title={t('hud.replay')} onClick={() => nav('/story?replay=1')}>
              ↺
            </button>
          )}
        </div>
        <div className="pointer-events-auto">
          <LangSwitch />
        </div>
      </div>
    )
  }
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-wrap items-end justify-between gap-2 p-2" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="pointer-events-auto">
        <LangSwitch />
      </div>
      <div className="pointer-events-auto flex gap-2">
        <LiteToggle />
        {replay && <ReplayStory />}
      </div>
    </div>
  )
}
