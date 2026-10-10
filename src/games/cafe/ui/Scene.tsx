import { cloudStage, type Step } from '../engine/flow'
import { stageOf } from '../engine/pressure'
import type { Run } from '../engine/types'

const INK = '#3A2A24'
const ART = '/art'

/** painted cast: everyone in the café is a sprite from the island's art set */
export const CAST = {
  chacha: `${ART}/npc-pearl-stand.webp`,
  teja: `${ART}/npc-chai-stand.webp`,
  yusuf: `${ART}/npc-kiosk-stand.webp`,
} as const
/** who stands at the window for each offer */
export const VENDOR: Record<string, string> = {
  gamepack: `${ART}/cafe/vendor-gamepack.webp`,
  jacket: `${ART}/cafe/vendor-jacket.webp`,
  match: `${ART}/cafe/vendor-match.webp`,
  cover: `${ART}/cafe/vendor-cover.webp`,
}

export interface Player { gender: 'girl' | 'boy'; persona: string | null }
export const playerSprite = (p: Player) => `${ART}/avatar/${p.gender}-${p.persona ?? 'school'}-0.webp`
export const playerFace = (p: Player) => `${ART}/avatar/${p.gender}-${p.persona ?? 'school'}-face.webp`

export interface SceneProps {
  step: Step
  run: Run
  player: Player
  /** 0..1 steam left in each saucer, or null when empty */
  saucers?: [number | null, number | null]
  /** who is at the window right now */
  vendor?: string
  /** rain finale beat */
  beat?: 'calm' | 'freeze' | 'crack' | 'table' | null
  /** highlight one object (the table speaks) */
  focus?: 'emergency' | 'spend' | 'save' | 'plates' | 'teja' | 'bottle' | null
  platesCount?: number
  lite?: boolean
}

/**
 * Where the camera looks (0 = window on the left, 1 = counter on the right).
 * Only matters on narrow screens; wide screens see the whole café.
 */
export function cameraFor(step: Step, beat: SceneProps['beat'], focus: SceneProps['focus']): number {
  if (focus === 'emergency') return 0.36
  if (focus === 'save') return 0.58
  if (focus) return 0.55
  if (step === 'window' || step === 'trolley') return 0.2
  if (step === 'rain') return beat === 'table' ? 0.52 : 0.2
  if (step === 'entry' || step === 'walkin' || step === 'goal' || step === 'predict1' || step === 'tally' || step === 'thennow' || step === 'onechange') return 0.8
  if (step === 'teja') return 0.3
  return 0.5
}

/** a ramune bottle: five painted stages, never a number. At the top stage the marble is out. */
export function Bottle({ x, y, v, kind, h = 46 }: { x: number; y: number; v: number; kind: 'fun' | 'friends'; h?: number }) {
  const s = stageOf(v)
  const w = h * (178 / 222)
  return <image href={`${ART}/cafe/bottle-${kind}-${s}.webp`} x={x - w / 2} y={y - h} width={w} height={h} className={s === 3 ? 'cafe-rattle' : s === 4 ? 'cafe-pop' : undefined} />
}

