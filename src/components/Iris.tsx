import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { stepped } from '../lib/stepped'

type IrisCtx = { go: (to: string, origin?: { x: number; y: number }) => void; busy: boolean }
const Ctx = createContext<IrisCtx>({ go: () => {}, busy: false })
export const useIris = () => useContext(Ctx)

/** Classic 1930s iris-wipe: the picture closes to a circle, we change scene, then it opens again. */
export function IrisProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const r = useMotionValue(5000)
  const cx = useMotionValue(0)
  const cy = useMotionValue(0)
  const lock = useRef(false)
  const bg = useMotionTemplate`radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, #2B1A17 ${r}px)`

  const go = useCallback(
    (to: string, origin?: { x: number; y: number }) => {
      if (lock.current) return
      lock.current = true
      const W = window.innerWidth, H = window.innerHeight
      const max = Math.hypot(W, H)
      cx.set(origin?.x ?? W / 2)
      cy.set(origin?.y ?? H / 2)
      r.set(max)
      setBusy(true)
      animate(r, 0, { duration: 0.55, ease: stepped(12) }).then(() => {
        navigate(to)
        window.setTimeout(() => {
          animate(r, max, { duration: 0.55, ease: stepped(12) }).then(() => {
            setBusy(false)
            lock.current = false
          })
        }, 120)
      })
    },
    [cx, cy, r, navigate],
  )
  const value = useMemo(() => ({ go, busy }), [go, busy])

  return (
    <Ctx.Provider value={value}>
      {children}
      {busy && <motion.div aria-hidden style={{ background: bg }} className="fixed inset-0 z-[100]" />}
    </Ctx.Provider>
  )
}
