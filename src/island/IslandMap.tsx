import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PillarId } from '../content/data'
import { useGame } from '../store/game'
import { ArtSlot, useManifest } from '../art/ArtSlot'
import raw from '../content/island.json'
import { Gate, IslandArt, Kiosk } from './IslandArt'
import { Joystick } from './Joystick'
import { joy, useTouchUi } from './input'
import { NODES, WORLD, nodeById, px, type IslandNode, type NodeId } from './data'
import { canStand, grid, COLS, ROWS, T, pathTo, setGateOpen, gateEntry } from './walk'

type Dir = 'down' | 'up' | 'left' | 'right'
const SPEED = 560 // world px / second
const HERO_H = 190
const HERO_W = 150
const DOOR_R = 120 // stepping this close to a place offers to go in
const WATER = '#41B9E4' // matches the painted water at the island edge

type AvSizes = Record<string, number[]>
let avSizes: AvSizes | null = null
function useAvatarSizes() {
  const [m, setM] = useState<AvSizes | null>(avSizes)
  useEffect(() => { if (!avSizes) void fetch('/art/avatar/sizes.json').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) { avSizes = j; setM(j) } }).catch(() => {}) }, [])
  return m
}
/** avatar frame for a heading: down/up use front/back, left is the right-facing walk mirrored */
function avatarFrame(dir: Dir, moving: boolean, f: number): { n: number; flip: boolean } {
  if (dir === 'down') return { n: moving ? 4 + f : 0, flip: false }
  if (dir === 'up') return { n: moving ? 6 + f : 1, flip: false }
  return { n: moving ? 2 + f : 2, flip: dir === 'left' }
}

let lastPos: number[] | null = null // survives entering a pillar and coming back

