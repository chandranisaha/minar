import deck from '../content/deck.json'
import festivals from '../content/festivals.json'
import invites from '../content/invites.json'
import items from '../content/items.json'
import rules from '../content/rules.json'
import shops from '../content/shops.json'
import type { FestivalId, FriendId, ItemId, JarId, Jars, Quality, ShopId } from './types'

export interface ItemDef { id: ItemId; base: number; jar: JarId; day: 1 | 2 | 3; shops: ShopId[] }
export interface ShopDef {
  id: ShopId
  sticker: number
  quality: Quality
  /** none = fixed price; friendly = always comes down; tough = seeded yes/no; tenoff = "already 50% off!", ₹10 less */
  haggle: 'none' | 'friendly' | 'tough' | 'tenoff'
  haggleTo?: number
  haggleChance?: number
  was?: number
}
export interface InviteDef { id: string; from: FriendId; yes: number; swap: number | null; loan?: boolean; noFriendship?: number }
export type DeckEntry =
  | { type: 'banner' }
  | { type: 'shop'; item: ItemId }
  | { type: 'deferred' }
  | { type: 'invite'; id: string }
  | { type: 'mamu' }
  | { type: 'torn' }
  | { type: 'ringtoss' }
export interface FestivalDef { id: FestivalId; mvp: boolean; motif: string }

/** Content is data: an NGO edits the JSON files, not this code. */
export const ITEM_DEFS = items as ItemDef[]
export const SHOP_DEFS = shops as ShopDef[]
export const INVITE_DEFS = invites as InviteDef[]
export const DECK = deck as Record<'1' | '2' | '3', DeckEntry[]>
export const FESTIVAL_DEFS = festivals as FestivalDef[]
export const RULES = rules as {
  startMoney: number
  step: number
  dayMultiplier: Record<string, number>
  friendship: { start: number; yes: number; swap: number; no: number }
  mamuCost: number
  ringToss: { cost: number; winChance: number }
  sunnyRepayChance: number
  planStarMaxBorrowed: number
  sensiblePlan: Jars
}

export const item = (id: ItemId) => ITEM_DEFS.find((i) => i.id === id)!
export const shop = (id: ShopId) => SHOP_DEFS.find((s) => s.id === id)!
export const invite = (id: string) => INVITE_DEFS.find((i) => i.id === id)!
