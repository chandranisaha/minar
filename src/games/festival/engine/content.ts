import items from '../content/items.json'
import stalls from '../content/stalls.json'
import invites from '../content/invites.json'
import festivals from '../content/festivals.json'
import rules from '../content/rules.json'
import type { Day, FestivalId, ItemId, PocketId, Pockets, Quality, StallId } from './types'

export interface ItemDef { id: ItemId; base: number; pocket: PocketId }
export interface StallDef {
  id: StallId
  sticker: number
  floor: number
  patience: number
  quality: Quality
  callback: number
  bargain: boolean
  wasMultiplier?: number
  sells: ItemId[]
}
export interface InviteDef {
  id: string
  day: Day
  from: 'arjun' | 'ayesha' | 'sunny'
  yes: number
  swap: number | null
  key: string
  loan?: boolean
  noFriendship?: number
}
export interface FestivalDef { id: FestivalId; mvp: boolean; motif: string }

/** Content is data: an NGO edits the JSON, not this file. */
export const ITEM_DEFS = items as ItemDef[]
export const STALL_DEFS = stalls as StallDef[]
export const INVITE_DEFS = invites as InviteDef[]
export const FESTIVAL_DEFS = festivals as FestivalDef[]
export const RULES = rules as {
  startMoney: number
  step: number
  dayMultiplier: Record<string, number>
  busFare: number
  tiredVisits: number
  friendship: { start: number; yes: number; swap: number; no: number; coverAyesha: number; refuseAyesha: number }
  ringToss: { cost: number; playsPerEvening: number; winChance: number }
  sunnyRepayChance: number
  ayeshaFare: number
  mamuCost: number
  sensiblePlan: Pockets
}

export const item = (id: ItemId) => ITEM_DEFS.find((i) => i.id === id)!
export const stall = (id: StallId) => STALL_DEFS.find((s) => s.id === id)!
export const invitesFor = (day: Day) => INVITE_DEFS.filter((i) => i.day === day)
export const invite = (id: string) => INVITE_DEFS.find((i) => i.id === id)!
