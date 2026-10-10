/**
 * Shared contract every pillar game reports through `onComplete`. No personal data: a cohort code and a seed only.
 * The shell stores results on the device so an NGO facilitator view can aggregate them later.
 */
export type GameId = 'festival' | 'payrun' | 'invest' | 'safe'

export interface GameResult {
  game: GameId
  cohortCode: string
  seed: string
  stars?: Record<string, boolean>
  score: Record<string, number> & { total: number }
  /** per-concept evidence of learning, from play */
  evidence: Record<string, number | boolean>
  lessonsSeen: string[]
  minaretLit: boolean
  /** extra context (e.g. which festival); never personal */
  meta?: Record<string, string>
  finishedAt?: string
}

const KEY = 'money-mohalla-results-v1'

export function loadResults(): GameResult[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as GameResult[]) : []
  } catch {
    return []
  }
}

export function saveResult(r: GameResult): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...loadResults(), { ...r, finishedAt: r.finishedAt ?? new Date().toISOString() }]))
  } catch {
    /* storage blocked or full: the game still finishes */
  }
}
