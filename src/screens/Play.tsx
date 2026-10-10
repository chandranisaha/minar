import { lazy, Suspense } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PILLARS, SKILLS, type PillarId } from '../content/data'
import { TopHud } from '../components/Hud'
import { TitleCard } from '../components/TitleCard'
import { useGame } from '../store/game'

// Pillar 4 (Stay Financially Safe) lives in src/pillar4 and is loaded only when its doorway is entered.
const Pillar4 = lazy(() => import('../pillar4/Pillar4'))

/** Simple line icons, no text: bangle, chai cup, pearl, phone. */
function PillarIcon({ id }: { id: PillarId }) {
  const p = { fill: 'none', stroke: '#3A2A24', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 64 64" width="84" height="84" aria-hidden>
      {id === 'plan' && (<g {...p}><ellipse cx="32" cy="34" rx="18" ry="22" fill="#E8AB3A" /><ellipse cx="32" cy="34" rx="11" ry="15" fill="#FBF0D2" /><path d="M20 22 q12 -8 24 0" /></g>)}
      {id === 'save' && (<g {...p}><path d="M14 26 H46 L42 50 H18Z" fill="#FBF0D2" /><path d="M46 30 q10 0 8 8 q-2 6 -10 6" /><path d="M24 20 q-4 -6 0 -10 M32 20 q-4 -6 0 -10 M40 20 q-4 -6 0 -10" /></g>)}
      {id === 'invest' && (<g {...p}><circle cx="32" cy="34" r="17" fill="#FBF6EA" /><path d="M24 26 q4 -5 10 -3" /><path d="M14 54 H50" /></g>)}
      {id === 'safe' && (<g {...p}><rect x="20" y="8" width="24" height="48" rx="5" fill="#FBF0D2" /><path d="M28 14 H36" /><circle cx="32" cy="46" r="2.4" /><path d="M32 22 V36" stroke="#D9573F" strokeWidth="4.4" /><circle cx="32" cy="40.5" r="1.8" fill="#D9573F" stroke="#D9573F" /></g>)}
    </svg>
  )
}

function RecapCard() {
  const { t } = useTranslation()
  return (
    <div className="paper w-full p-4 text-left">
      <div className="text-[11px] font-bold uppercase tracking-[.2em] text-coral">{t('recap.heading')}</div>
      <div className="font-display lang-fit mt-1 text-[21px] leading-tight">{t('recap.sampleTitle')}</div>
      <p className="mb-2 mt-1 text-[14px] leading-snug">{t('recap.sampleBody')}</p>
      <div className="flex flex-wrap gap-1.5">
        {SKILLS.slice(0, 3).map((s) => <span key={s} className="rounded-full border border-ink bg-[#F2DFB0] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">{s}</span>)}
      </div>
    </div>
  )
}

/** Shared shell the four mini-games plug into: goal pill, title card, back button, rewind stub, recap card. */
export default function Play() {
  const { pillar } = useParams()
  const { t } = useTranslation()
  const nav = useNavigate()
  const completed = useGame((s) => s.completedPillars)
  const complete = useGame((s) => s.completePillar)
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona)
  const gender = useGame((s) => s.gender)
  const setLanguage = useGame((s) => s.setLanguage)
  const p = PILLARS.find((x) => x.id === pillar)
  if (!p) return <Navigate to="/" replace />
  if (p.id === 'safe') return <Suspense fallback={null}><Pillar4 language={lang} setLanguage={setLanguage} avatarSrc={persona ? `/art/avatar/${gender}-${persona}-face.webp` : undefined} onExit={() => nav('/')} onComplete={() => complete('safe')} /></Suspense>
  const id: PillarId = p.id
  const done = completed.includes(id)
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: 'linear-gradient(#92C9D3, #F8EBCB 60%)' }}>
      <TopHud replay={false} />
      <div className="mx-auto flex min-h-full max-w-xl flex-col items-center gap-4 px-4 pb-16 pt-24">
        <div className="w-full">
          <TitleCard eyebrow={t('play.chapter', { n: p.n })} title={t(`pillars.${id}.name`)}>
            <p className="m-0 font-semibold">{t(`pillars.${id}.game`)}</p>
          </TitleCard>
        </div>
        <PillarIcon id={id} />
        <div className="paper w-full p-4 text-center">
          <div className="font-display lang-fit text-[20px]">{t('play.comingSoon')}</div>
          <p className="mb-3 mt-1 text-[14px] leading-snug">{done ? t('play.done') : t('play.comingSoonBody')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {!done && <button type="button" className="ink-btn" onClick={() => complete(id)}>{t('buttons.markComplete')}</button>}
            <button type="button" className="ink-btn cream" disabled title={t('play.rewindNote')}>⟲ {t('buttons.rewind')}</button>
          </div>
        </div>
        <RecapCard />
        <button type="button" className="ink-btn cream" onClick={() => nav('/')}>◂ {t('buttons.backToCharminar')}</button>
      </div>
    </div>
  )
}
