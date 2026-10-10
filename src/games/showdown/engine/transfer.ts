import { draw } from '../../../lib/rng'
import type { ConceptId } from './concepts'
import type { Decision } from './log'

/** One transfer question per concept: a situation the game never showed. The correct option is always 'ok'. */
export const TRANSFER_ID: Record<ConceptId, string> = { C1: 'T1', C2: 'T2', C3: 'T3', C4: 'T4', C5: 'T5', C7: 'T7' }
export const conceptOfTransfer = (id: string): ConceptId => (Object.entries(TRANSFER_ID).find(([, v]) => v === id)![0] as ConceptId)

export const transferCorrect = (answer: string) => answer === 'ok'

/** Option order is shuffled, but the same for the same player code (no Math.random in the engine). "Not sure" is always last. */
export function optionOrder(code: string, id: string): string[] {
  return ['ok', 'w1', 'w2'].map((o) => ({ o, r: draw(code, `transfer:${id}:${o}`) })).sort((a, b) => a.r - b.r).map((x) => x.o).concat('unsure')
}

/** The transfer answers given so far, by concept. "Not sure" counts as no point. */
export function transferAnswers(log: Decision[]): Partial<Record<ConceptId, boolean>> {
  const out: Partial<Record<ConceptId, boolean>> = {}
  for (const d of log) if (d.k === 'transfer') out[conceptOfTransfer(d.id)] = transferCorrect(d.answer)
  return out
}

import { factsOf, lowestConcepts } from './concepts'

/** The three questions to ask: one for each of the three lowest concepts (the ones play did not already show). */
export const pickTransfer = (log: Decision[]): string[] => lowestConcepts(factsOf(log)).map((c) => TRANSFER_ID[c])
