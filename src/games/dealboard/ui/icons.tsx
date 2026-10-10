import { useGame } from '../../../store/game'

/** The player's token: the girl from the main map, in the outfit of the persona they picked. */
export function Pawn() {
  const persona = useGame((st) => st.persona) ?? 'college'
  return <img src={`/art/avatar/girl-${persona}-0.webp`} alt="" aria-hidden draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: '50% 100%' }} />
}
