import { LOOKS, type ToonLook } from '../../../art/Toon'
import type { StallId } from '../engine/types'

export const AMMI: ToonLook = { ...LOOKS.nani, hair: '#2B1A17', top: '#2F6F73', scarf: '#E5457A', glasses: 'none' }

export const BROTHER_NEW: ToonLook = { skin: '#B5683B', hair: '#2B1A17', hairStyle: 'curly', top: '#E5457A', bottom: '#1E2A44', trim: '#D9A520' }
export const BROTHER_OLD: ToonLook = { ...BROTHER_NEW, top: '#9C8F80', trim: undefined }
export const FRIENDS: ToonLook[] = [
  { skin: '#C77D47', hair: '#2B1A17', hairStyle: 'curly', top: '#F28C28', bottom: '#2F6F73' },
  { skin: '#B8693A', hair: '#2B1A17', hairStyle: 'bun', top: '#3F7A3A', bottom: '#7A2A22', scarf: '#E8B04A' },
  { skin: '#A8602F', hair: '#2B1A17', hairStyle: 'none', top: '#5BB5D6', bottom: '#1E2A44' },
]

export const STALL_LOOK: Record<StallId, { awning: string; stripe: string; keeper: ToonLook }> = {
  daamfix: { awning: '#2F6F73', stripe: '#FFF3D6', keeper: { skin: '#B5683B', hair: '#2B1A17', hairStyle: 'curly', top: '#2F6F73', bottom: '#1E2A44', glasses: 'round', trim: '#FFF3D6' } },
  chacha: { awning: '#3F7A3A', stripe: '#E8B04A', keeper: { skin: '#A8602F', hair: '#EDE6D6', hairStyle: 'topi', top: '#FFF3D6', bottom: '#3F7A3A', moustache: true, trim: '#D9A520' } },
  aunty: { awning: '#E5457A', stripe: '#FFF3D6', keeper: { skin: '#B8693A', hair: '#2B1A17', hairStyle: 'bun', top: '#7A2A22', bottom: '#E5457A', scarf: '#E8B04A', trim: '#D9A520' } },
  megasale: { awning: '#D8503A', stripe: '#E8B04A', keeper: { skin: '#C77D47', hair: '#2B1A17', hairStyle: 'none', top: '#E8B04A', bottom: '#2B1A17', glasses: 'shades', trim: '#D8503A' } },
  sasta: { awning: '#E8B04A', stripe: '#D9632E', keeper: { skin: '#B5683B', hair: '#2B1A17', hairStyle: 'hood', top: '#D9632E', bottom: '#1E2A44', trim: '#E8B04A' } },
}

