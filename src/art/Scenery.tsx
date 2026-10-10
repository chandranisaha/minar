import { memo, useId } from 'react'
import { C } from './palette'
import { useLite } from '../store/game'

const INK = C.ink
const SW = 3.2

export const WORLD = { w: 1000, h: 1400 }

/* ------------------------------------------------------------------ pieces */

export function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 40 Q-4 18 22 20 Q30 -6 58 6 Q78 -8 94 12 Q122 8 120 34 Q124 46 108 48 H12 Q-2 48 0 40Z" fill={C.jasmine} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M8 40 Q40 52 112 40 V48 H12Z" fill="#F5B7B1" opacity=".8" />
    </g>
  )
}

interface FacadeProps { x: number; base: number; w: number; h: number; wall: string; shade: string; shutter: string; roof?: 'tile' | 'flat'; laundry?: boolean; ac?: boolean; arch?: boolean }
export function Facade({ x, base, w, h, wall, shade, shutter, roof = 'tile', laundry, ac, arch }: FacadeProps) {
  const top = base - h
  const cols = Math.max(1, Math.floor(w / 58))
  const rows = Math.max(1, Math.floor((h - 30) / 72))
  const cw = w / cols
  const win: React.ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + c * cw + cw / 2
      const wy = top + 34 + r * 72
      const isArch = arch && (r + c) % 2 === 0
      win.push(
        <g key={`${r}-${c}`}>
          <rect x={wx - 17} y={wy - 4} width={34} height={50} fill={C.jasmine} stroke={INK} strokeWidth={2.6} />
          {isArch ? <path d={`M${wx - 12} ${wy + 42} V${wy + 14} Q${wx} ${wy - 2} ${wx + 12} ${wy + 14} V${wy + 42}Z`} fill={C.dusk} /> : <rect x={wx - 12} y={wy + 2} width={24} height={40} fill={C.dusk} />}
          <rect x={wx - 24} y={wy - 2} width={11} height={46} fill={shutter} stroke={INK} strokeWidth={2.2} />
          <rect x={wx + 13} y={wy - 2} width={11} height={46} fill={shutter} stroke={INK} strokeWidth={2.2} />
          <path d={`M${wx - 22} ${wy + 6} h7 M${wx - 22} ${wy + 14} h7 M${wx - 22} ${wy + 22} h7 M${wx + 15} ${wy + 6} h7 M${wx + 15} ${wy + 14} h7 M${wx + 15} ${wy + 22} h7`} stroke={INK} strokeWidth={1.2} opacity=".6" />
          <rect x={wx - 20} y={wy + 46} width={40} height={6} fill={C.jasmine} stroke={INK} strokeWidth={2} />
        </g>,
      )
    }
  }
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill={wall} stroke={INK} strokeWidth={SW} />
      <rect x={x} y={top} width={w * 0.22} height={h} fill={shade} opacity=".5" />
      <path d={`M${x + w * 0.55} ${top + h * 0.35} q18 -10 30 4 q4 14 -12 18 q-18 0 -18 -22z`} fill="#F7E3C0" opacity=".55" />
      {win}
      {roof === 'tile' ? (
        <g>
          <path d={`M${x - 6} ${top} L${x + 8} ${top - 26} H${x + w - 8} L${x + w + 6} ${top}Z`} fill={C.terracotta} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d={`M${x + 2} ${top - 9} H${x + w - 2} M${x + 6} ${top - 18} H${x + w - 6}`} stroke={C.coral} strokeWidth={2.4} />
        </g>
      ) : (
        <g>
          <rect x={x - 3} y={top - 12} width={w + 6} height={14} fill={wall} stroke={INK} strokeWidth={SW} />
          <rect x={x - 3} y={top - 12} width={(w + 6) * 0.3} height={14} fill={shade} opacity=".5" />
        </g>
      )}
      {ac && (
        <g>
          <rect x={x + w - 52} y={top + h * 0.45} width={40} height={24} rx={3} fill="#E9E5DA" stroke={INK} strokeWidth={2.4} />
          <path d={`M${x + w - 46} ${top + h * 0.45 + 8} h28 M${x + w - 46} ${top + h * 0.45 + 15} h28`} stroke={INK} strokeWidth={1.6} />
        </g>
      )}
      {laundry && (
        <g className="anim-sway" style={{ transformOrigin: `${x + w / 2}px ${top + 60}px`, transformBox: 'view-box' }}>
          <path d={`M${x + 8} ${top + 60} Q${x + w / 2} ${top + 72} ${x + w - 8} ${top + 60}`} stroke={INK} strokeWidth={2} fill="none" />
          <path d={`M${x + 22} ${top + 63} v34 h20 v-34z`} fill={C.pink} stroke={INK} strokeWidth={2.2} />
          <path d={`M${x + 56} ${top + 66} v40 h24 v-40z`} fill={C.jasmine} stroke={INK} strokeWidth={2.2} />
          <path d={`M${x + 56} ${top + 76} h24 M${x + 56} ${top + 84} h24`} stroke={C.marigold} strokeWidth={3} />
        </g>
      )}
    </g>
  )
}

