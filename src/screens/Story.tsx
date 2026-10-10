import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { useIris } from '../components/Iris'
import { GoalBar, Coin, LangSwitch } from '../components/Hud'
import { TitleCard } from '../components/TitleCard'
import { CharminarArt } from '../components/CharminarArt'
import { Backdrop, Stage } from './story/Stage'
import { B1Dawn, B2Persona, B3Flowers, B4Goal, B5Bazaar } from './story/Beats'
import { stepped } from '../lib/stepped'
import { useShortLandscape } from '../world/input'

const LAST = 4

function Cover({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-0">
      <Backdrop>
        <defs>
          <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5BB5D6" /><stop offset=".55" stopColor="#FFE3A8" /><stop offset="1" stopColor="#F9A94C" /></linearGradient>
        </defs>
        <rect width="400" height="760" fill="url(#cv)" />
        <circle cx="200" cy="470" r="150" fill="#FFF1B0" opacity=".7" />
        <rect y="660" width="400" height="100" fill="#C98B58" stroke="#2B1A17" strokeWidth="4" />
      </Backdrop>
      <div className="absolute left-1/2 w-[108%] -translate-x-1/2" style={{ bottom: '12%', maxWidth: 600 }}>
        <CharminarArt className="block w-full" />
      </div>
      <div className="absolute inset-x-0 top-[17%] px-5">
        <div className="anim-pop mx-auto max-w-[440px]">
          <TitleCard eyebrow="★ ★ ★" title={t('app.title')}>
            <p className="m-0">{t('app.tagline')}</p>
            <div className="mt-4 flex justify-center">
              <LangSwitch />
            </div>
            <button type="button" className="ink-btn pink mt-4 text-[20px]" style={{ minHeight: 56, paddingInline: 32 }} onClick={onStart} autoFocus>
              {t('buttons.start')} ▶
            </button>
          </TitleCard>
        </div>
      </div>
    </div>
  )
}

export default function Story() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const iris = useIris()
  const persona = useGame((s) => s.persona)
  const setPersona = useGame((s) => s.setPersona)
  const setSeen = useGame((s) => s.setStorySeen)
  const [step, setStep] = useState(-1) // -1 = cover with language chooser, 0..4 = the five beats
  const [ready5, setReady5] = useState(false)
  const onReady = useCallback(() => setReady5(true), [])
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const sideways = useShortLandscape()

  const finish = useCallback(() => {
    if (!useGame.getState().persona) setPersona('college')
    setSeen(true)
    iris.go('/')
  }, [iris, setPersona, setSeen])

  const canNext = step === -1 || (step === 1 ? !!persona : step === LAST ? ready5 : true)
  const next = useCallback(() => {
    if (!canNext) return
    if (step >= LAST) return finish()
    iris.run(() => setStep((s) => s + 1), undefined, 0.38)
  }, [canNext, step, finish, iris])
  const back = useCallback(() => {
    if (step <= 0) return
    iris.run(() => setStep((s) => s - 1), undefined, 0.3)
  }, [step, iris])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || (e.key === 'Enter' && !(document.activeElement instanceof HTMLButtonElement))) { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [next, back, finish])

  const onPointerDown = (e: React.PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY } }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s || (e.target as HTMLElement).closest('button, [role=radio]')) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) (dx < 0 ? next : back)()
    else if (Math.abs(dx) < 10 && step >= 0 && step !== 1 && !(step === LAST && !ready5)) next()
  }

  return (
    <Stage>
      <div className="absolute inset-0" onPointerDown={onPointerDown} onPointerUp={onPointerUp} style={{ touchAction: 'pan-y' }}>
        <motion.div key={step} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: stepped(6) }}>
          {step === -1 && <Cover onStart={next} />}
          {step === 0 && <B1Dawn />}
          {step === 1 && <B2Persona onPicked={() => undefined} />}
          {step === 2 && <B3Flowers />}
          {step === 3 && <B4Goal />}
          {step === 4 && <B5Bazaar onReady={onReady} />}
        </motion.div>
      </div>

      {/* top: language + skip, always visible */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 p-2" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="pointer-events-auto">{step >= 0 && <LangSwitch />}</div>
          <button type="button" className="ink-btn pointer-events-auto" onClick={finish}>
            {t('buttons.skip')} »
          </button>
        </div>
        {step >= 3 && (
          <div className="pointer-events-auto mt-2">
            <GoalBar intro={step === 3} className="mx-auto max-w-[440px]" />
          </div>
        )}
      </div>

      {/* bottom: progress ticker + next */}
      {step >= 0 && (
        <div className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 p-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button type="button" className="ink-btn cream" onClick={back} disabled={step === 0} aria-label={t('buttons.back')} style={{ opacity: step === 0 ? 0.35 : 1 }}>◀</button>
          <div className="flex items-center gap-1.5" role="img" aria-label={t('story.step', { n: step + 1 })}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ opacity: i <= step ? 1 : 0.35, transform: i === step ? 'scale(1.25)' : undefined }}><Coin size={22} /></div>
            ))}
          </div>
          <button type="button" className="ink-btn pink" onClick={next} disabled={!canNext} style={{ opacity: canNext ? 1 : 0.45 }}>
            {step === LAST ? t('buttons.go') : t('buttons.next')} ▶
          </button>
        </div>
      )}
      {sideways && (
        <div className="absolute inset-0 z-50 grid place-items-center p-6" style={{ background: 'rgba(30,42,68,.94)' }} role="alert">
          <div className="paper max-w-sm p-4 text-center">
            <div className="text-[40px]" aria-hidden>⟳📱</div>
            <p className="font-sign lang-fit m-0 text-[18px]">{t('story.rotate')}</p>
            <button type="button" className="ink-btn mt-3" onClick={finish}>{t('buttons.skip')} »</button>
          </div>
        </div>
      )}
      {step === 3 && <div className="sr-only" aria-live="polite">{t('story.b4.caption')}</div>}
      <button type="button" className="sr-only" onClick={() => nav('/')}>home</button>
    </Stage>
  )
}
