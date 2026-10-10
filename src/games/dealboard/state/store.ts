import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { act, newRun, type Action, type RunState } from '../engine/run'
import { newSeed } from '../engine/rng'

interface DealBoardStore {
  run: RunState | null
  start: (seed?: string) => void
  dispatch: (a: Action) => void
  quit: () => void
}

/** Only the seed and the player's own state are stored; the market is recomputed from the seed. */
export const useDealBoard = create<DealBoardStore>()(
  persist(
    (set, get) => ({
      run: null,
      start: (seed) => set({ run: newRun(seed ?? newSeed()) }),
      dispatch: (a) => {
        const run = get().run
        if (run) set({ run: act(run, a) })
      },
      quit: () => set({ run: null }),
    }),
    { name: 'deal-board-v1' },
  ),
)