/** side-street wall segment (flush against the lane edges) */
function WallSegment({ x, y, w = 92, h = 250, wall, shade, shutter, flip }: { x: number; y: number; w?: number; h?: number; wall: string; shade: string; shutter: string; flip?: boolean }) {
  const dir = flip ? -1 : 1
  const ex = flip ? x : x + w // lane-facing edge
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={wall} stroke={INK} strokeWidth={SW} />
      <rect x={x} y={y} width={w} height={26} fill={shade} opacity=".5" />
      {/* windows */}
      {[24, 98].map((dy) => (
        <g key={dy}>
          <rect x={ex - dir * 52 - 15} y={y + dy} width={30} height={46} fill={C.jasmine} stroke={INK} strokeWidth={2.4} />
          <rect x={ex - dir * 52 - 11} y={y + dy + 5} width={22} height={36} fill={C.dusk} />
          <rect x={ex - dir * 52 - 25} y={y + dy} width={10} height={46} fill={shutter} stroke={INK} strokeWidth={2} />
          <rect x={ex - dir * 52 + 15} y={y + dy} width={10} height={46} fill={shutter} stroke={INK} strokeWidth={2} />
        </g>
      ))}
      {/* balcony */}
      <rect x={flip ? ex : ex - 38} y={y + 160} width={38} height={10} fill={C.jasmine} stroke={INK} strokeWidth={2.4} />
      <path d={`M${flip ? ex + 4 : ex - 34} ${y + 160} v-18 M${flip ? ex + 19 : ex - 19} ${y + 160} v-18 M${flip ? ex + 34 : ex - 4} ${y + 160} v-18`} stroke={INK} strokeWidth={2.4} />
      <path d={`M${flip ? ex : ex - 38} ${y + 142} h38`} stroke={INK} strokeWidth={3} />
      {/* door + awning */}
      <rect x={ex - dir * 44 - 15} y={y + h - 62} width={30} height={62} fill="#7A2A22" stroke={INK} strokeWidth={2.6} />
      <path d={`M${ex - dir * 44 - 24} ${y + h - 62} h48 l-4 -14 h-40z`} fill={C.mustard} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
    </g>
  )
}

/* ------------------------------------------------------------------ the static world backdrop */

