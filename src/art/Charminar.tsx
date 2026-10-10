import { useId } from 'react'
import { C } from './palette'
import { useLite } from '../store/game'

const INK = C.ink
const SW = 3.6

/** four minaret lamp positions in viewBox space (400x520). Index = pillar order. */
export const LAMPS = [
  { x: 62, y: 18 },
  { x: 338, y: 18 },
  { x: 130, y: 58 },
  { x: 270, y: 58 },
]

function Minaret({ cx, yTop, yBase, w, back, lit, glowId }: { cx: number; yTop: number; yBase: number; w: number; back?: boolean; lit: boolean; glowId: string }) {
  const stone = back ? '#E9CFA0' : C.stone
  const shade = back ? '#CFA877' : C.stoneShade
  const topW = w * 0.62
  const shaft = `M${cx - w / 2} ${yBase} L${cx - topW / 2} ${yTop + 62} L${cx + topW / 2} ${yTop + 62} L${cx + w / 2} ${yBase}Z`
  const ring = (y: number, k = 1.55) => (
    <g>
      <rect x={cx - (w * k) / 2} y={y} width={w * k} height={11} rx={5} fill={stone} stroke={INK} strokeWidth={SW - 0.4} />
      <path d={`M${cx - (w * k) / 2 + 3} ${y + 11} l4 6 l5 -6 M${cx + (w * k) / 2 - 3} ${y + 11} l-4 6 l-5 -6`} stroke={INK} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
      <rect x={cx - (w * k) / 2 + 2} y={y + 2} width={(w * k) / 2 - 2} height={4} fill={shade} opacity=".7" />
    </g>
  )
  const y1 = yTop + 104
  const y2 = yTop + 190
  const y3 = yBase - 70
  return (
    <g>
      <path d={shaft} fill={stone} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d={`M${cx - w / 2} ${yBase} L${cx - topW / 2} ${yTop + 62} L${cx - 2} ${yTop + 62} L${cx - 2} ${yBase}Z`} fill={shade} opacity=".75" />
      <path d={`M${cx - 4} ${yTop + 70} V${yBase - 8} M${cx + 5} ${yTop + 70} V${yBase - 8}`} stroke={INK} strokeWidth={1.6} opacity=".45" />
      {ring(y1)}
      {ring(y2)}
      {ring(y3, 1.7)}
      {/* lotus bulb near the base */}
      <ellipse cx={cx} cy={yBase - 38} rx={w * 0.72} ry={11} fill={back ? '#E2C08E' : C.mustard} stroke={INK} strokeWidth={SW - 0.6} />
      {/* open cupola with tiny pillars */}
      <rect x={cx - topW * 0.62} y={yTop + 26} width={topW * 1.24} height={38} rx={4} fill={stone} stroke={INK} strokeWidth={SW - 0.4} />
      {[-0.3, 0.3].map((k) => (
        <path key={k} d={`M${cx + topW * k - 5} ${yTop + 62} V${yTop + 46} Q${cx + topW * k} ${yTop + 37} ${cx + topW * k + 5} ${yTop + 46} V${yTop + 62}Z`} fill={C.maroon} stroke={INK} strokeWidth={2} />
      ))}
      <path d={`M${cx - topW * 0.7} ${yTop + 28} Q${cx - topW * 0.72} ${yTop - 4} ${cx} ${yTop - 6} Q${cx + topW * 0.72} ${yTop - 4} ${cx + topW * 0.7} ${yTop + 28}Z`} fill={back ? '#E9CFA0' : C.jasmine} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d={`M${cx - topW * 0.7} ${yTop + 28} Q${cx - topW * 0.72} ${yTop - 4} ${cx - 2} ${yTop - 6} V${yTop + 28}Z`} fill={shade} opacity=".55" />
      <path d={`M${cx} ${yTop - 6} V${yTop - 16}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {/* lamp */}
      <g>
        {lit && (
          <g>
            <circle cx={cx} cy={yTop - 22} r={30} fill={`url(#${glowId})`} className="anim-twinkle" />
            {[0, 45, 90, 135].map((a) => (
              <rect key={a} x={cx - 1.5} y={yTop - 22 - 22} width={3} height={44} rx={1.5} fill={C.lampRay} transform={`rotate(${a} ${cx} ${yTop - 22})`} className="anim-twinkle" />
            ))}
          </g>
        )}
        <path d={`M${cx - 7} ${yTop - 16} L${cx - 9} ${yTop - 26} Q${cx} ${yTop - 36} ${cx + 9} ${yTop - 26} L${cx + 7} ${yTop - 16}Z`} fill={lit ? C.lampLit : '#7B6A5E'} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        {lit && <ellipse cx={cx} cy={yTop - 24} rx={3} ry={5} fill="#FFF8D8" />}
        <circle cx={cx} cy={yTop - 38} r={2.6} fill={C.gold} stroke={INK} strokeWidth={1.4} />
      </g>
    </g>
  )
}

const Arch = ({ x, w, top, base, fill, stroke = INK }: { x: number; w: number; top: number; base: number; fill: string; stroke?: string }) => {
  const mid = top + (base - top) * 0.22
  return <path d={`M${x} ${base} V${mid + 24} Q${x} ${mid - 6} ${x + w / 2} ${top} Q${x + w} ${mid - 6} ${x + w} ${mid + 24} V${base}Z`} fill={fill} stroke={stroke} strokeWidth={SW} strokeLinejoin="round" />
}

