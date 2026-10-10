import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import EasyStar from 'easystarjs'
import { useTranslation } from 'react-i18next'
import { PILLARS, type PillarId } from '../content/data'
import { useGame, useLite } from '../store/game'
import { useIris } from '../components/Iris'
import { WorldScene } from './WorldScene'
import { PillarSignboard, StartHereTag } from './Signboard'
import { joy, useTouchUi } from './input'
import { COLS, DOOR_RADIUS, H, ROWS, SHOP_LAYOUT, START, T, W, canStand, cellOf, grid, nearestWalkable, walkable } from './layout'
import { C, alpha } from '../art/palette'

type Dir = 'down' | 'up' | 'left' | 'right'
const SPEED = 235
const HERO_W = 88
const HERO_H = 109
const frameSrc = (d: Dir, f: number) => `/art/chibi/${d}_${f}.png`

const es = new EasyStar.js()
es.setGrid(grid)
es.setAcceptableTiles([0])
es.enableDiagonals()
es.disableCornerCutting()
es.enableSync()

const pathTo = (sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] => {
  const s = nearestWalkable(sx, sy)
  const e = nearestWalkable(tx, ty)
  let out: { x: number; y: number }[] = []
  es.findPath(s.c, s.r, e.c, e.r, (p) => {
    if (p) out = p.slice(1).map((n) => ({ x: n.x * T + T / 2, y: n.y * T + T / 2 }))
  })
  es.calculate()
  if (out.length && walkable(tx, ty)) out[out.length - 1] = { x: tx, y: ty }
  return out
}

