import type { PillarId } from '../content/data'
import type { GameLevel } from './types'

/**
 * Which folder under src/games/ holds each pillar's real game. Dropping a game into
 * src/games/<folder>/index.tsx (default export) replaces that pillar's placeholder with no other change.
 */
export const GAME_FOLDERS: Record<PillarId, string> = {
  plan: 'festival',
  save: 'payrun',
  invest: 'dealboard',
  safe: 'casefiles',
}

/** the order pillars are offered after a game ends ("Continue" goes to the next unfinished one) */
export const PILLAR_ORDER: PillarId[] = ['plan', 'save', 'invest', 'safe']

/** values passed to games until onboarding lets the player choose them */
export const HOST_DEFAULTS: { level: GameLevel } = { level: 'beginner' }
