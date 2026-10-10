import { useEffect, useRef } from 'react'
import { useLite } from '../store/game'
import { C, alpha } from './palette'

const TILE = 128
/** four pre-rendered noise tiles, cycled at ~10fps: grain "on twos" with near-zero CPU cost */
let tiles: string[] | null = null
const makeTiles = () => {
  if (tiles) return tiles
  tiles = []
  const c = document.createElement('canvas')
  c.width = c.height = TILE
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(TILE, TILE)
  for (let n = 0; n < 4; n++) {
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() < 0.5 ? 20 : 255
      d[i] = d[i + 1] = d[i + 2] = v
      d[i + 3] = Math.random() * 38
    }
    ctx.putImageData(img, 0, 0)
    tiles.push(c.toDataURL('image/png'))
  }
  return tiles
}

/**
 * Old-film look: stepped grain (~10fps), flickering vertical scratches, soft vignette.
 * Lite mode keeps only the (static, free) vignette.
 */
export function FilmOverlay() {
  const lite = useLite()
  const grain = useRef<HTMLDivElement>(null)
  const scratches = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.lite = String(lite)
    if (lite) return
    const t = makeTiles()
    let f = 0
    const id = window.setInterval(() => {
      f = (f + 1) % t.length
      const g = grain.current
      if (g) {
        g.style.backgroundImage = `url(${t[f]})`
        g.style.backgroundPosition = `${Math.floor(Math.random() * TILE)}px ${Math.floor(Math.random() * TILE)}px`
      }
      const kids = scratches.current?.children
      if (kids) {
        for (let i = 0; i < kids.length; i++) {
          const el = kids[i] as HTMLElement
          const show = Math.random() < 0.22
          el.style.opacity = show ? String(0.2 + Math.random() * 0.3) : '0'
          if (show) el.style.left = Math.random() * 100 + '%'
        }
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [lite])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[var(--z-film)]">
      {!lite && (
        <>
          <div ref={grain} className="grain absolute inset-0" style={{ backgroundSize: `${TILE}px ${TILE}px`, opacity: 0.55 }} />
          <div ref={scratches} className="scratches absolute inset-0 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="absolute top-0 h-full w-px bg-jasmine" style={{ opacity: 0 }} />
            ))}
          </div>
        </>
      )}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 58%, ${alpha(C.ink,.34)} 100%)` }} />
    </div>
  )
}
