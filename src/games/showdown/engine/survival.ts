import { FUTURES } from './content'
import { runPlan } from './run'
import type { Choices, Plan, RunResult } from './types'

/** Replays the plan in all ten futures with autopilot defaults. "Survived" = no shortfall on any date. */
export function futuresRun(plan: Plan, choices: Choices = {}): { id: string; result: RunResult }[] {
  return FUTURES.map((f) => ({ id: f.id, result: runPlan(plan, f.id, choices) }))
}
export const survival = (plan: Plan, choices: Choices = {}): number => futuresRun(plan, choices).filter((x) => x.result.survived).length

/** The first date and bill that broke a plan that did not survive (for the debrief line). */
export function firstBreak(result: RunResult): { point: string; bill: string } | null {
  const first = result.shortfalls[0]
  if (!first) return null
  const [point] = first
  const paid = result.ledger[point]?.pay ?? []
  const biggest = [...paid].sort((a, b) => b[1] - a[1])[0]
  return { point, bill: biggest ? biggest[0] : '' }
}
