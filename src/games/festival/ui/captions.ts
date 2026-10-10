import type { Layer } from '../engine/scene'

/** Caption for each layer, so the result never depends on reading the picture (or on colour). */
export function sceneCaptions(layers: Layer[], t: (k: string, o?: Record<string, unknown>) => string, money: (n: number) => string, itemName: (i: string) => string): { icon: string; text: string; good: boolean | null }[] {
  const out: { icon: string; text: string; good: boolean | null }[] = []
  for (const l of layers) {
    switch (l.id) {
      case 'lights': out.push({ icon: '💡', text: t(l.level === 'full' ? 'scene.lightsFull' : l.level === 'half' ? 'scene.lightsHalf' : 'scene.lightsDark'), good: l.level === 'full' }); break
      case 'sweets': out.push({ icon: '🍬', text: t(l.on ? 'scene.sweets' : 'scene.noSweets'), good: l.on }); break
      case 'small': out.push({ icon: '🌼', text: t(l.on ? 'scene.small' : 'scene.noSmall', { items: itemName('small') }), good: l.on }); break
      case 'brother': out.push({ icon: '👕', text: t(l.newOutfit ? 'scene.brotherNew' : 'scene.brotherOld'), good: l.newOutfit }); break
      case 'gift': out.push({ icon: '🎁', text: t(l.on ? 'scene.gift' : 'scene.noGift'), good: l.on }); break
      case 'friends': out.push({ icon: '👋', text: t(l.visit ? 'scene.friends' : 'scene.noFriends'), good: l.visit }); break
      case 'teddy': out.push({ icon: '🧸', text: t('scene.teddy'), good: null }); break
      case 'worried': out.push({ icon: '🚶', text: t('scene.worried'), good: false }); break
      case 'sunny': out.push({ icon: '🤝', text: l.repaid ? t('scene.sunnyPaid', { money: money(l.repaid) }) : t('scene.sunnyNot'), good: l.repaid > 0 }); break
      case 'gullak': out.push({ icon: '🏺', text: t('scene.gullak', { money: money(l.amount) }), good: null }); break
    }
  }
  return out
}
