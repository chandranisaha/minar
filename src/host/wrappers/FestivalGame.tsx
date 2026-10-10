import FestivalCountdown from '../../games/festival/FestivalCountdown'
import type { GameProps } from '../types'

/**
 * Shell-side wrapper: maps the host's GameProps onto Festival Countdown's own props, so the game itself stays untouched.
 * Its payload (stars, score, evidence, lessonsSeen, minaretLit, meta) goes to onComplete as it is; src/host/adapters/festival.ts reads it.
 */
export default function FestivalGame({ seed, classCode, festival, onComplete, onExit }: GameProps) {
  return <FestivalCountdown seed={seed} cohortCode={classCode ?? ''} persona={festival ? { festival } : undefined} onComplete={onComplete} onExit={onExit ?? (() => {})} />
}
