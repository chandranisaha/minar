import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LOOKS, Toon } from '../art/Toon'
import { TitleCard } from './TitleCard'
import { useGame } from '../store/game'

const COLORS = ['#E5457A', '#F28C28', '#E8B04A', '#5BB5D6', '#FFF3D6', '#D8503A']

function Burst({ x, y, delay, color, size }: { x: number; y: number; delay: number; color: string; size: number }) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: 0, height: 0, animation: `firework 1.4s steps(9) ${delay}s infinite` }}>
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: -3, top: -size, width: 6, height: size * 0.62, background: color, border: '2px solid #2B1A17', borderRadius: 4, transformOrigin: `3px ${size}px`, transform: `rotate(${(360 / 14) * i}deg)` }} />
      ))}
    </div>
  )
}

/** Shown when all four minaret lamps are lit. Stepped fireworks, Nani waves, title card. */
export function Celebration() {
  const { t } = useTranslation()
  const setCelebrated = useGame((s) => s.setCelebrated)
  const [bursts] = useState(() => Array.from({ length: 7 }, (_, i) => ({ x: 8 + ((i * 37) % 84), y: 8 + ((i * 23) % 40), delay: (i % 5) * 0.35, color: COLORS[i % COLORS.length], size: 46 + (i % 3) * 14 })))
  useEffect(() => {
    const el = document.getElementById('celebrate-btn')
    el?.focus()
  }, [])
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(30,42,68,.55)' }} role="dialog" aria-label={t('celebrate.title')}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bursts.map((b, i) => <Burst key={i} {...b} />)}
      </div>
      <div className="relative mx-4 w-full max-w-[460px] anim-pop">
        <TitleCard eyebrow="★ ★ ★" title={t('celebrate.title')}>
          <p className="m-0">{t('celebrate.body')}</p>
          <button id="celebrate-btn" type="button" className="ink-btn pink mt-4" onClick={() => setCelebrated(true)}>
            {t('celebrate.again')}
          </button>
        </TitleCard>
        <div className="pointer-events-none absolute -bottom-24 -left-6 flex items-end sm:-left-24">
          <Toon look={LOOKS.nani} mood="happy" wave x={0} y={0} width={112} height={168} />
          <div className="ink-chip font-sign lang-fit anim-pop mb-24 -ml-2 px-3 py-1 text-[16px]">{t('celebrate.nani')}</div>
        </div>
      </div>
    </div>
  )
}
