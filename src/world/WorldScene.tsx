import { memo, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PILLARS, type PillarId } from '../content/data'
import { CharminarSvg } from '../art/Charminar'
import { SHOPS } from '../art/Shops'
import { Bicycle, Crates, FlowerCart, Overhead, Pigeon, PotPlant, Tree, WorldBackdrop } from '../art/Scenery'
import { LOOKS, Toon } from '../art/Toon'
import { useManifest } from '../art/ArtSlot'
import { CHARMINAR, H, SHOP_LAYOUT, W } from './layout'

const Obj = ({ x, y, w, h, z, children, style }: { x: number; y: number; w: number; h: number; z: number; children: ReactNode; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z, pointerEvents: 'none', ...style }}>{children}</div>
)

export interface SceneProps {
  lamps: boolean[]
  done: Record<PillarId, boolean>
  react: Record<PillarId, boolean>
  /** glowing ground ring at each doorway (lights up one by one in the story) */
  doorGlow: Record<PillarId, boolean>
  children?: ReactNode
  showOverhead?: boolean
}

/** where the four finial lamps sit inside the painted Charminar (fractions of the trimmed image), by pillar order */
const LAMP_FRAC = [{ x: 0.223, y: 0.019 }, { x: 0.8, y: 0.019 }, { x: 0.31, y: 0.147 }, { x: 0.708, y: 0.147 }]
/** shopkeeper placement over painted stalls: centre x and counter-top y, as fractions of the stall image */
const KEEPER: Record<PillarId, { cx: number; counter: number; mood: 'happy' | 'worried' | 'sly' | 'cycle'; s: number }> = {
  plan: { cx: 0.47, counter: 0.7, mood: 'happy', s: 1 },
  save: { cx: 0.5, counter: 0.7, mood: 'cycle', s: 1 },
  invest: { cx: 0.56, counter: 0.7, mood: 'happy', s: 1 },
  safe: { cx: 0.43, counter: 0.57, mood: 'sly', s: 0.72 },
}
/** blank starburst sign on the painted kiosk: we letter OFFER! on it so it stays translatable */
const OFFER_POS = { x: 0.664, y: 0.1 }
const KEEPER_LOOK: Record<PillarId, string> = { plan: 'bangle', save: 'chai', invest: 'pearl', safe: 'upi' }