function Cloud({ stage, dark }: { stage: number; dark: boolean }) {
  // far and small at the top of the window, then closer, bigger and lower every phase
  const cx = [80, 72, 62, 56, 56][stage]
  const cy = [52, 58, 64, 70, 70][stage]
  const k = [0.25, 0.35, 0.48, 0.62, 0.8][stage]
  const c = dark ? '#5E6B78' : '#A9BCC6'
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k})`} className="cafe-drift">
      {[[-30, 4, 20], [-8, -8, 26], [18, 0, 22], [36, 8, 16], [0, 10, 24]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={c} stroke={INK} strokeWidth={1.5 / k} />
      ))}
    </g>
  )
}

export function Scene({ step, run, player, saucers = [null, null], vendor, beat = null, focus = null, platesCount = 0, lite }: SceneProps) {
  const bg = lite ? `${ART}/cafe-interior-lite.webp` : `${ART}/cafe-interior.webp`
  const stage = cloudStage(step)
  const raining = step === 'pay' || (step === 'rain' && beat !== 'calm')
  const flash = step === 'rain' && beat === 'freeze'
  const cracked = (step === 'rain' && (beat === 'crack' || beat === 'table')) || step === 'pay' || step === 'tally'
  const phoneOff = step === 'rain' && beat !== 'calm' && beat !== null
  const lent = run.lent
  const dim = (k: SceneProps['focus']) => (focus && focus !== k ? 0.35 : 1)
  const glow = (k: SceneProps['focus']) => (focus === k ? 'url(#cafe-glow)' : undefined)
  const chachaPose = beat === 'freeze' || beat === 'crack' ? 'shock' : ['predict1', 'predict2', 'worth', 'bignight', 'bignight0'].includes(step) ? 'think' : 'idle'
  const showTeja = step === 'teja' || (focus === 'teja' && lent > 0)
  return (
    <svg viewBox="0 0 480 270" className="cafe-svg" role="img" aria-label="Café Meherban" style={{ ['--cx' as string]: cameraFor(step, beat, focus) }}>
      <defs>
        <clipPath id="cafe-win"><path d="M17 36 H95 V168 H17 Z M100 70 H117 V166 H100 Z" /></clipPath>
        {/* the counter and glass case, redrawn over Chacha so he stands behind them */}
        <clipPath id="cafe-counter"><path d="M357 168 H480 V270 H357 Z" /></clipPath>
        <filter id="cafe-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFE9A8" floodOpacity="1" />
        </filter>
        <radialGradient id="cafe-shadow"><stop offset="0" stopColor="#000" stopOpacity=".35" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      {/* the painted café */}
      <image href={bg} width="480" height="270" preserveAspectRatio="xMidYMid slice" />

      {/* the window and the street: the sky darkens and the cloud comes closer every phase */}
      <g clipPath="url(#cafe-win)">
        {(raining || stage >= 3) && <rect width="120" height="170" fill={raining ? '#40566A' : '#6F8796'} opacity={raining ? 0.3 : 0.22} />}
        <Cloud stage={stage} dark={stage >= 3} />
        {raining && !lite && (
          <g className="cafe-rain">
            <image href={`${ART}/cafe/rain.webp`} x={-10} y={20} width={150} height={52} preserveAspectRatio="xMidYMid slice" opacity=".9" />
            <image href={`${ART}/cafe/rain.webp`} x={-10} y={72} width={150} height={52} preserveAspectRatio="xMidYMid slice" opacity=".9" />
            <image href={`${ART}/cafe/rain.webp`} x={-10} y={124} width={150} height={52} preserveAspectRatio="xMidYMid slice" opacity=".9" />
          </g>
        )}
        {vendor && VENDOR[vendor] && (
          <image key={vendor} href={VENDOR[vendor]} x={20} y={86} height={84} width={78} preserveAspectRatio="xMidYMax meet" className="cafe-pop" />
        )}
      </g>
      {flash && <rect width="480" height="270" fill="#FFFFFF" opacity=".55" className="cafe-flash" />}
      {flash && <image href={`${ART}/cafe/lightning.webp`} x={34} y={30} width={60} height={90} preserveAspectRatio="xMidYMid meet" className="cafe-flash" />}

      {/* the gullak (Save) on the high shelf */}
      <g opacity={dim('save')} filter={glow('save')}>
        <image href={`${ART}/cafe/gullak.webp`} x={256} y={22} width={44} height={42} preserveAspectRatio="xMidYMax meet" className={focus === 'save' ? 'cafe-rattle' : undefined} />
      </g>
      {/* the goal, pinned to the cork board */}
      <g transform="rotate(-3 378 106)">
        <rect x="364" y="95" width="30" height="22" fill="#FBF0D2" stroke={INK} strokeWidth="1.2" />
        <circle cx="379" cy="97" r="1.8" fill="#C8604A" />
        <text x="379" y="111" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={INK}>₹250</text>
      </g>

      {/* Chacha behind the counter */}
      <image href={`${ART}/cafe/chacha-${chachaPose}.webp`} x={368} y={52} height={124} width={89} preserveAspectRatio="xMidYMin meet" className={chachaPose === 'shock' ? 'cafe-rattle' : 'cafe-breathe'} />
      <image href={bg} width="480" height="270" preserveAspectRatio="xMidYMid slice" clipPath="url(#cafe-counter)" />

      {/* the umbrella stand by the door (Emergency) */}
      <g opacity={dim('emergency')} filter={glow('emergency')}>
        <rect x="146" y="176" width="20" height="44" rx="3" fill="#8C8590" stroke={INK} strokeWidth="2" />
        {raining && paidEmergency(run) ? (
          <path d="M134 164 Q156 136 178 164 Z" fill="#D9573F" stroke={INK} strokeWidth="2" className="cafe-pop" />
        ) : (
          <path d="M153 176 L151 142 Q156 134 161 142 L159 176" fill="#D9573F" stroke={INK} strokeWidth="1.8" />
        )}
      </g>

      {/* the player, standing at the table */}
      <ellipse cx="200" cy="246" rx="22" ry="5" fill="url(#cafe-shadow)" />
      <image href={playerSprite(player)} x={178} y={136} height={112} width={44} preserveAspectRatio="xMidYMax meet" className="cafe-breathe" />
      {/* Teja, while he is here */}
      {showTeja && (
        <g opacity={dim('teja')} filter={glow('teja')} className="cafe-pop">
          <ellipse cx="116" cy="246" rx="22" ry="5" fill="url(#cafe-shadow)" />
          <image href={`${ART}/cafe/teja-${step === 'teja' ? 'wave' : 'thumbs'}.webp`} x={86} y={134} height={114} width={60} preserveAspectRatio="xMidYMax meet" />
        </g>
      )}

      {/* the table */}
      <g>
        <path d="M272 214 V250 M248 214 L240 250 M296 214 L304 250" stroke={INK} strokeWidth="4" />
        <ellipse cx="272" cy="206" rx="70" ry="14" fill="#F6F1E6" stroke={INK} strokeWidth="2.5" />
      </g>
      {/* the tumbler (Spend) */}
      <g opacity={dim('spend')} filter={glow('spend')}>
        <image href={`${ART}/cafe/tumbler.webp`} x={228} y={177} width={24} height={29} preserveAspectRatio="xMidYMax meet" />
      </g>
      {/* two saucers for cooling */}
      {saucers.map((s, i) => (
        <g key={i} transform={`translate(${270 + i * 26} 206)`}>
          <ellipse rx="11" ry="3.6" fill="#FBF0D2" stroke={INK} strokeWidth="1.3" />
          {s !== null && (
            <>
              <path d="M-5 -2 l2 -8 h6 l2 8 z" fill="#D9A84E" stroke={INK} strokeWidth="1.2" />
              {s > 0 && <path className="cafe-steam" d="M0 -12 q-4 -6 0 -11 q4 -5 0 -10" fill="none" stroke="#fff" strokeWidth={1 + s * 2} opacity={0.3 + s * 0.6} strokeLinecap="round" />}
            </>
          )}
        </g>
      ))}
      {/* the phone */}
      {!phoneOff || cracked ? (
        <g transform={cracked ? 'translate(214 240) rotate(-10)' : 'translate(256 202)'}>
          <rect x="-7" y="-4" width="14" height="22" rx="2" transform="rotate(80)" fill="#3C4A52" stroke={INK} strokeWidth="1.4" />
          {cracked && <path d="M-12 -2 l6 3 l-2 4 l7 2" fill="none" stroke="#fff" strokeWidth="1.2" transform="rotate(10)" />}
        </g>
      ) : (
        <g className="cafe-slide"><rect x="248" y="198" width="22" height="9" rx="2" fill="#3C4A52" stroke={INK} strokeWidth="1.4" /></g>
      )}
      {/* the fizz bottles */}
      <g opacity={dim('bottle')} filter={glow('bottle')}>
        <Bottle x={318} y={210} v={run.fizz.fun} kind="fun" h={50} />
        <Bottle x={334} y={212} v={run.fizz.friends} kind="friends" h={42} />
      </g>
      {/* the plates tower (little things) */}
      {platesCount > 0 && (
        <g opacity={dim('plates')} filter={glow('plates')}>
          {Array.from({ length: platesCount }, (_, i) => (
            <ellipse key={i} cx={212 + (i % 2) * 1.5} cy={202 - i * 4.5} rx="12" ry="3.2" fill="#FBF0D2" stroke={INK} strokeWidth="1.3" className="cafe-plate" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </g>
      )}
      {/* Yusuf and his snack cart roll in, then wave */}
      {step === 'trolley' && (
        <g className="cafe-roll">
          <ellipse cx="96" cy="252" rx="64" ry="6" fill="url(#cafe-shadow)" />
          <image href={`${ART}/cafe/yusuf-wave.webp`} x={20} y={118} height={136} width={152} preserveAspectRatio="xMidYMax meet" />
        </g>
      )}
    </svg>
  )
}

const paidEmergency = (run: Run) => (run.rainPaid.emergency ?? 0) > 0
