import './i18n'
import './ui/festival.css'
import { useCallback, useEffect, useRef } from 'react'
import { LangSwitch } from '../../components/Hud'
import type { GameResult } from '../../lib/gameResult'
import { currentCard } from './engine/deck'
import { ideasFelt } from './engine/explain'
import { evidence, minaretLit, score, stars } from './engine/score'
import { replay } from './engine/state'
import type { FestivalId } from './engine/types'
import { newSeed, useFestival, type Phase } from './state/store'
import { BorrowSheet } from './ui/BorrowSheet'
import { FestivalMorning, Report } from './ui/Ending'
import { Intro } from './ui/Intro'
import { Bunting, FestivalBadge, GuardrailFooter, Rooftops, ToastHost } from './ui/kit'
import { Plan } from './ui/Plan'
import { Play } from './ui/Play'
import { useFt } from './ui/useFt'

export interface FestivalCountdownProps {
  /** omit to resume the game saved on this device; 'DEMO' starts Demo mode */
  seed?: string
  cohortCode: string
  persona?: { festival?: FestivalId }
  onComplete: (r: GameResult) => void
  onExit: () => void
}

/** Morning blue on day 1, golden rush on day 2, dusk with lights on day 3. */
const SKY = ['linear-gradient(#9FD4E8, #FFF0C8 60%, #F7C98A)', 'linear-gradient(#F7C98A, #FFE3A8 55%, #F2A56B)', 'linear-gradient(#3B3F6B, #8E4A6B 50%, #F28C28)']
const PHASE_SKY: Partial<Record<Phase, string>> = {
  intro: 'linear-gradient(#5BB5D6, #FFE3A8 60%, #F2A56B)',
  plan: 'linear-gradient(#9FD4E8, #FFF0C8 60%, #F7C98A)',
  festival: 'linear-gradient(#FFD9A0, #FFE9C4 50%, #F28C28)',
  report: 'linear-gradient(#5BB5D6, #FFE3A8 60%, #F2A56B)',
}

/** Festival Countdown (Pillar 1: Plan & Budget). Screens only emit events; all money logic lives in ./engine. */
export default function FestivalCountdown({ seed, cohortCode, persona, onComplete, onExit }: FestivalCountdownProps) {
  const { t, festival } = useFt()
  const phase = useFestival((s) => s.phase)
  const log = useFestival((s) => s.log)
  const showing = useFestival((s) => s.showing)
  const isDemo = useFestival((s) => s.demo)
  const skipDemo = useFestival((s) => s.skipDemo)
  const setup = useFestival((s) => s.setup)
  const setFestival = useFestival((s) => s.setFestival)
  const scroller = useRef<HTMLDivElement>(null)
  const day = phase === 'play' ? (currentCard(log)?.day ?? 3) : 1

  // a seed from the host (e.g. ?demo) starts that game; otherwise the saved game on this device resumes
  useEffect(() => {
    const st = useFestival.getState()
    if (seed && seed !== st.seed) setup({ seed, festival: seed === 'DEMO' ? 'diwali' : (persona?.festival ?? st.festival), demo: seed === 'DEMO' })
    else if (persona?.festival && st.phase === 'intro') setFestival(persona.festival)
  }, [seed, persona?.festival, setup, setFestival])

  useEffect(() => { scroller.current?.scrollTo(0, 0) }, [phase, showing])

  const finish = useCallback(() => {
    const st = useFestival.getState()
    const s = replay(st.log)
    const sc = score(s)
    const sr = stars(s)
    onComplete({
      game: 'festival',
      cohortCode,
      seed: st.seed,
      stars: { ...sr },
      score: { ...sc },
      evidence: { ...evidence(st.log, s) },
      lessonsSeen: ideasFelt(st.log),
      minaretLit: minaretLit(sr, sc),
      meta: { festival: st.festival, ...(st.demo ? { demo: 'true' } : {}) },
    })
  }, [cohortCode, onComplete])

  const done = () => {
    setup({ seed: newSeed(), festival: useFestival.getState().festival, demo: false })
    onExit()
  }

  return (
    <div ref={scroller} className="absolute inset-0 overflow-y-auto" style={{ background: phase === 'play' ? SKY[day - 1] : PHASE_SKY[phase] }}>
      <Rooftops night={phase === 'play' && day === 3} />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col">
        <header className="sticky top-0 z-40" style={{ background: '#FFF3D6', borderBottom: '3px solid #2B1A17' }}>
          <div className="flex items-center gap-1.5 px-2 pb-1" style={{ paddingTop: 'max(6px, env(safe-area-inset-top))' }}>
            <button type="button" className="ink-chip grid h-12 w-12 shrink-0 place-items-center text-[18px]" aria-label={t('exit')} title={t('exit')} onClick={onExit}>◀</button>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <FestivalBadge id={festival} size={26} />
              <span className="font-sign lang-fit min-w-0 text-[14px] leading-tight">{t('title')}</span>
            </div>
            <LangSwitch />
          </div>
          <Bunting />
        </header>
        <main className="flex-1 px-3 pb-4 pt-2">
          {phase === 'intro' && <Intro />}
          {phase === 'plan' && <Plan />}
          {phase === 'play' && <Play />}
          {phase === 'festival' && <FestivalMorning />}
          {phase === 'report' && <Report onFinish={finish} onContinue={done} />}
        </main>
        <footer className="sticky bottom-0 z-30 mt-auto" style={{ background: 'rgba(255,243,214,.94)', borderTop: '3px solid #2B1A17', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {isDemo && (phase === 'plan' || phase === 'play') && (
            <div className="flex justify-center pt-1.5">
              <button type="button" className="ink-chip font-sign lang-fit min-h-12 px-3 text-[13px]" onClick={skipDemo}>
                <span className="mr-1.5 rounded border-2 border-ink bg-pink px-1 text-[10px] text-jasmine">{t('demo.badge')}</span>⏭ {t('demo.skip')}
              </button>
            </div>
          )}
          <GuardrailFooter />
        </footer>
      </div>
      <BorrowSheet />
      <ToastHost />
    </div>
  )
}
