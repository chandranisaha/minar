# Progress model and Happy Index

How the shell turns "the player finished a game" into lamps, the goal bar and the Happy Index.
All of it is pure, tested functions; the store only holds the data and recomputes derived values.
Tunable numbers live in two files only: `src/progress/config.ts` and `src/happy/config.ts`.

## The rule in one paragraph

Each pillar is worth 25% of (goal - start). Clearing it lights its minaret lamp, and the lamp's brightness (bright, dim,
flicker) is read from the Happy Index at that moment. A bright lamp counts 100% of the pillar's share, dim 75%, flicker 50%.
A replay can only improve a pillar. The goal-bar amount is always computed from this state, never stored by hand.

## Data (`src/progress/types.ts`)

| Field | Meaning |
| --- | --- |
| `pillars[id].status` | `locked` = not started yet (**every pillar is always playable**), `in_progress`, `complete` |
| `pillars[id].brightness` | `bright`, `dim`, `flicker`, or `null` until cleared. The lamp state at the best clear |
| `pillars[id].partial` | 0..1 fill of the minaret. Never reaches 1 unless the pillar is complete (cap 0.99) |
| `pillars[id].bestQuality` | best 0..1 quality over all plays |
| `pillars[id].attempts`, `lessonsSeen` | counts and the lessons collected without duplicates |
| `pillars[id].skillsTouched` | skills this pillar's plays have reported, in canonical order |
| `happy` | Happy Index, clamped to 10..100, starts at 70 |
| `skills` | best 0..1 value seen for each of the six skills |
| `diamonds`, `shieldPieces`, `title` | Case Files rewards, summed or unioned |
| `lifeMomentsUsed`, `lifeMomentSpend` | how often each life moment was used, and the total rupees spent on them |
| `sessionsSinceBreak` | game sessions finished since the last life moment. `applyBurnout` adds one, any life moment resets it to 0. At `HAPPY.tiredAfterSessions` (3) the "time for a break" note appears |

Saved to the device under `money-mohalla-v2` (version 2), including the one-time flag `happyToastSeen` (the low-Happy tip has been shown). Derived and **not** saved: `savedAmount`, `completedPillars`.
The old `money-mohalla-v1` key is read once for migration and never written or deleted.

## Functions

| Function | File | What it does |
| --- | --- | --- |
| `applyGameResult(state, GameResult)` | `progress/applyGameResult.ts` | Folds one finished play in. Joy signals move Happy first; the lamp brightness reads that Happy. Burnout is **not** applied here |
| `savedAmountFor(state)` | `progress/saved.ts` | start + sum of pillar contributions - life-moment spend, kept between 0 and the goal |
| `brightnessFor(happy)` | `happy/brightness.ts` | 60 or more = bright, 35 to 59 = dim, below 35 = flicker |
| `applyBurnout(state)` | `happy/apply.ts` | Happy minus 5. The host calls it **once per game session** |
| `joyFromSignals(signals)` | `happy/signals.ts` | Turns a game's optional signals into a Happy delta, capped at +-12 |
| `applyLifeMoment(state, id)` | `happy/moments.ts` | Spends the cost, gains `round(joy x 0.5 ^ timesUsed)` Happy. Unknown or unaffordable moments return the same object |
| `earnedAmount(state)`, `brightnessPenalty(state)` | `progress/saved.ts` | What cleared pillars have added so far, and how much the Happy Index is holding back (sum of share x (1 - multiplier)). The progress and balance view-models use these |
| `sanitizeProgress`, `normalizePersisted` | `progress/state.ts`, `store/persisted.ts` | Repair any saved data (missing, junk or old-format) into valid state |
| `migrateLegacyState(old)` | `progress/migrate.ts` | Old completed pillars become fully bright, so the goal bar shows the same amount as before |

## Rules the tests lock in

- A replay can only improve a pillar: a brighter clear upgrades the lamp, a dimmer one never downgrades it, a failed one never un-lights it.
- Partial progress moves forward only, and is capped below 1 until the pillar is cleared.
- Happy is always clamped. A non-finite change is ignored.
- Same state in, same `savedAmount` out. No function mutates its input.
- Life moments: price is paid in full every time, the Happy gain halves each repeat (8, 4, 2, 1, 1, 0 for the chai).
  A moment costs money taken from the goal bar, so looking after yourself is a real trade-off.

## Not here yet

- No UI (the lamps, Happy meter and doorway cards come in later prompts). Only the `?dev=1` panel exists.
- The host exists now (adapters, registry, game host screen, placeholder games): see `docs/INTEGRATION.md` and `docs/UI_CONTRACT.md`. `GameResult` lives in `src/host/types.ts`; extend it, do not replace it.
- The store action `finishSession(result)` is the one end-of-session step the host uses: `applyGameResult` then `applyBurnout`, once, committed together.
- Calibrating the numbers against the real games is a later step (see the Happy tuning prompt).

## Dev panel

Open any page with `?dev=1`. It stays on for the browser tab (in-app navigation drops the query string) until `?dev=0`.
It can set Happy, force-clear a pillar at a chosen quality, apply burnout and reset progress. Without `?dev=1` nothing renders.

## View-models and screens

The progress, Happy, life-moment and balance view-models live in `src/features/*` and the plain wireframes in `src/ui/wire/`. They are
listed, with their test ids and string keys, in `docs/UI_CONTRACT.md`. Open `/wire?dev=1` to see them all live.

The balance card calls a player "all work" when they have taken fewer than `HAPPY.balance.allWorkBelowBreaks` life moments (free ones count),
and "self heavy" when more than `HAPPY.balance.selfHeavyAbove` of everything earned plus spent went on themselves.