export function CharminarSvg({ lamps = [false, false, false, false], className, style }: { lamps?: boolean[]; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, '')
  const lite = useLite()
  const glow = `${id}-glow`
  const sky = `${id}-sky`
  const wob = `${id}-wob`
  return (
    <svg viewBox="0 0 400 520" className={className} style={{ overflow: 'visible', ...style }} role="img" aria-label="Charminar">
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={C.sunGlow} stopOpacity=".95" />
          <stop offset=".45" stopColor={C.lampGlow} stopOpacity=".5" />
          <stop offset="1" stopColor={C.lampGlow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.skyCream} />
          <stop offset=".6" stopColor={C.skyOrange} />
          <stop offset="1" stopColor={C.terracotta} />
        </linearGradient>
        {!lite && (
          <filter id={wob} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="3.2" />
          </filter>
        )}
      </defs>
      <ellipse cx="200" cy="512" rx="190" ry="14" fill={INK} opacity=".22" />
      <g filter={lite ? undefined : `url(#${wob})`}>
        {/* back minarets */}
        <Minaret cx={130} yTop={84} yBase={220} w={26} back lit={lamps[2]} glowId={glow} />
        <Minaret cx={270} yTop={84} yBase={220} w={26} back lit={lamps[3]} glowId={glow} />

        {/* rooftop mosque tier */}
        <rect x={128} y={150} width={144} height={42} fill={C.stone} stroke={INK} strokeWidth={SW} />
        <rect x={128} y={150} width={50} height={42} fill={C.stoneShade} opacity=".6" />
        {[148, 178, 208, 238].map((x) => (
          <Arch key={x} x={x} w={16} top={160} base={192} fill={C.maroon} />
        ))}
        {[
          { cx: 200, r: 25, y: 150 },
          { cx: 150, r: 15, y: 150 },
          { cx: 250, r: 15, y: 150 },
        ].map((d) => (
          <g key={d.cx}>
            <path d={`M${d.cx - d.r} ${d.y} Q${d.cx - d.r} ${d.y - d.r * 1.5} ${d.cx} ${d.y - d.r * 1.55} Q${d.cx + d.r} ${d.y - d.r * 1.5} ${d.cx + d.r} ${d.y}Z`} fill={C.jasmine} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d={`M${d.cx - d.r} ${d.y} Q${d.cx - d.r} ${d.y - d.r * 1.5} ${d.cx} ${d.y - d.r * 1.55} V${d.y}Z`} fill={C.stoneShade} opacity=".5" />
            <path d={`M${d.cx} ${d.y - d.r * 1.55} v-9`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <circle cx={d.cx} cy={d.y - d.r * 1.55 - 12} r={3.4} fill={C.gold} stroke={INK} strokeWidth={1.6} />
          </g>
        ))}

        {/* upper arcade storey */}
        <rect x={76} y={196} width={248} height={66} fill={C.stone} stroke={INK} strokeWidth={SW} />
        <rect x={76} y={196} width={80} height={66} fill={C.stoneShade} opacity=".5" />
        {Array.from({ length: 7 }, (_, i) => 90 + i * 32).map((x) => (
          <Arch key={x} x={x} w={22} top={208} base={256} fill={C.maroon} />
        ))}
        {/* frieze of pointed merlons */}
        <path d={`M72 196 ${Array.from({ length: 16 }, () => "l 8 -14 l 8 14").join(' ')} Z`} fill={C.stone} stroke={INK} strokeWidth={SW - 0.6} strokeLinejoin="round" />
        <rect x={70} y={258} width={260} height={16} fill={C.terracotta} stroke={INK} strokeWidth={SW} />
        {Array.from({ length: 13 }, (_, i) => 82 + i * 19.5).map((x) => (
          <circle key={x} cx={x} cy={266} r={3} fill={C.mustard} stroke={INK} strokeWidth={1.2} />
        ))}

        {/* grand lower storey */}
        <rect x={66} y={274} width={268} height={238} fill={C.stone} stroke={INK} strokeWidth={SW} />
        <rect x={66} y={274} width={86} height={238} fill={C.stoneShade} opacity=".55" />
        <Arch x={134} w={132} top={292} base={512} fill={C.stone} />
        <Arch x={148} w={104} top={310} base={512} fill={`url(#${sky})`} />
        {/* silhouette of lane seen through the arch */}
        <path d="M148 512 V470 L168 470 V452 L186 452 V472 L204 472 V440 L222 440 V466 L240 466 V456 L252 456 V512Z" fill={C.maroon} opacity=".55" />
        <Arch x={78} w={46} top={360} base={512} fill={C.maroon} />
        <Arch x={276} w={46} top={360} base={512} fill={C.maroon} />
        <Arch x={86} w={30} top={378} base={512} fill="#3a1d19" />
        <Arch x={284} w={30} top={378} base={512} fill="#3a1d19" />
        {[110, 290].map((x) => (
          <g key={x}>
            <circle cx={x} cy={322} r={11} fill={C.mustard} stroke={INK} strokeWidth={2.6} />
            <circle cx={x} cy={322} r={4.6} fill={C.terracotta} stroke={INK} strokeWidth={1.6} />
          </g>
        ))}
        <rect x={62} y={496} width={276} height={18} fill={C.stoneShade} stroke={INK} strokeWidth={SW} />
        {/* peeling plaster patches */}
        <path d="M90 410 q8 -10 18 -2 q6 8 -4 14 q-12 2 -14 -12z" fill="#E7C896" opacity=".8" />
        <path d="M296 440 q10 -8 16 2 q2 10 -10 12 q-8 -4 -6 -14z" fill="#E7C896" opacity=".8" />

        {/* front minarets */}
        <Minaret cx={62} yTop={44} yBase={512} w={40} lit={lamps[0]} glowId={glow} />
        <Minaret cx={338} yTop={44} yBase={512} w={40} lit={lamps[1]} glowId={glow} />
      </g>
    </svg>
  )
}
