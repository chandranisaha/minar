export type Day = 1 | 2 | 3
export type JarId = 'needs' | 'gift' | 'fun' | 'spare'
export type ItemId = 'sweets' | 'outfit' | 'gift' | 'decor'
export type ShopId = 'daamfix' | 'chacha' | 'aunty' | 'megasale' | 'sasta'
export type FestivalId = 'diwali' | 'eid' | 'bonalu' | 'sankranti' | 'christmas'
export type FriendId = 'arjun' | 'ayesha' | 'sunny'
export type Quality = 'good' | 'low'
export type Reply = 'yes' | 'swap' | 'no'

export const JARS: JarId[] = ['needs', 'gift', 'fun', 'spare']
export const NEEDS: ItemId[] = ['sweets', 'outfit', 'decor']
export const ITEMS: ItemId[] = ['sweets', 'outfit', 'gift', 'decor']
export const DAYS: Day[] = [1, 2, 3]

export type Jars = Record<JarId, number>
export const zeroJars = (): Jars => ({ needs: 0, gift: 0, fun: 0, spare: 0 })
export const sumJars = (j: Jars) => JARS.reduce((a, k) => a + j[k], 0)

/**
 * Everything the player does is one of these. Events with a `card` and a terminal kind
 * (buy, later, without, invite, surprise, ringtoss, seen) resolve that card.
 */
export type GameEvent =
  | { kind: 'plan'; jars: Jars }
  | { kind: 'borrow'; day: Day; card: string; from: JarId; to: JarId; amount: number }
  | { kind: 'haggle'; day: Day; card: string; shop: ShopId; item: ItemId; result: 'counter' | 'refuse'; price: number }
  | { kind: 'buy'; day: Day; card: string; item: ItemId; shop: ShopId; price: number; quality: Quality }
  | { kind: 'later'; day: Day; card: string; item: ItemId }
  | { kind: 'without'; day: Day; card: string; item: ItemId }
  | { kind: 'invite'; day: Day; card: string; id: string; reply: Reply; cost: number }
  | { kind: 'surprise'; day: Day; card: string; id: 'mamu' | 'torn'; choice: 'pay' | 'rebuy' | 'old'; cost: number }
  | { kind: 'ringtoss'; day: Day; card: string; play: boolean; win: boolean }
  | { kind: 'seen'; day: Day; card: string }
  | { kind: 'repay'; amount: number }
  | { kind: 'end' }

export const TERMINAL = new Set<GameEvent['kind']>(['buy', 'later', 'without', 'invite', 'surprise', 'ringtoss', 'seen'])

export interface Owned { shop: ShopId; day: Day; price: number; quality: Quality; torn?: boolean }

export interface GameState {
  jars: Jars
  planned: Jars
  spent: Jars
  borrowedIn: Jars
  borrowedOut: Jars
  borrowed: number
  /** cards whose payment needed borrowing */
  borrowCards: string[]
  owned: Partial<Record<ItemId, Owned>>
  without: ItemId[]
  friendship: number
  swaps: number
  sunnyLent: number
  sunnyRepaid: number | null
  mamu: 'spare' | 'borrowed' | null
  tornChoice: 'rebuy' | 'old' | null
  ringTossPlays: number
  teddy: boolean
  ended: boolean
}
