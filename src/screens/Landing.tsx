import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IslandMap } from '../island/IslandMap'
import { TopHud } from '../components/Hud'
import { useGame } from '../store/game'

export default function Landing() {
  const { t } = useTranslation()
  const storySeen = useGame((s) => s.storySeen)
  const [hint, setHint] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setHint(false), 8000)
    const off = () => setHint(false)
    window.addEventListener('pointerdown', off, { once: true })
    return () => { window.clearTimeout(id); window.removeEventListener('pointerdown', off) }
  }, [])
  if (!storySeen) return <Navigate to="/story" replace />
  return (
    <div className="absolute inset-0 overflow-hidden">
      <IslandMap />
      <TopHud />
      {hint && (
        <div className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3" style={{ top: 68 }}>
          <div className="ink-chip rise px-3 py-1.5 text-center text-[13px] font-bold">{t('hud.walkHint')}</div>
        </div>
      )}
    </div>
  )
}
