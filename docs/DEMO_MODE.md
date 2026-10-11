# Fast mode (for demo videos)

Open the app with `?fast=1` for 3x speed, or `?fast=N` for any speed up to 12x. `?fast=0` turns it off. The speed is remembered for the browser tab,
so it survives the page reloads the app does itself (starting or loading a game).

Examples: `http://localhost:5173/?fast=3`, `https://<site>/?fast=5`.

What speeds up: everything that waits. The welcome page, Ammamma's story, every animation and transition, the island walk, counting numbers,
and the waits and timers inside all four games (Pocket Panic's cooling saucers and storm beats, Deal Board's reveals, and so on).

What does not change: the rules, scores, seeds, saved data and the real clock (`Date.now`). A sped-up run plays exactly like a normal one, just shorter.

How it works: `src/lib/fastMode.ts` divides timer delays by N, runs the animation clock N times faster and sets CSS animations to play N times faster.
`src/lib/fastBoot.ts` is imported first in `main.tsx` so libraries that capture the animation clock at load also get it.
Tips for recording: use `?fast=3` for story and island scenes and `?fast=5` for long waits. The Light mode switch in Settings still works.
