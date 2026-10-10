import { create } from 'zustand'
import type { SceneProps } from '../ui/Scene'

/** What the café picture is showing right now. Presentation only: never saved, never touches money. */
export interface StageState {
  saucers: [number | null, number | null]
  vendor?: string
  beat: SceneProps['beat']
  focus: SceneProps['focus']
  plates: number
  /** Ammamma's envelope: on Chacha's counter, sliding over, or on the table */
  letter: 'counter' | 'slide' | 'table' | null
  /** the intro plays the bottles itself: fizz values to show instead of the run's */
  demo: { fun: number; friends: number } | null
  pulse: { jar: 'spend' | 'save' | 'emergency'; n: number } | null
  clink: (jar: 'spend' | 'save' | 'emergency') => void
  set: (s: Partial<Omit<StageState, 'set' | 'reset'>>) => void
  setSaucer: (i: 0 | 1, v: number | null) => void
  reset: () => void
}

export const useStage = create<StageState>()((set, get) => ({
  saucers: [null, null],
  vendor: undefined,
  beat: null,
  focus: null,
  plates: 0,
  letter: null,
  demo: null,
  pulse: null,
  clink: (jar) => set((st) => ({ pulse: { jar, n: (st.pulse?.n ?? 0) + 1 } })),
  set: (s) => set(s),
  setSaucer: (i, v) => {
    const s = [...get().saucers] as StageState['saucers']
    s[i] = v
    set({ saucers: s })
  },
  reset: () => set({ saucers: [null, null], vendor: undefined, beat: null, focus: null, pulse: null, demo: null, letter: null }),
}))
