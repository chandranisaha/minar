import './i18n'
import { useCallback, useEffect, useRef } from 'react'
import { LangSwitch } from '../../components/Hud'
import type { GameResult } from '../../lib/gameResult'
import { topLessons } from './engine/lessons'
import { evidence, minaretLit, plannerScore, stars } from './engine/score'
import { replay } from './engine/state'
import type { FestivalId } from './engine/types'
import { newSeed, useFestival, useGameState, type Phase } from './state/store'
import { Bazaar } from './ui/Bazaar'
import { DayDiary } from './ui/DayDiary'
import { FestivalMorning } from './ui/FestivalMorning'
import { FestivalBadge, Intro } from './ui/Intro'
import { GuardrailFooter, Rooftops, ToastHost, WalletStrip } from './ui/kit'
import { useFt } from './ui/useFt'
import { Mela } from './ui/Mela'
import { Planner } from './ui/Planner'
import { RaidSheet } from './ui/RaidSheet'
import { Report } from './ui/Report'

export interface FestivalCountdownProps {
  /** omit to keep the game saved on this device; 'DEMO' starts Demo mode */
  seed?: string
  cohortCode: string
  persona?: { festival?: FestivalId }
  onComplete: (r: GameResult) => void
  onExit: () => void
}

const SKY: Record<Phase, string> = {
  intro: 'linear-gradient(#5BB5D6, #FFE3A8 60%, #F2A56B)',
  morning: 'linear-gradient(#9FD4E8, #FFF0C8 60%, #F7C98A)',
  bazaar: 'linear-gradient(#5BB5D6, #FFE3A8 55%, #F2A56B)',
  mela: 'linear-gradient(#1E2A44, #6B3B5A 55%, #D9632E)',
  diary: 'linear-gradient(#121A2E, #1E2A44 60%, #2F3E63)',
  festival: 'linear-gradient(#F7C98A, #FFE3A8 50%, #F28C28)',
  report: 'linear-gradient(#5BB5D6, #FFE3A8 60%, #F2A56B)',
}

function Header({ onExit }: { onExit: () => void }) {
  const { t, festival } = useFt()
  const phase = useFestival((s) => s.phase)
  const day = useFestival((s) => s.day)
  const s = useGameState()
  // the planner shows its own pockets; elsewhere the wallet stays in view
  const money = phase === 'bazaar' || phase === 'mela' || phase === 'diary'
  return (
    <header className="sticky top-0 z-40 flex flex-col gap-1.5 px-2 pb-1.5" style={{ paddingTop: 'max(6px, env(safe-area-inset-top))', background: '#FFF3D6', borderBottom: '3px solid #2B1A17' }}>
      <div className="flex items-center gap-1.5">
        <button type="button" className="ink-chip grid h-12 w-12 shrink-0 place-items-center text-[18px]" aria-label={t('exit')} title={t('exit')} onClick={onExit}>◀</button>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <FestivalBadge id={festival} size={26} />
          <span className="font-sign lang-fit min-w-0 text-[14px] leading-tight">
            {phase === 'intro' || phase === 'report' ? t('title') : phase === 'festival' ? t('phase.festival') : `${t('day', { n: day })} · ${t(`phase.${phase}`)}`}
          </span>
        </div>
        <LangSwitch />
      </div>
      {money && <WalletStrip pockets={s.pockets} />}
    </header>
  )
}

/** Festival Countdown (Pillar 1: Plan & Budget). Screens only emit events; all money logic is in ./engine. */
export default function FestivalCountdown({ seed, cohortCode, persona, onComplete, onExit }: FestivalCountdownProps) {
  const phase = useFestival((s) => s.phase)
  const day = useFestival((s) => s.day)
  const isDemo = useFestival((s) => s.demo)
  const skipDemo = useFestival((s) => s.skipDemo)
  const setup = useFestival((s) => s.setup)
  const { t } = useFt()
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { scroller.current?.scrollTo(0, 0) }, [phase, day])
  const setFestival = useFestival((s) => s.setFestival)

  // a seed from the host (e.g. ?demo) starts that game; otherwise the saved game on this device resumes
  useEffect(() => {
    const st = useFestival.getState()
    if (seed && seed !== st.seed) setup({ seed, festival: seed === 'DEMO' ? 'diwali' : persona?.festival ?? st.festival, demo: seed === 'DEMO' })
    else if (persona?.festival && st.phase === 'intro') setFestival(persona.festival)
  }, [seed, persona?.festival, setup, setFestival])

  const finish = useCallback(() => {
    const st = useFestival.getState()
    const s = replay(st.log)
    const sc = plannerScore(st.log, s)
    const sr = stars(s)
    onComplete({
      game: 'festival',
      cohortCode,
      seed: st.seed,
      stars: { ...sr },
      score: { ...sc },
      evidence: { ...evidence(st.log, s) },
      lessonsSeen: [...new Set([...st.shown, ...topLessons(st.log).map((h) => h.id)])],
      minaretLit: minaretLit(sr, sc),
      meta: { festival: st.festival, ...(st.demo ? { demo: 'true' } : {}) },
    })
  }, [cohortCode, onComplete])

  const done = () => {
    const st = useFestival.getState()
    setup({ seed: newSeed(), festival: st.festival, demo: false })
    onExit()
  }

  return (
    <div ref={scroller} className="absolute inset-0 overflow-y-auto" style={{ background: SKY[phase] }}>
      <Rooftops night={phase === 'mela' || phase === 'diary'} />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col">
        <Header onExit={onExit} />
        <main className="flex-1 px-3 pb-4 pt-1">
          {phase === 'intro' && <Intro />}
          {phase === 'morning' && <Planner key={day} />}
          {phase === 'bazaar' && <Bazaar />}
          {phase === 'mela' && <Mela />}
          {phase === 'diary' && <DayDiary />}
          {phase === 'festival' && <FestivalMorning />}
          {phase === 'report' && <Report onFinish={finish} onContinue={done} />}
        </main>
        <footer className="sticky bottom-0 z-30 mt-auto" style={{ background: 'rgba(255,243,214,.92)', borderTop: '3px solid #2B1A17', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {isDemo && phase !== 'intro' && phase !== 'festival' && phase !== 'report' && (
            <div className="flex justify-center pt-1.5">
              <button type="button" className="ink-chip font-sign lang-fit min-h-12 px-3 text-[13px]" onClick={skipDemo}>
                <span className="mr-1.5 rounded border-2 border-ink bg-pink px-1 text-[10px] text-jasmine">{t('demo.badge')}</span>⏭ {t('demo.skip')}
              </button>
            </div>
          )}
          <GuardrailFooter />
        </footer>
      </div>
      <RaidSheet />
      <ToastHost />
    </div>
  )
}
