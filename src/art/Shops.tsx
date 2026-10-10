import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { C } from './palette'
import { LOOKS, Toon } from './Toon'

// TODO(final-ui): procedural placeholder shops (fallback when no painted art exists). Chai cafe has no painted art yet.

const INK = C.ink
const SW = 3.4

export interface ShopProps {
  /** squash-and-stretch reaction active (hover/focus/tap) */
  react?: boolean
  /** pillar finished */
  done?: boolean
  className?: string
}

const Sign = ({ x, y, w, h, text, fill, color, size = 17 }: { x: number; y: number; w: number; h: number; text: string; fill: string; color: string; size?: number }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={5} fill={fill} stroke={INK} strokeWidth={SW} />
    <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={3} fill="none" stroke={color} strokeWidth={1.4} opacity=".8" />
    <text x={x + w / 2} y={y + h / 2 + size * 0.36} textAnchor="middle" fontSize={size} fill={color} className="font-sign" style={{ fontFamily: 'var(--font-sign)' }}>
      {text}
    </text>
  </g>
)

const DoneSeal = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`} className="anim-pop">
    <circle r="17" fill={C.gold} stroke={INK} strokeWidth={3.4} />
    <circle r="12" fill="none" stroke={INK} strokeWidth={1.4} strokeDasharray="3 3" />
    <path d="M-7 0 l5 6 l10 -12" stroke={INK} strokeWidth={4.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
)

/** scalloped awning with stripes */
function Awning({ x, y, w, h = 30, a, b, n = 8 }: { x: number; y: number; w: number; h?: number; a: string; b: string; n?: number }) {
  const sw = w / n
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M${x + i * sw} ${y} H${x + (i + 1) * sw} V${y + h} a${sw / 2} ${sw / 2.4} 0 0 1 ${-sw} 0Z`} fill={i % 2 ? b : a} stroke={INK} strokeWidth={SW - 0.4} strokeLinejoin="round" />
      ))}
    </g>
  )
}

const shopStyle = (react?: boolean) => ({ transformBox: 'fill-box' as const, transformOrigin: '50% 100%', ...(react ? {} : {}) })

