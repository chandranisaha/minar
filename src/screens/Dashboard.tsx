import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TitleCard } from '../components/TitleCard'

// TODO(final-ui): stub. The NGO dashboard replaces this.

export default function Dashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-peach p-4">
      <div className="w-full max-w-md">
        <TitleCard title={t('dashboard.title')}>
          <p className="m-0">{t('dashboard.body')}</p>
          <button type="button" className="ink-btn mt-4" onClick={() => nav('/')}>{t('buttons.backToCharminar')}</button>
        </TitleCard>
      </div>
    </div>
  )
}
