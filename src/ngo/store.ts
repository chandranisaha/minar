import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEMO_CODE, demoStudents } from './demo'
import { cleanCode, decodeSummary, findCodes, parseSummary, type StudentSummary } from './summary'

export interface Cohort {
  /** the class code students type in; also this cohort's id */
  id: string
  name: string
  createdAt: number
  students: Record<string, StudentSummary>
  demo?: boolean
}

export interface ImportReport { added: number; updated: number; skipped: number }

interface NgoState {
  cohorts: Cohort[]
  checklist: Record<string, boolean>
  createCohort: (name: string) => string
  renameCohort: (id: string, name: string) => void
  deleteCohort: (id: string) => void
  /** adds every progress code found in the text; `into` puts them all in one cohort whatever code they carry */
  importText: (text: string, into?: string | null) => ImportReport
  loadDemo: () => void
  tick: (key: string) => void
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const newCode = (): string => 'HYD-' + Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')

/** the facilitator's data lives under a "mm-slots" key so a student's save slots never capture or restore it */
export const useNgo = create<NgoState>()(
  persist(
    (set, get) => ({
      cohorts: [],
      checklist: {},
      createCohort: (name) => {
        const taken = new Set(get().cohorts.map((c) => c.id))
        let id = newCode()
        while (taken.has(id)) id = newCode()
        set((s) => ({ cohorts: [...s.cohorts, { id, name: name.trim().slice(0, 40) || id, createdAt: Date.now(), students: {} }] }))
        return id
      },
      renameCohort: (id, name) => set((s) => ({ cohorts: s.cohorts.map((c) => (c.id === id ? { ...c, name: name.trim().slice(0, 40) || c.name } : c)) })),
      deleteCohort: (id) => set((s) => ({ cohorts: s.cohorts.filter((c) => c.id !== id) })),
      importText: (text, into) => {
        const report: ImportReport = { added: 0, updated: 0, skipped: 0 }
        const incoming: StudentSummary[] = []
        for (const code of findCodes(text)) {
          const s = decodeSummary(code)
          if (s) incoming.push(s)
          else report.skipped++
        }
        // a pasted JSON file of summaries works too
        try {
          const j = JSON.parse(text)
          for (const item of Array.isArray(j) ? j : []) {
            const s = parseSummary(item)
            if (s) incoming.push(s)
          }
        } catch { /* plain text */ }
        set((st) => {
          const cohorts = st.cohorts.map((c) => ({ ...c, students: { ...c.students } }))
          for (const s of incoming) {
            const id = cleanCode(into) ?? s.cohort ?? 'UNASSIGNED'
            let c = cohorts.find((x) => x.id === id)
            if (!c) {
              c = { id, name: id === 'UNASSIGNED' ? 'No class code' : id, createdAt: Date.now(), students: {} }
              cohorts.push(c)
            }
            const old = c.students[s.id]
            if (old && old.at >= s.at) { report.skipped++; continue }
            if (old) report.updated++
            else report.added++
            c.students[s.id] = { ...s, cohort: id === 'UNASSIGNED' ? null : id }
          }
          return { cohorts }
        })
        return report
      },
      loadDemo: () =>
        set((st) => ({
          cohorts: [
            ...st.cohorts.filter((c) => c.id !== DEMO_CODE),
            { id: DEMO_CODE, name: 'Demo class (made-up students)', createdAt: Date.now(), demo: true, students: Object.fromEntries(demoStudents().map((s) => [s.id, s])) },
          ],
        })),
      tick: (key) => set((s) => ({ checklist: { ...s.checklist, [key]: !s.checklist[key] } })),
    }),
    { name: 'mm-slots-ngo-v1', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
)
