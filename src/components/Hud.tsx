import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LANGS, inr, type Lang } from '../content/data'
import { useGame, useLite } from '../store/game'

export function Coin({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <circle cx="20" cy="20" r="17" fill="#E8AB3A" stroke="#3A2A24" strokeWidth="2.2" />
      <circle cx="20" cy="20" r="12" fill="none" stroke="#3A2A24" strokeWidth="1.2" opacity=".5" />
      <text x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="800" fill="#3A2A24" fontFamily="serif">₹</text>
    </svg>
  )
}

/** One small paper pill: coin, ₹ saved / ₹ target, thin progress line. Always visible. */
export function GoalBar({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const saved = useGame((s) => s.savedAmount)
  const goal = useGame((s) => s.goalAmount)
  const pct = goal ? Math.min(1, saved / goal) : 0
  return (
    <div className={`ink-chip flex items-center gap-2 py-1.5 pl-2 pr-3 ${className}`} role="group" aria-label={t('play.goalBar')}>
      <Coin />
      <div className="min-w-0">
        <div className="whitespace-nowrap text-[13px] font-bold leading-none">
          {inr(saved, lang)} <span className="opacity-55">/ {inr(goal, lang)}</span>
        </div>
        <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[#EAD6A0]" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(saved)}>
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct * 100}%`, transition: 'width .6s steps(8)' }} />
        </div>
      </div>
    </div>
  )
}

export function PersonaChip() {
  const persona = useGame((s) => s.persona)
  const gender = useGame((s) => s.gender)
  const { t } = useTranslation()
  if (!persona) return null
  return (
    <div className="ink-chip grid h-11 w-11 place-items-center overflow-hidden p-0" title={t(`personas.${persona}.name`)}>
      <img src={`/art/avatar/${gender}-${persona}-face.webp`} alt={t(`personas.${persona}.name`)} className="h-full w-full object-cover object-top" draggable={false} />
    </div>
  )
}

export function LangSwitch() {
  const lang = useGame((s) => s.language)
  const setLanguage = useGame((s) => s.setLanguage)
  const { t } = useTranslation()
  return (
    <div className="ink-chip inline-flex items-center p-0.5" role="group" aria-label={t('hud.language')}>
      {LANGS.map((l: Lang) => (
        <button
          key={l}
          type="button"
          onClick={() => setLanguage(l)}
          aria-pressed={lang === l}
          className="h-10 min-w-11 rounded-full px-2.5 text-[14px] font-bold"
          style={{ background: lang === l ? '#3A2A24' : 'transparent', color: lang === l ? '#FBF0D2' : '#3A2A24', border: 0, cursor: 'pointer' }}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  )
}

/** The only other persistent control: a gear holding language, lite mode and replay story. */
export function GearMenu({ replay = true }: { replay?: boolean }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const lite = useLite()
  const setLite = useGame((s) => s.setLite)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', off)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('pointerdown', off); window.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div ref={root} className="relative">
      <button type="button" className="ink-chip grid h-11 w-11 place-items-center" aria-haspopup="true" aria-expanded={open} aria-label={t('hud.settings')} onClick={() => setOpen((o) => !o)}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="none" stroke="#3A2A24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" />
        </svg>
      </button>
      {open && (
        <div className="paper rise absolute right-0 top-[52px] z-50 w-[250px] p-3" role="menu">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] opacity-60">{t('hud.language')}</div>
          <LangSwitch />
          <button type="button" role="menuitemcheckbox" aria-checked={lite} className="ink-btn cream mt-3 flex w-full items-center justify-between" onClick={() => setLite(!lite)}>
            <span>{t('hud.lite')}</span>
            <span>{lite ? '●' : '○'}</span>
          </button>
          {replay && (
            <button type="button" role="menuitem" className="ink-btn cream mt-2 w-full" onClick={() => nav('/story?replay=1')}>
              ↺ {t('hud.replay')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TopHud({ replay = true }: { replay?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 p-2.5" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
      <GoalBar className="pointer-events-auto" />
      <div className="pointer-events-auto flex items-center gap-2">
        <PersonaChip />
        <GearMenu replay={replay} />
      </div>
    </div>
  )
}