/** A flag on a pole: white while incomplete, antique gold with a tick once the place is done. */
function Marker({ done, pulse, locked }: { done: boolean; pulse?: boolean; locked?: boolean }) {
  return (
    <svg width="90" height="150" viewBox="0 0 90 150" style={{ overflow: 'visible', display: 'block' }} aria-hidden>
      <ellipse cx="22" cy="144" rx="22" ry="7" fill="#3A2A24" opacity=".2" />
      {pulse && <ellipse className="idle ring" cx="22" cy="142" rx="40" ry="14" fill="none" stroke="#D9573F" strokeWidth="3" />}
      <path d="M22 144 V18" stroke="#3A2A24" strokeWidth="5" strokeLinecap="round" />
      <circle cx="22" cy="14" r="6" fill="#D9A520" stroke="#3A2A24" strokeWidth="2" />
      <g className="idle flag" style={{ transformOrigin: '24px 24px' }}>
        <path d="M24 24 H80 Q70 40 80 56 H24Z" fill={done ? '#D9A520' : locked ? '#CFC7B3' : '#FBF6EA'} stroke="#3A2A24" strokeWidth="2.4" strokeLinejoin="round" />
        {done && <path d="M40 42 l8 8 l16 -18" fill="none" stroke="#3A2A24" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </svg>
  )
}

export function IslandMap() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const completed = useGame((s) => s.completedPillars)
  const setCelebrated = useGame((s) => s.setCelebrated)
  const allDone = completed.length >= 4
  const touch = useTouchUi()
  setGateOpen(allDone) // closed gate = solid, open gate = walk through
  const art = useManifest()
  const persona = useGame((q) => q.persona) ?? 'school'
  const avatar = useAvatarSizes()
  const debug = useMemo(() => new URLSearchParams(window.location.search).has('debug'), [])

  const box = useRef<HTMLDivElement>(null)
  const worldEl = useRef<HTMLDivElement>(null)
  const heroEl = useRef<HTMLDivElement>(null)
  const heroImg = useRef<HTMLImageElement>(null)
  const heroBob = useRef<HTMLDivElement>(null)
  const startPt = lastPos ?? px([nodeById('dock').x, nodeById('dock').y])

  const [zoom, setZoom] = useState(1)
  const [near, setNear] = useState<NodeId | null>(null)
  const [hover, setHover] = useState<NodeId | null>(null)
  const [card, setCard] = useState<NodeId | null>(null)
  const [firstTime, setFirstTime] = useState(true)
  const [vpTick, setVpTick] = useState(0)

  const S = useRef({
    x: startPt[0], y: startPt[1], path: [] as { x: number; y: number }[], dir: 'down' as Dir, t: 0,
    camX: 0, camY: 0, keys: new Set<string>(), pending: null as NodeId | null, near: null as NodeId | null,
    avatar: null as AvSizes | null, persona: 'school', fit: 0.4, zoom: 1, scale: 0, vw: 390, vh: 844, maxZoom: 2, ptrs: new Map<number, { x: number; y: number }>(), pinch: 0, down: false, lastRepath: 0, dismissed: null as NodeId | null, cardOpen: false, cardFor: null as NodeId | null, gateOpen: false, through: false, ready: false,
  })
  S.current.cardOpen = card !== null
  S.current.avatar = avatar
  S.current.gateOpen = allDone
  S.current.persona = persona
  S.current.cardFor = card

  /* ---------------------------------------------------------------- viewport / scale */
  useEffect(() => {
    const el = box.current!
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight
      const s = S.current
      // desktop: the whole island fits. phone: fit by height and follow the hero sideways.
      s.fit = w < 700 ? h / WORLD.h : Math.min(w / WORLD.w, h / WORLD.h)
      s.vw = w; s.vh = h
      setVpTick((n) => n + 1) // re-render so label scale and zoom cap update
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { S.current.zoom = zoom }, [zoom])
  // zoom is capped by how sharp the painting is: source px per world px, times the screen's pixel ratio
  const srcW = art['island-bg']?.w
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1
    const crisp = srcW ? ((srcW / WORLD.w) * dpr) / (S.current.fit || 0.4) : 2
    S.current.maxZoom = Math.max(1, Math.min(3, crisp))
    setZoom((z) => Math.min(z, S.current.maxZoom))
  }, [srcW, vpTick])

  /* ---------------------------------------------------------------- walking */
  const walkTo = useCallback((tx: number, ty: number, pend: NodeId | null) => {
    const s = S.current
    s.path = pathTo(s.x, s.y, tx, ty)
    s.pending = pend
    setCard(null)
    setFirstTime(false)
  }, [])

  const openCard = useCallback((id: NodeId) => { S.current.dismissed = null; setCard(id) }, [])

  const goToPlace = useCallback((n: IslandNode) => {
    const [dx, dy] = px([n.x, n.y])
    const s = S.current
    if (n.kind === 'pillar' || n.kind === 'goal') {
      if (Math.hypot(s.x - dx, s.y - dy) < DOOR_R * 0.7) openCard(n.id)
      else walkTo(dx, dy, n.id)
    } else walkTo(dx, dy, null)
  }, [openCard, walkTo])

  /* ---------------------------------------------------------------- main loop */
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const s = S.current
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let dx = 0, dy = 0
      const k = s.keys
      if (k.has('ArrowLeft') || k.has('a')) dx -= 1
      if (k.has('ArrowRight') || k.has('d')) dx += 1
      if (k.has('ArrowUp') || k.has('w')) dy -= 1
      if (k.has('ArrowDown') || k.has('s')) dy += 1
      let analog = 1
      if (!dx && !dy && joy.active) { dx = joy.x; dy = joy.y; analog = Math.min(1, Math.hypot(dx, dy)) }
      let moving = false
      if (dx || dy) {
        s.path = []; s.pending = null
        const len = Math.hypot(dx, dy)
        const mx = (dx / len) * SPEED * analog * dt, my = (dy / len) * SPEED * analog * dt
        if (canStand(s.x + mx, s.y + my)) { s.x += mx; s.y += my }
        else {
          // blocked: slide along the wall, or steer around it (roads are diagonal in this view)
          let moved = false
          for (const a of [0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2, 1.57, -1.57]) {
            const c = Math.cos(a), sn = Math.sin(a)
            const rx = mx * c - my * sn, ry = mx * sn + my * c
            if (canStand(s.x + rx, s.y + ry)) { s.x += rx; s.y += ry; moved = true; break }
          }
          if (!moved) { if (canStand(s.x + mx, s.y)) s.x += mx; else if (canStand(s.x, s.y + my)) s.y += my }
        }
        moving = true
        s.dir = Math.abs(dx) > Math.abs(dy) * 0.9 ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      } else if (s.path.length) {
        const tg = s.path[0]
        const vx = tg.x - s.x, vy = tg.y - s.y
        const dist = Math.hypot(vx, vy), step = SPEED * dt
        if (dist <= step) { s.x = tg.x; s.y = tg.y; s.path.shift() } else { s.x += (vx / dist) * step; s.y += (vy / dist) * step }
        if (dist > 0.5) s.dir = Math.abs(vx) > Math.abs(vy) * 0.9 ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up'
        moving = true
        if (!s.path.length && s.pending) { const id = s.pending; s.pending = null; setCard(id); s.dismissed = null }
      }
      if (moving) s.t += dt

      // stepping up to a place offers to go in (once per approach)
      let n: NodeId | null = null
      for (const q of NODES) {
        if (q.kind !== 'pillar' && q.kind !== 'goal') continue
        const [qx, qy] = px([q.x, q.y])
        if (Math.hypot(s.x - qx, s.y - qy) < DOOR_R) n = q.id
      }
      if (n !== s.near) {
        s.near = n; setNear(n)
        if (!n) s.dismissed = null
        else if (moving && !s.pending && s.dismissed !== n) { setCard(n); s.dismissed = null }
      }
      lastPos = [s.x, s.y]
      if (s.gateOpen && Math.hypot(s.x - gateEntry.x, s.y - gateEntry.y) < gateEntry.r && !s.through) { s.through = true; setCelebrated(true); nav('/dashboard') }
      if (s.cardFor && s.near !== s.cardFor) { s.cardFor = null; setCard(null) }

      // hero
      const frame = moving ? Math.floor(s.t * 6) % 2 : 0
      if (heroEl.current) { heroEl.current.style.transform = `translate3d(${s.x - HERO_W / 2}px, ${s.y - HERO_H}px, 0)`; heroEl.current.style.zIndex = String(Math.floor(s.y)) }
      if (heroImg.current) {
        const sz = s.avatar
        if (sz) {
          const { n, flip } = avatarFrame(s.dir, moving, frame)
          const dim = sz[`${s.persona}-${n}`], ref = sz[`${s.persona}-0`]
          if (dim && ref) {
            const k = HERO_H / ref[1]
            const src = `/art/avatar/${s.persona}-${n}.webp`
            if (!heroImg.current.src.endsWith(src)) heroImg.current.src = src
            heroImg.current.style.height = `${dim[1] * k}px`
            heroImg.current.style.width = `${dim[0] * k}px`
            heroImg.current.style.transform = flip ? 'scaleX(-1)' : 'none'
          }
        } else {
          const src = `/art/chibi/${s.dir}_${frame}.png`
          if (!heroImg.current.src.endsWith(src)) heroImg.current.src = src
        }
      }
      if (heroBob.current) heroBob.current.className = moving ? 'hero-walk' : 'hero-idle'

      // camera: centred when the island fits, otherwise it follows the hero
      const target = s.fit * s.zoom
      if (!s.scale) s.scale = target
      s.scale += (target - s.scale) * Math.min(1, dt * 8)
      const sc = s.scale
      const cw = WORLD.w * sc, ch = WORLD.h * sc
      const wantX = cw <= s.vw ? (s.vw - cw) / 2 : Math.min(0, Math.max(s.vw - cw, s.vw / 2 - s.x * sc))
      const wantY = ch <= s.vh ? (s.vh - ch) / 2 : Math.min(0, Math.max(s.vh - ch, s.vh * 0.55 - s.y * sc))
      if (!s.ready) { s.camX = wantX; s.camY = wantY; s.ready = true }
      const lerp = Math.min(1, dt * 6)
      s.camX += (wantX - s.camX) * lerp
      s.camY += (wantY - s.camY) * lerp
      if (worldEl.current) worldEl.current.style.transform = `translate3d(${s.camX}px, ${s.camY}px, 0) scale(${sc})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* ---------------------------------------------------------------- keyboard */
  useEffect(() => {
    const norm = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key)
    const dn = (e: KeyboardEvent) => {
      const key = norm(e)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'].includes(key)) {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return
        e.preventDefault()
        S.current.keys.add(key)
        setFirstTime(false)
      } else if (key === 'Enter' && S.current.near && !(document.activeElement instanceof HTMLButtonElement)) {
        openCard(S.current.near)
      } else if (key === '+' || key === '=') { setZoom((z) => Math.min(S.current.maxZoom, z * 1.15)) }
      else if (key === '-') { setZoom((z) => Math.max(1, z / 1.15)) }
      else if (key === 'Escape') { S.current.dismissed = S.current.near; setCard(null) }
    }
    const up = (e: KeyboardEvent) => S.current.keys.delete(norm(e))
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [openCard])

  /* ---------------------------------------------------------------- tap / drag to walk */
  const toWorld = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    const sc = S.current.scale || S.current.fit * S.current.zoom
    return { x: (e.clientX - r.left - S.current.camX) / sc, y: (e.clientY - r.top - S.current.camY) / sc }
  }
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, [role=application], [role=dialog]')) return
    const q = S.current
    q.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (q.ptrs.size === 2) {
      // second finger: pinch to zoom, stop any walk the first finger started
      const [a, b] = [...q.ptrs.values()]
      q.pinch = Math.hypot(a.x - b.x, a.y - b.y)
      q.down = false; q.path = []
      return
    }
    const p = toWorld(e)
    q.down = true
    walkTo(p.x, p.y, null)
  }
  const onMove = (e: React.PointerEvent) => {
    const q = S.current
    if (q.ptrs.has(e.pointerId)) q.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (q.ptrs.size >= 2) {
      const [a, b] = [...q.ptrs.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (q.pinch > 0) setZoom((z) => Math.min(q.maxZoom, Math.max(1, z * (d / q.pinch))))
      q.pinch = d
      return
    }
    if (!q.down) return
    const now = performance.now()
    if (now - q.lastRepath < 140) return
    q.lastRepath = now
    const p = toWorld(e)
    walkTo(p.x, p.y, null)
  }
  const onUp = (e: React.PointerEvent) => {
    const q = S.current
    q.ptrs.delete(e.pointerId)
    if (q.ptrs.size < 2) q.pinch = 0
    q.down = false
  }
  const zoomBy = (k: number) => setZoom((z) => Math.min(S.current.maxZoom, Math.max(1, z * k)))
  const onWheel = (e: React.WheelEvent) => zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1)

  /* ---------------------------------------------------------------- render */
  const labelFor = (n: IslandNode) => t(n.labelKey)
  const active = hover ?? near
  const gateOpenNow = allDone && (active === 'gate' || card === 'gate')
  const monument = art.monument
  const inv = 1 / (S.current.fit * zoom || 1)
  void vpTick

  return (
    <div
      ref={box}
      className="absolute inset-0 touch-none overflow-hidden"
      style={{ background: WATER, cursor: 'pointer' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onWheel={onWheel}
      onScroll={(e) => { e.currentTarget.scrollTop = 0; e.currentTarget.scrollLeft = 0 }}
    >
      <div ref={worldEl} style={{ position: 'absolute', left: 0, top: 0, width: WORLD.w, height: WORLD.h, transformOrigin: '0 0', willChange: 'transform' }}>
        <ArtSlot name={raw.ground} className="absolute inset-0 h-full w-full" fallback={<IslandArt done={completed as NodeId[]} allDone={allDone} />} />

        {/* buildings: painted cutouts when present (shop-*.webp), a quiet placeholder otherwise. Layered by their base line. */}
        {raw.buildings.map((b) => {
          const [bx, by] = px([b.x, b.y])
          const img = (name: string, extra?: React.CSSProperties) => {
            const a = art[name]
            if (!a) return null
            const h = (b.w * a.h) / a.w
            return <img key={name} src={`/art/${name}.webp`} alt="" draggable={false} style={{ position: 'absolute', left: bx - b.w / 2, top: by - h, width: b.w, height: h, zIndex: Math.round(by), pointerEvents: 'none', ...extra }} />
          }
          if (b.id === 'gate' && art['gate-closed'] && art['gate-open']) {
            // the gate swings open (image replaced with the open one) when the player steps up to it, once all four lessons are done
            return (
              <div key={b.id}>
                {allDone && <div className="gate-glow" style={{ position: 'absolute', left: bx - 200, top: by - 330, width: 400, height: 330, zIndex: Math.round(by) - 1, pointerEvents: 'none' }} />}
                {img('gate-closed', { opacity: gateOpenNow ? 0 : 1, transition: 'opacity .5s steps(5)' })}
                {img('gate-open', { opacity: gateOpenNow ? 1 : 0, transition: 'opacity .5s steps(5)', zIndex: Math.round(by) + 1 })}
              </div>
            )
          }
          if (art[b.art]) return img(b.art)
          return (
            <svg key={b.id} width={WORLD.w} height={WORLD.h} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', zIndex: Math.round(by), pointerEvents: 'none' }} aria-hidden>
              <g transform={`translate(${bx} ${by}) scale(1.6)`}>
                {b.id === 'safe' && <Kiosk x={0} y={0} />}
                {b.id === 'gate' && <Gate x={0} y={0} open={allDone} />}
              </g>
            </svg>
          )
        })}

        {/* the Charminar stands on the plaza; the hero walks behind / in front of it by y */}
        {monument && (() => {
          const w = raw.monument.w, h = (w * monument.h) / monument.w
          const [mx, my] = px([raw.monument.x, raw.monument.y])
          return <img src="/art/monument.webp" alt="" draggable={false} style={{ position: 'absolute', left: mx - w / 2, top: my - h * 0.78, width: w, height: h, zIndex: Math.round(my - 10), pointerEvents: 'none' }} />
        })()}

        {/* places: marker flag + hit area. Positions come from island.json; swapping art never breaks them. */}
        {NODES.map((n) => {
          const [x, y] = px([n.x, n.y])
          const isPillar = n.kind === 'pillar'
          const isDone = isPillar && completed.includes(n.id as PillarId)
          const locked = n.kind === 'goal' && !allDone
          const showLabel = active === n.id || card === n.id
          return (
            <div key={n.id}>
              {(isPillar || n.kind === 'goal') && (
                <div style={{ position: 'absolute', left: x + 30, top: y - 215, pointerEvents: 'none', zIndex: Math.round(y) + 5, transform: 'scale(1.5)', transformOrigin: '0 100%' }}>
                  <Marker done={n.kind === 'goal' ? allDone : isDone} locked={locked} pulse={n.id === 'plan' && firstTime && completed.length === 0} />
                </div>
              )}
              <button
                type="button"
                aria-label={isPillar ? `${labelFor(n)}. ${t(n.hookKey!)}` : labelFor(n)}
                onClick={() => goToPlace(n)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover((h) => (h === n.id ? null : h))}
                style={{ position: 'absolute', left: x - 80, top: y - 80, width: 160, height: 160, borderRadius: '50%', background: 'transparent', border: 0, cursor: 'pointer', zIndex: 3000, outline: 'none' }}
                className="island-hit"
              >
                <span className="island-ring" style={{ opacity: showLabel ? 1 : 0 }} />
              </button>
              {showLabel && (
                <div className="island-label" style={{ left: x, top: y - 175, transform: `translate(-50%,-100%) scale(${inv})`, zIndex: 4000 }}>{labelFor(n)}</div>
              )}
            </div>
          )
        })}

        {/* the hero */}
        <div ref={heroEl} style={{ position: 'absolute', left: 0, top: 0, width: HERO_W, height: HERO_H, pointerEvents: 'none', willChange: 'transform' }}>
          <div style={{ position: 'absolute', left: '20%', right: '20%', bottom: -2, height: 14, borderRadius: '50%', background: 'rgba(58,42,36,.3)' }} />
          <div ref={heroBob} className="hero-idle" style={{ width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <img ref={heroImg} src={avatar ? `/art/avatar/${persona}-0.webp` : '/art/chibi/down_0.png'} alt="" draggable={false} style={{ display: 'block', height: avatar ? undefined : '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {debug && (
          <svg width={WORLD.w} height={WORLD.h} style={{ position: 'absolute', inset: 0, zIndex: 9000, pointerEvents: 'none' }}>
            {grid.map((row, r) => row.map((v, c) => (v === 0 ? <rect key={`${r}-${c}`} x={c * T} y={r * T} width={T} height={T} fill="#ff2200" opacity=".38" /> : null)))}
            {Array.from({ length: 21 }, (_, i) => (<g key={i}><line x1={(i * 5 / 100) * WORLD.w} x2={(i * 5 / 100) * WORLD.w} y1="0" y2={WORLD.h} stroke="#fff" strokeWidth={i % 2 ? 1 : 3} opacity=".7" /><line y1={(i * 5 / 100) * WORLD.h} y2={(i * 5 / 100) * WORLD.h} x1="0" x2={WORLD.w} stroke="#fff" strokeWidth={i % 2 ? 1 : 3} opacity=".7" />{i % 2 === 0 && <text x={(i * 5 / 100) * WORLD.w + 6} y="30" fontSize="30" fill="#c00">{i * 5}</text>}{i % 2 === 0 && <text x="6" y={(i * 5 / 100) * WORLD.h - 6} fontSize="30" fill="#c00">{i * 5}</text>}</g>))}
            {NODES.map((n) => { const [x, y] = px([n.x, n.y]); return <circle key={n.id} cx={x} cy={y} r={DOOR_R} fill="none" stroke="#ff00aa" strokeWidth="4" /> })}
            <text x="20" y="40" fontSize="30" fill="#000">{COLS}x{ROWS}</text>
          </svg>
        )}

        {allDone && (
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5000 }}>
            {Array.from({ length: 9 }, (_, i) => <span key={i} className="petal" style={{ left: `${30 + i * 5}%`, animationDelay: `${i * 0.9}s` }} />)}
          </div>
        )}
      </div>

      {touch && <Joystick />}
      {!touch && (
        <div className="absolute right-2 z-30 flex flex-col gap-1.5" style={{ bottom: 12 }}>
          <button type="button" className="ink-chip grid h-10 w-10 place-items-center text-[20px]" aria-label="+" onClick={() => zoomBy(1.25)}>+</button>
          <button type="button" className="ink-chip grid h-10 w-10 place-items-center text-[20px]" aria-label="−" onClick={() => zoomBy(1 / 1.25)}>−</button>
        </div>
      )}

      {/* paper card for the place you stepped up to */}
      {card && (
        <div className="absolute inset-x-0 z-40 flex justify-center px-3" style={{ bottom: touch ? 'calc(176px + env(safe-area-inset-bottom))' : 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="paper rise w-full max-w-[420px] p-4 text-left" role="dialog" aria-label={labelFor(nodeById(card))}>
            {card === 'gate' ? (
              <>
                <div className="font-display lang-fit text-[22px] leading-tight">{allDone ? t('celebrate.title') : t('island.gate')}</div>
                <p className="m-0 mt-1 text-[14px] leading-snug">{allDone ? t('celebrate.body') : t('island.gateLocked')}</p>
              </>
            ) : (
              <>
                <div className="text-[12px] font-bold uppercase tracking-[.2em] text-coral">{t('play.chapter', { n: nodeById(card).n })}</div>
                <div className="font-display lang-fit text-[22px] leading-tight">{t(nodeById(card).labelKey)}</div>
                <p className="m-0 mt-1 text-[14px] leading-snug">{t(nodeById(card).hookKey!)}</p>
              </>
            )}
            <div className="mt-3 flex gap-2">
              {card !== 'gate' && <button type="button" className="ink-btn" autoFocus onClick={() => nav(`/play/${card}`)}>{t('hud.enter')} ▸</button>}
              {card === 'gate' && allDone && <button type="button" className="ink-btn" autoFocus onClick={() => { setCelebrated(true); nav('/dashboard') }}>{t('celebrate.enter')}</button>}
              <button type="button" className="ink-btn cream" onClick={() => { S.current.dismissed = S.current.near; setCard(null) }}>{t('buttons.back')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
