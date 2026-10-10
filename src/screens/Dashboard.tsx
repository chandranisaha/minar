import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TitleCard } from '../components/TitleCard'
import { GoalBar } from '../components/Hud'
import { useArtReady } from '../art/ArtSlot'

/** Goal screen: reached through the college gate once all four lessons are done. */
export default function Dashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const open = useArtReady('gate-open')
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-4" style={{ background: 'linear-gradient(#92C9D3, #F8EBCB 70%)' }}>
      {open && <img src="/art/gate-open.webp" alt="" draggable={false} className="rise w-[min(70vw,360px)]" style={{ filter: 'drop-shadow(0 10px 16px rgba(58,42,36,.28))' }} />}
      <div className="w-full max-w-md">
        <TitleCard title={t('dashboard.title')}>
          <p className="m-0">{t('dashboard.body')}</p>
          <div className="mt-3 flex justify-center"><GoalBar /></div>
          <button type="button" className="ink-btn mt-4" onClick={() => nav('/')}>{t('buttons.backToCharminar')}</button>
        </TitleCard>
      </div>
    </div>
  )
}
