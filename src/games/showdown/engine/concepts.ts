import { item } from './content'
import { cashLines } from './lines'
import { answerOf, choicesOf, marketOf, planOf, shortfallOf, type Decision } from './log'
import { PREDICTIONS, p3Truth, type PredictionId } from './predictions'
import { runPlan } from './run'
import { survival } from './survival'
import type { RunResult } from './types'

export type ConceptId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C7'
export const CONCEPTS: ConceptId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C7']
export type Level = 'got' | 'getting' | 'not'

export interface Signals { prediction: boolean; flag: boolean; unsure: boolean }
export interface Facts { played: RunResult; survived: number; cushion: number; signals: Record<ConceptId, Signals> }

/** The festival that was played, with the player's own event and shortfall choices. */
export const playedOf = (log: Decision[]): RunResult => runPlan(planOf(log), 'F2', choicesOf(log), { mode: 'play', shortfall: shortfallOf(log) })

/**
 * The two signals that come from play, per concept (section 9): was the prediction right, and did the behaviour show the idea.
 * Concepts with no prediction count it as met when the matching outcome happened.
 */
export function factsOf(log: Decision[]): Facts {
  const plan = planOf(log)
  const m = marketOf(log)
  const played = playedOf(log)
  const survived = survival(plan, choicesOf(log))
  const { cushion } = cashLines(plan.contracts)
  const ranks = plan.ranks ?? []
  const met = ranks.filter((g) => played.goals.includes(g)).length
  const signed = (id: string) => plan.contracts.some((c) => c.id === id)
  const plates = plan.contracts.find((c) => item(c.id).cat === 'food')
  const crowd = played.crowd ?? 0
  const answered = (id: PredictionId) => answerOf(log, id)
  const right = (id: PredictionId, truth: string) => answered(id)?.answer === truth
  const unsure = (id: PredictionId) => answered(id)?.answer === 'unsure'
  const noShort = !played.shortfalls.some(([p]) => p !== 'FD')
  const signals: Record<ConceptId, Signals> = {
    C1: { prediction: right('P3', p3Truth(played)), flag: noShort && cushion >= 0, unsure: unsure('P3') },
    C2: { prediction: met >= 2, flag: met >= 2 && played.cancelled.length === 0, unsure: false },
    C3: { prediction: played.avoidable.rushPlates === 0, flag: !!plates && crowd > 0 && Math.abs(plates.qty - crowd) <= 0.1 * crowd, unsure: false },
    C4: { prediction: right('P2', PREDICTIONS.P2.truth!), flag: m.readBasic || !signed('basic'), unsure: unsure('P2') },
    C5: { prediction: cushion >= 0, flag: survived >= 7, unsure: false },
    C7: { prediction: right('P4', PREDICTIONS.P4.truth!), flag: !signed('combo'), unsure: unsure('P4') },
  }
  return { played, survived, cushion, signals }
}

const pts = (s: Signals) => Number(s.prediction) + Number(s.flag)

/** The three concepts to ask a transfer question about: the three lowest (ties go in concept order). */
export function lowestConcepts(facts: Facts, n = 3): ConceptId[] {
  return [...CONCEPTS].sort((a, b) => pts(facts.signals[a]) - pts(facts.signals[b]) || CONCEPTS.indexOf(a) - CONCEPTS.indexOf(b)).slice(0, n)
}

/**
 * Mastery per concept: 1 point each for the prediction, the behaviour and the transfer question. 3 = Got it, 2 = Getting there, 0 or 1 = Not yet.
 * A concept that was not asked about and was fully shown in play (both signals met) has its transfer point credited, so strong play can reach
 * "Got it". A weaker concept that simply was not asked keeps its play points only, so skipped questions never inflate a result.
 */
export function masteryOf(facts: Facts, transfer: Partial<Record<ConceptId, boolean>>): Record<ConceptId, { points: number; level: Level }> {
  const asked = new Set(lowestConcepts(facts))
  const out = {} as Record<ConceptId, { points: number; level: Level }>
  for (const c of CONCEPTS) {
    const played = pts(facts.signals[c])
    const points = played + (asked.has(c) ? Number(!!transfer[c]) : played === 2 ? 1 : 0)
    out[c] = { points, level: points >= 3 ? 'got' : points === 2 ? 'getting' : 'not' }
  }
  return out
}
