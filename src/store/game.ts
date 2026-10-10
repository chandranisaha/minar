import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PERSONAS, SKILLS, type Lang, type PersonaId, type PillarId, type Skill } from '../content/data'

interface GameState {
  language: Lang
  persona: PersonaId | null
  startAmount: number
  goalAmount: number
  savedAmount: number
  completedPillars: PillarId[]
  storySeen: boolean
  celebrated: boolean
  /** null = automatic (decided from device + reduced-motion) */
  liteMode: boolean | null
  skills: Record<Skill, number>
  setLanguage: (l: Lang) => void
  setPersona: (p: PersonaId) => void
  completePillar: (p: PillarId) => void
  setStorySeen: (v: boolean) => void
  setCelebrated: (v: boolean) => void
  setLite: (v: boolean) => void
  resetProgress: () => void
}

const zeroSkills = Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<Skill, number>

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      language: 'en',
      persona: null,
      startAmount: 0,
      goalAmount: 0,
      savedAmount: 0,
      completedPillars: [],
      storySeen: false,
      celebrated: false,
      liteMode: null,
      skills: zeroSkills,
      setLanguage: (language) => set({ language }),
      setPersona: (persona) => {
        const p = PERSONAS[persona]
        set({ persona, startAmount: p.start, goalAmount: p.goal, savedAmount: p.start, completedPillars: [], celebrated: false })
      },
      completePillar: (id) => {
        const s = get()
        if (s.completedPillars.includes(id)) return
        const step = (s.goalAmount - s.startAmount) / 4
        const done = [...s.completedPillars, id]
        set({ completedPillars: done, savedAmount: Math.min(s.goalAmount, s.startAmount + step * done.length) })
      },
      setStorySeen: (storySeen) => set({ storySeen }),
      setCelebrated: (celebrated) => set({ celebrated }),
      setLite: (liteMode) => set({ liteMode }),
      resetProgress: () => set((s) => ({ completedPillars: [], savedAmount: s.startAmount, celebrated: false })),
    }),
    { name: 'money-mohalla-v1' },
  ),
)

export const autoLite = (): boolean => {
  try {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cores = navigator.hardwareConcurrency ?? 8
    return reduced || cores <= 4
  } catch {
    return false
  }
}

export const useLite = (): boolean => {
  const l = useGame((s) => s.liteMode)
  return l ?? autoLite()
}
