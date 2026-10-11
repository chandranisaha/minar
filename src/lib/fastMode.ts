/**
 * Fast mode, for recording demo videos: the whole app runs at N times speed. Open any page with ?fast=1 (x3), ?fast=5 (x5) and so on;
 * ?fast=0 turns it off. It is remembered for the browser tab, so it survives the reloads the app does on its own.
 *
 * How: it warps time instead of editing every game. setTimeout and setInterval delays are divided by N, the clock that drives
 * requestAnimationFrame animations (the island walk, framer-motion, counting numbers) runs N times faster, and CSS animations and
 * transitions get playbackRate N. Game rules are untouched: only waiting is shorter. Date.now is left alone so seeds and saves are unaffected.
 */
const KEY = 'mm-fast'
export const DEFAULT_FAST = 3
export const MAX_FAST = 12

/** the speed factor from the URL and the tab's memory: 1 means normal */
export function readFastFactor(search: string, store: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): number {
  const raw = new URLSearchParams(search).get('fast')
  try {
    if (raw !== null) {
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 1) {
        if (raw === '1' || raw === '' || raw === 'true') { store?.setItem(KEY, String(DEFAULT_FAST)); return DEFAULT_FAST }
        store?.removeItem(KEY)
        return 1
      }
      const k = Math.min(MAX_FAST, n)
      store?.setItem(KEY, String(k))
      return k
    }
    const saved = Number(store?.getItem(KEY))
    return Number.isFinite(saved) && saved > 1 ? Math.min(MAX_FAST, saved) : 1
  } catch {
    return 1
  }
}

/** the delay a timer should really wait at speed k */
export const scaleDelay = (ms: unknown, k: number): number => {
  const n = Number(ms)
  return Number.isFinite(n) && n > 0 ? Math.max(1, n / k) : 0
}

let installed = false

/** warp time for the whole page. Safe to call once at startup; does nothing at speed 1. */
export function installFastMode(k: number): void {
  if (installed || k <= 1 || typeof window === 'undefined') return
  installed = true

  const st = window.setTimeout.bind(window)
  const si = window.setInterval.bind(window)
  window.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => st(fn, scaleDelay(ms, k), ...args)) as typeof window.setTimeout
  window.setInterval = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => si(fn, scaleDelay(ms, k), ...args)) as typeof window.setInterval

  // a clock that runs k times faster than the real one, for everything that reads performance.now or the rAF timestamp
  const realNow = performance.now.bind(performance)
  const t0 = realNow()
  const fastNow = () => t0 + (realNow() - t0) * k
  performance.now = fastNow
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => raf((ts) => cb(t0 + (ts - t0) * k))) as typeof window.requestAnimationFrame

  // CSS animations and transitions (and anything on the Web Animations API) play k times faster
  const speedUp = () => {
    try {
      for (const a of document.getAnimations()) if (a.playbackRate !== k) a.updatePlaybackRate(k)
    } catch { /* an old browser: CSS timing stays normal */ }
  }
  const loop = () => { speedUp(); raf(loop) }
  raf(loop)
  document.documentElement.setAttribute('data-fast', String(k))
}
