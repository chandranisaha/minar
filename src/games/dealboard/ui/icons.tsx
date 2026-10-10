const INK = '#2B1A17'

/** The player's token: an inked brass-and-pink pawn that walks the ring one quarter at a time. */
export function Pawn() {
  return (
    <svg viewBox="0 0 40 50" width="100%" height="100%" aria-hidden>
      <ellipse cx="20" cy="46" rx="15" ry="3.6" fill="rgba(0,0,0,.25)" />
      <path d="M8 44c0-5 4-7 6-8-2-2-3-5-3-8 0-3 2-5 4-6-2-1.5-3-3.6-3-6a8 8 0 0 1 16 0c0 2.4-1 4.5-3 6 2 1 4 3 4 6 0 3-1 6-3 8 2 1 6 3 6 8Z" fill="#E5457A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M15 12a5 5 0 0 1 5-4" stroke="#FFF3D6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}
