import { memo, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
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
  save: { cx: 0.555, counter: 0.77, mood: 'cycle', s: 0.8 },
  invest: { cx: 0.56, counter: 0.7, mood: 'happy', s: 1 },
  safe: { cx: 0.43, counter: 0.57, mood: 'sly', s: 0.72 },
}
/** blank starburst sign on the painted kiosk: we letter OFFER! on it so it stays translatable */
const OFFER_POS = { x: 0.664, y: 0.1 }
/** the painted stalls have blank sign boards: letter them from i18n so they translate */
const SIGN: Partial<Record<PillarId, { key: string; x: number; y: number; color: string; size: number; rot: number }>> = {
  plan: { key: 'world.bangles', x: 0.56, y: 0.155, color: '#7A2A22', size: 20, rot: 0 },
  save: { key: 'world.chai', x: 0.515, y: 0.15, color: '#E8B04A', size: 17, rot: 0 },
  invest: { key: 'world.pearls', x: 0.625, y: 0.17, color: '#7A2A22', size: 21, rot: 0 },
}
/** painted shopkeepers (from character sheets): idle poses alternate, the hover pose plays the reaction */
const ART_KEEPER: Partial<Record<PillarId, { idle: string[]; hover: string; ref: string; width: number; drop: number }>> = {
  plan: { idle: ['char-seller-arrange'], hover: 'char-seller-arrange', ref: 'char-seller-hold', width: 0.34, drop: 20 },
}

