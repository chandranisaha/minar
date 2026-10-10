import { useState } from 'react'
import { Toon } from '../../../art/Toon'
import { useLite } from '../../../store/game'
import demo from '../content/demo.json'
import { festivalScene, type Layer } from '../engine/scene'
import { replay } from '../engine/state'
import type { FestivalId, GameEvent } from '../engine/types'
import { useFestival, useGameState } from '../state/store'
import { sceneCaptions } from './captions'
import { FestivalBadge } from './Intro'
import { AMMI, BROTHER_NEW, BROTHER_OLD, FRIENDS } from './looks'
import { useFt } from './useFt'

const get = <K extends Layer['id']>(ls: Layer[], id: K) => ls.find((l) => l.id === id) as Extract<Layer, { id: K }> | undefined

/** The festival-morning room, drawn from the scene layers. Pure: same layers, same picture. */
export function Room({ layers, festival }: { layers: Layer[]; festival: FestivalId }) {
  const lite = useLite()
  const lights = get(layers, 'lights')!.level
  const sweets = get(layers, 'sweets')!.on
  const smallOn = get(layers, 'small')!.on
  const brotherNew = get(layers, 'brother')!.newOutfit
  const gift = get(layers, 'gift')!.on
  const friends = get(layers, 'friends')!.visit
  const teddy = !!get(layers, 'teddy')
  const gullak = get(layers, 'gullak')
  const worried = !!get(layers, 'worried')
  const bulbs = Array.from({ length: 11 }, (_, i) => i)
  return (
    <svg viewBox="0 0 360 280" className="w-full rounded-lg border-4 border-ink" role="img" aria-hidden style={{ background: '#F6D7A7' }}>
      <rect width="360" height="200" fill="#F6D7A7" />
      <rect y="200" width="360" height="80" fill="#C98552" stroke="#2B1A17" strokeWidth="3" />
      {[30, 90, 150, 210, 270, 330].map((x) => <path key={x} d={`M${x} 200 L${x - 20} 280`} stroke="#B97A48" strokeWidth="2" />)}
      {/* window */}
      <rect x="130" y="40" width="70" height="72" fill="#9FD4E8" stroke="#2B1A17" strokeWidth="3" />
      <path d="M165 40 V112 M130 76 H200" stroke="#2B1A17" strokeWidth="2.6" />
      <circle cx="184" cy="58" r="9" fill="#FFD25A" />
      {/* door */}
      <rect x="282" y="72" width="66" height="128" fill="#7A2A22" stroke="#2B1A17" strokeWidth="3" />
      <rect x="290" y="80" width="50" height="120" fill={friends ? '#FFE9B8' : '#5E2018'} stroke="#2B1A17" strokeWidth="2" />
      {smallOn && (
        <g>
          {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={286 + i * 7.5} cy={78 + Math.sin((i / 8) * Math.PI) * 10} r="4.2" fill={i % 2 ? '#F28C28' : '#E8B04A'} stroke="#2B1A17" strokeWidth="1.4" />)}
          <g transform="translate(180 246)">
            {[0, 45, 90, 135].map((a) => <ellipse key={a} rx="26" ry="9" fill={a % 90 ? '#E5457A' : '#5BB5D6'} stroke="#2B1A17" strokeWidth="1.6" transform={`rotate(${a})`} opacity=".9" />)}
            <circle r="9" fill="#E8B04A" stroke="#2B1A17" strokeWidth="1.8" />
          </g>
        </g>
      )}
      {/* festival motif, lit by the decor */}
      {lights !== 'dark' && (
        <g>
          <rect x="206" y="100" width="72" height="7" fill="#7A2A22" stroke="#2B1A17" strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${209 + i * 22} 76)`} opacity={lights === 'half' && i === 1 ? 0.45 : 1}>
              <FestivalBadge id={festival} size={24} />
            </g>
          ))}
        </g>
      )}
      {/* light strand */}
      <path d="M0 18 Q180 46 360 18" fill="none" stroke="#2B1A17" strokeWidth="2" />
      {bulbs.map((i) => {
        const x = 12 + i * 33.6
        const y = 18 + Math.sin((x / 360) * Math.PI) * 24 + 6
        const on = lights === 'full' || (lights === 'half' && i % 2 === 0)
        return (
          <g key={i}>
            {on && <circle cx={x} cy={y} r="9" fill="#FFD25A" opacity=".45" className={lite ? undefined : 'anim-twinkle'} />}
            <ellipse cx={x} cy={y} rx="4" ry="5.5" fill={on ? '#FFD25A' : '#8C7B6E'} stroke="#2B1A17" strokeWidth="1.6" />
          </g>
        )
      })}
      {/* table and plate */}
      <rect x="112" y="178" width="100" height="10" fill="#7A2A22" stroke="#2B1A17" strokeWidth="2.4" />
      <path d="M120 188 V226 M204 188 V226" stroke="#2B1A17" strokeWidth="4" />
      <ellipse cx="162" cy="176" rx="30" ry="7" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="2.4" />
      {sweets && [[-14, 0], [0, -2], [14, 0], [-7, -8], [7, -8], [0, -14]].map(([dx, dy], i) => (
        <circle key={i} cx={162 + dx} cy={170 + dy} r="6" fill={i % 2 ? '#F28C28' : '#E8B04A'} stroke="#2B1A17" strokeWidth="1.6" />
      ))}
      {/* Ammi, with the gift if there is one */}
      <Toon look={AMMI} mood="happy" x={20} y={104} width={72} height={108} armsUp={gift} />
      {gift && (
        <g transform="translate(78 150)">
          <rect width="28" height="22" fill="#5BB5D6" stroke="#2B1A17" strokeWidth="2.4" />
          <path d="M-2 -6 L30 -12" stroke="#2B1A17" strokeWidth="2.4" />
          <path d="M14 0 V22" stroke="#E5457A" strokeWidth="4" />
          <path d="M6 -14 l2 -6 M14 -18 v-6 M22 -16 l3 -5" stroke="#D9A520" strokeWidth="2.4" strokeLinecap="round" className={lite ? undefined : 'anim-twinkle'} />
        </g>
      )}
      {worried && (
        <g>
          <ellipse cx="96" cy="94" rx="18" ry="12" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="2" />
          <text x="96" y="100" textAnchor="middle" fontSize="16" fontWeight="900" fill="#2B1A17">🚶</text>
        </g>
      )}
      {/* brother */}
      <Toon look={brotherNew ? BROTHER_NEW : BROTHER_OLD} mood={brotherNew ? 'happy' : 'worried'} x={212} y={126} width={60} height={90} />
      {/* friends at the door, or a phone buzz */}
      {friends ? (
        FRIENDS.map((l, i) => <Toon key={i} look={l} mood="happy" wave={i === 1} x={284 + i * 18} y={128 + (i % 2) * 6} width={40} height={60} />)
      ) : (
        <g transform="translate(186 150)">
          <rect width="14" height="22" rx="3" fill="#1E2A44" stroke="#2B1A17" strokeWidth="2" transform="rotate(12 7 11)" />
          <path d="M-6 4 l-4 -3 M-6 12 h-5 M20 4 l4 -3 M20 12 h5" stroke="#2B1A17" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {teddy && (
        <g transform="translate(300 214)">
          <circle cx="20" cy="40" r="22" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.6" />
          <circle cx="20" cy="12" r="15" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.6" />
          <circle cx="8" cy="0" r="6" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.2" />
          <circle cx="32" cy="0" r="6" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.2" />
          <circle cx="15" cy="11" r="2" fill="#2B1A17" /><circle cx="25" cy="11" r="2" fill="#2B1A17" />
          <path d="M16 18 Q20 21 24 18" fill="none" stroke="#2B1A17" strokeWidth="1.8" />
          <path d="M10 30 Q20 36 30 30" fill="none" stroke="#E5457A" strokeWidth="4" />
        </g>
      )}
      {gullak && (
        <g transform="translate(240 222)">
          <path d="M4 18 Q0 4 18 2 Q36 4 32 18 Q34 36 18 36 Q2 36 4 18Z" fill="#D9632E" stroke="#2B1A17" strokeWidth="2.4" />
          <path d="M12 6 H24" stroke="#2B1A17" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="-4" r="5" fill="#F0C24A" stroke="#2B1A17" strokeWidth="1.6" className={lite ? undefined : 'anim-bob-sm'} />
        </g>
      )}
      {lights !== 'full' && <rect width="360" height="280" fill="#1E2A44" opacity={lights === 'dark' ? 0.42 : 0.18} pointerEvents="none" />}
    </svg>
  )
}

function Captions({ layers }: { layers: Layer[] }) {
  const { t, money, itemName } = useFt()
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[14px] font-bold">
      {sceneCaptions(layers, t, money, itemName).map((c, i) => (
        <li key={i} className="flex gap-2"><span aria-hidden>{c.icon}</span><span>{c.good === false ? '✕ ' : c.good ? '✓ ' : ''}{c.text}</span></li>
      ))}
    </ul>
  )
}

export function FestivalMorning() {
  const { t } = useFt()
  const s = useGameState()
  const festival = useFestival((x) => x.festival)
  const isDemo = useFestival((x) => x.demo)
  const toReport = useFestival((x) => x.toReport)
  const [other, setOther] = useState(false)
  const layers = festivalScene(s)
  const otherLayers = festivalScene(replay(demo.impulsive.log as GameEvent[]))
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display lang-fit m-0 text-center text-[26px]" style={{ textShadow: '2px 3px 0 #FFF3D6' }}>
        {t('scene.title')}
      </h1>
      <div className={other ? 'grid grid-cols-1 gap-3 min-[560px]:grid-cols-2' : ''}>
        <figure className="paper m-0 flex flex-col gap-2 p-2.5">
          {other && <figcaption className="font-sign lang-fit text-[14px]">{t('scene.yourPlan')}</figcaption>}
          <Room layers={layers} festival={festival} />
          <Captions layers={layers} />
        </figure>
        {other && (
          <figure className="paper m-0 flex flex-col gap-2 p-2.5">
            <figcaption className="font-sign lang-fit text-[14px]">{t('scene.impulsivePlan')}</figcaption>
            <Room layers={otherLayers} festival={festival} />
            <Captions layers={otherLayers} />
          </figure>
        )}
      </div>
      {isDemo && (
        <button type="button" className="ink-btn teal self-center" aria-pressed={other} onClick={() => setOther(!other)}>
          {other ? t('scene.hideOther') : t('scene.otherPlan')}
        </button>
      )}
      <button type="button" className="ink-btn pink self-center" onClick={toReport}>{t('scene.continue')} ▶</button>
    </div>
  )
}
