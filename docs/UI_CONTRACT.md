# UI contract

What any UI (the current wireframes, or the final design) must provide so the headless logic and the tests keep working.
The final look, theme, layout, orientation and input scheme are **not decided**; nothing here depends on them.

## The three layers

| Layer | Where | Rule |
| --- | --- | --- |
| Headless logic | `src/host`, `src/features`, `src/progress`, `src/happy`, `src/store` | Pure functions plus hooks returning view-models. Fully unit-tested. No markup |
| Wireframe UI | `src/ui/wire/*` (and the placeholder games in `src/host/placeholders`) | Plain, replaceable components that only consume view-models. No business logic. Marked `TODO(final-ui)` |
| Routes | `src/ui/screens.ts` | The one file the router reads for these screens. A new UI re-points these entries |

The legacy screens (`/`, `/story`, `/dashboard`, `/kit`) are still registered directly in `App.tsx` and are not part of this contract.

## `data-testid` convention

kebab-case, `<thing>` or `<thing>-<id>`, for example `game-entry-plan`, `placeholder-great`, `result-continue`.
Tests find things through these names and accessible roles, never through styling. A new UI must keep the names below.

## Host section (`/play/:pillar`)

Route: `/play/:pillar` where `:pillar` is `plan`, `save`, `invest` or `safe`. An unknown pillar redirects to `/`.

| Screen / part | Component today | View-model | Test ids |
| --- | --- | --- | --- |
| Whole page | `GameHostScreen` | `useGameHost(pillar)` in `src/host/useGameHost.ts` | `game-host` |
| Exit bar | in `GameHostScreen` | `host.phase` | `game-exit`, `game-new-seed` (dev only) |
| Exit confirmation (only while playing) | in `GameHostScreen` | local | `game-exit-confirm`, `game-exit-yes`, `game-exit-no` |
| Entry panel | in `GameHostScreen` | `host.entry`, pillar copy | `game-entry-<pillar>`, `game-play` |
| Game mount | in `GameHostScreen` | `host.Game`, `host.props` | `game-mount`, `game-loading`, `game-banner` |
| Error panel | `GameErrorBoundary` fallback | `host.phase === 'error'` or a caught crash | `game-error`, `game-error-back` |
| Result screen | `ResultScreen` (also shows the balance card after a clear, the tired note when due, and a link to `/progress`) | `buildResultView(outcome)` in `src/host/resultView.ts` | `result-screen`, `result-title`, `result-state`, `result-quality`, `result-goal`, `result-saved-after`, `result-happy`, `result-happy-after`, `result-skills`, `result-lessons`, `result-continue`, `result-replay`, `result-back` |
| Placeholder game | `makePlaceholder` | none | `placeholder-<pillar>`, `placeholder-label`, `placeholder-great`, `placeholder-ok`, `placeholder-poor`, `placeholder-quit` |

### What the host must do (behaviour, not looks)

- Show an entry step, then mount the game, then show the result. Replay returns to the game with the **same seed**.
- Give the game the space available: full width on a small screen, a centred portrait-shaped column on a wide one, no fixed size,
  and never less than 360px of width. Keep the Exit bar and the banner out of the game's area.
- A crash in a game (while rendering or while loading) must show the error panel, never a blank page.
- Exit while playing asks first. Exit anywhere else leaves immediately.
- The result screen shows only what `buildResultView` returns; it does no maths.

### View-model: `ResultView`

```ts
{ pillar, cleared, state: { status, brightness, partialPercent }, improved, qualityPercent,
  skills: { skill, percent }[], lessons: string[],
  saved: { before, after, delta }, happy: { before, after, delta } }
```
`state.status` is `locked` (not started), `in_progress` or `complete`; `brightness` is `bright`, `dim`, `flicker` or `null`.
A UI may draw these states however it likes, but each needs an icon **and** a text label (never colour alone).

### Strings (locale files, all of en, hi, te)

`host.*` (exit, play, loading, error, banner, placeholder.*), `result.*`, `state.*` (notStarted, partial, bright, dim, flicker),
`skills.*`, and the existing `pillars.<id>.name` and `pillars.<id>.hook`. Wording is neutral (no theme words) so the final UI can re-theme it.

### Other host logic a UI may call

- `seedFor(installId, pillar, salt)`: `src/host/seed.ts`.
- `finishSession(state, result)`, `SessionGuard`: `src/host/session.ts` (the store exposes `finishSession(result)` which commits it).
- `nextPillarAfter(state, current)`: the next unfinished pillar, used by the Continue button.
- `PILLAR_GAMES[pillar]`: registry entry with `placeholder`, `adapter`, `load()`: `src/host/registry.ts`.

## Progress, Happy Index, life moments and balance

All of these follow the three layers: a pure view-model in `src/features/<name>/view.ts`, a hook in `hooks.ts` that returns it, and a
plain wireframe in `src/ui/wire/` that only draws it. A new UI replaces the wireframes and keeps using the view-models.

### Routes

| Route | Component today | Notes |
| --- | --- | --- |
| `/progress` | `ProgressScreen` | How am I doing. Works with or without dev tools |
| `/wire` | `WireIndex` | **Dev only** (`?dev=1`); redirects home otherwise. Lists every wireframe and shows the live components together |

### View-models