export const WorldBackdrop = memo(function WorldBackdrop({ skyline = false }: { skyline?: boolean }) {
  const id = useId().replace(/:/g, '')
  const lite = useLite()
  return (
    <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} width={WORLD.w} height={WORLD.h} style={{ display: 'block', position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4FA9CF" />
          <stop offset=".38" stopColor="#8FD0DA" />
          <stop offset=".7" stopColor="#FFE3A8" />
          <stop offset="1" stopColor="#F9A94C" />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0" stopColor="#FFF1B0" stopOpacity=".95" />
          <stop offset=".5" stopColor="#FFD27A" stopOpacity=".55" />
          <stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9B078" />
          <stop offset=".55" stopColor="#D49A62" />
          <stop offset="1" stopColor="#B27442" />
        </linearGradient>
        <pattern id={`${id}-cob`} width="84" height="58" patternUnits="userSpaceOnUse">
          <rect width="84" height="58" fill="none" />
          <rect x="3" y="3" width="36" height="24" rx="7" fill="#E4B27C" stroke="#A8693A" strokeWidth="2.2" />
          <rect x="43" y="4" width="36" height="22" rx="7" fill="#D69E68" stroke="#A8693A" strokeWidth="2.2" />
          <rect x="-16" y="31" width="36" height="24" rx="7" fill="#D69E68" stroke="#A8693A" strokeWidth="2.2" />
          <rect x="24" y="30" width="36" height="25" rx="7" fill="#EBBB87" stroke="#A8693A" strokeWidth="2.2" />
          <rect x="64" y="31" width="36" height="24" rx="7" fill="#D3995F" stroke="#A8693A" strokeWidth="2.2" />
        </pattern>
        <radialGradient id={`${id}-plaza`}>
          <stop offset="0" stopColor="#FFE9B8" stopOpacity=".7" />
          <stop offset="1" stopColor="#FFE9B8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK} stopOpacity="0" />
          <stop offset="1" stopColor={INK} stopOpacity=".55" />
        </linearGradient>
        {!lite && (
          <filter id={`${id}-paint`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="8" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
          </filter>
        )}
      </defs>

      {/* sky + golden hour sun */}
      <rect x="-420" width="1840" height="600" fill={`url(#${id}-sky)`} />
      <circle cx="500" cy="360" r="260" fill={`url(#${id}-sun)`} />
      <circle cx="500" cy="360" r="86" fill="#FFF1B0" opacity=".85" />
      {skyline ? (
        <image href="/art/bg-skyline.webp" x="-200" y="150" width="1400" height="451" preserveAspectRatio="none" />
      ) : (
        <>
          <Cloud x={70} y={90} s={1.2} />
          <Cloud x={690} y={60} s={1.5} />
          <Cloud x={380} y={150} s={0.9} />
          <Cloud x={850} y={210} s={0.8} />
        </>
      )}

      {/* far skyline: domes, minarets, hills (procedural fallback) */}
      <g opacity=".85" display={skyline ? 'none' : undefined}>
        <path d="M0 440 Q90 400 180 430 Q260 410 330 440 V560 H0Z" fill="#9CC9C6" />
        <path d="M660 440 Q760 395 850 430 Q930 410 1000 436 V560 H660Z" fill="#9CC9C6" />
      </g>
      <g fill="#7FB0AE" stroke={INK} strokeWidth="2" strokeOpacity=".5" display={skyline ? 'none' : undefined}>
        <path d="M60 520 V450 Q60 420 90 420 Q120 420 120 450 V520Z" />
        <rect x="84" y="380" width="12" height="44" />
        <circle cx="90" cy="374" r="7" />
        <path d="M840 520 V440 Q840 405 875 405 Q910 405 910 440 V520Z" />
        <rect x="869" y="360" width="12" height="48" />
        <circle cx="875" cy="354" r="7" />
        <path d="M180 520 V470 H250 V520Z M200 470 Q215 440 232 470Z" />
        <path d="M730 520 V478 H800 V520Z M748 478 Q764 450 782 478Z" />
      </g>

      {/* back row of buildings behind the monument */}
      <g filter={lite ? undefined : `url(#${id}-paint)`}>
        <Facade x={-20} base={600} w={160} h={190} wall="#F2A56B" shade="#D9743F" shutter={C.sage} laundry ac />
        <Facade x={130} base={600} w={140} h={150} wall="#F7D18A" shade="#D6A04A" shutter={C.teal} roof="flat" />
        <Facade x={730} base={600} w={140} h={165} wall="#8FC9C4" shade="#5E9D9B" shutter={C.coral} />
        <Facade x={860} base={600} w={160} h={200} wall="#F0907A" shade="#C65A47" shutter={C.sage} arch laundry />
        <Facade x={-190} base={600} w={160} h={170} wall="#F7D18A" shade="#D6A04A" shutter={C.coral} roof="flat" />
        <Facade x={1010} base={600} w={160} h={180} wall="#F2A56B" shade="#D9743F" shutter={C.teal} ac />
        <Facade x={-330} base={600} w={150} h={200} wall="#8FC9C4" shade="#5E9D9B" shutter={C.sage} />
        <Facade x={1160} base={600} w={150} h={210} wall="#F7D18A" shade="#D6A04A" shutter={C.coral} laundry />
      </g>

      {/* ground */}
      <rect x="-420" y="580" width="1840" height="820" fill={`url(#${id}-ground)`} />
      <rect x="-420" y="580" width="1840" height="820" fill={`url(#${id}-cob)`} opacity=".55" />
      <ellipse cx="500" cy="880" rx="400" ry="330" fill={`url(#${id}-plaza)`} />
      {/* painted lane edges */}
      <path d="M70 585 V1290 M930 585 V1290" stroke="#A8693A" strokeWidth="6" opacity=".5" />

      {/* rangoli in the plaza */}
      <g transform="translate(500 955)">
        <ellipse rx="150" ry="74" fill="#FFF3D6" opacity=".55" stroke={INK} strokeWidth="2.6" />
        <ellipse rx="118" ry="58" fill="none" stroke={C.pink} strokeWidth="6" strokeDasharray="14 9" />
        <ellipse rx="86" ry="42" fill="#F5C26B" opacity=".7" stroke={INK} strokeWidth="2.2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          return <ellipse key={i} cx={Math.cos(a) * 62} cy={Math.sin(a) * 30} rx="16" ry="8" transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 62} ${Math.sin(a) * 30})`} fill={i % 2 ? C.pink : C.teal} stroke={INK} strokeWidth="1.8" opacity=".9" />
        })}
        <ellipse rx="30" ry="15" fill={C.marigold} stroke={INK} strokeWidth="2.4" />
        <ellipse rx="12" ry="6" fill={C.jasmine} stroke={INK} strokeWidth="1.8" />
      </g>

      {/* long golden-hour shadows, cast down-left */}
      <g fill="#7A2A22" opacity=".2">
        <path d="M340 760 L660 760 L560 900 L240 900Z" />
        <path d="M300 1000 L540 1000 L440 1130 L200 1130Z" transform="translate(-170 -280)" />
        <path d="M70 720 H300 L200 800 H-20Z" />
        <path d="M700 720 H930 L850 800 H620Z" />
        <path d="M70 1080 H300 L210 1160 H-10Z" />
        <path d="M700 1080 H930 L850 1160 H620Z" />
      </g>

      {/* left & right street walls */}
      <g>
        <WallSegment x={-22} y={590} wall="#F2A56B" shade="#D9743F" shutter={C.sage} />
        <WallSegment x={-22} y={840} wall="#8FC9C4" shade="#5E9D9B" shutter={C.coral} h={250} />
        <WallSegment x={-22} y={1090} wall="#F7D18A" shade="#D6A04A" shutter={C.teal} h={220} />
        <WallSegment x={930} y={590} wall="#F0907A" shade="#C65A47" shutter={C.sage} flip />
        <WallSegment x={930} y={840} wall="#F7D18A" shade="#D6A04A" shutter={C.teal} flip />
        <WallSegment x={930} y={1090} wall="#A7D1A1" shade="#6BA46A" shutter={C.coral} flip h={220} />
        <WallSegment x={-114} y={590} wall="#F0907A" shade="#C65A47" shutter={C.teal} />
        <WallSegment x={-114} y={840} wall="#F7D18A" shade="#D6A04A" shutter={C.sage} />
        <WallSegment x={-114} y={1090} wall="#8FC9C4" shade="#5E9D9B" shutter={C.coral} h={220} />
        <WallSegment x={-206} y={590} wall="#F7D18A" shade="#D6A04A" shutter={C.coral} />
        <WallSegment x={-206} y={840} wall="#F2A56B" shade="#D9743F" shutter={C.teal} />
        <WallSegment x={-206} y={1090} wall="#F0907A" shade="#C65A47" shutter={C.sage} h={220} />
        <WallSegment x={1022} y={590} wall="#8FC9C4" shade="#5E9D9B" shutter={C.coral} flip />
        <WallSegment x={1022} y={840} wall="#F2A56B" shade="#D9743F" shutter={C.sage} flip />
        <WallSegment x={1022} y={1090} wall="#F7D18A" shade="#D6A04A" shutter={C.teal} flip h={220} />
        <WallSegment x={1114} y={590} wall="#A7D1A1" shade="#6BA46A" shutter={C.teal} flip />
        <WallSegment x={1114} y={840} wall="#F0907A" shade="#C65A47" shutter={C.sage} flip />
        <WallSegment x={1114} y={1090} wall="#8FC9C4" shade="#5E9D9B" shutter={C.coral} flip h={220} />
      </g>

      {/* low front kerb + dark vignette at the south edge */}
      <rect x="-420" y="1290" width="1840" height="130" fill="#8A4F2B" stroke={INK} strokeWidth={SW} />
      <rect x="-420" y="1290" width="1840" height="16" fill="#C98B58" stroke={INK} strokeWidth={SW} />
      <rect x="-420" y="1250" width="1840" height="170" fill={`url(#${id}-edge)`} />
    </svg>
  )
})

