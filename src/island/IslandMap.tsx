import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PillarId } from '../content/data'
import { useGame } from '../store/game'
import { ArtSlot } from '../art/ArtSlot'
import { IslandArt } from './IslandArt'
import { NODES, WORLD, nodeById, px, route, smoothD, type IslandNode, type NodeId } from './data'

type Dir = 'down' | 'up' | 'left' | 'right'
const TOKEN_H = 150
let lastNode: NodeId = 'dock' // survives navigating into a pillar and back

/** A flag on a pole: white while incomplete, antique gold with a tick once the pillar is done. */
function Marker({ done, pulse, locked }: { done: boolean; pulse?: boolean; locked?: boolean }) {
  return (
    <svg width="90" height="150" viewBox="0 0 90 150" style={{ overflow: 'visible', display: 'block' }} aria-hidden>
      <ellipse cx="22" cy="144" rx="22" ry="7" fill="#3A2A24" opacity=".2" />
      {pulse && <ellipse className="idle ring" cx="22" cy="142" rx="40" ry="14" fill="none" stroke="#C8604A" strokeWidth="3" />}
      <path d="M22 144 V18" stroke="#3A2A24" strokeWidth="5" strokeLinecap="round" />
      <circle cx="22" cy="14" r="6" fill="#C79A2E" stroke="#3A2A24" strokeWidth="2" />
      <g className="idle flag" style={{ transformOrigin: '24px 24px' }}>
        <path d="M24 24 H80 Q70 40 80 56 H24Z" fill={done ? '#C79A2E' : locked ? '#CFC7B3' : '#FBF6EA'} stroke="#3A2A24" strokeWidth="2.4" strokeLinejoin="round" />
        {done && <path d="M40 42 l8 8 l16 -18" fill="none" stroke="#3A2A24" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </svg>
  )
}

interface View { s: number; x: number; y: number }

export function IslandMap() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const completed = useGame((s) => s.completedPillars)
  const celebrated = useGame((s) => s.celebrated)
  const setCelebrated = useGame((s) => s.setCelebrated)
  const allDone = completed.length >= 4

  const box = useRef<HTMLDivElement>(null)
  const measure = useRef<SVGSVGElement>(null)
  const [vp, setVp] = useState({ w: 390, h: 844 })
  const [view, setView] = useState<View>({ s: 0.4, x: 0, y: 0 })
  const fit = useRef(0.4)
  const [at, setAt] = useState<NodeId>(lastNode)
  const [pos, setPos] = useState(() => px([nodeById(lastNode).x, nodeById(lastNode).y]))
  const [dir, setDir] = useState<Dir>('down')
  const [frame, setFrame] = useState(0)
  const [walking, setWalking] = useState(false)
  const [card, setCard] = useState<NodeId | null>(null)
  const [hover, setHover] = useState<NodeId | null>(null)
  const [firstTime, setFirstTime] = useState(true)
  const walkTimer = useRef<number | null>(null)
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean }[]>([])
  const pinch = useRef<{ d: number; s: number } | null>(null)
  const dragged = useRef(false)

  /* ---------------------------------------------------------------- camera */
  const clamp = useCallback((v: View, w = vp.w, h = vp.h): View => {
    const cw = WORLD.w * v.s, ch = WORLD.h * v.s
    const x = cw <= w ? (w - cw) / 2 : Math.min(0, Math.max(w - cw, v.x))
    const y = ch <= h ? (h - ch) / 2 : Math.min(0, Math.max(h - ch, v.y))
    return { s: v.s, x, y }
  }, [vp.w, vp.h])

  useEffect(() => {
    const el = box.current!
    const run = () => {
      const w = el.clientWidth, h = el.clientHeight
      setVp({ w, h })
      // desktop: fit the whole island. phone: fit by height, drag sideways.
      const f = w < 700 ? h / WORLD.h : Math.min(w / WORLD.w, h / WORLD.h)
      fit.current = f
      setView((v) => {
        const s = v.s < f * 0.999 || Math.abs(v.s - f) < 1e-6 || v.s === 0.4 ? f : v.s
        const tok = px([nodeById(lastNode).x, nodeById(lastNode).y])
        const centred = clamp({ s, x: w / 2 - tok[0] * s, y: h / 2 - tok[1] * s }, w, h)
        return w < 700 ? centred : clamp({ s, x: 0, y: 0 }, w, h)
      })
    }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(el)
    return () => ro.disconnect()
  }, [clamp])

  const zoomAt = (cx: number, cy: number, factor: number) =>
    setView((v) => {
      const s = Math.min(1.8, Math.max(fit.current, v.s * factor))
      const k = s / v.s
      return clamp({ s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k })
    })

  const onWheel = (e: React.WheelEvent) => {
    const r = box.current!.getBoundingClientRect()
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12)
  }
  const onDown = (e: React.PointerEvent) => {
    if (!drag.current.length) dragged.current = false
    drag.current.push({ id: e.pointerId, x: e.clientX, y: e.clientY, moved: false })
    if (drag.current.length === 2) {
      const [a, b] = drag.current
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s }
    }
  }
  const onMove = (e: React.PointerEvent) => {
    const p = drag.current.find((d) => d.id === e.pointerId)
    if (!p) return
    const dx = e.clientX - p.x, dy = e.clientY - p.y
    if (!p.moved && Math.hypot(dx, dy) < 6) return
    p.moved = true
    dragged.current = true
    if (drag.current.length === 2 && pinch.current) {
      p.x = e.clientX; p.y = e.clientY
      const [a, b] = drag.current
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const r = box.current!.getBoundingClientRect()
      const target = pinch.current.s * (d / pinch.current.d)
      zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, target / view.s)
      return
    }
    p.x = e.clientX; p.y = e.clientY
    setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }))
  }
  const onUp = (e: React.PointerEvent) => {
    drag.current = drag.current.filter((d) => d.id !== e.pointerId)
    if (drag.current.length < 2) pinch.current = null
  }

  /* ---------------------------------------------------------------- walking token (stepped ~8fps) */
  const walkTo = useCallback(
    (target: NodeId, after?: () => void) => {
      if (walkTimer.current) window.clearInterval(walkTimer.current)
      setCard(null)
      const legs = route(at, target)
      if (!legs.length) { after?.(); return }
      const svg = measure.current!
      const pts: { x: number; y: number }[] = []
      for (const leg of legs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('d', smoothD(leg.path.pts))
        svg.appendChild(el)
        const len = el.getTotalLength()
        const n = Math.max(8, Math.round(len / 12))
        for (let i = 0; i <= n; i++) {
          const p = el.getPointAtLength((leg.reverse ? 1 - i / n : i / n) * len)
          pts.push({ x: p.x, y: p.y })
        }
        svg.removeChild(el)
      }
      const dur = Math.min(1.5, Math.max(0.7, pts.length / 160)) // seconds, whole route
      const ticks = Math.max(4, Math.round(dur * 8))
      let k = 0
      setWalking(true)
      walkTimer.current = window.setInterval(() => {
        k++
        const idx = Math.min(pts.length - 1, Math.round((k / ticks) * (pts.length - 1)))
        const p = pts[idx], q = pts[Math.max(0, idx - 3)]
        const vx = p.x - q.x, vy = p.y - q.y
        if (Math.hypot(vx, vy) > 2) setDir(Math.abs(vx) > Math.abs(vy) * 0.8 ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up')
        setPos([p.x, p.y])
        setFrame((f) => 1 - f)
        // on phones the camera follows the token
        setView((v) => (vp.w < 700 ? clamp({ ...v, x: vp.w / 2 - p.x * v.s, y: vp.h / 2 - p.y * v.s }) : v))
        if (k >= ticks) {
          window.clearInterval(walkTimer.current!)
          walkTimer.current = null
          setWalking(false)
          setFrame(0)
          setAt(target)
          lastNode = target
          after?.()
        }
      }, 125)
    },
    [at, clamp, vp.h, vp.w],
  )
  useEffect(() => () => { if (walkTimer.current) window.clearInterval(walkTimer.current) }, [])

  const activate = useCallback(
    (n: IslandNode) => {
      if (dragged.current) return
      setFirstTime(false)
      if (n.kind === 'pillar' || n.kind === 'goal') walkTo(n.id, () => setCard(n.id))
      else walkTo(n.id)
    },
    [walkTo],
  )

  /* ---------------------------------------------------------------- render */
  const doneIds = completed as NodeId[]
  const toScreen = (x: number, y: number) => ({ left: x, top: y })
  const labelFor = (n: IslandNode) => t(n.labelKey)
  const active = hover ?? null

  return (
    <div
      ref={box}
      className="absolute inset-0 touch-none overflow-hidden"
      style={{ background: '#BFD9E3', cursor: 'grab' }}
      onWheel={onWheel}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onScroll={(e) => { e.currentTarget.scrollTop = 0; e.currentTarget.scrollLeft = 0 }}
    >
      <svg ref={measure} width="0" height="0" style={{ position: 'absolute' }} aria-hidden />
      <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD.w, height: WORLD.h, transformOrigin: '0 0', transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`, willChange: 'transform' }}>
        <ArtSlot name="island-bg" className="absolute inset-0 h-full w-full" fallback={<IslandArt done={doneIds} allDone={allDone} />} />

        {/* hotspots layer: independent of the art, positioned from island.json */}
        {NODES.map((n) => {
          const [x, y] = px([n.x, n.y])
          const isPillar = n.kind === 'pillar'
          const isDone = isPillar && completed.includes(n.id as PillarId)
          const locked = n.kind === 'goal' && !allDone
          const showLabel = active === n.id || card === n.id
          return (
            <div key={n.id}>
              {(isPillar || n.kind === 'goal') && (
                <div style={{ position: 'absolute', left: x + 36, top: y - 142, pointerEvents: 'none', zIndex: Math.round(y) }}>
                  <Marker done={n.kind === 'goal' ? allDone : isDone} locked={locked} pulse={n.id === 'plan' && firstTime && completed.length === 0} />
                </div>
              )}
              <button
                type="button"
                aria-label={isPillar ? `${labelFor(n)}. ${t(n.hookKey!)}` : labelFor(n)}
                onClick={() => activate(n)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover((h) => (h === n.id ? null : h))}
                style={{ ...toScreen(x - 70, y - 70), position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'transparent', border: 0, cursor: 'pointer', zIndex: 3000, outline: 'none' }}
                className="island-hit"
              >
                <span className="island-ring" style={{ opacity: showLabel ? 1 : 0 }} />
              </button>
              {showLabel && (
                <div className="island-label" style={{ left: x, top: y - 168, transform: `translate(-50%,-100%) scale(${1 / view.s})`, zIndex: 4000 }}>
                  {labelFor(n)}
                </div>
              )}
            </div>
          )
        })}

        {/* player token */}
        <div style={{ position: 'absolute', left: pos[0] - TOKEN_H * 0.4, top: pos[1] - TOKEN_H + 8, width: TOKEN_H * 0.8, height: TOKEN_H, pointerEvents: 'none', zIndex: Math.round(pos[1]) + 100 }}>
          <div style={{ position: 'absolute', left: '18%', right: '18%', bottom: -2, height: 14, borderRadius: '50%', background: 'rgba(58,42,36,.28)' }} />
          <img src={`/art/chibi/${dir}_${walking ? frame : 0}.png`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', display: 'block' }} />
        </div>

        {/* quiet petals once the goal is reached */}
        {allDone && (
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5000 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="petal" style={{ left: `${30 + i * 5}%`, animationDelay: `${i * 0.9}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* zoom buttons for mouse users */}
      <div className="absolute right-2 z-30 hidden flex-col gap-1.5 sm:flex" style={{ bottom: 12 }}>
        <button type="button" className="ink-chip grid h-10 w-10 place-items-center text-[20px]" aria-label="+" onClick={() => zoomAt(vp.w / 2, vp.h / 2, 1.25)}>+</button>
        <button type="button" className="ink-chip grid h-10 w-10 place-items-center text-[20px]" aria-label="−" onClick={() => zoomAt(vp.w / 2, vp.h / 2, 1 / 1.25)}>−</button>
      </div>

      {/* paper card for the chosen place */}
      {card && !walking && (
        <div className="absolute inset-x-0 z-40 flex justify-center px-3" style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="paper w-full max-w-[420px] p-4 text-left" role="dialog" aria-label={labelFor(nodeById(card))}>
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
              {card !== 'gate' && (
                <button type="button" className="ink-btn" autoFocus onClick={() => nav(`/play/${card}`)}>
                  {t('hud.enter')} ▸
                </button>
              )}
              {card === 'gate' && allDone && !celebrated && (
                <button type="button" className="ink-btn" autoFocus onClick={() => setCelebrated(true)}>{t('celebrate.again')}</button>
              )}
              <button type="button" className="ink-btn cream" onClick={() => setCard(null)}>{t('buttons.back')}</button>
            </div>
          </div>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{walking ? '' : labelFor(nodeById(at))}</span>
    </div>
  )
}
