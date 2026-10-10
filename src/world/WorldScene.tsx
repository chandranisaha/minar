import { memo, type CSSProperties, type ReactNode } from 'react'
import { PILLARS, type PillarId } from '../content/data'
import { CharminarSvg } from '../art/Charminar'
import { SHOPS } from '../art/Shops'
import { Bicycle, Crates, FlowerCart, Overhead, Pigeon, PotPlant, Tree, WorldBackdrop } from '../art/Scenery'
import { LOOKS, Toon } from '../art/Toon'
import { ArtSlot } from '../art/ArtSlot'
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

const PIGEONS = [
  { x: 405, y: 800, f: false, d: 0 }, { x: 470, y: 838, f: true, d: 1.1 }, { x: 600, y: 812, f: false, d: 2.2 },
  { x: 250, y: 930, f: true, d: 0.7 }, { x: 740, y: 972, f: false, d: 1.7 },
]

export const WorldScene = memo(function WorldScene({ lamps, done, react, doorGlow, children, showOverhead = true }: SceneProps) {
  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <WorldBackdrop />

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
                border: `5px solid ${done[p.id] ? '#D9A520' : lit ? '#FFF3D6' : '#2B1A17'}`,
                background: done[p.id] ? 'rgba(217,165,32,.45)' : lit ? 'rgba(255,225,120,.75)' : 'rgba(255,243,214,.28)',
                boxShadow: lit || done[p.id] ? '0 0 26px 10px rgba(255,210,90,.75)' : 'inset 0 0 0 3px rgba(242,140,40,.55)',
                opacity: lit || done[p.id] ? 1 : 0.8,
              }}
            />
          </div>
        )
      })}

      {/* Charminar */}
      <Obj x={CHARMINAR.x} y={CHARMINAR.y} w={CHARMINAR.w} h={CHARMINAR.h} z={CHARMINAR.base}>
        <ArtSlot name="charminar" fallback={<CharminarSvg lamps={lamps} style={{ width: '100%', height: '100%' }} />} />
      </Obj>

      {/* the four pillar doorways */}
      {PILLARS.map((p) => {
        const L = SHOP_LAYOUT[p.id]
        const Shop = SHOPS[p.id]
        return (
          <Obj key={p.id} x={L.x} y={L.y} w={L.w} h={L.h} z={L.base}>
            <ArtSlot name={`shop-${p.id}`} fallback={<Shop react={react[p.id]} done={done[p.id]} />} />
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