function ArtKeeper({ a, cfg, active, cx, counter, sw, sh }: { a: Record<string, { w: number; h: number }>; cfg: NonNullable<(typeof ART_KEEPER)[PillarId]>; active: boolean; cx: number; counter: number; sw: number; sh: number }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (active) return
    const id = window.setInterval(() => setF((x) => (x + 1) % cfg.idle.length), 1500)
    return () => window.clearInterval(id)
  }, [active, cfg.idle.length])
  const name = active ? cfg.hover : cfg.idle[f]
  const m = a[name]
  const ref = a[cfg.ref]
  if (!m || !ref) return null
  const k = (sw * cfg.width) / ref.w // same sheet scale for every pose
  const w = m.w * k, h = m.h * k
  return (
    <div style={{ position: 'absolute', left: cx * sw - w / 2, top: counter * sh - h + cfg.drop, width: w, height: h, clipPath: `inset(-60px -60px ${cfg.drop}px -60px)` }}>
      <div className={active ? 'anim-float-fast' : 'anim-float'} style={{ width: '100%', height: '100%' }}>
        <img src={`/art/${name}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  )
}

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

/** painted street-wall clusters along both lane edges, three layers deep (far, back, front) so no gaps show.
 * Two building styles (a, b); back/far layers reuse the same art flipped and permuted. */
interface SB { art: string; side: 'left' | 'right'; base: number; h: number; dx: number; flip?: boolean }
const FRONT: SB[] = [
  { art: 'bld-b-left', side: 'left', base: 760, h: 440, dx: 0 },
  { art: 'bld-a-left', side: 'left', base: 1050, h: 430, dx: 0 },
  { art: 'bld-b-left', side: 'left', base: 1340, h: 430, dx: 0 },
  { art: 'bld-a-right', side: 'right', base: 760, h: 440, dx: 0 },
  { art: 'bld-b-right', side: 'right', base: 1050, h: 430, dx: 0 },
  { art: 'bld-a-right', side: 'right', base: 1340, h: 430, dx: 0 },
]
const BACK: SB[] = [
  { art: 'bld-a-right', side: 'left', base: 640, h: 420, dx: 95, flip: true },
  { art: 'bld-b-right', side: 'left', base: 910, h: 430, dx: 120, flip: true },
  { art: 'bld-a-right', side: 'left', base: 1190, h: 430, dx: 100, flip: true },
  { art: 'bld-b-right', side: 'left', base: 1440, h: 430, dx: 120, flip: true },
  { art: 'bld-b-left', side: 'right', base: 640, h: 420, dx: 95, flip: true },
  { art: 'bld-a-left', side: 'right', base: 910, h: 430, dx: 120, flip: true },
  { art: 'bld-b-left', side: 'right', base: 1190, h: 430, dx: 100, flip: true },
  { art: 'bld-a-left', side: 'right', base: 1440, h: 430, dx: 120, flip: true },
]
const FAR: SB[] = [
  { art: 'bld-a-left', side: 'left', base: 560, h: 430, dx: 260 },
  { art: 'bld-b-left', side: 'left', base: 850, h: 430, dx: 270 },
  { art: 'bld-a-left', side: 'left', base: 1140, h: 430, dx: 260 },
  { art: 'bld-b-left', side: 'left', base: 1430, h: 430, dx: 270 },
  { art: 'bld-a-right', side: 'right', base: 560, h: 430, dx: 260 },
  { art: 'bld-b-right', side: 'right', base: 850, h: 430, dx: 270 },
  { art: 'bld-a-right', side: 'right', base: 1140, h: 430, dx: 260 },
  { art: 'bld-b-right', side: 'right', base: 1430, h: 430, dx: 270 },
]
const SIDE_BUILDINGS: SB[] = [...FAR, ...BACK, ...FRONT]

/** plaza tile placement: the medallion (at 50% x, 49% y of the tile) sits exactly on the plaza centre (500, 938) */
const PLAZA = (() => {
  const w = 1287, h = 777
  return { w, h, left: 500 - w * 0.5, top: 938 - h * 0.49 }
})()

/** a painted prop standing on its base line, centred on cx; size comes from the import manifest */
function Prop({ a, name, cx, base, w, z }: { a: Record<string, { w: number; h: number }>; name: string; cx: number; base: number; w: number; z: number }) {
  const m = a[`prop-${name}`]
  if (!m) return null
  const h = Math.round((w * m.h) / m.w)
  return (
    <Obj x={cx - w / 2} y={base - h} w={w} h={h} z={z}>
      <img src={`/art/prop-${name}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
    </Obj>
  )
}

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
      <WorldBackdrop skyline={!!art['bg-skyline']} />
      {hasBuildings && SIDE_BUILDINGS.map((b, i) => {
        const a = art[b.art]
        const bh = b.h
        const bw = Math.round((bh * a.w) / a.h)
        return (
          <Obj key={i} x={b.side === 'left' ? 82 - bw - b.dx : 918 + b.dx} y={b.base - bh} w={bw} h={bh} z={1}>
            <img src={`/art/${b.art}.webp`} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', transform: b.flip ? 'scaleX(-1)' : undefined }} />
          </Obj>
        )
      })}
      {art['deco-rangoli'] && (
        <div style={{ position: 'absolute', left: -1500, top: 580, width: 4000, height: 710, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
          {[-1, 0, 1].map((k) => (
            <img
              key={k}
              src="/art/deco-rangoli.webp"
              alt=""
              draggable={false}
              style={{ position: 'absolute', width: PLAZA.w, height: PLAZA.h, left: PLAZA.left - -1500 + k * PLAZA.w, top: PLAZA.top - 580, transform: k ? 'scaleX(-1)' : undefined }}
            />
          ))}
        </div>
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
            {ART_KEEPER[p.id] && art[ART_KEEPER[p.id]!.ref] ? (
              <ArtKeeper a={art} cfg={ART_KEEPER[p.id]!} active={react[p.id]} cx={k.cx} counter={k.counter} sw={sw} sh={sh} />
            ) : (
              <div style={{ position: 'absolute', left: k.cx * sw - tw / 2, top: k.counter * sh - visible, width: tw, height: th, clipPath: `inset(-40px -40px ${th - visible}px -40px)` }}>
                <div key={String(react[p.id])} className={react[p.id] ? 'anim-squash' : 'anim-bob'} style={{ width: '100%', height: '100%', transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
                  <Toon look={LOOKS[KEEPER_LOOK[p.id]]} mood={k.mood} excited={react[p.id]} wave={p.id === 'plan' && !react[p.id]} shifty={p.id === 'safe'} width={tw} height={th} />
                </div>
              </div>
            )}
            {SIGN[p.id] && (
              <div className="font-sign lang-fit" style={{ position: 'absolute', left: SIGN[p.id]!.x * sw, top: SIGN[p.id]!.y * sh, transform: `translate(-50%,-50%) rotate(${SIGN[p.id]!.rot}deg)`, fontSize: SIGN[p.id]!.size, color: SIGN[p.id]!.color, whiteSpace: 'nowrap', textShadow: SIGN[p.id]!.color === '#E8B04A' ? '1px 1px 0 #2B1A17' : '1px 1px 0 rgba(255,243,214,.7)' }}>
                {t(SIGN[p.id]!.key)}
              </div>
            )}
            {p.id === 'safe' && (
              <div className="font-sign anim-blink" style={{ position: 'absolute', left: OFFER_POS.x * sw, top: OFFER_POS.y * sh, transform: 'translate(-50%,-50%) rotate(-5deg)', fontSize: 17, color: '#D8503A', textShadow: '1px 1px 0 #2B1A17, -1px -1px 0 #2B1A17, 1px -1px 0 #2B1A17, -1px 1px 0 #2B1A17', whiteSpace: 'nowrap' }}>
                {t('world.offer')}
              </div>
            )}
            {done[p.id] && <Seal />}
          </Obj>
        )
      })}

      {/* decor: painted props when present (/art/prop-*.webp), SVG fallbacks otherwise */}
      {art['prop-tree'] ? (
        <>
          <Prop a={art} name="tree" cx={70} base={1332} w={280} z={1} />
          <Prop a={art} name="crates" cx={210} base={1324} w={92} z={7} />
          <Prop a={art} name="bicycle" cx={318} base={1318} w={136} z={8} />
          <Prop a={art} name="pot-big" cx={440} base={1336} w={118} z={2000} />
          <Prop a={art} name="pot-tall" cx={606} base={1344} w={74} z={2000} />
          <Prop a={art} name="pot-small" cx={528} base={1350} w={50} z={2000} />
          <Prop a={art} name="lamp" cx={112} base={822} w={52} z={822} />
          <Prop a={art} name="lamp" cx={888} base={822} w={52} z={822} />
          <Prop a={art} name="waterpot" cx={610} base={1240} w={62} z={1240} />
          <Prop a={art} name="lights" cx={330} base={1176} w={104} z={3} />
          <Prop a={art} name="cart" cx={880} base={1322} w={222} z={1300} />
          <Obj x={720} y={1206} w={66} h={99} z={1304}><Toon look={LOOKS.nani} mood="happy" wave flip x={0} y={0} width={66} height={99} /></Obj>
        </>
      ) : (
        <>
          <Obj x={-60} y={1175} w={220} h={220} z={1}><Tree /></Obj>
          <Obj x={92} y={1222} w={140} h={86} z={6}><Bicycle /></Obj>
          <Obj x={24} y={1262} w={86} h={66} z={7}><Crates /></Obj>
          <Obj x={846} y={1152} w={70} h={105} z={1210}><Toon look={LOOKS.nani} mood="happy" wave x={0} y={0} width={70} height={105} /></Obj>
          <Obj x={774} y={1140} w={206} h={164} z={1300}><FlowerCart /></Obj>
          <Obj x={420} y={1262} w={84} h={84} z={2000}><PotPlant /></Obj>
          <Obj x={602} y={1268} w={72} h={72} z={2000}><PotPlant /></Obj>
        </>
      )}
      {PIGEONS.map((p, i) => (
        <Obj key={i} x={p.x} y={p.y} w={44} h={38} z={p.y}>
          {art['prop-pigeon-a'] ? (
            <img src={`/art/prop-pigeon-${i % 2 ? 'b' : 'a'}.webp`} alt="" draggable={false} className="anim-hop" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', transform: p.f ? 'scaleX(-1)' : undefined, animationDelay: `${p.d}s` }} />
          ) : (
            <Pigeon flip={p.f} className="anim-hop" style={{ width: '100%', height: '100%', animationDelay: `${p.d}s` }} />
          )}
        </Obj>
      ))}
      {art['prop-pigeon-fly'] && (
        <div style={{ position: 'absolute', left: 0, top: 640, width: 70, zIndex: 4900, pointerEvents: 'none', animation: 'pigeon-cross 16s steps(80) 4s infinite' }}>
          <img src="/art/prop-pigeon-fly.webp" alt="" draggable={false} style={{ width: '100%', display: 'block', animation: 'flap .3s steps(2) infinite' }} />
        </div>
      )}

      {children}

      {showOverhead && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5000, pointerEvents: 'none' }}>
          <Overhead />
        </div>
      )}
    </div>
  )
})
