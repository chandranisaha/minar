import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PILLARS, SKILLS, type PillarId } from '../content/data'
import { SHOPS } from '../art/Shops'
import { BottomHud, TopHud } from '../components/Hud'
import { TitleCard } from '../components/TitleCard'
import { useIris } from '../components/Iris'
import { useGame } from '../store/game'
import DealBoard from '../games/dealboard/ui/DealBoard'

/** Shared shell the four mini-games plug into: goal bar, title card, back button, rewind stub, recap card. */
function RecapCard() {
  const { t } = useTranslation()
  return (
    <div className="paper w-full max-w-sm p-4 text-left" style={{ transform: 'rotate(-1.2deg)' }}>
      <div className="font-sign lang-fit text-[12px] tracking-[.25em] text-pink">{t('recap.heading')}</div>
      <div className="font-display lang-fit mt-1 text-[22px] leading-tight">{t('recap.sampleTitle')}</div>
      <p className="mb-2 mt-1 text-[14px] leading-snug">{t('recap.sampleBody')}</p>
      <div className="flex flex-wrap gap-1.5">
        {SKILLS.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">{s}</span>
        ))}
      </div>
    </div>
  )
}

export default function Play() {
  const { pillar } = useParams()
  const { t } = useTranslation()
  const iris = useIris()
  const nav = useNavigate()
  const completed = useGame((s) => s.completedPillars)
  const complete = useGame((s) => s.completePillar)
  const p = PILLARS.find((x) => x.id === pillar)
  if (!p) return <Navigate to="/" replace />
  const id: PillarId = p.id
  // pillar 3 is a full game with its own table, header and guardrail banner
  if (id === 'invest') return <DealBoard onExit={() => iris.go('/')} />
  const done = completed.includes(id)
  const Shop = SHOPS[id]
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: 'linear-gradient(#5BB5D6, #FFE3A8 55%, #F2A56B)' }}>
      <TopHud />
      <div className="mx-auto flex min-h-full max-w-xl flex-col items-center gap-4 px-4 pb-44 pt-24">
        <div className="w-full">
          <TitleCard eyebrow={t('play.chapter', { n: p.n })} title={t(`pillars.${id}.name`)}>
            <p className="m-0 font-semibold">{t(`pillars.${id}.game`)}</p>
          </TitleCard>
        </div>
        <div className="w-44 sm:w-56"><Shop react={false} done={done} /></div>
        <div className="paper w-full p-4 text-center">
          <div className="font-sign lang-fit text-[20px]">{t('play.comingSoon')}</div>
          <p className="mb-3 mt-1 text-[14px] leading-snug">{done ? t('play.done') : t('play.comingSoonBody')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {!done && <button type="button" className="ink-btn pink" onClick={() => complete(id)}>{t('buttons.markComplete')}</button>}
            <button type="button" className="ink-btn" disabled title={t('play.rewindNote')} style={{ opacity: 0.6, cursor: 'not-allowed' }}>⟲ {t('buttons.rewind')}</button>
          </div>
        </div>
        <RecapCard />
        <button type="button" className="ink-btn teal" onClick={() => iris.go('/')}>◀ {t('buttons.backToCharminar')}</button>
        <button type="button" className="sr-only" onClick={() => nav('/dashboard')}>{t('dashboard.title')}</button>
      </div>
      <BottomHud replay={false} />
    </div>
  )
}