| Feature | Pure function (testable) | Hook | Returns |
| --- | --- | --- | --- |
| Progress | `buildProgressView(state)` in `src/features/progress/view.ts` | `useProgressView()` | `goal { saved, target, percent }`, `pillars[]` (see below), `counts { total, lit, bright, dim, flicker }`, `summary { key, params }`, `happyPenalty { active, lostAmount, pillarCount }` |
| Happy Index | `buildHappyView(state)` in `src/features/happy/view.ts` | `useHappyView()` | `value`, `percent`, `band` (`glowing` / `ok` / `tired`), `labelKey`, `needsBreak`, `sessionsSinceBreak` |
| Low-Happy tip | `shouldShowHappyToast(state)`, `isToastSuppressed(pathname)` | `useHappyToast()` | `{ visible, dismiss }` |
| Life moments | `buildMomentsView(state)` in `src/features/moments/view.ts` | `useMoments()` | `moments[]` (`id`, `nameKey`, `descriptionKey`, `cost`, `gainNow`, `faded`, `affordable`, `timesUsed`) and `choose(id)` |
| Balance | `balanceFor(state)` in `src/features/balance/view.ts` | `useBalance()` | `earned`, `spentOnSelf`, `net`, `breaksTaken`, `selfSharePercent`, `tone` (`none` / `allWork` / `balanced` / `selfHeavy`), `whyKey`, `nextStepKey` |

Each entry of `pillars[]`: `id`, `nameKey`, `status`, `state` (`notStarted` / `partial` / `bright` / `dim` / `flicker`), `stateLabelKey`,
`icon` (`empty` / `half` / `full` / `dim` / `faint`), `partial`, `partialPercent`, `bestQuality`, `qualityPercent`, `attempts`,
`lessonsSeen`, `skillsTouched`, `actionKey` (`start` / `continue` / `replay` / `brighten`).

Rules a UI must respect:
- Every state is shown with an **icon and a text label**, never colour alone.
- `happyPenalty` is explained plainly (what is held back, how to recover) and never shames.
- The balance card educates and never advises; it carries "Made-up numbers. Real life is different."
- The life-moment price is shown **before** choosing, with the Happy it gives right now.
- The low-Happy tip never covers a game or onboarding (`isToastSuppressed`).

### `data-testid` names

| Part | Test ids |
| --- | --- |
| Goal meter | `goal-meter`, `goal-meter-value` |
| Happy meter | `happy-meter` (has `data-band`), `happy-label`, `happy-value` |
| Tired note | `tired-note` (only rendered when `needsBreak`) |
| Low-Happy tip | `toast-happy`, `toast-happy-dismiss` |
| Progress screen | `progress-screen`, `progress-back`, `progress-summary`, `happy-penalty` (only when active), `pillar-card-<id>` (has `data-state`), `pillar-state-<id>`, `pillar-partial-<id>`, `pillar-details-toggle-<id>`, `pillar-detail-<id>`, `pillar-play-<id>` |
| Life moments | `moments-open`, `moments-sheet`, `moments-close`, `moment-<id>`, `moment-cost-<id>`, `moment-gain-<id>`, `moment-unaffordable-<id>`, `moment-choose-<id>` |
| Balance card | `balance-card` (has `data-tone`), `balance-earned`, `balance-spent`, `balance-next` |
| Result screen additions | `result-progress-link` (the balance card and tired note sit inside it) |
| Dev index | `wire-index`, `wire-link-progress`, `wire-link-play-<id>`, `wire-link-home` |

### Strings (locale files, en, hi, te; neutral wording)

`progress.*` (title, back, goalLabel, goalValue, summary.{none, allBright, lit, litDim, litFaint, litDimFaint}, partial, details,
hideDetails, quality, attempts, lessons, skills, none, action.{start, continue, replay, brighten}, penalty.{title, body, how}),
`happy.*` (title, band.{glowing, ok, tired}, tiredNote, toast.{title, body, dismiss}), `moments.*` (title, open, close, cost, free,
gain, gainFaded, used, cannotAfford, choose, and `<id>.name` / `<id>.description` for every entry in `src/happy/moments.json`),
`balance.*` (title, earned, spent, why, next.{none, allWork, balanced, selfHeavy}), `wire.*` (dev only; left in English),
`result.progressLink`. Adding a life moment to `moments.json` needs its `moments.<id>.name` and `.description` keys.

### Stored state these rely on

`pillars[id].skillsTouched`, `sessionsSinceBreak` (progress state) and `happyToastSeen` (a one-time flag). Actions:
`markHappyToastSeen`, `applyLifeMoment`, `applyBurnout`, and for dev tools `devResetTips`. See `docs/PROGRESS_MODEL.md`.

## Not yet in this contract

Summary, settings and dashboard are added by later prompts and will append their own sections here.

## Onboarding and Hub (Prompt B)

| Route / Component | View-model | Test ids |
| --- | --- | --- |
| `/welcome` | `useOnboarding()` | `onboarding-screen`, `onboarding-step-counter`, `onboarding-skip`, `onboarding-title-<kind>`, `onboarding-lang-<lang>`, `onboarding-persona-<id>`, `onboarding-festival-<id>`, `onboarding-avatar-<id>`, `onboarding-back`, `onboarding-next` |
| `/hub` | `useHub()` | `hub-screen`, `hub-open-moments`, `hub-pillar-<id>`, `hub-cta-<id>` |
| `PillarIntroCard` | `usePillarIntro(id)` | `pillar-intro-<id>`, `intro-start`, `intro-back` |
| `CoachTips` | `useCoachTips()` | `coach-tips-container`, `coach-dismiss-all`, `coach-tip-<id>`, `coach-dismiss-<id>` |

### Strings

`onboarding.*` (welcome, problem, persona, festival, avatar, skills, win, happy, controls, skip, next, back).
`hub.*` (title, lookAfterYourself, teaches, time, minutes, bestQuality, cta.{start, continue, replay, brighten, back}, plan.*, save.*, invest.*, safe.*).
`coach.*` (header, dismissAll, goal.*, happy.*, progress.*, hub.*).