/* ----------------------- 1. Bangle bazaar stall (Plan & Budget) ----------------------- */
export function BangleStall({ react, done, className }: ShopProps) {
  const { t } = useTranslation()
  const cols = [C.pink, C.teal, C.gold, C.coral, C.sage, C.sky, C.marigold]
  const rack = (x0: number, y: number, n: number, off: number) =>
    Array.from({ length: n }, (_, i) => {
      const c = cols[(i + off) % cols.length]
      const x = x0 + i * 16
      return (
        <g key={`${y}-${i}`}>
          <ellipse cx={x} cy={y} rx={7} ry={13} fill="none" stroke={INK} strokeWidth={8.4} />
          <ellipse cx={x} cy={y} rx={7} ry={13} fill="none" stroke={c} strokeWidth={5} />
          <path d={`M${x - 3} ${y - 9} q3 -3 6 0`} stroke={C.jasmine} strokeWidth={1.6} fill="none" opacity=".8" />
        </g>
      )
    })
  return (
    <svg viewBox="0 0 240 250" className={className} style={{ overflow: 'visible' }} role="img" aria-hidden>
      <ellipse cx="120" cy="244" rx="118" ry="9" fill={INK} opacity=".2" />
      <rect x="18" y="64" width="204" height="178" fill={C.teal} stroke={INK} strokeWidth={SW} />
      <rect x="18" y="64" width="62" height="178" fill="#215558" opacity=".55" />
      <path d="M18 120 H222 M18 172 H222" stroke="#7BC0C4" strokeWidth={2} opacity=".6" />
      {/* hanging bangle racks */}
      <path d="M26 92 H92 M148 92 H214 M26 134 H92 M148 134 H214" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {rack(34, 106, 4, 0)}
      {rack(156, 106, 4, 3)}
      {rack(34, 148, 4, 2)}
      {rack(156, 148, 4, 5)}
      <Awning x={8} y={44} w={224} a={C.pink} b={C.jasmine} n={8} />
      <Sign x={56} y={6} w={128} h={34} text={t('world.bangles')} fill={C.mustard} color={C.maroon} size={19} />
      {/* shopkeeper */}
      <g className={react ? 'anim-squash' : 'anim-bob'} style={shopStyle(react)} key={String(react)}>
        <Toon look={LOOKS.bangle} mood="happy" excited={react} wave={!react} x={80} y={76} width={82} height={123} />
      </g>
      {/* counter */}
      <path d="M6 196 H234 V244 H6Z" fill={C.terracotta} stroke={INK} strokeWidth={SW} />
      <path d="M6 206 H234" stroke={C.mustard} strokeWidth={5} />
      {Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${22 + i * 20} 214 l8 14 l-8 14 l-8 -14Z`} fill={cols[i % cols.length]} stroke={INK} strokeWidth={1.6} />)}
      {/* bangle stacks on counter */}
      {[34, 196].map((x, k) => (
        <g key={x}>
          {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={x} cy={192 - i * 5} rx={14} ry={5} fill={cols[(i + k * 2) % cols.length]} stroke={INK} strokeWidth={2.4} />)}
        </g>
      ))}
      {done && <DoneSeal x={206} y={20} />}
    </svg>
  )
}

/* ----------------------- 2. Irani chai cafe (Save & Manage) ----------------------- */
export function ChaiCafe({ react, done, className }: ShopProps) {
  const { t } = useTranslation()
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 240 250" className={className} style={{ overflow: 'visible' }} role="img" aria-hidden>
      <defs>
        <pattern id={`${id}-chk`} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={C.jasmine} />
          <rect width="10" height="10" fill={C.sky} />
          <rect x="10" y="10" width="10" height="10" fill={C.sky} />
        </pattern>
      </defs>
      <ellipse cx="120" cy="244" rx="118" ry="9" fill={INK} opacity=".2" />
      <rect x="14" y="58" width="212" height="184" fill="#9ED3DE" stroke={INK} strokeWidth={SW} />
      <rect x="14" y="58" width="60" height="184" fill="#7BB8C6" opacity=".6" />
      <rect x="14" y="196" width="212" height="46" fill={`url(#${id}-chk)`} stroke={INK} strokeWidth={SW} />
      {/* arched window + door */}
      <path d="M28 190 V120 Q28 92 56 90 Q84 92 84 120 V190Z" fill={C.dusk} stroke={INK} strokeWidth={SW} />
      <path d="M36 186 V122 Q36 100 56 98" fill="none" stroke={C.sky} strokeWidth={2} opacity=".6" />
      <path d="M160 190 V112 Q160 86 188 84 Q216 86 216 112 V190Z" fill={C.maroon} stroke={INK} strokeWidth={SW} />
      {/* biscuit jars */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={92 + i * 22} y={124} width={17} height={22} rx={3} fill={C.jasmine} stroke={INK} strokeWidth={2.4} />
          <rect x={90 + i * 22} y={118} width={21} height={8} rx={3} fill={C.marigold} stroke={INK} strokeWidth={2.4} />
        </g>
      ))}
      <path d="M88 150 H160" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {/* hanging lanterns */}
      {[100, 150].map((x) => (
        <g key={x} className="anim-sway" style={{ transformOrigin: `${x}px 62px`, transformBox: 'view-box' }}>
          <path d={`M${x} 62 V76`} stroke={INK} strokeWidth={2.4} />
          <path d={`M${x - 8} 90 Q${x - 11} 78 ${x} 76 Q${x + 11} 78 ${x + 8} 90Z`} fill={C.marigold} stroke={INK} strokeWidth={2.6} />
          <ellipse cx={x} cy={88} rx={5} ry={3.5} fill={C.lampRay} />
        </g>
      ))}
      <Awning x={6} y={38} w={228} a={C.teal} b={C.jasmine} n={8} />
      <Sign x={46} y={2} w={148} h={34} text={t('world.chai')} fill={C.dusk} color={C.mustard} size={18} />
      {/* marble table + glasses */}
      <ellipse cx="62" cy="206" rx="40" ry="9" fill="#EDE7DA" stroke={INK} strokeWidth={SW} />
      <path d="M50 208 V240 M74 208 V240" stroke={INK} strokeWidth={5} />
      {/* customer: worried, then relieved */}
      <g className={react ? 'anim-squash' : 'anim-bob'} style={shopStyle(react)} key={String(react)}>
        <Toon look={LOOKS.chai} mood="cycle" excited={react} x={26} y={110} width={72} height={108} />
      </g>
      <ellipse cx="62" cy="205" rx="40" ry="9" fill="#EDE7DA" stroke={INK} strokeWidth={SW} opacity="0" />
      {[48, 78].map((x) => <path key={x} d={`M${x - 6} 194 L${x - 4} 206 H${x + 4} L${x + 6} 194Z`} fill={C.peach} stroke={INK} strokeWidth={2.2} />)}
      {/* kettle on the stove */}
      <g>
        <rect x="150" y="196" width="68" height="46" rx="4" fill={C.floorDark} stroke={INK} strokeWidth={SW} />
        <path d="M158 198 q4 -4 8 0 M178 198 q4 -4 8 0 M198 198 q4 -4 8 0" stroke={C.marigold} strokeWidth={3} fill="none" />
        <path d="M156 196 Q154 164 184 162 Q214 164 212 196Z" fill={C.gold} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M160 190 Q160 172 172 168" stroke={C.jasmine} strokeWidth={3} fill="none" opacity=".7" />
        <path d="M211 182 Q226 176 228 162" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d="M211 182 Q226 176 228 162" fill="none" stroke={C.gold} strokeWidth={4.4} strokeLinecap="round" />
        <path d="M156 178 Q142 176 138 160" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path d="M156 178 Q142 176 138 160" fill="none" stroke={C.gold} strokeWidth={3.4} strokeLinecap="round" />
        <circle cx="184" cy="160" r="5" fill={C.gold} stroke={INK} strokeWidth={2.6} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={184 + (i - 1) * 6} cy={146} r={5 + i} fill={C.jasmine} opacity=".85" style={{ animation: `steam 1.5s steps(7) ${i * 0.5}s infinite` }} />
        ))}
      </g>
      {done && <DoneSeal x={206} y={22} />}
    </svg>
  )
}