function Lamp({ lit, x, y }: { lit: boolean; x: number; y: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
      {lit ? (
        <>
          <div className="anim-twinkle" style={{ position: 'absolute', left: -60, top: -60, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,241,176,.95) 0, rgba(255,201,74,.55) 35%, rgba(255,201,74,0) 70%)' }} />
          {[0, 45, 90, 135].map((a) => (
            <div key={a} className="anim-twinkle" style={{ position: 'absolute', left: -1.5, top: -26, width: 3, height: 52, borderRadius: 2, background: '#FFE9A0', transform: `rotate(${a}deg)` }} />
          ))}
        </>
      ) : (
        <div style={{ position: 'absolute', left: -11, top: -11, width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #A39284, #6E5E52)', border: '2.5px solid #2B1A17' }} />
      )}
    </div>
  )
}

function Seal() {
  return (
    <div className="anim-pop" style={{ position: 'absolute', right: 8, top: 6, width: 38, height: 38, borderRadius: '50%', background: '#D9A520', border: '4px solid #2B1A17', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 3px 0 #2B1A17' }}>
      <svg width="22" height="22" viewBox="0 0 22 22"><path d="M4 11 l5 6 l10 -12" stroke="#2B1A17" strokeWidth="4.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  )
}

/** painted street-wall clusters along both lane edges; two building styles (a, b) alternate */
const SIDE_BUILDINGS: { art: string; side: 'left' | 'right'; base: number; h: number }[] = [
  { art: 'bld-b-left', side: 'left', base: 760, h: 440 },
  { art: 'bld-a-left', side: 'left', base: 1050, h: 430 },
  { art: 'bld-b-left', side: 'left', base: 1340, h: 430 },
  { art: 'bld-a-right', side: 'right', base: 760, h: 440 },
  { art: 'bld-b-right', side: 'right', base: 1050, h: 430 },
  { art: 'bld-a-right', side: 'right', base: 1340, h: 430 },
]

const PIGEONS = [
  { x: 405, y: 800, f: false, d: 0 }, { x: 470, y: 838, f: true, d: 1.1 }, { x: 600, y: 812, f: false, d: 2.2 },
  { x: 250, y: 930, f: true, d: 0.7 }, { x: 740, y: 972, f: false, d: 1.7 },
]

export const WorldScene = memo(function WorldScene({ lamps, done, react, doorGlow, children, showOverhead = true }: SceneProps) {
  const art = useManifest()
  const { t } = useTranslation()
  const hasBuildings = SIDE_BUILDINGS.every((b) => !!art[b.art])
  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <WorldBackdrop skyline={!!art['bg-skyline']} buildings={hasBuildings} />
      {hasBuildings && SIDE_BUILDINGS.map((b, i) => {
        const a = art[b.art]
        const bh = b.h
        const bw = Math.round((bh * a.w) / a.h)
        return (
          <Obj key={i} x={b.side === 'left' ? 82 - bw : 918} y={b.base - bh} w={bw} h={bh} z={b.base - 400}>
            <img src={`/art/${b.art}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
          </Obj>
        )
      })}
      {art['deco-rangoli'] && (
        <img src="/art/deco-rangoli.webp" alt="" draggable={false} style={{ position: 'absolute', left: 190, top: 770, width: 620, height: 374, zIndex: 3, pointerEvents: 'none', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 52%, transparent 71%)', maskImage: 'radial-gradient(ellipse at center, #000 52%, transparent 71%)', opacity: 0.95 }} />
      )}

      {/* door rings on the ground */}
      {PILLARS.map((p) => {
        const d = SHOP_LAYOUT[p.id].door
        const lit = doorGlow[p.id]
        return (
          <div key={p.id} style={{ position: 'absolute', left: d.x - 62, top: d.y - 28, width: 124, height: 56, zIndex: 2, pointerEvents: 'none' }}>
            <div
              className={lit ? 'anim-pulse' : undefined}
              style={{
                width: '100%', height: '100%', borderRadius: '50%',
                border: `4px solid ${done[p.id] ? '#D9A520' : lit ? '#FFF3D6' : 'rgba(43,26,23,.5)'}`,
                background: done[p.id] ? 'rgba(217,165,32,.45)' : lit ? 'rgba(255,225,120,.75)' : 'radial-gradient(ellipse, rgba(255,230,150,.5), rgba(255,243,214,.12))',
                boxShadow: lit || done[p.id] ? '0 0 26px 10px rgba(255,210,90,.75)' : '0 0 14px 2px rgba(255,200,90,.45)',
                opacity: lit || done[p.id] ? 1 : 0.8,
              }}
            />
          </div>
        )
      })}

      {/* Charminar: painted art if /art/charminar.webp exists (lamps overlaid), else the SVG fallback */}
      {art.charminar ? (
        (() => {
          const cw = 450
          const ch = Math.round((cw * art.charminar.h) / art.charminar.w)
          return (
            <Obj x={W / 2 - cw / 2} y={CHARMINAR.base + 8 - ch} w={cw} h={ch} z={CHARMINAR.base}>
              <img src="/art/charminar.webp" alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
              {LAMP_FRAC.map((f, i) => (
                <Lamp key={i} lit={lamps[i]} x={f.x * cw} y={f.y * ch} />
              ))}
            </Obj>
          )
        })()
      ) : (
        <Obj x={CHARMINAR.x} y={CHARMINAR.y} w={CHARMINAR.w} h={CHARMINAR.h} z={CHARMINAR.base}>
          <CharminarSvg lamps={lamps} style={{ width: '100%', height: '100%' }} />
        </Obj>
      )}

      {/* the four pillar doorways */}
      {PILLARS.map((p) => {
        const L = SHOP_LAYOUT[p.id]
        const Shop = SHOPS[p.id]
        const a = art[`shop-${p.id}`]
        if (!a) {
          return (
            <Obj key={p.id} x={L.x} y={L.y} w={L.w} h={L.h} z={L.base}>
              <Shop react={react[p.id]} done={done[p.id]} />
            </Obj>
          )
        }
        const sw = 270
        const sh = Math.round((sw * a.h) / a.w)
        const k = KEEPER[p.id]
        const tw = Math.round(92 * k.s), th = Math.round(138 * k.s), visible = Math.round(104 * k.s)
        return (
          <Obj key={p.id} x={L.x + L.w / 2 - sw / 2} y={L.base + 8 - sh} w={sw} h={sh} z={L.base}>
            <img src={`/art/shop-${p.id}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', left: k.cx * sw - tw / 2, top: k.counter * sh - visible, width: tw, height: th, clipPath: `inset(-40px -40px ${th - visible}px -40px)` }}>
              <div key={String(react[p.id])} className={react[p.id] ? 'anim-squash' : 'anim-bob'} style={{ width: '100%', height: '100%', transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
                <Toon look={LOOKS[KEEPER_LOOK[p.id]]} mood={k.mood} excited={react[p.id]} wave={p.id === 'plan' && !react[p.id]} shifty={p.id === 'safe'} width={tw} height={th} />
              </div>
            </div>
            {p.id === 'safe' && (
              <div className="font-sign anim-blink" style={{ position: 'absolute', left: OFFER_POS.x * sw, top: OFFER_POS.y * sh, transform: 'translate(-50%,-50%) rotate(-5deg)', fontSize: 17, color: '#D8503A', textShadow: '1px 1px 0 #2B1A17, -1px -1px 0 #2B1A17, 1px -1px 0 #2B1A17, -1px 1px 0 #2B1A17', whiteSpace: 'nowrap' }}>
                {t('world.offer')}
              </div>
            )}
            {done[p.id] && <Seal />}
          </Obj>
        )
      })}

      {/* decor */}
      <Obj x={-60} y={1175} w={220} h={220} z={5}><Tree /></Obj>
      <Obj x={92} y={1222} w={140} h={86} z={6}><Bicycle /></Obj>
      <Obj x={24} y={1262} w={86} h={66} z={7}><Crates /></Obj>
      <Obj x={846} y={1152} w={70} h={105} z={1210}><Toon look={LOOKS.nani} mood="happy" wave x={0} y={0} width={70} height={105} /></Obj>
      <Obj x={774} y={1140} w={206} h={164} z={1300}><FlowerCart /></Obj>
      <Obj x={420} y={1262} w={84} h={84} z={2000}><PotPlant /></Obj>
      <Obj x={602} y={1268} w={72} h={72} z={2000}><PotPlant /></Obj>
      {PIGEONS.map((p, i) => (
        <Obj key={i} x={p.x} y={p.y} w={38} h={32} z={p.y}>
          <Pigeon flip={p.f} className="anim-hop" style={{ width: '100%', height: '100%', animationDelay: `${p.d}s` }} />
        </Obj>
      ))}

      {children}

      {showOverhead && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5000, pointerEvents: 'none' }}>
          <Overhead />
        </div>
      )}
    </div>
  )
})
