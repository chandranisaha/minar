import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import demo from '../content/demo.json'
import { stall as stallDef } from '../engine/content'
import { festivalMorningEvents, morningEvents } from '../engine/flow'
import { lessonFor, type LessonHit, type LessonId } from '../engine/lessons'
import { priceFor } from '../engine/prices'
import { applyEvent, canAfford, replay, shortfall } from '../engine/state'
import type { Day, FestivalId, GameEvent, GameState, PocketId, StallId } from '../engine/types'

export type Phase = 'intro' | 'morning' | 'bazaar' | 'mela' | 'diary' | 'festival' | 'report'

/** A payment that may need the Raid sheet. `event` is logged only once the pocket can cover it. */
export interface PayRequest {
  pocket: PocketId
  amount: number
  reason: string
  event: GameEvent
  /** the alternative offered on the Raid sheet: e.g. Walk home (logged) or just Cancel (nothing logged) */
  alt?: { kind: 'walk'; event: GameEvent } | { kind: 'cancel' }
  after?: () => void
}

export interface Toast { id: string; key: string; vars?: Record<string, string | number> }

interface FestivalStore {
  seed: string
  festival: FestivalId
  demo: boolean
  phase: Phase
  day: Day
  log: GameEvent[]
  /** lessons already shown in Day diaries (each at most twice) */
  shown: LessonId[]
  diaryLesson: LessonHit | null
  /** evenings where the player finished (or skipped) the ring toss */
  ringDone: Day[]
  /** one-off toasts already shown (fake-sale reveal) */
  toastsShown: string[]
  /** this run's result has been sent to onComplete */
  reported: boolean
  /** not persisted */
  raid: PayRequest | null
  toast: Toast | null

  setup: (o: { seed: string; festival: FestivalId; demo: boolean }) => void
  setFestival: (f: FestivalId) => void
  begin: () => void
  push: (...e: GameEvent[]) => void
  pay: (r: PayRequest) => void
  closeRaid: () => void
  showToast: (t: Toast | null) => void
  startDay: (plan: GameState['pockets'] | null) => void
  visit: (s: StallId) => void
  toMela: () => void
  finishRing: () => void
  toDiary: () => void
  nextDay: () => void
  toReport: () => void
  replaySameSeed: () => void
  skipDemo: () => void
  markReported: () => void
}

/** localStorage can throw (private mode, blocked storage, shared-device policies): never let that break the game. */
const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* play on without saving */ } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

export const newSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase()

const fresh = { phase: 'intro' as Phase, day: 1 as Day, log: [] as GameEvent[], shown: [] as LessonId[], diaryLesson: null, ringDone: [] as Day[], toastsShown: [] as string[], reported: false, raid: null, toast: null }

export const useFestival = create<FestivalStore>()(
  persist(
    (set, get) => {
      const push = (...e: GameEvent[]) => set((s) => ({ log: [...s.log, ...e] }))
      const st = () => replay(get().log)

      /** Fake sale: once a Mega Sale buy is in the log and a cheaper sticker for that item has been seen, say so (once). */
      const fakeSaleCheck = () => {
        const { log, toastsShown } = get()
        for (const e of log) {
          if (e.kind !== 'buy' || e.stall !== 'megasale' || toastsShown.includes(`fake:${e.item}`)) continue
          const cheaper = log
            .filter((v): v is Extract<GameEvent, { kind: 'visit' }> => v.kind === 'visit' && v.stall !== 'megasale' && v.stall !== 'sasta' && stallDef(v.stall).sells.includes(e.item))
            .map((v) => ({ stall: v.stall, price: priceFor(e.item, v.stall, v.day)! }))
            .filter((x) => x.price < e.price)
            .sort((a, b) => a.price - b.price)[0]
          if (cheaper) {
            set((s) => ({ toastsShown: [...s.toastsShown, `fake:${e.item}`], toast: { id: `fake:${e.item}`, key: 'toast.fakeSale', vars: { stall: cheaper.stall, price: cheaper.price, item: e.item } } }))
            return
          }
        }
      }

      return {
        seed: newSeed(),
        festival: 'diwali',
        demo: false,
        ...fresh,

        setup: ({ seed, festival, demo }) => set({ ...fresh, seed, festival, demo }),
        setFestival: (festival) => set({ festival }),
        begin: () => set({ phase: 'morning', day: 1 }),
        push,

        pay: (r) => {
          const s = st()
          if (shortfall(s, r.pocket, r.amount) === 0) {
            push(r.event)
            if (r.event.kind === 'buy') fakeSaleCheck()
            r.after?.()
            return
          }
          if (!canAfford(s, r.amount) && r.alt?.kind !== 'walk') {
            set({ toast: { id: `nem:${Date.now()}`, key: 'toast.notEnough' } })
            return
          }
          set({ raid: r })
        },
        closeRaid: () => set({ raid: null }),
        showToast: (toast) => set({ toast }),

        startDay: (plan) => {
          const { day } = get()
          const s = st()
          const changed = plan && (day === 1 || Object.keys(plan).some((k) => plan[k as PocketId] !== s.pockets[k as PocketId]))
          if (changed) push({ kind: 'plan', day, pockets: plan })
          set({ phase: 'bazaar' })
        },
        visit: (stall) => {
          push({ kind: 'visit', day: get().day, stall })
          fakeSaleCheck()
        },
        toMela: () => set({ phase: 'mela' }),
        finishRing: () => set((s) => ({ ringDone: [...s.ringDone, s.day] })),
        toDiary: () => {
          const { log, day, shown } = get()
          const hit = lessonFor(log, day, shown)
          set({ phase: 'diary', diaryLesson: hit, shown: hit ? [...shown, hit.id] : shown })
        },
        nextDay: () => {
          const { day, log, seed } = get()
          if (day < 3) {
            const d = (day + 1) as Day
            set({ day: d, phase: 'morning', log: [...log, ...morningEvents(log, d)] })
          } else {
            if (!replay(log).ended) set({ log: [...log, ...festivalMorningEvents(seed, log)] })
            set({ phase: 'festival' })
          }
        },
        toReport: () => set({ phase: 'report' }),
        replaySameSeed: () => set((s) => ({ ...fresh, seed: s.seed, festival: s.festival, demo: s.demo, phase: 'morning' })),
        /** Demo mode: jump to festival morning with the scripted planner run from demo.json (reproduces it exactly). */
        skipDemo: () => set({ log: demo.planner.log as GameEvent[], day: 3, phase: 'festival', raid: null, ringDone: [1, 2, 3] }),
        markReported: () => set({ reported: true }),
      }
    },
    {
      name: 'festival-countdown-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ seed: s.seed, festival: s.festival, demo: s.demo, phase: s.phase, day: s.day, log: s.log, shown: s.shown, diaryLesson: s.diaryLesson, ringDone: s.ringDone, toastsShown: s.toastsShown, reported: s.reported }),
      // a saved log that no longer replays (content changed) starts a fresh game instead of crashing
      merge: (saved, cur) => {
        const p = saved as Partial<FestivalStore>
        try {
          if (p?.log) p.log.reduce(applyEvent, replay([]))
          return { ...cur, ...p }
        } catch {
          return cur
        }
      },
    },
  ),
)

/** The replayed game state for the current log. */
export const useGameState = () => {
  const log = useFestival((s) => s.log)
  return useMemoReplay(log)
}

let memo: { log: GameEvent[]; s: GameState } | null = null
function useMemoReplay(log: GameEvent[]): GameState {
  if (memo?.log !== log) memo = { log, s: replay(log) }
  return memo.s
}
