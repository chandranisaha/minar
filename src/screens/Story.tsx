import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { animate, motion, useMotionValue } from 'framer-motion'
import { FESTIVALS, PERSONAS, PILLARS, inr, type PersonaId } from '../content/data'
import { HappyMeter } from '../ui/wire/HappyMeter'
import { useGame } from '../store/game'
import { GearMenu, GoalBar } from '../components/Hud'
import { TitleCard } from '../components/TitleCard'
import { ArtSlot, useManifest } from '../art/ArtSlot'
import { IslandArt } from '../island/IslandArt'
import { WORLD, nodeById, px } from '../island/data'
import { stepped } from '../lib/stepped'

const LAST = 6
const bgSky = 'linear-gradient(#92C9D3, #F8EBCB 70%)'

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [s, set] = useState({ w: 390, h: 844 })
  useEffect(() => {
    const el = ref.current!
    const f = () => set({ w: el.clientWidth, h: el.clientHeight })
    f()
    const ro = new ResizeObserver(f)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return s
}

/** Beat 1: a slow pull-in over the island at dawn, ending at the dock. */
function B1Island({ w, h }: { w: number; h: number }) {
  const { t } = useTranslation()
  const sc = useMotionValue(1)
  const tx = useMotionValue(0)
  const ty = useMotionValue(0)
  useEffect(() => {
    const fit = Math.min(w / WORLD.w, h / WORLD.h) * 1.12
    const close = Math.max(fit * 2.4, h / WORLD.h * 1.5)
    const c = px([nodeById('plaza').x, nodeById('plaza').y - 6])
    const d = px([nodeById('dock').x + 8, nodeById('dock').y - 4])
    sc.set(fit); tx.set(w / 2 - c[0] * fit); ty.set(h * 0.5 - c[1] * fit)
    const o = { duration: 6, delay: 0.4, ease: stepped(30) }
    const a = [animate(sc, close, o), animate(tx, w / 2 - d[0] * close, o), animate(ty, h * 0.6 - d[1] * close, o)]
    return () => a.forEach((x) => x.stop())
  }, [w, h, sc, tx, ty])
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#92C9D3' }}>
      <motion.div style={{ position: 'absolute', left: 0, top: 0, width: WORLD.w, height: WORLD.h, transformOrigin: '0 0', x: tx, y: ty, scale: sc, willChange: 'transform' }}>
        <ArtSlot name="island-bg" className="absolute inset-0 h-full w-full" fallback={<IslandArt done={[]} allDone={false} />} />
      </motion.div>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(232,150,120,.38), rgba(255,214,150,.12) 55%, rgba(255,214,150,0))', mixBlendMode: 'multiply' }} />
      <div className="absolute inset-x-0 top-[12%] px-5">
        <div className="rise mx-auto max-w-[420px]">
          <TitleCard title={t('story.b1.title')}>{t('story.b1.caption')}</TitleCard>
        </div>
      </div>
    </div>
  )
}

