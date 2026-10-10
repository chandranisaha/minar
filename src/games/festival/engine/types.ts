export type Day = 1 | 2 | 3
export type PocketId = 'ghar' | 'gift' | 'masti' | 'bus' | 'loose'
export type ItemId = 'sweets' | 'decor' | 'outfit' | 'small' | 'gift'
export type StallId = 'daamfix' | 'chacha' | 'aunty' | 'megasale' | 'sasta'
export type FestivalId = 'diwali' | 'eid' | 'bonalu' | 'sankranti' | 'christmas'
export type Quality = 'good' | 'low'
export type Reply = 'yes' | 'swap' | 'no'
export type SurpriseId = 'S1' | 'S2' | 'S3' | 'S4'
export type OfferResult = 'accept' | 'counter' | 'insult' | 'closed'

export const POCKETS: PocketId[] = ['ghar', 'gift', 'masti', 'bus', 'loose']
export const LIST_ITEMS: ItemId[] = ['sweets', 'decor', 'outfit', 'small']
export const ITEMS: ItemId[] = ['sweets', 'decor', 'outfit', 'small', 'gift']
export const STALLS: StallId[] = ['daamfix', 'chacha', 'aunty', 'megasale', 'sasta']

export type Pockets = Record<PocketId, number>

export type GameEvent =
  | { kind: 'plan'; day: Day; pockets: Pockets }
  | { kind: 'visit'; day: Day; stall: StallId }
  | { kind: 'offer'; day: Day; stall: StallId; item: ItemId; offer: number; result: OfferResult; counter?: number }
  | { kind: 'walkaway'; day: Day; stall: StallId; item: ItemId; callback?: number }
  | { kind: 'buy'; day: Day; stall: StallId; item: ItemId; price: number; quality: Quality }
  | { kind: 'raid'; day: Day; from: PocketId; to: PocketId; amount: number; reason: string }
  | { kind: 'invite'; day: Day; id: string; reply: Reply; cost: number }
  | { kind: 'ringtoss'; day: Day; win: boolean }
  | { kind: 'surprise'; day: Day; id: SurpriseId; choice: string; cost: number }
  | { kind: 'bus'; day: Day; paid: boolean }
  | { kind: 'repay'; day: Day | 4; who: 'ayesha' | 'sunny'; amount: number }
  | { kind: 'end' }

export interface Owned {
  stall: StallId
  day: Day
  price: number
  quality: Quality
  torn?: boolean
}

export interface Raid {
  day: Day
  from: PocketId
  to: PocketId
  amount: number
  reason: string
}

export interface GameState {
  pockets: Pockets
  /** day-1 plan plus any free morning rebalancing on days 2 and 3 */
  planned: Pockets
  spent: Pockets
  raidedIn: Pockets
  raidedOut: Pockets
  raids: Raid[]
  owned: Partial<Record<ItemId, Owned>>
  friendship: number
  walked: Day[]
  ringTossPlays: Record<Day, number>
  teddy: boolean
  sunnyLent: number
  sunnyRepaid: number | null
  ayeshaCovered: boolean | null
  ayeshaRepaid: boolean
  mamuPaidFrom: PocketId[] | null
  s1: 'rebuy' | 'old' | 'festival' | null
  swaps: number
  mastiSpent: number
  moneyIn: number
  moneyOut: number
  ended: boolean
}

export const zeroPockets = (): Pockets => ({ ghar: 0, gift: 0, masti: 0, bus: 0, loose: 0 })
export const sumPockets = (p: Pockets) => POCKETS.reduce((a, k) => a + p[k], 0)