/* ------------------------------------------------------------------ overhead: wires, strung lights, laundry, bunting (above everything) */

const wire = (x1: number, y1: number, x2: number, y2: number, sag: number) => `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}`
const qpt = (x1: number, y1: number, x2: number, y2: number, sag: number, t: number) => {
  const cx = (x1 + x2) / 2, cy = Math.max(y1, y2) + sag
  return { x: (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2, y: (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2 }
}

export const Overhead = memo(function Overhead() {
  const wires: [number, number, number, number, number][] = [
    [66, 640, 934, 668, 54],
    [66, 820, 934, 800, 60],
    [66, 1010, 934, 1030, 62],
    [66, 1190, 934, 1170, 56],
  ]
  const bulbs = Array.from({ length: 15 }, (_, i) => qpt(...wires[0], (i + 0.5) / 15))
  const bulbs2 = Array.from({ length: 15 }, (_, i) => qpt(...wires[2], (i + 0.5) / 15))
  const flags = Array.from({ length: 18 }, (_, i) => qpt(...wires[1], (i + 0.5) / 18))
  const flagCols = [C.pink, C.mustard, C.teal, C.coral, C.sage]
  const clothes = [0.15, 0.25, 0.7, 0.8].map((t) => qpt(...wires[3], t))
  return (
    <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} width={WORLD.w} height={WORLD.h} style={{ display: 'block', position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} aria-hidden>
      {wires.map((w, i) => (
        <path key={i} d={wire(...w)} fill="none" stroke={INK} strokeWidth={2.4} opacity=".85" />
      ))}
      <path d="M66 700 L400 640 L934 760" fill="none" stroke={INK} strokeWidth={1.6} opacity=".55" />
      {[bulbs, bulbs2].map((set, k) =>
        set.map((b, i) => (
          <g key={`${k}-${i}`} className="anim-twinkle" style={{ animationDelay: `${((i + k) % 3) * 0.3}s` }}>
            <circle cx={b.x} cy={b.y + 7} r={13} fill="#FFD25A" opacity=".28" />
            <path d={`M${b.x - 4} ${b.y + 2} h8 l-1 6 a4.4 5 0 1 1 -6 0z`} fill={['#FFE9A0', '#FFC94A', '#FFB4C8'][i % 3]} stroke={INK} strokeWidth={1.6} />
          </g>
        )),
      )}
      {flags.map((f, i) => (
        <path key={i} d={`M${f.x - 7} ${f.y} h14 l-7 20z`} fill={flagCols[i % flagCols.length]} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" className="anim-sway" style={{ transformOrigin: `${f.x}px ${f.y}px`, transformBox: 'view-box', animationDelay: `${(i % 5) * 0.2}s` }} />
      ))}
      {clothes.map((c, i) => (
        <g key={i} className="anim-sway" style={{ transformOrigin: `${c.x}px ${c.y}px`, transformBox: 'view-box', animationDelay: `${i * 0.35}s` }}>
          <path d={`M${c.x - 11} ${c.y} h22 l-2 36 h-18z`} fill={[C.jasmine, C.pink, C.sky, C.mustard][i]} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <path d={`M${c.x - 9} ${c.y + 10} h18`} stroke={INK} strokeWidth={1.6} opacity=".4" />
          <circle cx={c.x - 8} cy={c.y} r={2.4} fill={C.coral} stroke={INK} strokeWidth={1.2} />
          <circle cx={c.x + 8} cy={c.y} r={2.4} fill={C.coral} stroke={INK} strokeWidth={1.2} />
        </g>
      ))}
    </svg>
  )
})

/* ------------------------------------------------------------------ props */

export function Pigeon({ flip, className, style }: { flip?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 48 40" className={className} style={{ overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined, ...style }} aria-hidden>
      <path d="M8 22 L-2 18 L2 28Z" fill="#6D7A92" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="22" cy="24" rx="16" ry="11" fill="#9AA6BD" stroke={INK} strokeWidth="2.6" />
      <path d="M12 22 Q22 14 32 24 Q22 30 12 22Z" fill="#7B879F" stroke={INK} strokeWidth="2" />
      <circle cx="36" cy="14" r="8" fill="#9AA6BD" stroke={INK} strokeWidth="2.6" />
      <path d="M30 18 Q34 24 38 20" fill="none" stroke="#7AC29A" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      <path d="M43 13 l7 2 l-7 3z" fill={C.mustard} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="38" cy="12" r="2.6" fill={C.jasmine} stroke={INK} strokeWidth="1.2" />
      <circle cx="38.6" cy="12.2" r="1.2" fill={INK} />
      <path d="M20 34 v6 M26 34 v6" stroke={C.coral} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function Tree({ className }: { className?: string }) {
  const blobs = [
    [60, 70, 52, '#3F7A3A'], [130, 50, 56, '#4F8F3F'], [200, 74, 54, '#3F7A3A'], [96, 112, 50, '#6BA83F'], [170, 112, 52, '#5C9A3C'],
    [128, 80, 46, '#8DC04A'], [64, 40, 28, '#9BD04E'], [186, 40, 26, '#B4DB58'],
  ] as const
  return (
    <svg viewBox="0 0 260 260" className={className} style={{ overflow: 'visible' }} aria-hidden>
      <path d="M112 250 Q116 190 104 150 L152 150 Q142 190 150 250Z" fill="#7A4A2E" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M114 250 Q118 190 108 150 L128 150 Q124 200 126 250Z" fill="#5C3520" opacity=".55" />
      <ellipse cx="130" cy="252" rx="52" ry="8" fill={INK} opacity=".22" />
      {blobs.map(([x, y, r, f], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={f} stroke={INK} strokeWidth={SW} />
      ))}
      {blobs.slice(0, 6).map(([x, y, r], i) => (
        <path key={i} d={`M${x - r * 0.55} ${y - r * 0.2} q${r * 0.3} -${r * 0.5} ${r * 0.8} -${r * 0.35}`} stroke="#C9E87A" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".75" />
      ))}
      {/* hanging glowing stars */}
      {[50, 90, 130, 170, 210].map((x, i) => (
        <g key={x} className="anim-twinkle" style={{ animationDelay: `${i * 0.2}s` }}>
          <path d={`M${x} ${100 + (i % 2) * 14} V${150 + (i % 3) * 18}`} stroke="#FFF3D6" strokeWidth="1.6" opacity=".85" />
          <path d={`M${x} ${146 + (i % 3) * 18} l3 7 l7 1 l-5 5 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -5 l7 -1z`} fill="#FFE9A0" stroke={INK} strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  )
}

export function PotPlant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 110" className={className} style={{ overflow: 'visible' }} aria-hidden>
      <ellipse cx="55" cy="104" rx="38" ry="6" fill={INK} opacity=".25" />
      {[[34, 30, -28], [56, 14, 0], [78, 30, 28], [44, 40, -12], [68, 40, 12]].map(([x, y, r], i) => (
        <path key={i} d={`M55 62 Q${x} ${y + 24} ${x} ${y}`} stroke={INK} strokeWidth="14" fill="none" strokeLinecap="round" transform={`rotate(${r} 55 62)`} />
      ))}
      {[[34, 30, -28], [56, 14, 0], [78, 30, 28], [44, 40, -12], [68, 40, 12]].map(([x, y, r], i) => (
        <path key={i} d={`M55 62 Q${x} ${y + 24} ${x} ${y}`} stroke={['#3F7A3A', '#5C9A3C', '#4F8F3F'][i % 3]} strokeWidth="8" fill="none" strokeLinecap="round" transform={`rotate(${r} 55 62)`} />
      ))}
      <path d="M22 62 H88 L80 102 Q55 110 30 102Z" fill={C.terracotta} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M18 56 H92 V66 H18Z" fill="#E5703A" stroke={INK} strokeWidth={SW} />
      <path d="M26 74 H84" stroke={C.mustard} strokeWidth="3" strokeDasharray="6 5" />
    </svg>
  )
}

export function Bicycle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 110" className={className} style={{ overflow: 'visible' }} aria-hidden>
      <ellipse cx="90" cy="106" rx="76" ry="5" fill={INK} opacity=".22" />
      {[40, 140].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="72" r="30" fill="none" stroke={INK} strokeWidth="9" />
          <circle cx={cx} cy="72" r="30" fill="none" stroke="#6BB0C9" strokeWidth="4" />
          <path d={`M${cx - 26} 72 H${cx + 26} M${cx} 46 V98`} stroke={INK} strokeWidth="1.6" opacity=".6" />
        </g>
      ))}
      <path d="M40 72 L72 40 H112 L140 72 M72 40 L88 72 H40 M88 72 L112 40" fill="none" stroke={INK} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M40 72 L72 40 H112 L140 72 M72 40 L88 72 H40 M88 72 L112 40" fill="none" stroke="#F4D35E" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M62 34 H82 M112 40 L118 24 H132" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Crates({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 100" className={className} style={{ overflow: 'visible' }} aria-hidden>
      <ellipse cx="65" cy="96" rx="58" ry="5" fill={INK} opacity=".22" />
      {[[4, 50, 56], [62, 50, 56], [32, 8, 56]].map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={44} fill="#E5703A" stroke={INK} strokeWidth={SW} />
          <path d={`M${x} ${y + 15} H${x + w} M${x} ${y + 29} H${x + w}`} stroke={INK} strokeWidth="2.4" />
          {[0, 1, 2, 3].map((k) => <path key={k} d={`M${x + 10 + k * 13} ${y} v44`} stroke={INK} strokeWidth="2" opacity=".5" />)}
        </g>
      ))}
    </svg>
  )
}

