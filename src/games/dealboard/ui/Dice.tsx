const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

/** A cream, inked die. While rolling it tumbles in stepped frames (the face is cosmetic; the seed decides the roll). */
export function Die({ value, rolling, size = 56, label }: { value: number; rolling?: boolean; size?: number; label?: string }) {
  return (
    <div className={`db-die ${rolling ? 'rolling' : ''}`} style={{ width: size, height: size }} role="img" aria-label={label ?? String(value)}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} style={{ display: 'grid' }}>{PIPS[value]?.includes(i) && <i />}</span>
      ))}
    </div>
  )
}
