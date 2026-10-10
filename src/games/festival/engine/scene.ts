import { walletTotal } from './state'
import type { GameState } from './types'

export type Layer =
  | { id: 'sweets'; on: boolean }
  | { id: 'lights'; level: 'full' | 'half' | 'dark' }
  | { id: 'brother'; newOutfit: boolean }
  | { id: 'small'; on: boolean }
  | { id: 'gift'; on: boolean }
  | { id: 'friends'; visit: boolean }
  | { id: 'teddy' }
  | { id: 'worried' }
  | { id: 'sunny'; repaid: number }
  | { id: 'gullak'; amount: number }

/** The festival-morning room, as an ordered list of layers. Each layer depends on a choice. */
export function festivalScene(s: GameState): Layer[] {
  const decor = s.owned.decor
  const outfit = s.owned.outfit
  const layers: Layer[] = [
    { id: 'lights', level: !decor ? 'dark' : decor.quality === 'low' ? 'half' : 'full' },
    { id: 'sweets', on: !!s.owned.sweets },
    { id: 'small', on: !!s.owned.small },
    { id: 'brother', newOutfit: !!outfit && !outfit.torn },
    { id: 'gift', on: !!s.owned.gift },
    { id: 'friends', visit: s.friendship >= 60 },
  ]
  if (s.teddy) layers.push({ id: 'teddy' })
  if (s.walked.length) layers.push({ id: 'worried' })
  if (s.sunnyLent > 0) layers.push({ id: 'sunny', repaid: s.sunnyRepaid ?? 0 })
  const left = walletTotal(s)
  if (left > 0) layers.push({ id: 'gullak', amount: left })
  return layers
}
