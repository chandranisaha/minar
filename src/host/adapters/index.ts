import type { PillarId } from '../../content/data'
import type { GameAdapter } from '../types'
import { adaptCaseFiles } from './casefiles'
import { adaptDealBoard } from './dealboard'
import { adaptFestival } from './festival'
import { adaptPayRun } from './payrun'

export { adaptCaseFiles, adaptDealBoard, adaptFestival, adaptPayRun }

export const ADAPTERS: Record<PillarId, GameAdapter> = {
  plan: adaptFestival,
  save: adaptPayRun,
  invest: adaptDealBoard,
  safe: adaptCaseFiles,
}
