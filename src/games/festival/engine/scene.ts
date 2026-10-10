import { walletTotal } from './state'
import type { GameState } from './types'

export interface Scene {
  lights: 'full' | 'half' | 'dark'
  sweets: boolean
  brother: 'new' | 'old' | 'torn'
  gift: boolean
  friends: boolean
  teddy: boolean
  mamu: boolean
  sunny: number | null
  gullak: number
}

/** The festival room, from the state. It fills in live during play, and is the first result on festival morning. */
export function festivalScene(s: GameState): Scene {
  const decor = s.owned.decor
  const outfit = s.owned.outfit
  return {
    lights: !decor ? 'dark' : decor.quality === 'low' ? 'half' : 'full',
    sweets: !!s.owned.sweets,
    brother: !outfit ? 'old' : outfit.torn ? 'torn' : 'new',
    gift: !!s.owned.gift,
    friends: s.friendship >= 60,
    teddy: s.teddy,
    mamu: s.mamu != null,
    sunny: s.sunnyLent > 0 ? (s.sunnyRepaid ?? 0) : null,
    gullak: s.ended ? walletTotal(s) : 0,
  }
}
