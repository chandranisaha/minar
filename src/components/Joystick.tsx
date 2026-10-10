import { useRef, useState } from 'react'
import { joy, useTouchUi } from '../world/input'
import { C, alpha, flat, inkBorder } from '../art/palette'

// TODO(final-ui): placeholder joystick styling (behaviour must stay as is).

const SIZE = 132
const R = 42 // knob travel

/**
 * Among Us-style analog stick: drag the knob, the hero walks that way at a speed proportional to how far you push.
 * Fixed bottom-left (thumb zone), large target, only shown on touch / narrow screens.
 */
export function Joystick() {
  const show = useTouchUi()
  const pad = useRef<HTMLDivElement>(null)
  const [k, setK] = useState({ x: 0, y: 0 })
  const [down, setDown] = useState(false)
  if (!show) return null

  const move = (e: React.PointerEvent) => {
    const r = pad.current!.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R }
    setK({ x: dx, y: dy })
    const m = Math.hypot(dx, dy) / R
    if (m < 0.16) { joy.x = 0; joy.y = 0 } else { joy.x = dx / R; joy.y = dy / R }
    joy.active = m >= 0.16
  }
  const end = () => {
    joy.x = 0; joy.y = 0; joy.active = false
    setK({ x: 0, y: 0 })
    setDown(false)
  }

  return (
    <div
      ref={pad}
      role="application"
      aria-label="Joystick"
      className="absolute z-[var(--z-hud)] select-none"
      style={{ left: 'max(14px, env(safe-area-inset-left))', bottom: 'max(18px, env(safe-area-inset-bottom))', width: SIZE, height: SIZE, touchAction: 'none' }}
      onPointerDown={(e) => { e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDown(true); move(e) }}
      onPointerMove={(e) => { if (down) move(e) }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: alpha(C.jasmine,.82), border: inkBorder(4), boxShadow: flat(4, 5), opacity: down ? 1 : 0.9 }}
      />
      {/* direction chevrons */}
      {[0, 90, 180, 270].map((a) => (
        <svg key={a} width="22" height="14" viewBox="0 0 22 14" className="absolute left-1/2 top-1/2" style={{ transform: `translate(-50%,-50%) rotate(${a}deg) translateY(-48px)` }} aria-hidden>
          <path d="M3 11 L11 3 L19 11" fill="none" stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
        </svg>
      ))}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{ width: 58, height: 58, marginLeft: -29, marginTop: -29, transform: `translate(${k.x}px, ${k.y}px)`, background: C.pink, border: inkBorder(4), boxShadow: down ? flat(1, 2) : flat(3, 4) }}
      >
        <div className="absolute rounded-full" style={{ left: 9, top: 8, width: 16, height: 10, background: alpha(C.jasmine,.7), transform: 'rotate(-25deg)' }} />
      </div>
    </div>
  )
}
