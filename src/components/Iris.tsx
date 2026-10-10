import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { stepped } from '../lib/stepped'
import { C, MOTION } from '../art/palette'

type IrisCtx = {
  go: (to: string, origin?: { x: number; y: number }) => void
  /** run any scene change under an iris wipe (used between story beats) */
  run: (cb: () => void, origin?: { x: number; y: number }, dur?: number) => void
  busy: boolean
}
const Ctx = createContext<IrisCtx>({ go: () => {}, run: () => {}, busy: false })
export const useIris = () => useContext(Ctx)

/** Classic 1930s iris-wipe: the picture closes to a circle, we change scene, then it opens again. */
export function IrisProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const r = useMotionValue(5000)
  const cx = useMotionValue(0)
  const cy = useMotionValue(0)
  const lock = useRef(false)
  const bg = useMotionTemplate`radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, ${C.ink} ${r}px)`

  const run = useCallback(
    (cb: () => void, origin?: { x: number; y: number }, dur: number = MOTION.irisDefault) => {
      if (lock.current) return
      lock.current = true
      const W = window.innerWidth, H = window.innerHeight
      const max = Math.hypot(W, H)
      cx.set(origin?.x ?? W / 2)
      cy.set(origin?.y ?? H / 2)
      r.set(max)
      setBusy(true)
      animate(r, 0, { duration: dur, ease: stepped(MOTION.steps) }).then(() => {
        cb()
        window.setTimeout(() => {
          animate(r, max, { duration: dur, ease: stepped(MOTION.steps) }).then(() => {
            setBusy(false)
            lock.current = false
          })
        }, Math.round(MOTION.irisHold * 1000))
      })
    },
    [cx, cy, r],
  )
  const go = useCallback((to: string, origin?: { x: number; y: number }) => run(() => navigate(to), origin), [run, navigate])
  const value = useMemo(() => ({ go, run, busy }), [go, run, busy])

  return (
    <Ctx.Provider value={value}>
      {children}
      {busy && <motion.div aria-hidden style={{ background: bg }} className="fixed inset-0 z-[var(--z-transition)]" />}
    </Ctx.Provider>
  )
}
