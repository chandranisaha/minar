import type { ToonLook } from '../../shared/Toon'

/** The shared cast, drawn with the hub's character rig. Fictional people; no stereotypes. */
export const CAST: Record<'shobha' | 'arjun' | 'ayesha' | 'sunny' | 'rao', ToonLook> = {
  shobha: { skin: '#B8693A', hair: '#E8E2D6', hairStyle: 'bun', top: '#7A2A22', bottom: '#FFF3D6', glasses: 'round', bindi: true, scarf: '#E8B04A', trim: '#D9A520' },
  arjun: { skin: '#C77D47', hair: '#2B1A17', hairStyle: 'curly', top: '#F28C28', bottom: '#2F6F73', glasses: 'shades' },
  ayesha: { skin: '#B8693A', hair: '#2B1A17', hairStyle: 'bun', top: '#3F7A3A', bottom: '#7A2A22', scarf: '#E8B04A' },
  sunny: { skin: '#A8602F', hair: '#2B1A17', hairStyle: 'none', top: '#5BB5D6', bottom: '#1E2A44' },
  rao: { skin: '#A8602F', hair: '#EDE6D6', hairStyle: 'topi', top: '#FFF3D6', bottom: '#3F7A3A', moustache: true, trim: '#D9A520' },
}
export type CastId = keyof typeof CAST
