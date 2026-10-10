import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Overworld } from '../world/Overworld'
import { BottomHud, TopHud } from '../components/Hud'
import { Celebration } from '../components/Celebration'
import { useGame } from '../store/game'

export default function Landing() {
  const { t } = useTranslation()
  const storySeen = useGame((s) => s.storySeen)
  const done = useGame((s) => s.completedPillars.length)
  const celebrated = useGame((s) => s.celebrated)
  const [hint, setHint] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setHint(false), 9000)
    const off = () => setHint(false)
    window.addEventListener('pointerdown', off, { once: true })
    window.addEventListener('keydown', off, { once: true })
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', off)
    }
  }, [])
  if (!storySeen) return <Navigate to="/story" replace />
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Overworld />
      <TopHud />
      {hint && (
        <div className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3" style={{ top: 76 }}>
          <div className="ink-chip font-sign lang-fit anim-pop px-3 py-1.5 text-center text-[13px]">
            <span className="sm:hidden">{t('hud.walkHint')}</span>
            <span className="hidden sm:inline">{t('hud.keysHint')}</span>
          </div>
        </div>
      )}
      <BottomHud />
      {done >= 4 && !celebrated && <Celebration />}
    </div>
  )
}
