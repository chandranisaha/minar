import { useEffect, useState, type ReactNode } from 'react'

/** Portrait "cinema frame": fills a phone, and sits centred (phone-shaped) on desktop. */
export function useStageSize() {
  const get = () => ({ vw: window.innerWidth, vh: window.innerHeight })
  const [s, set] = useState(get)
  useEffect(() => {
    const f = () => set(get())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return { ...s, w: Math.min(s.vw, s.vh * 0.62), h: s.vh }
}

export function Stage({ children, bg }: { children: ReactNode; bg?: string }) {
  const { w, h } = useStageSize()
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#2B1A17' }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'repeating-linear-gradient(135deg, #3a231f 0 14px, #2B1A17 14px 28px)', opacity: 0.9 }}
      />
      <div className="absolute left-1/2 top-0 overflow-hidden" style={{ width: w, height: h, transform: 'translateX(-50%)', background: bg, borderLeft: w < window.innerWidth ? '5px solid #2B1A17' : undefined, borderRight: w < window.innerWidth ? '5px solid #2B1A17' : undefined, boxShadow: '0 0 0 3px #D9A520' }}>
        {children}
      </div>
    </div>
  )
}

/** full-bleed SVG backdrop for a story scene: 400x760 viewBox, cropped to fit any phone aspect */
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 400 760" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      {children}
    </svg>
  )
}