/* ----------------------- 3. Pearl merchant (Understand Investing) ----------------------- */
export function PearlShop({ react, done, className }: ShopProps) {
  const { t } = useTranslation()
  const id = useId().replace(/:/g, '')
  const pearl = (x: number, y: number, r = 7, k = 0) => (
    <g key={`${x}-${y}`}>
      <circle cx={x} cy={y} r={r + 5} fill={`url(#${id}-glow)`} className="anim-twinkle" style={{ animationDelay: `${(k % 4) * 0.25}s` }} />
      <circle cx={x} cy={y} r={r} fill={`url(#${id}-pearl)`} stroke={INK} strokeWidth={2} />
    </g>
  )
  return (
    <svg viewBox="0 0 240 250" className={className} style={{ overflow: 'visible' }} role="img" aria-hidden>
      <defs>
        <radialGradient id={`${id}-pearl`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor={C.white} />
          <stop offset=".55" stopColor="#FFE9EE" />
          <stop offset="1" stopColor="#E9B7C4" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={C.jasmine} stopOpacity=".9" />
          <stop offset="1" stopColor={C.jasmine} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="244" rx="118" ry="9" fill={INK} opacity=".2" />
      <rect x="16" y="56" width="208" height="186" fill="#1E4A4A" stroke={INK} strokeWidth={SW} />
      <rect x="16" y="56" width="58" height="186" fill="#143838" opacity=".6" />
      {/* arched display window with velvet */}
      <path d="M30 196 V104 Q30 66 120 62 Q210 66 210 104 V196Z" fill={C.maroon} stroke={C.gold} strokeWidth={5} />
      <path d="M30 196 V104 Q30 66 120 62 Q210 66 210 104 V196Z" fill="none" stroke={INK} strokeWidth={SW} />
      {[40, 66, 92].map((y, i) => (
        <g key={y}>
          <path d={`M${44 + i * 3} ${y + 8} H${70 - i * 3}`} stroke={INK} strokeWidth={0} />
          {[0, 1, 2, 3].map((j) => pearl(46 + j * 16 + (i % 2) * 6, 96 + y - 40 + (i === 2 ? 4 : 0), 6.5, i * 4 + j))}
        </g>
      ))}
      {/* strings of pearls on the right */}
      <path d="M150 74 Q172 106 150 136 M172 70 Q196 108 172 142" fill="none" stroke={INK} strokeWidth={2.2} />
      {[0, 1, 2, 3, 4].map((i) => pearl(152 + Math.sin(i * 0.8) * 8 * -1 + i * 2, 80 + i * 13, 5.4, i))}
      {[0, 1, 2, 3, 4].map((i) => pearl(174 + Math.sin(i * 0.8) * 9 * -1 + i * 2, 76 + i * 14, 5.4, i + 2))}
      <Sign x={54} y={4} w={132} h={34} text={t('world.pearls')} fill="#143838" color={C.mustard} size={19} />
      <path d="M10 44 H230 L222 56 H18Z" fill={C.gold} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {/* merchant */}
      <g className={react ? 'anim-squash' : 'anim-bob'} style={shopStyle(react)} key={String(react)}>
        <Toon look={LOOKS.pearl} mood="happy" excited={react} x={78} y={92} width={84} height={126} />
      </g>
      {/* counter + brass balance scale */}
      <path d="M6 198 H234 V244 H6Z" fill="#143838" stroke={INK} strokeWidth={SW} />
      <path d="M6 198 H234" stroke={C.gold} strokeWidth={6} />
      <g className="anim-sway" style={{ transformOrigin: '196px 168px', transformBox: 'view-box' }}>
        <path d="M196 198 V160" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d="M196 198 V160" stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
        <path d="M168 164 H224" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path d="M168 164 H224" stroke={C.gold} strokeWidth={3.4} strokeLinecap="round" />
        {[170, 222].map((x) => (
          <g key={x}>
            <path d={`M${x} 164 L${x - 10} 186 M${x} 164 L${x + 10} 186`} stroke={INK} strokeWidth={1.8} />
            <path d={`M${x - 14} 186 Q${x} 198 ${x + 14} 186Z`} fill={C.gold} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          </g>
        ))}
        {pearl(170, 181, 5, 1)}
        {pearl(222, 181, 5, 2)}
      </g>
      <g>{[36, 52, 68].map((x, i) => pearl(x, 190, 6, i))}</g>
      {done && <DoneSeal x={206} y={24} />}
    </svg>
  )
}

/* ----------------------- 4. Recharge / UPI kiosk (Stay Financially Safe) ----------------------- */
export function UpiKiosk({ react, done, className }: ShopProps) {
  const { t } = useTranslation()
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 240 250" className={className} style={{ overflow: 'visible' }} role="img" aria-hidden>
      <ellipse cx="120" cy="244" rx="118" ry="9" fill={INK} opacity=".2" />
      <rect x="22" y="70" width="196" height="172" fill={C.mustard} stroke={INK} strokeWidth={SW} />
      <rect x="22" y="70" width="56" height="172" fill="#C99533" opacity=".6" />
      {/* roof + sign */}
      <path d="M8 70 L28 40 H212 L232 70Z" fill={C.coral} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <Sign x={44} y={6} w={152} h={32} text={t('world.recharge')} fill={C.dusk} color={C.sky} size={17} />
      {/* phone posters */}
      {[34, 70].map((x, i) => (
        <g key={x}>
          <rect x={x} y={84} width={26} height={44} rx={5} fill={C.dusk} stroke={INK} strokeWidth={2.8} />
          <rect x={x + 3} y={90} width={20} height={30} rx={2} fill={i ? C.pink : C.sky} />
          <text x={x + 13} y={110} fontSize="14" textAnchor="middle" fill={C.jasmine} fontWeight="900">₹</text>
        </g>
      ))}
      {/* fake OFFER sign: starburst, blinking bulbs */}
      <g transform="translate(176 106)"><g className="anim-pulse" style={{ transformOrigin: '0px 0px', transformBox: 'view-box' }}>
        <path d={Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; const r = i % 2 ? 24 : 38; return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}` }).join(' ') + 'Z'} fill={C.mustard} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
        <circle r="24" fill={C.coral} stroke={INK} strokeWidth={3} />
        <text y="5" fontSize="13" textAnchor="middle" fill={C.jasmine} className="font-sign" style={{ fontFamily: 'var(--font-sign)' }}>
          {t('world.offer')}
        </text>
      </g></g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return <circle key={i} cx={176 + Math.cos(a) * 41} cy={106 + Math.sin(a) * 41} r={3.2} fill={C.sunGlow} stroke={INK} strokeWidth={1.4} className="anim-blink" style={{ animationDelay: `${(i % 2) * 0.45}s` }} />
      })}
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x="22" y="70" width="196" height="172" />
        </clipPath>
      </defs>
      {/* suspicious customer (shades, hood) leaning on the counter */}
      <g className={react ? 'anim-squash' : 'anim-bob'} style={shopStyle(react)} key={String(react)}>
        <Toon look={LOOKS.upi} mood="sly" excited={react} shifty armsUp={false} x={100} y={90} width={84} height={126} />
      </g>
      <path d="M6 194 H234 V244 H6Z" fill="#5C6B73" stroke={INK} strokeWidth={SW} />
      <path d="M6 194 H234" stroke={C.sky} strokeWidth={5} />
      <rect x="20" y="204" width="46" height="30" rx="4" fill={C.dusk} stroke={INK} strokeWidth={2.6} />
      <path d="M26 212 H60 M26 220 H52 M26 228 H58" stroke={C.sky} strokeWidth={2.6} strokeLinecap="round" />
      {/* QR sticker */}
      <rect x="180" y="200" width="42" height="36" rx="3" fill={C.jasmine} stroke={INK} strokeWidth={2.6} />
      {[0, 1, 2, 3, 4].flatMap((r) => [0, 1, 2, 3, 4, 5].map((c) => ((r * 7 + c * 3) % 5 < 2 ? <rect key={`${r}${c}`} x={184 + c * 6} y={204 + r * 6} width={5} height={5} fill={INK} /> : null)))}
      {done && <DoneSeal x={208} y={44} />}
    </svg>
  )
}

export const SHOPS = { plan: BangleStall, save: ChaiCafe, invest: PearlShop, safe: UpiKiosk } as const
