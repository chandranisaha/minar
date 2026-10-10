import { create } from 'zustand'
import type { SceneProps } from '../ui/Scene'

/** What the café picture is showing right now. Presentation only: never saved, never touches money. */
export interface StageState {
  saucers: [number | null, number | null]
  vendor?: string
  beat: SceneProps['beat']
  focus: SceneProps['focus']
  plates: number
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
  set: (s) => set(s),
  setSaucer: (i, v) => {
    const s = [...get().saucers] as StageState['saucers']
    s[i] = v
    set({ saucers: s })
  },
  reset: () => set({ saucers: [null, null], vendor: undefined, beat: null, focus: null }),
}))