export function Overworld() {
  const { t } = useTranslation()
  const iris = useIris()
  const touchUi = useTouchUi()
  const lite = useLite()
  const completed = useGame((s) => s.completedPillars)
  const celebrated = useGame((s) => s.celebrated)

  const box = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const heroEl = useRef<HTMLDivElement>(null)
  const heroImg = useRef<HTMLImageElement>(null)
  const heroBob = useRef<HTMLDivElement>(null)

  const [view, setView] = useState({ w: 390, h: 844, s: 0.75 })
  const [near, setNear] = useState<PillarId | null>(null)
  const [hover, setHover] = useState<PillarId | null>(null)
  const [pending, setPending] = useState<PillarId | null>(null)
  const [moved, setMoved] = useState(false)
  const [reactKey, setReactKey] = useState<Record<PillarId, number>>({ plan: 0, save: 0, invest: 0, safe: 0 })

  const st = useRef({
    x: START.x, y: START.y, path: [] as { x: number; y: number }[], dir: 'down' as Dir, t: 0, moving: false,
    camX: 0, camY: 0, keys: new Set<string>(), pending: null as PillarId | null, near: null as PillarId | null, s: 0.75, vw: 390, vh: 844,
    entering: false, down: false, lastRepath: 0, intro: 1.8,
  })

  // layout / scale
  useEffect(() => {
    const el = box.current!
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight
      const s = Math.min(1.5, Math.max(0.6, Math.min(w / 520, h / 760)))
      st.current.s = s; st.current.vw = w; st.current.vh = h
      setView({ w, h, s })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const enter = useCallback(
    (id: PillarId) => {
      const S = st.current
      if (S.entering) return
      S.entering = true
      setReactKey((k) => ({ ...k, [id]: k[id] + 1 }))
      const d = SHOP_LAYOUT[id].door
      const sx = (d.x - S.camX) * S.s
      const sy = (d.y - S.camY) * S.s
      window.setTimeout(() => iris.go(`/play/${id}`, { x: sx, y: sy }), 520)
      window.setTimeout(() => { S.entering = false }, 2400)
    },
    [iris],
  )

  const walkTo = useCallback((tx: number, ty: number, pend: PillarId | null) => {
    const S = st.current
    S.path = pathTo(S.x, S.y, tx, ty)
    S.pending = pend
    setPending(pend)
    setMoved(true)
  }, [])

  const goToShop = useCallback(
    (id: PillarId) => {
      const d = SHOP_LAYOUT[id].door
      const S = st.current
      if (Math.hypot(S.x - d.x, S.y - d.y) < DOOR_RADIUS) enter(id)
      else walkTo(d.x, d.y, id)
    },
    [enter, walkTo],
  )

  // main loop
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const S = st.current
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let dx = 0, dy = 0
      const k = S.keys
      if (k.has('ArrowLeft') || k.has('a')) dx -= 1
      if (k.has('ArrowRight') || k.has('d')) dx += 1
      if (k.has('ArrowUp') || k.has('w')) dy -= 1
      if (k.has('ArrowDown') || k.has('s')) dy += 1
      let analog = 1
      if (!dx && !dy && joy.active) { dx = joy.x; dy = joy.y; analog = Math.min(1, Math.hypot(dx, dy)) }
      let moving = false
      if ((dx || dy) && !S.entering) {
        S.path = []
        S.pending = null
        const len = Math.hypot(dx, dy)
        const mx = (dx / len) * SPEED * analog * dt, my = (dy / len) * SPEED * analog * dt
        if (canStand(S.x + mx, S.y)) S.x += mx
        if (canStand(S.x, S.y + my)) S.y += my
        moving = true
        if (Math.abs(dx) > Math.abs(dy) || (dx && !dy)) S.dir = dx > 0 ? 'right' : 'left'
        else S.dir = dy > 0 ? 'down' : 'up'
      } else if (S.path.length && !S.entering) {
        const tgt = S.path[0]
        const vx = tgt.x - S.x, vy = tgt.y - S.y
        const dist = Math.hypot(vx, vy)
        const step = SPEED * dt
        if (dist <= step) {
          S.x = tgt.x; S.y = tgt.y; S.path.shift()
        } else {
          S.x += (vx / dist) * step; S.y += (vy / dist) * step
        }
        if (dist > 0.5) {
          if (Math.abs(vx) > Math.abs(vy) * 0.9) S.dir = vx > 0 ? 'right' : 'left'
          else S.dir = vy > 0 ? 'down' : 'up'
        }
        moving = true
        if (!S.path.length && S.pending) {
          const id = S.pending
          S.pending = null
          enter(id)
        }
      }
      S.moving = moving
      if (moving) S.t += dt

      // nearest door
      let n: PillarId | null = null
      for (const p of PILLARS) {
        const d = SHOP_LAYOUT[p.id].door
        if (Math.hypot(S.x - d.x, S.y - d.y) < DOOR_RADIUS) n = p.id
      }
      if (n !== S.near) {
        S.near = n
        setNear(n)
        if (n) setReactKey((r) => ({ ...r, [n!]: r[n!] + 1 }))
      }

      // hero DOM
      const frame = moving ? Math.floor(S.t * 6) % 2 : 0
      if (heroEl.current) {
        heroEl.current.style.transform = `translate3d(${S.x - HERO_W / 2}px, ${S.y - HERO_H}px, 0)`
        heroEl.current.style.zIndex = String(Math.floor(S.y))
      }
      if (heroImg.current) {
        const src = frameSrc(S.dir, frame)
        if (!heroImg.current.src.endsWith(src)) heroImg.current.src = src
      }
      if (heroBob.current) heroBob.current.className = moving ? 'anim-walk' : 'anim-idle'

      // camera follows the hero
      const vwW = S.vw / S.s, vhW = S.vh / S.s
      if (S.intro > 0 && !moving) S.intro -= dt
      else S.intro = 0
      const fx = S.intro > 0 ? W / 2 : S.x
      const fy = S.intro > 0 ? 500 : S.y
      // narrow screens clamp to the world; wide screens centre it (margins are filled by extended backdrop art)
      const tx = vwW >= W ? (W - vwW) / 2 : Math.max(0, Math.min(W - vwW, fx - vwW / 2))
      const ty = vhW >= H ? (H - vhW) / 2 : Math.max(0, Math.min(H - vhW, fy - vhW * (S.intro > 0 ? 0.5 : 0.58)))
      const lerp = Math.min(1, dt * (lite ? 9 : 5.5))
      S.camX += (tx - S.camX) * lerp
      S.camY += (ty - S.camY) * lerp
      if (world.current) world.current.style.transform = `scale(${S.s}) translate3d(${-S.camX}px, ${-S.camY}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    // snap camera on first frame
    const S0 = st.current
    S0.camX = W / 2 - S0.vw / S0.s / 2
    S0.camY = Math.max(0, Math.min(H - S0.vh / S0.s, 500 - (S0.vh / S0.s) * 0.5))
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [enter, lite])

  // keyboard
  useEffect(() => {
    const norm = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key)
    const dn = (e: KeyboardEvent) => {
      const key = norm(e)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'].includes(key)) {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return
        e.preventDefault()
        st.current.keys.add(key)
        setMoved(true)
      } else if (key === 'Enter' && st.current.near && !(document.activeElement instanceof HTMLButtonElement)) {
        enter(st.current.near)
      }
    }
    const up = (e: KeyboardEvent) => st.current.keys.delete(norm(e))
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [enter])

  // tap / drag to walk
  const toWorld = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    const S = st.current
    return { x: S.camX + (e.clientX - r.left) / S.s, y: S.camY + (e.clientY - r.top) / S.s }
  }
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const p = toWorld(e)
    st.current.down = true
    walkTo(p.x, p.y, null)
  }
  const onMove = (e: React.PointerEvent) => {
    const S = st.current
    if (!S.down) return
    const now = performance.now()
    if (now - S.lastRepath < 140) return
    S.lastRepath = now
    const p = toWorld(e)
    walkTo(p.x, p.y, null)
  }
  const onUp = () => { st.current.down = false }

  const doneMap = useMemo(() => Object.fromEntries(PILLARS.map((p) => [p.id, completed.includes(p.id)])) as Record<PillarId, boolean>, [completed])
  const lamps = useMemo(() => PILLARS.map((p) => completed.includes(p.id)), [completed])
  const active = hover ?? pending ?? near
  const reactMap = useMemo(
    () => Object.fromEntries(PILLARS.map((p) => [p.id, active === p.id])) as Record<PillarId, boolean>,
    [active],
  )
  const glow = useMemo(() => Object.fromEntries(PILLARS.map((p) => [p.id, active === p.id])) as Record<PillarId, boolean>, [active])
  void reactKey; void celebrated; void COLS; void ROWS; void cellOf

  return (
    <div
      ref={box}
      className="absolute inset-0 touch-none overflow-hidden"
      style={{ background: C.ink, cursor: 'pointer' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onScroll={(e) => { e.currentTarget.scrollTop = 0; e.currentTarget.scrollLeft = 0 }}
    >
      <div ref={world} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', willChange: 'transform', ['--s' as string]: view.s }}>
        <WorldScene lamps={lamps} done={doneMap} react={reactMap} doorGlow={glow}>
          {/* hero */}
          <div ref={heroEl} style={{ position: 'absolute', left: 0, top: 0, width: HERO_W, height: HERO_H, pointerEvents: 'none', willChange: 'transform' }}>
            <div style={{ position: 'absolute', left: 8, right: 8, bottom: -4, height: 14, borderRadius: '50%', background: alpha(C.ink,.3) }} />
            <div ref={heroBob} className="anim-idle" style={{ width: '100%', height: '100%' }}>
              <img ref={heroImg} src={frameSrc('down', 0)} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', filter: `drop-shadow(0 0 0 ${C.ink})` }} />
            </div>
          </div>

          {/* hotspots + signboards */}
          {PILLARS.map((p) => {
            const L = SHOP_LAYOUT[p.id]
            const show = active === p.id
            const first = p.id === 'plan' && completed.length === 0 && !moved
            return (
              <div key={p.id}>
                <button
                  type="button"
                  aria-label={`${t(`pillars.${p.id}.name`)}. ${t(`pillars.${p.id}.hook`)}`}
                  onClick={(e) => { e.stopPropagation(); goToShop(p.id) }}
                  onPointerEnter={() => setHover(p.id)}
                  onPointerLeave={() => setHover((h) => (h === p.id ? null : h))}
                  onPointerDown={(e) => { e.stopPropagation(); setHover(p.id); if (e.pointerType === 'touch') window.setTimeout(() => setHover((h) => (h === p.id ? null : h)), 2200) }}
                  onFocus={() => setHover(p.id)}
                  onBlur={() => setHover((h) => (h === p.id ? null : h))}
                  style={{ position: 'absolute', left: L.x, top: L.y, width: L.w, height: L.h, zIndex: 3000, background: 'transparent', border: 0, borderRadius: 18, cursor: 'pointer' }}
                />
                {(show || first) && (
                  <div
                    style={{ position: 'absolute', left: L.x < 500 ? L.x : L.x + L.w, top: L.y + 4, zIndex: 4000, transform: `translate(${L.x < 500 ? '0' : '-100%'},-100%) scale(${1 / view.s})`, transformOrigin: L.x < 500 ? '0 100%' : '100% 100%', pointerEvents: 'none' }}
                  >
                    {show ? (
                      <div className="anim-unfurl" key={`${p.id}-${reactKey[p.id]}`}>
                        <PillarSignboard pillar={p} done={doneMap[p.id]} leftSide={L.x < 500} />
                      </div>
                    ) : (
                      <StartHereTag leftSide={L.x < 500} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </WorldScene>
      </div>

      {/* keyboard / touch "Enter" prompt when standing at a doorway */}
      {near && !pending && (
        <div className="pointer-events-none absolute inset-x-0 z-[var(--z-scene)] flex justify-center" style={{ bottom: touchUi ? 188 : 96 }}>
          <button type="button" className="ink-btn pink pointer-events-auto anim-pop" onClick={() => enter(near)}>
            ▶ {t('hud.enter')}: {t(`pillars.${near}.name`)}
          </button>
        </div>
      )}
    </div>
  )
}
