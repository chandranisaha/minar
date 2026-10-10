import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Overworld } from '../world/Overworld'
import { BottomHud, TopHud } from '../components/Hud'
import { Celebration } from '../components/Celebration'
import { Joystick } from '../components/Joystick'
import { useGame } from '../store/game'
import { useFirstHint } from './useFirstHint'
import { ONBOARDING } from '../features/onboarding/config'

export default function Landing() {
  const { t } = useTranslation()
  const storySeen = useGame((s) => s.storySeen)
  const done = useGame((s) => s.completedPillars.length)
  const celebrated = useGame((s) => s.celebrated)
  const hint = useFirstHint()
  if (!storySeen) {
    if (ONBOARDING.useWireframe) return <Navigate to="/welcome" replace />
    return <Navigate to="/story" replace />
  }
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Overworld />
      <TopHud />
      {hint && done < 4 && (
        <div className="pointer-events-none absolute inset-x-0 z-[var(--z-scene)] flex justify-center px-3" style={{ top: 76 }}>
          <div className="ink-chip font-sign lang-fit anim-pop px-3 py-1.5 text-center text-[13px]">
            <span className="[@media(pointer:coarse)]:inline hidden max-[699px]:inline">{t('hud.walkHint')}</span>
            <span className="[@media(pointer:coarse)]:hidden min-[700px]:inline max-[699px]:hidden">{t('hud.keysHint')}</span>
          </div>
        </div>
      )}
      <Joystick />
      <BottomHud />
      {done >= 4 && !celebrated && <Celebration />}
    </div>
  )
}
