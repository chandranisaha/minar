import { Toon } from '../../../art/Toon'
import { useLite } from '../../../store/game'
import type { Scene } from '../engine/scene'
import type { FestivalId } from '../engine/types'
import { FestivalBadge } from './kit'
import { AMMI, BROTHER_NEW, BROTHER_OLD, FRIEND_LOOK } from './looks'

/** A CSS animation's transform replaces an SVG transform attribute, so pop-ins sit in a group inside the positioned one. */
const POP = { transformBox: 'fill-box', transformOrigin: 'center' } as const

/**
 * The family room. It fills in live as the player shops (sweets on the plate, lights, the new outfit, the gift),
 * and on festival morning it is the first result the player reads. Same scene in, same picture out.
 */
export function Room({ scene, festival, compact = false }: { scene: Scene; festival: FestivalId; compact?: boolean }) {
  const lite = useLite()
  const twinkle = lite ? undefined : 'anim-twinkle'
  const bulbs = Array.from({ length: 11 }, (_, i) => i)
  // friends drop by on festival morning; while shopping, the friendship meter shows how they feel
  const friendsHere = scene.friends && !compact
  return (
    <svg viewBox={compact ? '0 12 360 200' : '0 0 360 280'} className="block w-full" role="img" aria-hidden style={{ background: '#F6D7A7' }}>
      <rect width="360" height="200" fill="#F6D7A7" />
      <rect y="200" width="360" height="80" fill="#C98552" stroke="#2B1A17" strokeWidth="3" />
      {[30, 90, 150, 210, 270, 330].map((x) => <path key={x} d={`M${x} 200 L${x - 20} 280`} stroke="#B97A48" strokeWidth="2" />)}
      {/* window */}
      <rect x="130" y="40" width="70" height="72" fill="#9FD4E8" stroke="#2B1A17" strokeWidth="3" />
      <path d="M165 40 V112 M130 76 H200" stroke="#2B1A17" strokeWidth="2.6" />
      <circle cx="184" cy="58" r="9" fill="#FFD25A" />
      {/* door */}
      <rect x="282" y="72" width="66" height="128" fill="#7A2A22" stroke="#2B1A17" strokeWidth="3" />
      <rect x="290" y="80" width="50" height="120" fill={friendsHere ? '#FFE9B8' : '#5E2018'} stroke="#2B1A17" strokeWidth="2" />
      {/* marigold garland: festive once the lights are up */}
      {scene.lights !== 'dark' && Array.from({ length: 9 }, (_, i) => <circle key={i} cx={286 + i * 7.5} cy={78 + Math.sin((i / 8) * Math.PI) * 10} r="4.2" fill={i % 2 ? '#F28C28' : '#E8B04A'} stroke="#2B1A17" strokeWidth="1.4" />)}
      {/* festival motif on a shelf, lit by the decor */}
      {scene.lights !== 'dark' && (
        <g className="anim-pop" style={{ transformOrigin: '242px 100px' }}>
          <rect x="206" y="100" width="72" height="7" fill="#7A2A22" stroke="#2B1A17" strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${209 + i * 22} 76)`} opacity={scene.lights === 'half' && i === 1 ? 0.4 : 1}>
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
        const on = scene.lights === 'full' || (scene.lights === 'half' && i % 2 === 0)
        return (
          <g key={i}>
            {on && <circle cx={x} cy={y} r="9" fill="#FFD25A" opacity=".45" className={twinkle} />}
            <ellipse cx={x} cy={y} rx="4" ry="5.5" fill={on ? '#FFD25A' : '#8C7B6E'} stroke="#2B1A17" strokeWidth="1.6" />
          </g>
        )
      })}
      {/* table and plate */}
      <rect x="112" y="178" width="100" height="10" fill="#7A2A22" stroke="#2B1A17" strokeWidth="2.4" />
      <path d="M120 188 V226 M204 188 V226" stroke="#2B1A17" strokeWidth="4" />
      <ellipse cx="162" cy="176" rx="30" ry="7" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="2.4" />
      {scene.sweets && (
        <g className="anim-pop" style={{ transformOrigin: '162px 172px' }}>
          {[[-14, 0], [0, -2], [14, 0], [-7, -8], [7, -8], [0, -14]].map(([dx, dy], i) => (
            <circle key={i} cx={162 + dx} cy={170 + dy} r="6" fill={i % 2 ? '#F28C28' : '#E8B04A'} stroke="#2B1A17" strokeWidth="1.6" />
          ))}
        </g>
      )}
      {/* Ammi; arms up with the gift when there is one */}
      <Toon look={AMMI} mood="happy" x={20} y={104} width={72} height={108} armsUp={scene.gift} />
      {scene.gift && (
        <g transform="translate(78 150)">
          <g className="anim-pop" style={POP}>
            <rect width="28" height="22" fill="#5BB5D6" stroke="#2B1A17" strokeWidth="2.4" />
            <path d="M-2 -6 L30 -12" stroke="#2B1A17" strokeWidth="2.4" />
            <path d="M14 0 V22" stroke="#E5457A" strokeWidth="4" />
            <path d="M6 -14 l2 -6 M14 -18 v-6 M22 -16 l3 -5" stroke="#D9A520" strokeWidth="2.4" strokeLinecap="round" className={twinkle} />
          </g>
        </g>
      )}
      {/* brother: new outfit, old clothes, or a torn cheap one */}
      <Toon look={scene.brother === 'new' ? BROTHER_NEW : BROTHER_OLD} mood={scene.brother === 'new' ? 'happy' : 'worried'} x={212} y={126} width={60} height={90} />
      {scene.brother === 'torn' && <path d="M236 172 l4 6 -4 5 5 6" fill="none" stroke="#2B1A17" strokeWidth="2.4" strokeLinecap="round" />}
      {/* friends at the door */}
      {friendsHere && (['arjun', 'ayesha', 'sunny'] as const).map((f, i) => <Toon key={f} look={FRIEND_LOOK[f]} mood="happy" wave={i === 1} x={284 + i * 18} y={128 + (i % 2) * 6} width={40} height={60} />)}
      {scene.teddy && (
        <g transform="translate(300 214)">
          <g className="anim-pop" style={POP}>
            <circle cx="20" cy="40" r="22" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.6" />
            <circle cx="20" cy="12" r="15" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.6" />
            <circle cx="8" cy="0" r="6" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.2" />
            <circle cx="32" cy="0" r="6" fill="#B97A48" stroke="#2B1A17" strokeWidth="2.2" />
            <circle cx="15" cy="11" r="2" fill="#2B1A17" /><circle cx="25" cy="11" r="2" fill="#2B1A17" />
            <path d="M10 30 Q20 36 30 30" fill="none" stroke="#E5457A" strokeWidth="4" />
          </g>
        </g>
      )}
      {scene.gullak > 0 && (
        <g transform="translate(240 222)">
          <g className="anim-pop" style={POP}>
            <path d="M4 18 Q0 4 18 2 Q36 4 32 18 Q34 36 18 36 Q2 36 4 18Z" fill="#D9632E" stroke="#2B1A17" strokeWidth="2.4" />
            <path d="M12 6 H24" stroke="#2B1A17" strokeWidth="3" strokeLinecap="round" />
            <circle cx="30" cy="-4" r="5" fill="#F0C24A" stroke="#2B1A17" strokeWidth="1.6" />
          </g>
        </g>
      )}
      {scene.lights !== 'full' && <rect width="360" height="280" fill="#1E2A44" opacity={scene.lights === 'dark' ? 0.38 : 0.16} pointerEvents="none" />}
    </svg>
  )
}