export function FlowerCart({ className }: { className?: string }) {
  const bloom = (x: number, y: number, c: string, k: number) => (
    <g key={k}>
      <circle cx={x} cy={y} r={11} fill={c} stroke={INK} strokeWidth="2" />
      <circle cx={x - 3} cy={y - 3} r={3} fill="#FFF3D6" opacity=".8" />
    </g>
  )
  return (
    <svg viewBox="0 0 240 190" className={className} style={{ overflow: 'visible' }} aria-hidden>
      <ellipse cx="120" cy="184" rx="108" ry="7" fill={INK} opacity=".22" />
      <path d="M20 54 H220 L208 20 H32Z" fill={C.coral} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${34 + i * 38} 20 L${24 + i * 38} 54 H${42 + i * 38}Z`} fill={C.jasmine} opacity=".9" stroke={INK} strokeWidth="2" />)}
      <path d="M36 56 V150 M204 56 V150" stroke={INK} strokeWidth="6" />
      {[0, 1, 2].map((i) => (
        <g key={i} className="anim-sway" style={{ transformOrigin: `${70 + i * 50}px 58px`, transformBox: 'view-box', animationDelay: `${i * 0.3}s` }}>
          {[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={70 + i * 50} cy={66 + k * 11} r={7} fill={C.marigold} stroke={INK} strokeWidth="1.8" />)}
        </g>
      ))}
      <rect x="22" y="120" width="196" height="54" rx="4" fill="#8A4F2B" stroke={INK} strokeWidth={SW} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M${40 + i * 46} 124 h38 l-4 44 h-30z`} fill="#6D7A92" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx={59 + i * 46} cy="118" r="20" fill={['#FFF3D6', '#E5457A', '#FFF3D6', '#F28C28'][i]} stroke={INK} strokeWidth="2.6" />
          {bloom(48 + i * 46, 112, ['#FFF3D6', '#F26BA0', '#FFFFFF', '#F5A623'][i], i)}
          {bloom(70 + i * 46, 114, ['#FFFFFF', '#E5457A', '#FFF3D6', '#F28C28'][i], i + 9)}
        </g>
      ))}
    </svg>
  )
}
