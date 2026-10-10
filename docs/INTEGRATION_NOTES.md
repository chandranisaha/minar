# Integration notes: findings for the game owners

Written after plugging the real Festival Countdown and Pay Run (branch `shriya/saveandmanage`) into the shell. The games were **not
edited**. Everything below was handled in the shell (wrappers, adapters, shims); these are the differences you may want to change.

## How the shell loads them

Neither game has an `index.tsx`, so the shell uses a thin wrapper per game (`src/host/wrappers/`) that maps the shell's `GameProps`
onto the game's own props. The registry picks the wrapper only when the game's entry file exists (`src/host/config.ts`, `GAME_ENTRIES`).
A game that does add `src/games/<folder>/index.tsx` with a default export taking `GameProps` is used directly and the wrapper is skipped.

## Festival Countdown (`src/games/festival`)

| Spec / contract | What the real game does | What the shell did |
| --- | --- | --- |
| `score` = needs, plan, shopping, goal, balance, total (25/25/20/15/15/100) | `score` = needs (0-40), gift (0-20), friends (0-20), plan (0-30), total (can reach 110) | The adapter understands both shapes. Quality = total/100, capped at 1 |
| Friendship meter or `evidence.friendship` | Not reported. Only `score.friends` (20, 10 or 0) and `stars.dost` | Friendship is derived from `score.friends` (20 = good, 10 = middling, else poor) |
| `evidence.ringTossPlays` (a count), `evidence.swaps` | `evidence.ringToss` is a boolean; `swaps` is a count; `lentToSunny` is a boolean | Boolean ring toss counts as 1 treat; `lentToSunny` counts as 1 loan to a friend |
| Clear = 3 or more stars or total 70+ | Sends `minaretLit` with the same rule | The shell trusts `minaretLit` |
| `onComplete` when the player finishes | Fires from an effect the moment the **report screen appears** (`Report`, via `onFinish`), before the player presses Continue | The shell's Result screen replaces the game's report at that moment, so the player never sees the game's own report. **Decide:** keep the shell result, or call `onComplete` only when Continue is pressed |
| Props `seed`, `cohortCode`, `persona.festival`, `onComplete`, `onExit` | `cohortCode` is a required string, `onComplete` takes your own `GameResult` | Wrapper passes the shell seed, `''` when there is no class code, the chosen festival, and the shell's exit |
| Own strings in the `festival` namespace | OK | Nothing in the shell locale files was changed or overwritten |

Also: `GameResult` comes from `src/lib/gameResult.ts` (your branch); it is restored as a shell shim. The shell stores results itself, so
`saveResult` is not called.

## Pay Run (`src/games/payrun`)

| Spec / contract | What the real game does | What the shell did |
| --- | --- | --- |
| `onComplete(payload)` with the five habit parts, shifts, goal reached, lessons | **No payload.** Only `onGoalReached()`, called once when the jar first reaches `ECON.goal` | The wrapper builds `{ game, goalReached, jar, goal, shifts }` from the game's own store (read only) |
| Habit score (saving, buffer, spending, planning, lending) | Not computed or reported | With no parts, quality = how full the jar is (1 when the goal is reached) and **no skills** are reported |
| Joy signals (purchases bought or skipped, lending) | Not reported | None. Happy is not affected by Pay Run play |
| Lessons seen | Not reported | None |
| Props `seed`, `lang` | **Not accepted.** It makes its own random seed (`newSeed`) and persists the season in `localStorage` | Replay does **not** reuse the shell's seed. The player resumes or restarts the game's own saved season |
| Finish | Only the goal ends it; leaving through its Exit button just calls `onExit` | The wrapper turns an early exit into a quit result ("not cleared yet") with the jar as partial progress |
| Language | Shares the global i18n instance | Telugu and Hindi reach the game |

**Suggested for Pay Run:** accept `seed` and `onComplete(payload)` (habit parts, shifts, goal reached, lessons, and purchase and lending
counters), so quality, skills and Happy signals are real.

## Shell shims restored for the games (from `shriya/saveandmanage`)

`src/lib/rng.ts`, `src/lib/gameResult.ts`, `src/art/Toon.tsx`, `src/components/Scenery.tsx`, `src/components/gameMotion.css`.
They are copies of your versions; the island UI does not use them. `Toon.tsx` uses raw hex colours (the shell's token check
ignores it).

## Layout

The games position themselves with `absolute inset-0`. The host now gives the playing game a real, relatively positioned box
(full width on a small screen, a centred column of `min(width, height x 0.62)` on a wide one) below its Exit bar, with the
"Made-up numbers" line under it. Both games render with no horizontal scroll at 360, 390x844 and 1440x900.

## Not verified

- **Offline reload:** the offline cache is added by a later step, so offline behaviour was not verified.
- **Pay Run reaching its goal** was covered by tests of the adapter (goal reached gives a cleared, full-quality result), not by playing a whole season.

- `src/world/input.ts`: shim for Deal Board (re-exports useTouchUi from src/island).

## Pocket Panic replaced Pay Run (Save & Manage)

`src/games/cafe` (from origin/pocketpanic) is now the Save game: wrapper `src/host/wrappers/PocketPanicGame.tsx`, adapter `adapters/cafe.ts` (behaviours 0-9 give quality; no play money is read). It resumes its own saved month, so no seed is passed. Pay Run's files, wrapper and adapter are kept but unused; to bring it back, set `save` back to `payrun` / `PayRun` in `src/host/config.ts` and the registry wrapper. Merge choices: kept the shell's `package*.json` and `src/art/palette.ts` and the existing festival files; took Pocket Panic's `lib/gameResult.ts` (adds the 'cafe' id).
