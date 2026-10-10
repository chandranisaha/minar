import raw from '../content/island.json'
import type { PillarId } from '../content/data'

export type NodeId = 'dock' | 'plaza' | PillarId | 'gate'
export interface IslandNode { id: NodeId; kind: 'start' | 'hub' | 'pillar' | 'goal'; n?: number; x: number; y: number; art: { x: number; y: number }; labelKey: string; hookKey?: string }
export interface IslandPath { id: string; from: NodeId; to: NodeId; pts: number[][] }

export const WORLD = raw.world
export const NODES = raw.nodes as IslandNode[]
export const PATHS = raw.paths as IslandPath[]
export const nodeById = (id: NodeId) => NODES.find((n) => n.id === id)!

/** % of the world -> world px */
export const px = (p: number[]) => [(p[0] / 100) * WORLD.w, (p[1] / 100) * WORLD.h]

/** Catmull-Rom through the points, written as a cubic Bezier path (gently curved, never a grid). */
export function smoothD(pts: number[][], closed = false): string {
  const P = pts.map(px)
  const n = P.length
  const at = (i: number) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))])
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return closed ? d + 'Z' : d
}

export interface Segment { path: IslandPath; reverse: boolean }
/** route between any two nodes; everything meets at the plaza */
export function route(a: NodeId, b: NodeId): Segment[] {
  if (a === b) return []
  const link = (id: NodeId) => PATHS.find((q) => (q.from === id && q.to === 'plaza') || (q.to === id && q.from === 'plaza'))!
  const toPlaza = (id: NodeId): Segment[] => { const p = link(id); return [{ path: p, reverse: p.from !== id }] }
  const fromPlaza = (id: NodeId): Segment[] => { const p = link(id); return [{ path: p, reverse: p.from === id }] }
  if (a === 'plaza') return fromPlaza(b)
  if (b === 'plaza') return toPlaza(a)
  return [...toPlaza(a), ...fromPlaza(b)]
}

export const PALETTE = {
  ink: '#3A2A24', paper: '#F3E9D2', water: '#BFD9E3', water2: '#A8CBD8', stone: '#E8DCC0', stoneShade: '#D2C4A3',
  terracotta: '#C97B4A', ochre: '#D9A84E', sage: '#8FAE7A', green: '#5E8A5A', granite: '#8C8590', granite2: '#A39BA3',
  coral: '#C8604A', gold: '#C79A2E', rock: '#9A8878', rock2: '#7E6F66',
} as const