/** Beat 2: three plain persona cards, a quiet selected state. */
function B2Persona() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona)
  const setPersona = useGame((s) => s.setPersona)
  const gender = useGame((s) => s.gender)
  const setGender = useGame((s) => s.setGender)
  const ids = Object.keys(PERSONAS) as PersonaId[]
  const seen = useGame((s) => s.storySeen) // replaying must not reset progress: the person is fixed once chosen
  const festival = useGame((s) => s.festival)
  const setFestival = useGame((s) => s.setFestival)
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: bgSky }}>
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col justify-center gap-3 px-4 pb-24 pt-20">
        <TitleCard title={t('story.b2.title')}>{t('story.b2.caption')}</TitleCard>
        <div className="ink-chip mx-auto inline-flex p-0.5" role="radiogroup" aria-label={t('story.b2.look')}>
          {(['girl', 'boy'] as const).map((g) => (
            <button key={g} type="button" role="radio" aria-checked={gender === g} onClick={() => setGender(g)} className="h-10 min-w-24 rounded-full px-4 text-[14px] font-bold" style={{ background: gender === g ? '#3A2A24' : 'transparent', color: gender === g ? '#FBF0D2' : '#3A2A24', border: 0, cursor: 'pointer' }}>
              {t(`story.b2.${g}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={t('story.b2.title')}>
          {ids.map((id) => {
            const sel = persona === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={sel}
                disabled={seen && !!persona}
                onClick={() => { if (!seen) setPersona(id) }}
                className="paper flex w-full items-center gap-3 p-2.5 text-left"
                style={{ cursor: 'pointer', minHeight: 88, background: sel ? '#FBF3DF' : '#FBF0D2', borderColor: sel ? '#D9573F' : '#3A2A24', borderWidth: sel ? 2.5 : 1.5, transition: 'border-color .2s, background .2s' }}
              >
                <img src={`/art/avatar/${gender}-${id}-face.webp`} alt="" draggable={false} className="h-[64px] w-[64px] shrink-0 rounded-full border-[1.5px] border-ink bg-[#F2DFB0] object-cover object-top" />
                <div className="min-w-0 flex-1">
                  <div className="font-display lang-fit text-[18px] leading-tight">{t(`personas.${id}.name`)}</div>
                  <div className="mt-0.5 text-[13px] leading-snug opacity-85">{t(`personas.${id}.blurb`)}</div>
                  <div className="mt-1 text-[12px] font-bold text-gold">{t('personas.startsWith')} {inr(PERSONAS[id].start, lang)}</div>
                </div>
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-[13px]" style={{ background: sel ? '#D9573F' : 'transparent', color: '#FBF6EA' }} aria-hidden>{sel ? '✓' : ''}</div>
              </button>
            )
          })}
        </div>
        <div className="paper p-2.5" role="radiogroup" aria-label={t('story.b2.festival')}>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[.16em] opacity-70">{t('story.b2.festival')}</div>
          <div className="flex flex-wrap gap-1.5">
            {FESTIVALS.map((f) => (
              <button key={f} type="button" role="radio" aria-checked={festival === f} onClick={() => setFestival(f)} className="h-10 rounded-full px-3 text-[14px] font-bold" style={{ background: festival === f ? '#3A2A24' : 'transparent', color: festival === f ? '#FBF0D2' : '#3A2A24', border: '1.5px solid #3A2A24', cursor: 'pointer' }}>{t(`festivals.${f}`)}</button>
            ))}
          </div>
        </div>
        <p className="m-0 text-center text-[11px] font-semibold opacity-70">{t('hud.illustrative')}</p>
      </div>
    </div>
  )
}

/** Beat 3: the grandmother's flower stall (watercolour vignette), the bundle, the line. */
function B3Flowers() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const start = useGame((s) => s.startAmount)
  const man = useManifest()
  const m = man['story-flowers']
  const nani = !!man['npc-nani-wave']
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: 'linear-gradient(#F8EBCB, #F2DFB0)' }}>
      <div className="mx-auto flex min-h-full max-w-[520px] flex-col justify-center gap-3 px-4 pb-24 pt-20">
        {m && (
          <div className="fade-in relative w-full">
            <img src="/art/story-flowers.webp" alt="" draggable={false} className="block w-full" style={{ filter: 'drop-shadow(0 8px 14px rgba(58,42,36,.25))' }} />
            {nani && (
              <div className="anim-float absolute" style={{ left: '38%', bottom: '4%', width: '24%' }}>
                <img src="/art/npc-nani-wave.webp" alt="" draggable={false} className="block w-full" />
              </div>
            )}
          </div>
        )}
        <div className="paper rise relative mx-auto -mt-6 w-[92%] px-4 py-3 text-center" style={{ animationDelay: '.5s' }}>
          <p className="m-0 text-[17px] font-bold leading-snug">“{t('story.b3.quote')}”</p>
          <p className="m-0 mt-1 text-[13px] opacity-75">{t('story.b3.caption')}</p>
          <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-[#F2DFB0] px-3 py-1 text-[14px] font-bold">
            <svg width="22" height="22" viewBox="0 0 92 92" aria-hidden><path d="M8 60 Q4 26 36 18 Q60 10 82 34 Q92 60 70 82 Q40 94 8 60Z" fill="#F8EBCB" stroke="#3A2A24" strokeWidth="5" strokeLinejoin="round" /></svg>
            +{inr(start, lang)}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Beat 4: the fee letter. The goal pill slides in at the top. */
function B4Letter() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona) ?? 'college'
  const goal = useGame((s) => s.goalAmount)
  const m = useManifest().receipt
  const n = useMotionValue(0)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const c = animate(n, goal, { duration: 1.2, delay: 0.6, ease: stepped(12), onUpdate: (v) => setShown(v) })
    return () => c.stop()
  }, [goal, n])
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: bgSky }}>
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col justify-center gap-4 px-4 pb-24 pt-24">
        <div className="rise relative mx-auto w-full">
          {m ? (
            <div className="relative">
              <img src="/art/receipt.webp" alt="" draggable={false} className="block w-full" style={{ filter: 'drop-shadow(0 8px 14px rgba(58,42,36,.25))' }} />
              <div className="absolute inset-0" style={{ transform: 'rotate(4deg)' }}>
                <div className="font-display lang-fit absolute text-[clamp(14px,4.4vw,22px)] text-coral" style={{ left: '45%', top: '14%', transform: 'translate(-50%,-50%)' }}>{t('story.b4.receipt')}</div>
                <div className="absolute text-center font-bold" style={{ left: '41%', top: '29%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(11px,3.4vw,15px)' }}>{t(`personas.${persona}.goalFor`)}</div>
                <div className="font-display lang-fit absolute whitespace-nowrap" style={{ left: '41%', top: '46%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(30px,10vw,48px)', lineHeight: 1 }}>{inr(shown, lang)}</div>
                <div className="absolute whitespace-nowrap font-bold" style={{ left: '41%', top: '60%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(12px,3.6vw,16px)' }}>{t('story.b4.deadline')}</div>
              </div>
            </div>
          ) : (
            <div className="paper p-5 text-center">
              <div className="text-[11px] font-bold uppercase tracking-[.2em] text-coral">{t('story.b4.receipt')}</div>
              <div className="font-display lang-fit mt-1 text-[44px] leading-none">{inr(shown, lang)}</div>
              <div className="mt-2 text-[15px] font-bold">{t('story.b4.deadline')}</div>
            </div>
          )}
        </div>
        <TitleCard title={t('story.b4.title')}>{t('story.b4.caption')}</TitleCard>
      </div>
    </div>
  )
}

/** Beat 5: the four places and the skill each teaches. */
function B5Places() {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: bgSky }}>
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col justify-center gap-3 px-4 pb-24 pt-20">
        <TitleCard title={t('story.places.title')}>{t('story.places.caption')}</TitleCard>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {PILLARS.map((p) => (
            <li key={p.id} className="paper flex items-center gap-3 p-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-[14px] font-bold">{p.n}</span>
              <div className="min-w-0"><div className="font-display text-[17px] leading-tight">{t(`pillars.${p.id}.name`)}</div><div className="text-[13px] leading-snug opacity-85">{t(`pillars.${p.id}.hook`)}</div></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Beat 6: finish a place, its flag turns gold, the goal bar fills. */
function B6Win() {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: bgSky }}>
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col justify-center gap-3 px-4 pb-24 pt-24">
        <div className="paper rise flex items-end justify-center gap-6 p-3" aria-hidden>
          <img src="/art/flag-open.webp" alt="" draggable={false} className="h-24 object-contain" />
          <span className="pb-8 text-[26px]">→</span>
          <img src="/art/flag-done.webp" alt="" draggable={false} className="h-24 object-contain" />
        </div>
        <TitleCard title={t('story.win.title')}>{t('story.win.caption')}</TitleCard>
      </div>
    </div>
  )
}

/** Beat 7: stay happy, and how to move on the island. */
function B7Happy() {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: bgSky }}>
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col justify-center gap-3 px-4 pb-24 pt-24">
        <div className="paper rise p-3"><HappyMeter /></div>
        <TitleCard title={t('story.happy.title')}>{t('story.happy.caption')}</TitleCard>
      </div>
    </div>
  )
}

function Cover({ onStart, w, h }: { onStart: () => void; w: number; h: number }) {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#92C9D3' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD.w, height: WORLD.h, transformOrigin: '0 0', transform: `translate(${(w - WORLD.w * Math.max(w / WORLD.w, h / WORLD.h) * 1.15) / 2}px, ${h * 0.12}px) scale(${Math.max(w / WORLD.w, h / WORLD.h) * 1.15})`, opacity: 0.95 }}>
        <ArtSlot name="island-bg" className="absolute inset-0 h-full w-full" fallback={<IslandArt done={[]} allDone={false} />} />
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(243,233,210,.88), rgba(243,233,210,.35) 55%, rgba(243,233,210,0))' }} />
      <div className="absolute inset-x-0 top-[9%] px-5">
        <div className="rise mx-auto max-w-[420px]">
          <TitleCard title={t('app.title')}>
            <p className="m-0">{t('app.tagline')}</p>
            <button type="button" className="ink-btn mt-4" style={{ minHeight: 50, paddingInline: 34 }} onClick={onStart} autoFocus>{t('buttons.start')} ▸</button>
          </TitleCard>
        </div>
      </div>
    </div>
  )
}

export default function Story() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const persona = useGame((s) => s.persona)
  const setPersona = useGame((s) => s.setPersona)
  const setSeen = useGame((s) => s.setStorySeen)
  const [step, setStep] = useState(-1) // -1 = cover, 0..3 = the four beats
  const frame = useRef<HTMLDivElement>(null)
  const { w, h } = useSize(frame)

  const finish = useCallback(() => {
    if (!useGame.getState().persona) setPersona('college')
    setSeen(true)
    nav('/')
  }, [nav, setPersona, setSeen])

  const canNext = step === 1 ? !!persona : true
  const next = useCallback(() => { if (!canNext) return; if (step >= LAST) finish(); else setStep((s) => s + 1) }, [canNext, step, finish])
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), [])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const onBtn = document.activeElement instanceof HTMLButtonElement
      if (e.key === 'ArrowRight' || (e.key === ' ' && !onBtn)) { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [next, back, finish])

  return (
    <div ref={frame} className="absolute inset-0 overflow-hidden" style={{ background: '#92C9D3' }}>
      <div key={step} className="fade-in absolute inset-0">
        {step === -1 && <Cover onStart={next} w={w} h={h} />}
        {step === 0 && <B1Island w={w} h={h} />}
        {step === 1 && <B2Persona />}
        {step === 2 && <B3Flowers />}
        {step === 3 && <B4Letter />}
        {step === 4 && <B5Places />}
        {step === 5 && <B6Win />}
        {step === 6 && <B7Happy />}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-2 p-2.5" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
        <div className="pointer-events-auto">{step >= 3 ? <GoalBar className="rise" /> : <GearMenu replay={false} />}</div>
        <div className="pointer-events-auto flex items-center gap-2">
          {step >= 3 && <GearMenu replay={false} />}
          <button type="button" className="ink-btn cream" onClick={finish}>{t('buttons.skip')} »</button>
        </div>
      </div>

      {step >= 0 && (
        <div className="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-2 p-3" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
          <button type="button" className="ink-btn cream" onClick={back} disabled={step === 0} aria-label={t('buttons.back')}>◂</button>
          <div className="flex items-center gap-2" role="img" aria-label={t('story.step', { n: step + 1 })}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, background: i <= step ? '#3A2A24' : 'rgba(58,42,36,.25)', transition: 'width .25s' }} />)}
          </div>
          <button type="button" className="ink-btn" onClick={next} disabled={!canNext}>{step === LAST ? t('buttons.go') : t('buttons.next')} ▸</button>
        </div>
      )}
    </div>
  )
}
