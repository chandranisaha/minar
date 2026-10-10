import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { PLANNER, runBot } from '../engine/bots'
import { currentCard, festivalMorning } from '../engine/deck'
import { applyEvent, canAfford, initialState, replay, shortfall } from '../engine/state'
import { TERMINAL, type Day, type FestivalId, type GameEvent, type GameState, type JarId, type Jars } from '../engine/types'

export type Phase = 'intro' | 'plan' | 'play' | 'festival' | 'report'

/** A payment that may need the Borrow sheet. `event` is logged only once its jar can cover it. */
export interface PayRequest {
  jar: JarId
  amount: number
  day: Day
  card: string
  event: GameEvent
  /** false for things that must be paid (Mamu's family) */
  cancellable: boolean
}

interface FestivalStore {
  seed: string
  festival: FestivalId
  demo: boolean
  phase: Phase
  log: GameEvent[]
  /** the card whose outcome is on screen (until the player taps Next) */
  showing: string | null
  /** this run's result has been sent to onComplete */
  reported: boolean
  /** not persisted */
  borrow: PayRequest | null
  toast: string | null

  setup: (o: { seed: string; festival: FestivalId; demo: boolean }) => void
  setFestival: (f: FestivalId) => void
  toPlan: () => void
  plan: (jars: Jars) => void
  push: (...e: GameEvent[]) => void
  pay: (r: PayRequest) => void
  closeBorrow: () => void
  showToast: (key: string | null) => void
  next: () => void
  toReport: () => void
  replaySameSeed: () => void
  skipDemo: () => void
  markReported: () => void
}

/** localStorage can throw (private mode, blocked storage): never let that break the game. */
const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* play on without saving */ } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

export const newSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase()

const fresh = { phase: 'intro' as Phase, log: [] as GameEvent[], showing: null, reported: false, borrow: null, toast: null }

export const useFestival = create<FestivalStore>()(
  persist(
    (set, get) => {
      /** Log events; a choice that resolves a card puts its outcome on screen (day banners just move on). */
      const push = (...es: GameEvent[]) => {
        const log = [...get().log, ...es]
        const last = es[es.length - 1]
        const showing = last && TERMINAL.has(last.kind) && last.kind !== 'seen' ? (last as { card: string }).card : get().showing
        set({ log, showing })
        if (last?.kind === 'seen') advance()
      }
      /** Nothing left to play: festival morning. */
      const advance = () => {
        const { log, seed } = get()
        if (currentCard(log)) return
        set({ log: [...log, ...festivalMorning(seed, log)], phase: 'festival', showing: null })
      }

      return {
        seed: newSeed(),
        festival: 'diwali',
        demo: false,
        ...fresh,

        setup: ({ seed, festival, demo }) => set({ ...fresh, seed, festival, demo }),
        setFestival: (festival) => set({ festival }),
        toPlan: () => set({ phase: 'plan' }),
        plan: (jars) => set({ log: [{ kind: 'plan', jars }], phase: 'play', showing: null }),
        push,
        pay: (r) => {
          const s = replay(get().log)
          if (shortfall(s, r.jar, r.amount) === 0) return push(r.event)
          if (!canAfford(s, r.amount)) return set({ toast: 'toast.notEnough' })
          set({ borrow: r })
        },
        closeBorrow: () => set({ borrow: null }),
        showToast: (toast) => set({ toast }),
        next: () => {
          set({ showing: null })
          advance()
        },
        toReport: () => set({ phase: 'report' }),
        replaySameSeed: () => set((s) => ({ ...fresh, seed: s.seed, festival: s.festival, demo: s.demo, phase: 'plan' })),
        /** Demo mode: jump to festival morning with the planner bot's game on seed DEMO. */
        skipDemo: () => set({ log: runBot('DEMO', PLANNER), phase: 'festival', showing: null, borrow: null }),
        markReported: () => set({ reported: true }),
      }
    },
    {
      name: 'festival-countdown-v2',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ seed: s.seed, festival: s.festival, demo: s.demo, phase: s.phase, log: s.log, showing: s.showing, reported: s.reported }),
      // a saved game that no longer replays (content changed) starts fresh instead of crashing
      merge: (saved, cur) => {
        const p = saved as Partial<FestivalStore>
        try {
          p?.log?.reduce(applyEvent, initialState())
          return { ...cur, ...p }
        } catch {
          return cur
        }
      },
    },
  ),
)

/** The replayed game state for the current log. */
export function useGameState(): GameState {
  const log = useFestival((s) => s.log)
  return useMemo(() => replay(log), [log])
}
